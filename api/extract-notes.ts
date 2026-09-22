import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: body.imageBase64, mimeType: body.mimeType } },
    ]);

    const text = result.response.text();
    const parsed = parseJsonLoose(text);

    if (!Array.isArray(parsed)) {
      res.status(200).json({ ok: false, error: 'The model did not return a list.' });
      return;
    }

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
    console.error('extract-notes failed', err);
    res.status(200).json({ ok: false, error: 'The AI service could not process that photo.' });
  }
}
