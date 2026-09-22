import { Shuffle } from 'lucide-react';
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

  return (
    <section>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <h2 className="text-2xl">Warm-up</h2>
          <p className="mt-0.5 text-base text-ink-soft">
            Pick one to loosen everyone up before the retro — team and PO play together.
          </p>
        </div>
        <button
          onClick={pickRandom}
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-base font-semibold text-white hover:bg-brand-strong"
        >
          <Shuffle size={15} />
          Shuffle a game
        </button>
      </div>

      <div className="mb-3.5">
        <h3 className="mb-1.5 text-base font-semibold text-ink-soft">Timer</h3>
        <TimerWidget timer={timer} timerDoc={timerDoc} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
        {WARMUP_GAMES.map((g) => {
          const picked = warmup?.gameId === g.id;
          const Icon = g.icon;
          return (
            <div
              key={g.id}
              className={`relative rounded-xl border p-4 ${
                picked ? 'border-brand' : 'border-line-soft'
              }`}
            >
              {picked && (
                <span className="absolute right-4 top-4 text-xs font-bold text-brand">Selected</span>
              )}
              <div className="mb-1.5 flex items-center gap-2">
                <Icon size={16} className="shrink-0 text-brand-strong" />
                <h3 className="text-lg font-semibold">{g.title}</h3>
              </div>
              <p className="mb-2.5 text-base leading-snug text-ink-soft">{g.instruction}</p>
              <div className="text-sm text-ink-faint">{g.duration}</div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="mt-6 border-l-2 border-brand pl-4">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-strong">
            <current.icon size={14} />
            Now playing
          </div>
          <h3 className="mt-1 text-lg">{current.title}</h3>

          <ol className="mt-2.5 flex list-decimal flex-col gap-1 pl-4 text-base text-ink-soft">
            {current.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <p className="mt-3 text-base italic text-ink-soft">
            <span className="not-italic font-semibold text-ink-faint">Example — </span>
            {current.example}
          </p>
        </div>
      )}

      {previous && (
        <div className="mt-8">
          <PreviousRetroPanel previous={previous} />
        </div>
      )}
    </section>
  );
}
