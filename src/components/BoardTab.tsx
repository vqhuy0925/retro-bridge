import { useRef, useState } from 'react';
import { Camera, Settings, X } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { Modal } from './Modal';
import { dismissToast, showToast } from '../hooks/useToast';
import { aiErrorCopy, createPhotoThumbnail, extractNotesFromPhoto, AiExtractError } from '../services/aiExtract';
import type { CollectionStore, DocStore } from '../services/store';
import type { BoardPhoto, Column, ExtractedNoteRow, Note, RetroConfig, Role } from '../types';

interface BoardTabProps {
  config: RetroConfig;
  configDoc: DocStore<RetroConfig>;
  notes: Note[];
  notesCol: CollectionStore<Note>;
  photos: BoardPhoto[];
  photosCol: CollectionStore<BoardPhoto>;
  role: Role;
  author: string;
}

export function BoardTab({ config, configDoc, notes, notesCol, photos, photosCol, role, author }: BoardTabProps) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editingColumns, setEditingColumns] = useState(false);
  const [reviewRows, setReviewRows] = useState<ExtractedNoteRow[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<BoardPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function submitNote(columnId: string) {
    const text = (draft[columnId] || '').trim();
    if (!text) return;
    notesCol.add({
      text,
      columnId,
      role,
      author,
      source: 'manual',
      createdAt: Date.now(),
      groupId: null,
    });
    setDraft((d) => ({ ...d, [columnId]: '' }));
  }

  async function handlePhoto(file: File) {
    setAnalyzing(true);
    const analyzingToast = showToast('Analyzing photo…', true);

    // Save the photo itself so the PO / remote team can see the physical
    // board too — independent of note extraction, so it still shows up
    // even if that fails.
    createPhotoThumbnail(file).then((dataUrl) => {
      if (!dataUrl) return;
      photosCol.add({ dataUrl, role, author, createdAt: Date.now() });
    });

    try {
      const rows = await extractNotesFromPhoto(file, config.columns);
      if (!rows.length) {
        showToast(aiErrorCopy('empty'));
      } else {
        setReviewRows(rows);
      }
    } catch (err) {
      const code = err instanceof AiExtractError ? err.code : 'unknown';
      showToast(aiErrorCopy(code));
    } finally {
      setAnalyzing(false);
      dismissToast(analyzingToast);
    }
  }

  return (
    <section>
      <div className="mb-3.5">
        <h2 className="text-xl">Shared Board — Round 1</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Type notes directly, or snap a photo of the paper board and let AI sort them into columns.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <button
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          <Camera size={15} />
          {analyzing ? 'Analyzing…' : 'Snap / upload board photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) handlePhoto(file);
          }}
        />
        <button
          onClick={() => setEditingColumns(true)}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink hover:border-ink-faint"
        >
          <Settings size={15} />
          Rename columns
        </button>
      </div>

      {photos.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-ink-soft">
            Uploaded board photos ({photos.length})
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {[...photos]
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((p) => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => setViewingPhoto(p)}
                    title={`${p.author} (${p.role === 'po' ? 'PO' : 'Team'}) — ${new Date(p.createdAt).toLocaleString()}`}
                    className="block h-20 w-20 overflow-hidden rounded-lg border border-line"
                  >
                    <img src={p.dataUrl} alt={`Board photo by ${p.author}`} className="h-full w-full object-cover" />
                  </button>
                  <button
                    onClick={() => photosCol.remove(p.id)}
                    title="Remove photo"
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white group-hover:flex"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] items-start gap-4">
        {config.columns.map((col) => {
          const colNotes = notes
            .filter((n) => n.columnId === col.id)
            .sort((a, b) => a.createdAt - b.createdAt);
          return (
            <div key={col.id} className="rounded-2xl border border-line bg-surface p-3.5">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: col.color }} />
                <h3 className="flex-1 text-sm font-semibold">{col.name}</h3>
                <span className="text-xs text-ink-faint">{colNotes.length}</span>
              </div>
              <div className="mb-3 flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add a note…"
                  value={draft[col.id] || ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [col.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitNote(col.id);
                  }}
                  className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
                />
                <button
                  onClick={() => submitNote(col.id)}
                  className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong"
                >
                  +
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {colNotes.length ? (
                  colNotes.map((n) => (
                    <NoteCard
                      key={n.id}
                      note={n}
                      color={col.color}
                      columns={config.columns}
                      onEdit={(text) => notesCol.update(n.id, { text })}
                      onMove={(columnId) => notesCol.update(n.id, { columnId })}
                      onDelete={() => notesCol.remove(n.id)}
                    />
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-line py-3 text-center text-xs text-ink-faint">
                    No notes yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingColumns && (
        <ColumnEditorModal
          columns={config.columns}
          onSave={(columns) => configDoc.update({ columns })}
          onClose={() => setEditingColumns(false)}
        />
      )}

      {viewingPhoto && (
        <Modal
          title={`Photo by ${viewingPhoto.author}`}
          subtitle={`${viewingPhoto.role === 'po' ? 'PO' : 'Team'} · ${new Date(viewingPhoto.createdAt).toLocaleString()}`}
          onDismiss={() => setViewingPhoto(null)}
          actions={[{ label: 'Close', onClick: () => setViewingPhoto(null) }]}
        >
          <img src={viewingPhoto.dataUrl} alt="Board photo" className="w-full rounded-lg" />
        </Modal>
      )}

      {reviewRows && (
        <NoteReviewModal
          rows={reviewRows}
          columns={config.columns}
          onCancel={() => setReviewRows(null)}
          onConfirm={(rows) => {
            rows.forEach((r) =>
              notesCol.add({
                text: r.text,
                columnId: r.column,
                role,
                author,
                source: 'photo',
                createdAt: Date.now(),
                groupId: null,
              }),
            );
            setReviewRows(null);
            showToast('Added notes from photo to the board.');
          }}
        />
      )}
    </section>
  );
}

function ColumnEditorModal({
  columns,
  onSave,
  onClose,
}: {
  columns: Column[];
  onSave: (columns: Column[]) => void;
  onClose: () => void;
}) {
  const [names, setNames] = useState<Record<string, string>>(
    Object.fromEntries(columns.map((c) => [c.id, c.name])),
  );
  return (
    <Modal
      title="Rename columns"
      subtitle="Applies instantly for both team and PO."
      onDismiss={onClose}
      actions={[
        { label: 'Close', onClick: onClose },
        {
          label: 'Save',
          primary: true,
          onClick: () => {
            onSave(columns.map((c) => ({ ...c, name: (names[c.id] || c.name).trim() || c.name })));
            onClose();
          },
        },
      ]}
    >
      <div className="flex flex-col gap-2.5">
        {columns.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
            <input
              type="text"
              value={names[c.id] || ''}
              onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))}
              className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

function NoteReviewModal({
  rows,
  columns,
  onCancel,
  onConfirm,
}: {
  rows: ExtractedNoteRow[];
  columns: Column[];
  onCancel: () => void;
  onConfirm: (rows: ExtractedNoteRow[]) => void;
}) {
  const [draftRows, setDraftRows] = useState(rows.map((r) => ({ ...r, include: true })));

  return (
    <Modal
      title="Review notes from photo"
      subtitle="Edit the text or uncheck items before adding them to the board."
      onDismiss={onCancel}
      actions={[
        { label: 'Cancel', onClick: onCancel },
        {
          label: 'Add to board',
          primary: true,
          onClick: () =>
            onConfirm(
              draftRows.filter((r) => r.include && r.text.trim()).map((r) => ({ text: r.text.trim(), column: r.column })),
            ),
        },
      ]}
    >
      <div className="flex flex-col gap-1">
        {draftRows.map((r, i) => (
          <div key={i} className="flex items-start gap-2 border-b border-line-soft py-2 last:border-b-0">
            <input
              type="checkbox"
              checked={r.include}
              onChange={(e) =>
                setDraftRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, include: e.target.checked } : row)))
              }
              className="mt-2.5 h-[15px] w-[15px] accent-brand"
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <input
                type="text"
                value={r.text}
                onChange={(e) =>
                  setDraftRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, text: e.target.value } : row)))
                }
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
              />
              <select
                value={r.column}
                onChange={(e) =>
                  setDraftRows((rs) => rs.map((row, idx) => (idx === i ? { ...row, column: e.target.value } : row)))
                }
                className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
