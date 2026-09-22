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
    <div className="mb-6 flex gap-5 overflow-x-auto border-b border-line-soft">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px whitespace-nowrap border-b-2 py-2.5 text-sm font-semibold ${
            active === tab.id
              ? 'border-brand text-ink'
              : 'border-transparent text-ink-faint hover:text-ink-soft'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
