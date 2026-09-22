import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { WARMUP_GAMES } from '../data/defaults';
import type { CollectionStore } from '../services/store';
import type { ActionItem, Column, Group, Note, Vote, WarmupState } from '../types';

interface WrapTabProps {
  columns: Column[];
  notes: Note[];
  groups: Group[];
  votes: Vote[];
  actions: ActionItem[];
  actionsCol: CollectionStore<ActionItem>;
  warmup: WarmupState | null;
}

function targetTitle(key: string, groups: Group[], notes: Note[]): string {
  if (key.startsWith('group:')) {
    const id = key.slice(6);
    return groups.find((g) => g.id === id)?.title || 'Untitled group';
  }
  const id = key.slice(5);
  return notes.find((n) => n.id === id)?.text || 'Note';
}

export function WrapTab({ columns, notes, groups, votes, actions, actionsCol, warmup }: WrapTabProps) {
  const [text, setText] = useState('');
  const [owner, setOwner] = useState('');
  const [due, setDue] = useState('');

  function addAction() {
    if (!text.trim()) return;
    actionsCol.add({ text: text.trim(), owner: owner.trim(), dueDate: due, done: false, createdAt: Date.now() });
    setText('');
    setOwner('');
    setDue('');
  }

  const voteTotals = new Map<string, number>();
  for (const v of votes) voteTotals.set(v.targetKey, (voteTotals.get(v.targetKey) || 0) + v.count);
  const rankedVotes = [...voteTotals.entries()]
    .map(([key, total]) => ({ key, total, title: targetTitle(key, groups, notes) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  function downloadSummary() {
    const lines: string[] = [];
    lines.push(`# Retro Summary — ${new Date().toLocaleDateString('en-US')}`);
    if (warmup) {
      const game = WARMUP_GAMES.find((g) => g.id === warmup.gameId);
      if (game) lines.push(`\n**Warm-up:** ${game.title}`);
    }
    for (const c of columns) {
      lines.push(`\n## ${c.name}`);
      const colNotes = notes.filter((n) => n.columnId === c.id);
      lines.push(colNotes.length ? colNotes.map((n) => `- ${n.text}`).join('\n') : '_No notes_');
    }
    lines.push('\n## Discussion priorities (by vote)');
    lines.push(
      rankedVotes.length ? rankedVotes.map((t) => `- ${t.title} (${t.total} votes)`).join('\n') : '_No votes yet_',
    );
    lines.push('\n## Action items');
    lines.push(
      actions.length
        ? actions
            .map(
              (a) =>
                `- [${a.done ? 'x' : ' '}] ${a.text}${a.owner ? ` — ${a.owner}` : ''}${a.dueDate ? ` (due: ${a.dueDate})` : ''}`,
            )
            .join('\n')
        : '_No action items_',
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'retro-summary.md';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section>
      <div className="mb-3.5">
        <h2 className="text-2xl">Action Items</h2>
        <p className="mt-0.5 text-base text-ink-soft">Capture follow-ups from this retro.</p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          type="text"
          placeholder="What needs to happen…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-lg border border-line-soft bg-surface px-2.5 py-1.5 text-base focus:border-brand focus:outline-none"
        />
        <input
          type="text"
          placeholder="Owner"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="rounded-lg border border-line-soft bg-surface px-2.5 py-1.5 text-base focus:border-brand focus:outline-none"
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="rounded-lg border border-line-soft bg-surface px-2.5 py-1.5 text-base focus:border-brand focus:outline-none"
        />
        <button
          onClick={addAction}
          className="rounded-lg bg-brand px-3.5 py-1.5 text-base font-semibold text-white hover:bg-brand-strong"
        >
          Add
        </button>
      </div>

      {actions.length ? (
        actions
          .slice()
          .sort((a, b) => a.createdAt - b.createdAt)
          .map((a) => (
            <div key={a.id} className="flex items-center gap-2.5 border-b border-line-soft py-2">
              <input
                type="checkbox"
                checked={a.done}
                onChange={(e) => actionsCol.update(a.id, { done: e.target.checked })}
                className="h-4 w-4 accent-brand"
              />
              <span className={`flex-1 text-base ${a.done ? 'text-ink-faint line-through' : ''}`}>
                {a.text}
                {a.owner && (
                  <>
                    {' — '}
                    <b>{a.owner}</b>
                  </>
                )}
              </span>
              <span className="font-mono text-sm text-ink-faint">{a.dueDate}</span>
              <button
                onClick={() => actionsCol.remove(a.id)}
                className="rounded p-1 text-ink-faint hover:bg-line-soft hover:text-danger"
              >
                <X size={13} />
              </button>
            </div>
          ))
      ) : (
        <div className="py-2.5 text-center text-sm text-ink-faint">No action items yet.</div>
      )}

      <div className="mb-3.5 mt-8 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="text-2xl">Summary</h2>
          <p className="mt-0.5 text-base text-ink-soft">Wrap up the retro to share with team and PO.</p>
        </div>
        <button
          onClick={downloadSummary}
          className="flex items-center gap-1.5 text-base font-semibold text-ink-soft hover:text-ink"
        >
          <Download size={15} />
          Download summary (.md)
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-x-8 gap-y-4 border-y border-line-soft py-4">
        {columns.map((c) => (
          <div key={c.id}>
            <div className="font-display text-3xl font-semibold">{notes.filter((n) => n.columnId === c.id).length}</div>
            <div className="mt-0.5 text-sm text-ink-soft">{c.name}</div>
          </div>
        ))}
        <div>
          <div className="font-display text-3xl font-semibold">
            {actions.filter((a) => a.done).length}/{actions.length}
          </div>
          <div className="mt-0.5 text-sm text-ink-soft">Actions completed</div>
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold">Discussion priorities (by vote)</h3>
      <ul className="list-none p-0">
        {rankedVotes.length ? (
          rankedVotes.map((t) => (
            <li key={t.key} className="flex justify-between gap-2.5 border-b border-line-soft py-2 text-base last:border-b-0">
              <span>{t.title}</span>
              <span className="font-mono">{t.total} votes</span>
            </li>
          ))
        ) : (
          <li className="py-2 text-base text-ink-faint">No votes yet.</li>
        )}
      </ul>
    </section>
  );
}
