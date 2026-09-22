import { createWorker } from 'tesseract.js';
import type { ExtractedNoteRow } from '../types';

/**
 * On-device OCR used only when Gemini is unreachable (rate-limited or
 * overloaded) — no network call, no quota, but plain OCR has no notion of
 * "column" or even "one note per line", so it reads noticeably worse on
 * messy handwriting than the Gemini vision path. Every recognized line
 * gets dumped into the first column and left for the reviewer to fix up
 * in the existing review-before-adding modal.
 */
export async function extractTextWithTesseract(file: File, defaultColumnId: string): Promise<ExtractedNoteRow[]> {
  const worker = await createWorker('eng');
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ text: line, column: defaultColumnId }));
  } finally {
    await worker.terminate();
  }
}
