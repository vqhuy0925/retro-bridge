import { useState } from 'react';
import { Modal } from './Modal';
import { showToast } from '../hooks/useToast';
import { getLastRoomCode } from '../hooks/useRoom';

const ROOM_CODE_PATTERN = /^\d{3,4}$/;

interface NewRetroModalProps {
  onCreate: (topic: string, previousRoomId?: string) => void;
  onJoin: (code: string) => void;
  onCancel?: () => void;
}

export function NewRetroModal({ onCreate, onJoin, onCancel }: NewRetroModalProps) {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [topic, setTopic] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [linkPrevious, setLinkPrevious] = useState(() => !!getLastRoomCode());
  const [previousRoomId, setPreviousRoomId] = useState(() => getLastRoomCode() || '');

  function submitCreate() {
    if (!topic.trim()) {
      showToast('Give this retro a topic first.');
      return;
    }
    onCreate(topic.trim(), linkPrevious ? previousRoomId.trim() || undefined : undefined);
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
      subtitle={
        mode === 'create'
          ? 'Name a topic to start a fresh room.'
          : 'Drop in the room code someone shared with you.'
      }
      actions={onCancel ? [{ label: 'Cancel', onClick: onCancel }] : []}
      onDismiss={onCancel ?? (() => {})}
    >
      <div className="mb-4 flex rounded-full bg-line-soft p-0.5 text-base font-semibold">
        <button
          onClick={() => setMode('create')}
          className={`flex-1 rounded-full py-1.5 ${mode === 'create' ? 'bg-brand text-white' : 'text-ink-soft'}`}
        >
          New retro
        </button>
        <button
          onClick={() => setMode('join')}
          className={`flex-1 rounded-full py-1.5 ${mode === 'join' ? 'bg-brand text-white' : 'text-ink-soft'}`}
        >
          Join a room
        </button>
      </div>

      <div className="flex min-h-[180px] flex-col justify-center">
        {mode === 'create' ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-soft">Retro topic</label>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitCreate();
                  }}
                  placeholder="e.g. Sprint 26.09.B Retro"
                  className="w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink focus:border-brand focus:outline-none"
                />
                <button
                  onClick={submitCreate}
                  className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-base font-semibold text-white hover:bg-brand-strong"
                >
                  Create
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={linkPrevious}
                onChange={(e) => setLinkPrevious(e.target.checked)}
                className="h-[15px] w-[15px] accent-brand"
              />
              Carry over open actions from a previous retro
            </label>

            {linkPrevious && (
              <div>
                <input
                  value={previousRoomId}
                  onChange={(e) => setPreviousRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  placeholder="Previous retro's room code, e.g. 1234"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-base tracking-[0.2em] text-ink focus:border-brand focus:outline-none"
                />
                <p className="mt-1 text-xs text-ink-faint">
                  The team can check those actions off before diving into this topic.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink-soft">Room code</label>
            <div className="flex gap-2">
              <input
                autoFocus
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitJoin();
                }}
                inputMode="numeric"
                placeholder="1234"
                className="w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-center text-base tracking-[0.3em] text-ink focus:border-brand focus:outline-none"
              />
              <button
                onClick={submitJoin}
                className="shrink-0 rounded-lg bg-brand px-3.5 py-2 text-base font-semibold text-white hover:bg-brand-strong"
              >
                Join
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
