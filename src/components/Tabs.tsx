import type { TabId } from '../types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'warmup', label: '1 · Warm-up' },
  { id: 'board', label: '2 · Shared Board' },
  { id: 'group', label: '3 · Group & Vote' },
  { id: 'wrap', label: '4 · Actions & Wrap-up' },
];

interface TabsProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${
            active === tab.id
              ? 'border-brand text-brand-strong'
              : 'border-transparent text-ink-faint hover:text-ink-soft'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
