import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from '@google/generative-ai';
import type { GenerativeModel } from '@google/generative-ai';

interface ColumnInput {
  id: string;
  name: string;
}

interface RequestBody {
  mode: 'notes' | 'groups';
  imageBase64: string;
  mimeType: string;
  columns: ColumnInput[];
}

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function buildPrompt(mode: 'notes' | 'groups', columns: ColumnInput[]): string {
  const colDesc = columns.map((c) => `${c.id} = "${c.name}"`).join(', ');
  if (mode === 'notes') {
    return (
      `This is a photo of a retro whiteboard with handwritten sticky notes, placed into these areas: ${colDesc}. ` +
      'Read each note, transcribe the handwriting into text (keep the meaning, fix obvious spelling mistakes), and figure out which column each note belongs to based on its position on the board or the nearest section heading. ' +
      'Reply with ONLY a JSON array, each item shaped {"text": string, "column": "one of the column ids above"}. If no notes are readable, return [].'
    );
  }
  return (
    'This is a photo of a retro board after the team clustered the sticky notes into groups of related ideas (there may be handwritten group labels). ' +
    'For each cluster, give it a short group name (use the handwritten label if there is one, otherwise summarize it) and list the text of every note in that cluster. ' +
    'Reply with ONLY a JSON array shaped {"label": string, "items": [string, ...]}. If no clear clusters are visible, return [].'
  );
}

function parseJsonLoose(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    /* fall through to extraction below */
  }
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      /* fall through */
    }
  }
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf(']'), text.lastIndexOf('}'));
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* give up below */
    }
  }
  throw new Error('Could not parse a JSON value from the model response.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface VisionParagraph {
  text: string;
  xCenterRatio: number;
}

interface CloudVisionAnnotateResponse {
  responses?: Array<{
    fullTextAnnotation?: {
      pages?: Array<{
        width?: number;
        blocks?: Array<{
          boundingBox?: { vertices?: Array<{ x?: number }> };
          paragraphs?: Array<{
            boundingBox?: { vertices?: Array<{ x?: number }> };
            words?: Array<{ symbols?: Array<{ text?: string }> }>;
          }>;
        }>;
      }>;
    };
    error?: { message?: string };
  }>;
}

// Cloud Vision has no notion of "column" either, but unlike Tesseract it
// does hand back a bounding box per paragraph — good enough to bucket each
// note into the column under its horizontal position on the board, which
// beats dumping everything into column 0.
function paragraphColumn(xCenterRatio: number, columns: ColumnInput[]): string {
  if (columns.length === 0) return '';
  const idx = Math.min(columns.length - 1, Math.floor(xCenterRatio * columns.length));
  return columns[idx].id;
}

/**
 * Second attempt when Gemini is unavailable (high demand / rate limit) —
 * plain handwriting OCR via Cloud Vision's DOCUMENT_TEXT_DETECTION, with no
 * "which column" or "which group" reasoning of its own. Notes get bucketed
 * by horizontal position; groups mode has no clustering signal at all, so
 * every line lands in one catch-all group for the reviewer to split up.
 * Only reached when GOOGLE_CLOUD_VISION_API_KEY is configured — otherwise
 * the caller falls straight through to the 'server' error as before.
 */
