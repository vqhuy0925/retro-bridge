import type { PreviousRetro } from '../hooks/usePreviousRetro';

interface PreviousRetroPanelProps {
  previous: PreviousRetro;
}

export function PreviousRetroPanel({ previous }: PreviousRetroPanelProps) {
  const { roomId, config, actions, toggleAction } = previous;

  if (!config) {
    return (
      <div className="mb-6 border-l-2 border-line-soft pl-4 text-sm text-ink-faint">
        Linked to previous retro <b className="text-ink-soft">#{roomId}</b> — waiting for its data to load…
      </div>
    );
  }

  const openCount = actions.filter((a) => !a.done).length;
  const sorted = [...actions].sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt);

  return (
    <div className="mb-6 border-l-2 border-brand pl-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-brand-strong">
            Previous retro · check actions
          </div>
          <h3 className="text-base font-semibold">{config.title}</h3>
        </div>
        <span className="text-xs font-semibold text-ink-soft">
          {actions.length === 0
            ? 'No actions logged'
            : openCount
              ? `${openCount} still open`
              : 'All closed'}
        </span>
      </div>

      {sorted.length ? (
        <div className="flex flex-col">
          {sorted.map((a) => (
            <label
              key={a.id}
              className="flex items-center gap-2.5 border-b border-line-soft py-2 last:border-b-0"
            >
              <input
                type="checkbox"
                checked={a.done}
                onChange={(e) => toggleAction(a.id, e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              <span className={`flex-1 text-sm ${a.done ? 'text-ink-faint line-through' : ''}`}>
                {a.text}
                {a.owner && (
                  <>
                    {' — '}
                    <b>{a.owner}</b>
                  </>
                )}
              </span>
              {a.dueDate && <span className="font-mono text-[11px] text-ink-faint">{a.dueDate}</span>}
            </label>
          ))}
        </div>
      ) : (
        <div className="text-sm text-ink-soft">No action items were logged last time.</div>
      )}
    </div>
  );
}
