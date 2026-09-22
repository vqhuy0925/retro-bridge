import { RefreshCw, Shuffle } from 'lucide-react';
import { WARMUP_GAMES } from '../data/defaults';
import { TimerWidget } from './TimerWidget';
import { PreviousRetroPanel } from './PreviousRetroPanel';
import type { PreviousRetro } from '../hooks/usePreviousRetro';
import type { DocStore } from '../services/store';
import type { TimerState, WarmupState } from '../types';

interface WarmupTabProps {
  warmup: WarmupState | null;
  warmupDoc: DocStore<WarmupState>;
  timer: TimerState;
  timerDoc: DocStore<TimerState>;
  previous: PreviousRetro | null;
}

export function WarmupTab({ warmup, warmupDoc, timer, timerDoc, previous }: WarmupTabProps) {
  function pickRandom() {
    const game = WARMUP_GAMES[Math.floor(Math.random() * WARMUP_GAMES.length)];
    warmupDoc.set({ gameId: game.id, pickedAt: Date.now() });
  }

  const current = warmup ? WARMUP_GAMES.find((g) => g.id === warmup.gameId) : null;

  function shufflePrompt() {
    if (!warmup || !current?.prompts?.length) return;
    let next = Math.floor(Math.random() * current.prompts.length);
    // Avoid landing on the same prompt twice in a row when there's more than one to pick from.
    if (current.prompts.length > 1 && next === (warmup.promptIndex ?? -1)) {
      next = (next + 1) % current.prompts.length;
    }
    warmupDoc.update({ promptIndex: next });
  }

  return (
    <section>
      {previous && <PreviousRetroPanel previous={previous} />}

      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="text-xl">Warm-up</h2>
          <p className="mt-0.5 text-sm text-ink-soft">
            Pick one to loosen everyone up before the retro — team and PO play together.
          </p>
        </div>
        <button
          onClick={pickRandom}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          <Shuffle size={15} />
          Shuffle a game
        </button>
      </div>

      <div className="mb-3.5">
        <h3 className="mb-1.5 text-sm font-semibold text-ink-soft">Timer</h3>
        <TimerWidget timer={timer} timerDoc={timerDoc} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
        {WARMUP_GAMES.map((g) => {
          const picked = warmup?.gameId === g.id;
          const Icon = g.icon;
          return (
            <div
              key={g.id}
              className={`relative rounded-xl border bg-surface p-4 shadow-card ${
                picked ? 'border-brand ring-2 ring-brand-wash' : 'border-line'
              }`}
            >
              {picked && (
                <span className="absolute right-3 top-3 text-[11px] font-bold text-brand">Selected</span>
              )}
              <div className="mb-1.5 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-wash text-brand-strong">
                  <Icon size={16} />
                </span>
                <h3 className="text-base font-semibold">{g.title}</h3>
              </div>
              <p className="mb-2.5 text-sm leading-snug text-ink-soft">{g.instruction}</p>
              <div className="text-[11.5px] text-ink-faint">{g.duration}</div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="mt-5 rounded-xl border border-line bg-brand-wash p-4">
          <div className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wide text-brand-strong">
            <current.icon size={14} />
            Now playing
          </div>
          <h3 className="mt-1 text-base">{current.title}</h3>

          <ol className="mt-2.5 flex list-decimal flex-col gap-1 pl-4 text-sm text-ink-soft">
            {current.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          {current.prompts && current.prompts.length > 0 && (
            <div className="mt-3 rounded-lg border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Ready-made prompt — no prep needed
                </span>
                <button
                  onClick={shufflePrompt}
                  className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11.5px] font-semibold text-ink hover:border-brand"
                >
                  <RefreshCw size={11} />
                  New prompt
                </button>
              </div>
              <p className="mt-1.5 text-sm font-medium text-ink">
                {current.prompts[warmup?.promptIndex ?? 0]}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