async function extractWithCloudVision(imageBase64: string, mimeType: string): Promise<VisionParagraph[]> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) throw new Error('Cloud Vision not configured (missing GOOGLE_CLOUD_VISION_API_KEY).');

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Cloud Vision request failed (${res.status}).`);

  const body = (await res.json()) as CloudVisionAnnotateResponse;
  const page = body.responses?.[0]?.fullTextAnnotation?.pages?.[0];
  const apiError = body.responses?.[0]?.error?.message;
  if (apiError) throw new Error(`Cloud Vision error: ${apiError}`);
  if (!page || !page.width) return [];

  const paragraphs: VisionParagraph[] = [];
  for (const block of page.blocks || []) {
    for (const paragraph of block.paragraphs || []) {
      const text = (paragraph.words || [])
        .map((w) => (w.symbols || []).map((s) => s.text || '').join(''))
        .join(' ')
        .trim();
      if (!text) continue;
      const xs = (paragraph.boundingBox?.vertices || block.boundingBox?.vertices || [])
        .map((v) => v.x ?? 0);
      const xCenter = xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : page.width / 2;
      paragraphs.push({ text, xCenterRatio: xCenter / page.width });
    }
  }
  return paragraphs;
}

// Only retry a 503 ("high demand") — that's transient server-side load and
// often clears within a couple seconds. A 429 (rate limit) means the
// per-minute/per-day quota is used up; retrying seconds later almost always
// hits the same 429 again since that window hasn't reset, so it would just
// burn a second request against an already-exhausted quota for nothing.
async function generateWithRetry(
  model: GenerativeModel,
  parts: Parameters<GenerativeModel['generateContent']>[0],
): Promise<ReturnType<GenerativeModel['generateContent']>> {
  try {
    return await model.generateContent(parts);
  } catch (err) {
    const status = err instanceof GoogleGenerativeAIFetchError ? err.status : undefined;
    if (status !== 503) throw err;
    await sleep(1500);
    return model.generateContent(parts);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ ok: false, error: 'AI service not configured on the server (missing GEMINI_API_KEY).' });
    return;
  }

  const body = req.body as Partial<RequestBody>;
  if (!body || (body.mode !== 'notes' && body.mode !== 'groups') || !body.imageBase64 || !body.mimeType) {
    res.status(400).json({ ok: false, error: 'Malformed request.' });
    return;
  }
  const columns = Array.isArray(body.columns) ? body.columns : [];

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = buildPrompt(body.mode, columns);

    const result = await generateWithRetry(model, [
      { text: prompt },
      { inlineData: { data: body.imageBase64, mimeType: body.mimeType } },
    ]);

    const text = result.response.text();
    const parsed = parseJsonLoose(text);
    if (!Array.isArray(parsed)) throw new Error('The model did not return a list.');

    if (body.mode === 'notes') {
      const rows = parsed
        .map((item) => ({
          text: String((item as { text?: unknown })?.text || '').trim(),
          column: String((item as { column?: unknown })?.column || columns[0]?.id || ''),
        }))
        .filter((r) => r.text);
      res.status(200).json({ ok: true, rows });
    } else {
      const groups = parsed
        .map((item) => ({
          label: String((item as { label?: unknown })?.label || 'Idea group').trim(),
          items: Array.isArray((item as { items?: unknown })?.items)
            ? ((item as { items: unknown[] }).items.map(String))
            : [],
        }))
        .filter((g) => g.items.length > 0);
      res.status(200).json({ ok: true, groups });
    }
  } catch (err) {
    console.error('extract-notes failed, trying Cloud Vision fallback', err);
    try {
      const paragraphs = await extractWithCloudVision(body.imageBase64, body.mimeType);
      if (body.mode === 'notes') {
        const rows = paragraphs.map((p) => ({ text: p.text, column: paragraphColumn(p.xCenterRatio, columns) }));
        res.status(200).json({ ok: true, rows });
      } else {
        const items = paragraphs.map((p) => p.text);
        const groups = items.length ? [{ label: 'Ungrouped (Cloud Vision fallback)', items }] : [];
        res.status(200).json({ ok: true, groups });
      }
      return;
    } catch (fallbackErr) {
      console.error('Cloud Vision fallback also failed', fallbackErr);
    }

    const status = err instanceof GoogleGenerativeAIFetchError ? err.status : undefined;
    const message =
      status === 503
        ? "Gemini is at capacity right now (high demand on the free tier) — wait a few seconds and try again."
        : status === 429
          ? 'Gemini rate limit reached for now — wait a bit before trying another photo.'
          : 'The AI service could not process that photo.';
    res.status(200).json({ ok: false, error: message });
  }
}
