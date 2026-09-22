import { useMemo, useRef, useState } from 'react';
import { Camera, Minus, Plus, X } from 'lucide-react';
import { Modal } from './Modal';
import { VOTE_BUDGET } from '../data/defaults';
import { dismissToast, showToast } from '../hooks/useToast';
import { AiExtractError, aiErrorCopy, extractGroupsFromPhoto } from '../services/aiExtract';
import type { CollectionStore } from '../services/store';
import type { Column, ExtractedGroup, Group, Note, Role, Vote } from '../types';

interface GroupVoteTabProps {
  columns: Column[];
  notes: Note[];
  notesCol: CollectionStore<Note>;
  groups: Group[];
  groupsCol: CollectionStore<Group>;
  votes: Vote[];
  votesCol: CollectionStore<Vote>;
  voterId: string;
  voterName: string;
  role: Role;
}

interface VoteTarget {
  key: string;
  title: string;
  sub: string;
}

export function GroupVoteTab({
  columns,
  notes,
  notesCol,
  groups,
  groupsCol,
  votes,
  votesCol,
  voterId,
  voterName,
  role,
}: GroupVoteTabProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewGroups, setReviewGroups] = useState<ExtractedGroup[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ungrouped = notes.filter((n) => !n.groupId);

  function createGroup() {
    const ids = Object.keys(selected).filter((id) => selected[id]);
    if (!ids.length) {
      showToast('Select at least 1 note to group.');
      return;
    }
    const title = newGroupTitle.trim() || 'Untitled group';
    groupsCol.add({ title, createdAt: Date.now() }).then((gid) => {
      ids.forEach((id) => notesCol.update(id, { groupId: gid }));
      setSelected({});
      setNewGroupTitle('');
    });
  }

  async function handlePhoto(file: File) {
    setAnalyzing(true);
    const analyzingToast = showToast('Analyzing photo…', true);
    try {
      const extracted = await extractGroupsFromPhoto(file, columns);
      if (!extracted.length) showToast(aiErrorCopy('empty'));
      else setReviewGroups(extracted);
    } catch (err) {
      const code = err instanceof AiExtractError ? err.code : 'unknown';
      showToast(aiErrorCopy(code));
    } finally {
      setAnalyzing(false);
      dismissToast(analyzingToast);
    }
  }

  async function confirmGroupsFromPhoto(accepted: ExtractedGroup[]) {
    for (const g of accepted) {
      const gid = await groupsCol.add({ title: g.label, createdAt: Date.now() });
      for (const itemText of g.items) {
        const text = itemText.trim();
        if (!text) continue;
        const match = notes.find((n) => !n.groupId && n.text.trim().toLowerCase() === text.toLowerCase());
        if (match) {
          await notesCol.update(match.id, { groupId: gid });
        } else {
          await notesCol.add({
            text,
            columnId: columns[0]?.id || '',
            role,
            author: voterName,
            source: 'photo',
            createdAt: Date.now(),
            groupId: gid,
          });
        }
      }
    }
    setReviewGroups(null);
    showToast('Added idea groups from photo.');
  }

  const targets: VoteTarget[] = useMemo(() => {
    const groupTargets = groups.map((g) => ({
      key: `group:${g.id}`,
      title: g.title,
      sub: notes
        .filter((n) => n.groupId === g.id)
        .map((n) => n.text)
        .join(' · '),
    }));
    const noteTargets = ungrouped.map((n) => ({ key: `note:${n.id}`, title: n.text, sub: 'Ungrouped note' }));
    return [...groupTargets, ...noteTargets];
  }, [groups, notes, ungrouped]);

  function totalFor(key: string): number {
    return votes.filter((v) => v.targetKey === key).reduce((s, v) => s + v.count, 0);
  }
  function mineFor(key: string): number {
    return votes.find((v) => v.targetKey === key && v.voterId === voterId)?.count || 0;
  }
  const usedVotes = votes.filter((v) => v.voterId === voterId).reduce((s, v) => s + v.count, 0);

  function castVote(key: string, delta: number) {
    const mine = mineFor(key);
    if (delta > 0 && usedVotes >= VOTE_BUDGET) {
      showToast(`You've used all ${VOTE_BUDGET} of your votes.`);
      return;
    }
    if (delta < 0 && mine <= 0) return;
    votesCol.set(`${key}__${voterId}`, {
      targetKey: key,
      voterId,
      voterName,
      count: mine + delta,
      updatedAt: Date.now(),
    });
  }

  const sortedTargets = [...targets].sort((a, b) => totalFor(b.key) - totalFor(a.key));

  return (
    <section>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="text-xl">Group & Vote — Round 2</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Cluster notes that share an idea, then vote on what to discuss first.
          </p>
        </div>
        <button
          disabled={analyzing}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          <Camera size={15} />
          {analyzing ? 'Analyzing…' : 'Snap photo of grouped ideas'}
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
      </div>

      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Select notes to group</h3>
          <div className="mb-3.5 flex flex-col gap-1.5">
            {ungrouped.length ? (
              ungrouped.map((n) => {
                const col = columns.find((c) => c.id === n.columnId);
                return (
                  <label
                    key={n.id}
                    className="flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={!!selected[n.id]}
                      onChange={(e) => setSelected((s) => ({ ...s, [n.id]: e.target.checked }))}
                      className="mt-0.5 h-[15px] w-[15px] accent-brand"
                    />
                    <span className="flex-1 text-sm">{n.text}</span>
                    <span className="text-[10.5px] text-ink-faint">{col?.name}</span>
                  </label>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-line py-2.5 text-center text-xs text-ink-faint">
                No ungrouped notes left.
              </div>
            )}
          </div>
          <div className="mb-4.5 flex gap-2">
            <input
              type="text"
              placeholder="Idea group name…"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm"
            />
            <button
              onClick={createGroup}
              className="rounded-lg bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong"
            >
              Group them
            </button>
          </div>

          <h3 className="mb-2 mt-4.5 text-sm font-semibold">Existing groups</h3>
          {groups.length ? (
            groups.map((g) => {
              const members = notes.filter((n) => n.groupId === g.id);
              return (
                <div key={g.id} className="mb-3 rounded-xl border border-line bg-surface p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{g.title}</h4>
                    <button
                      onClick={() => {
                        groupsCol.remove(g.id);
                        members.forEach((m) => notesCol.update(m.id, { groupId: null }));
                      }}
                      title="Delete group"
                      className="rounded p-1 text-ink-faint hover:bg-line-soft hover:text-danger"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.length ? (
                      members.map((m) => (
                        <span key={m.id} className="rounded-full bg-line-soft px-2.5 py-1 text-xs text-ink-soft">
                          {m.text}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-line-soft px-2.5 py-1 text-xs text-ink-soft">No notes yet</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-line py-2.5 text-center text-xs text-ink-faint">
              No groups yet.
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Vote on discussion priority</h3>
          <div className="mb-2.5 rounded-lg bg-brand-wash px-3 py-2 text-sm text-ink-soft">
            You have <b className="text-brand-strong">{VOTE_BUDGET - usedVotes}/{VOTE_BUDGET}</b> votes left.
          </div>
          {sortedTargets.length ? (
            sortedTargets.map((t, i) => {
              const total = totalFor(t.key);
              const mine = mineFor(t.key);
              return (
                <div key={t.key} className="mb-2 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5">
                  <span className="w-[18px] font-mono text-sm text-ink-faint">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="truncate text-[11.5px] text-ink-faint">{t.sub}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      disabled={mine <= 0}
                      onClick={() => castVote(t.key, -1)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-surface hover:border-brand disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="min-w-[20px] text-center font-mono text-base font-semibold text-brand-strong">
                      {total}
                    </span>
                    <button
                      onClick={() => castVote(t.key, 1)}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-line bg-surface hover:border-brand"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="w-10 shrink-0 text-[11px] text-ink-faint">you: {mine}</div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-line py-2.5 text-center text-xs text-ink-faint">
              Nothing to vote on yet — group some notes first.
            </div>
          )}
        </div>
      </div>

      {reviewGroups && (
        <Modal
          title="Review groups from photo"
          subtitle="Each group creates new notes (if needed) and bundles them together for voting."
          onDismiss={() => setReviewGroups(null)}
          actions={[
            { label: 'Cancel', onClick: () => setReviewGroups(null) },
            {
              label: 'Add to board',
              primary: true,
              onClick: () => confirmGroupsFromPhoto(reviewGroups),
            },
          ]}
        >
          <div className="flex flex-col gap-1">
            {reviewGroups.map((g, i) => (
              <div key={i} className="border-b border-line-soft py-2 last:border-b-0">
                <div className="text-sm font-semibold">{g.label}</div>
                <div className="mt-1 text-xs text-ink-faint">{g.items.join(' · ')}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </section>
  );
}
