import { useState } from 'react';
import { X } from 'lucide-react';
import type { Column, Note } from '../types';

interface NoteCardProps {
  note: Note;
  color: string;
  columns: Column[];
  onEdit: (text: string) => void;
  onMove: (columnId: string) => void;
  onDelete: () => void;
}

export function NoteCard({ note, color, columns, onEdit, onMove, onDelete }: NoteCardProps) {
  const [text, setText] = useState(note.text);
  const tagLabel = note.source === 'photo' ? 'from photo' : note.role === 'po' ? 'PO' : 'Team';
  const tagClasses =
    note.source === 'photo'
      ? 'bg-line-soft text-ink-faint'
      : note.role === 'po'
        ? 'bg-po/15 text-po'
        : 'bg-team/15 text-team';

  return (
    <div
      className="rounded-r-lg bg-surface p-2.5"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const trimmed = text.trim();
          if (trimmed && trimmed !== note.text) onEdit(trimmed);
          else setText(note.text);
        }}
        rows={2}
        className="w-full resize-none rounded bg-transparent text-base leading-snug text-ink outline-none focus:bg-line-soft"
      />
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${tagClasses}`}>{tagLabel}</span>
        <div className="flex items-center gap-1">
          <select
            value={note.columnId}
            onChange={(e) => onMove(e.target.value)}
            className="rounded border border-line bg-surface px-1.5 py-0.5 text-xs"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={onDelete}
            title="Delete"
            className="rounded p-1 text-ink-faint hover:bg-line-soft hover:text-danger"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
