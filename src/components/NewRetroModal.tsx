import { useState } from 'react';
import { Modal } from './Modal';
import { showToast } from '../hooks/useToast';

const ROOM_CODE_PATTERN = /^\d{3,4}$/;

interface NewRetroModalProps {
  onCreate: (topic: string) => void;
  onJoin: (code: string) => void;
  onCancel?: () => void;
}

export function NewRetroModal({ onCreate, onJoin, onCancel }: NewRetroModalProps) {
  const [topic, setTopic] = useState('');
  const [roomCode, setRoomCode] = useState('');

  function submitCreate() {
    if (!topic.trim()) {
      showToast('Give this retro a topic first.');
      return;
    }
    onCreate(topic.trim());
  }

  function submitJoin() {
    if (!ROOM_CODE_PATTERN.test(roomCode)) {
      showToast('Room codes are 3–4 digits.');
      return;
    }
    onJoin(roomCode);
  }

  return (
    <Modal
      title="Start or join a retro"
      subtitle="Name a topic to start a fresh room, or drop in a room code someone shared with you."
      actions={onCancel ? [{ label: 'Cancel', onClick: onCancel }] : []}
      onDismiss={onCancel ?? (() => {})}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">New retro topic</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitCreate();
              }}
              placeholder="e.g. Sprint 26.09.B Retro"
              className="w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
            <button
              onClick={submitCreate}
              className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Create
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <div className="h-px flex-1 bg-line" />
          or
          <div className="h-px flex-1 bg-line" />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Have a room code?</label>
          <div className="flex gap-2">
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitJoin();
              }}
              inputMode="numeric"
              placeholder="1234"
              className="w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-center text-sm tracking-[0.3em] text-ink focus:border-brand focus:outline-none"
            />
            <button
              onClick={submitJoin}
              className="shrink-0 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink hover:border-ink-faint"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
