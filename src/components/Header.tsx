import { Link as LinkIcon } from 'lucide-react';
import type { Role } from '../types';
import { showToast } from '../hooks/useToast';

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  storeMode: 'firestore' | 'local';
}

export function Header({ role, onRoleChange, storeMode }: HeaderProps) {
  const isSynced = storeMode === 'firestore';

  function copyLink() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => showToast('Link copied — send it to your PO.'))
      .catch(() => showToast('Could not copy the link.'));
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-line pb-4 pt-3">
      <div className="flex min-w-0 flex-1 basis-60 items-center gap-2.5">
        <svg width="38" height="30" viewBox="0 0 38 30" fill="none" aria-hidden="true" className="shrink-0">
          <circle cx="6" cy="8" r="4" fill="var(--team)" />
          <circle cx="32" cy="22" r="4" fill="var(--po)" />
          <path
            d="M9 9 C 18 4, 22 26, 30 21"
            stroke="var(--brand)"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            fill="none"
          />
        </svg>
        <div>
          <h1 className="text-xl font-semibold text-ink">Retro Bridge</h1>
          <div className="mt-0.5 text-xs text-ink-soft">Your paper board, synced live with a remote PO</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink-faint"
        >
          <LinkIcon size={13} />
          Copy invite link
        </button>

        <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5 text-xs text-ink-soft">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isSynced ? 'bg-brand shadow-[0_0_0_3px_var(--brand-wash)]' : 'bg-ink-faint'}`}
          />
          {isSynced ? 'Live sync active' : 'Local demo (not synced)'}
        </span>

        <div className="flex rounded-full border border-line bg-surface p-0.5">
          <button
            onClick={() => onRoleChange('team')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              role === 'team' ? 'bg-team text-white' : 'text-ink-soft'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => onRoleChange('po')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
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
