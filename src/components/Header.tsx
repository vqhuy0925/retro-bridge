import { useState } from 'react';
import { Link as LinkIcon, Pencil, Plus } from 'lucide-react';
import type { DocStore } from '../services/store';
import type { RetroConfig, Role } from '../types';
import { showToast } from '../hooks/useToast';

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  storeMode: 'firestore' | 'local';
  onNewRetro: () => void;
  topic: string;
  configDoc: DocStore<RetroConfig>;
}

export function Header({ role, onRoleChange, storeMode, onNewRetro, topic, configDoc }: HeaderProps) {
  const isSynced = storeMode === 'firestore';
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(topic);

  function startEditing() {
    setDraftTitle(topic);
    setEditingTitle(true);
  }

  function commitTitle() {
    setEditingTitle(false);
    const next = draftTitle.trim();
    if (!next || next === topic) return;
    configDoc.update({ title: next });
  }

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast('Link copied — send it to your PO.'))
      .catch(() => showToast('Could not copy the link.'));
  }

  return (
    <div className="flex flex-wrap items-center gap-4 pb-4 pt-3">
      <div className="min-w-0 flex-1 basis-60">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Retro Bridge
          <span
            title={isSynced ? 'Live sync active' : 'Local demo (not synced)'}
            className={`h-1.5 w-1.5 rounded-full ${isSynced ? 'bg-brand' : 'bg-ink-faint'}`}
          />
        </div>
        {editingTitle ? (
          <input
            type="text"
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraftTitle(topic);
                setEditingTitle(false);
              }
            }}
            className="w-full max-w-xs border-b border-brand bg-transparent py-0.5 text-2xl font-semibold text-ink outline-none"
          />
        ) : (
          <button
            onClick={startEditing}
            className="group flex min-w-0 items-center gap-1.5 text-left"
            aria-label="Edit retro topic name"
          >
            <h1 className="truncate text-2xl font-semibold text-ink">{topic}</h1>
            <Pencil size={13} className="shrink-0 text-ink-faint opacity-0 group-hover:opacity-100" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <LinkIcon size={13} />
          Copy invite link
        </button>

        <button
          onClick={onNewRetro}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <Plus size={13} />
          New retro
        </button>

        <div className="flex rounded-full bg-line-soft p-0.5">
          <button
            onClick={() => onRoleChange('team')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              role === 'team' ? 'bg-team text-white' : 'text-ink-soft'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => onRoleChange('po')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
              role === 'po' ? 'bg-po text-white' : 'text-ink-soft'
            }`}
          >
            PO
          </button>
        </div>
      </div>
    </div>
  );
}
