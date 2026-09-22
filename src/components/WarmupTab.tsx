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
              <h3 className="mb-1.5 text-base font-semibold">{g.title}</h3>
              <p className="mb-2.5 text-sm leading-snug text-ink-soft">{g.instruction}</p>
              <div className="text-[11.5px] text-ink-faint">{g.duration}</div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="mt-5 rounded-xl border border-line bg-brand-wash p-4">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-brand-strong">
            Now playing
          </div>
          <h3 className="mt-1 text-base">{current.title}</h3>
          <p className="mt-1.5 text-sm text-ink-soft">{current.instruction}</p>
        </div>
      )}
    </section>
  );
}
