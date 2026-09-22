import type { Column, ExtractedGroup, ExtractedNoteRow } from '../types';

export class AiExtractError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// Vercel Serverless Functions reject request bodies over ~4.5 MB (a hard
// platform limit, not configurable) — a raw phone photo (often 8-15 MB) plus
// ~33% base64 inflation blows past that easily. Downscale on the client
// first: Gemini doesn't need full camera resolution to read handwriting, and
// a resized JPEG comfortably clears the limit with room to spare.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
const MAX_BASE64_BYTES = 3.5 * 1024 * 1024;

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new AiExtractError('read_failed', 'Could not read the photo file.'));
    };
    img.src = url;
  });
}

async function resizeForUpload(file: File): Promise<Blob> {
  const img = await loadImageElement(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AiExtractError('read_failed', 'Could not process the photo file.');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AiExtractError('read_failed', 'Could not process the photo file.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new AiExtractError('read_failed', 'Could not read the photo file.'));
    reader.readAsDataURL(blob);
  });
}

async function callExtractApi(
  mode: 'notes' | 'groups',
  file: File,
  columns: Column[],
): Promise<unknown> {
  const resized = await resizeForUpload(file);
  const imageBase64 = await blobToBase64(resized);
  if (imageBase64.length > MAX_BASE64_BYTES) {
    throw new AiExtractError('too_large', 'That photo is too large even after resizing — try a closer, less busy shot.');
  }

  let res: Response;
  try {
    res = await fetch('/api/extract-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        imageBase64,
        mimeType: 'image/jpeg',
        columns: columns.map((c) => ({ id: c.id, name: c.name })),
      }),
    });
  } catch {
    throw new AiExtractError('network', 'Could not reach the AI service — check your connection.');
  }

  if (res.status === 413) {
    throw new AiExtractError('too_large', 'That photo is too large even after resizing — try a closer, less busy shot.');
  }

  let body: { ok?: boolean; error?: string; rows?: unknown; groups?: unknown };
  try {
    body = await res.json();
  } catch {
    throw new AiExtractError('invalid_response', 'The AI service returned an unreadable response.');
  }

  if (!res.ok || !body.ok) {
    throw new AiExtractError('server', body.error || `AI service error (${res.status}).`);
  }
  return mode === 'notes' ? body.rows : body.groups;
}

export async function extractNotesFromPhoto(
  file: File,
  columns: Column[],
): Promise<ExtractedNoteRow[]> {
  const rows = (await callExtractApi('notes', file, columns)) as ExtractedNoteRow[];
  if (!Array.isArray(rows)) throw new AiExtractError('invalid_response', 'Unexpected response shape.');
  return rows;
}

export async function extractGroupsFromPhoto(
  file: File,
  columns: Column[],
): Promise<ExtractedGroup[]> {
  const groups = (await callExtractApi('groups', file, columns)) as ExtractedGroup[];
  if (!Array.isArray(groups)) throw new AiExtractError('invalid_response', 'Unexpected response shape.');
  return groups;
}

export function aiErrorCopy(code: string): string {
  const map: Record<string, string> = {
    network: "Could not reach the AI service — check your connection.",
    server: 'The AI service could not process that photo. Try a clearer one.',
    read_failed: 'Could not read the photo file.',
    invalid_response: "Couldn't read the AI response — try again.",
    empty: 'Could not recognize anything in the photo.',
    too_large: 'That photo is too large even after resizing — try a closer, less busy shot.',
  };
  return map[code] || `Could not analyze the photo (${code}).`;
}
