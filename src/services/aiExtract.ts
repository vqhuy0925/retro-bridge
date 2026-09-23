import type { Column, ExtractedGroup, ExtractedNoteRow } from '../types';

export type AiProvider = 'gemini' | 'cloud-vision';

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

// There's no Firebase Storage in this project (it would require moving off
// the no-billing-account Spark plan) — the display copy of a photo is
// stored inline as a data URL on its Firestore doc instead, so it has to
// clear Firestore's 1 MiB per-document cap with real headroom to spare.
const THUMBNAIL_MAX_DIMENSION = 1000;
const THUMBNAIL_JPEG_QUALITY = 0.7;
const MAX_THUMBNAIL_DATA_URL_BYTES = 700 * 1024;

// A board photo is the copy the PO/team zoom into to read handwriting, and
// (unlike the team wrap-up photo) each one is `addDoc`-ed as its own
// Firestore document — see firestoreStore.ts's `collection()` — so it isn't
// sharing its 1 MiB budget with any other field. Spend that budget on
// sharpness: aim high and search downward for the best quality that still
// clears the cap, instead of a fixed low quality that blurs text on zoom.
const BOARD_PHOTO_MAX_DIMENSION = 1920;
const BOARD_PHOTO_QUALITIES = [0.92, 0.88, 0.82, 0.75, 0.68, 0.6, 0.5];
const MAX_BOARD_PHOTO_DATA_URL_BYTES = 950 * 1024;

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

async function resizeImage(file: File, maxDimension: number, quality: number): Promise<Blob> {
  const img = await loadImageElement(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
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
      quality,
    );
  });
}

function resizeForUpload(file: File): Promise<Blob> {
  return resizeImage(file, MAX_DIMENSION, JPEG_QUALITY);
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new AiExtractError('read_failed', 'Could not read the photo file.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Builds a small data-URL copy of a board photo for the team/PO to view
 * alongside the board — independent of AI note extraction, so it still
 * shows up even if extraction fails or a device has no camera. Returns
 * null (rather than throwing) if the photo can't be read or is still too
 * big once downscaled, since this is a nice-to-have next to note capture.
 */
export async function createPhotoThumbnail(file: File): Promise<string | null> {
  try {
    const resized = await resizeImage(file, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_JPEG_QUALITY);
    const dataUrl = await blobToDataUrl(resized);
    return dataUrl.length <= MAX_THUMBNAIL_DATA_URL_BYTES ? dataUrl : null;
  } catch {
    return null;
  }
}

async function resizeWithQualitySearch(
  file: File,
  maxDimension: number,
  qualities: number[],
  maxDataUrlBytes: number,
): Promise<Blob> {
  const img = await loadImageElement(file);
  const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AiExtractError('read_failed', 'Could not process the photo file.');
  ctx.drawImage(img, 0, 0, width, height);

  let lastBlob: Blob | null = null;
  for (const quality of qualities) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob) continue;
    lastBlob = blob;
    // Base64 inflates a blob by ~4/3 — stop as soon as that estimate clears
    // the budget; the caller double-checks the real encoded length anyway.
    if ((blob.size * 4) / 3 <= maxDataUrlBytes) return blob;
  }
  if (!lastBlob) throw new AiExtractError('read_failed', 'Could not process the photo file.');
  return lastBlob;
}

/**
 * Saves a board photo at the highest quality/resolution that still fits
 * Firestore's per-document cap — see the BOARD_PHOTO_* constants above for
 * why this can afford to be sharper than createPhotoThumbnail.
 */
export async function createBoardPhoto(file: File): Promise<string | null> {
  try {
    const blob = await resizeWithQualitySearch(
      file,
      BOARD_PHOTO_MAX_DIMENSION,
      BOARD_PHOTO_QUALITIES,
      MAX_BOARD_PHOTO_DATA_URL_BYTES,
    );
    const dataUrl = await blobToDataUrl(blob);
    return dataUrl.length <= MAX_BOARD_PHOTO_DATA_URL_BYTES ? dataUrl : null;
  } catch {
    return null;
  }
}

async function callExtractApi(
  mode: 'notes' | 'groups',
  file: File,
  columns: Column[],
): Promise<{ data: unknown; provider: AiProvider }> {
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

  let body: { ok?: boolean; error?: string; rows?: unknown; groups?: unknown; provider?: string };
  try {
    body = await res.json();
  } catch {
    throw new AiExtractError('invalid_response', 'The AI service returned an unreadable response.');
  }

  if (!res.ok || !body.ok) {
    throw new AiExtractError('server', body.error || `AI service error (${res.status}).`);
  }
  const provider: AiProvider = body.provider === 'cloud-vision' ? 'cloud-vision' : 'gemini';
  return { data: mode === 'notes' ? body.rows : body.groups, provider };
}

export async function extractNotesFromPhoto(
  file: File,
  columns: Column[],
): Promise<{ rows: ExtractedNoteRow[]; provider: AiProvider }> {
  const { data, provider } = await callExtractApi('notes', file, columns);
  if (!Array.isArray(data)) throw new AiExtractError('invalid_response', 'Unexpected response shape.');
  return { rows: data as ExtractedNoteRow[], provider };
}

export async function extractGroupsFromPhoto(
  file: File,
  columns: Column[],
): Promise<{ groups: ExtractedGroup[]; provider: AiProvider }> {
  const { data, provider } = await callExtractApi('groups', file, columns);
  if (!Array.isArray(data)) throw new AiExtractError('invalid_response', 'Unexpected response shape.');
  return { groups: data as ExtractedGroup[], provider };
}

export function providerLabel(provider: AiProvider): string {
  return provider === 'cloud-vision' ? 'Cloud Vision (fallback)' : 'Gemini';
}

// `message` is the specific reason the server sent back (e.g. which
// Gemini quota was hit) — worth surfacing as-is for 'server' errors since
// it tells the user whether to just retry or wait out a quota. The other
// codes are raised client-side with a generic message that isn't worth
// showing verbatim, so they keep their friendlier fixed copy.
export function aiErrorCopy(code: string, message?: string): string {
  if (code === 'server' && message) return message;
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
