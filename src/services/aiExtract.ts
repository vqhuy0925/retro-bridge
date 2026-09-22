import type { Column, ExtractedGroup, ExtractedNoteRow } from '../types';

export class AiExtractError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new AiExtractError('read_failed', 'Could not read the photo file.'));
    reader.readAsDataURL(file);
  });
}

async function callExtractApi(
  mode: 'notes' | 'groups',
  file: File,
  columns: Column[],
): Promise<unknown> {
  const imageBase64 = await fileToBase64(file);
  let res: Response;
  try {
    res = await fetch('/api/extract-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        imageBase64,
        mimeType: file.type || 'image/jpeg',
        columns: columns.map((c) => ({ id: c.id, name: c.name })),
      }),
    });
  } catch {
    throw new AiExtractError('network', 'Could not reach the AI service — check your connection.');
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
  };
  return map[code] || `Could not analyze the photo (${code}).`;
}
