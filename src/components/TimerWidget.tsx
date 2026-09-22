import { useEffect, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import type { DocStore } from '../services/store';
import type { TimerState } from '../types';

interface TimerWidgetProps {
  timer: TimerState;
  timerDoc: DocStore<TimerState>;
}

function format(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function clampDigits(raw: string, max: number): string {
  const digits = raw.replace(/\D/g, '').slice(0, 2);
  return digits === '' ? '' : String(Math.min(Number(digits), max));
}

/** A plain set-your-own-time countdown (like the Windows Clock timer) synced to the whole room. */
export function TimerWidget({ timer, timerDoc }: TimerWidgetProps) {
  // Defensive: rooms created before this widget's schema settled (or a
  // half-written doc) may be missing fields — never let `undefined` reach
  // Firestore's setDoc(), which rejects it outright.
  const setSec = timer.setSec ?? 0;
  const remainingSec = timer.remainingSec ?? setSec;
  const endsAt = timer.endsAt ?? null;

  const running = endsAt != null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = running ? (endsAt! - now) / 1000 : remainingSec;
  const expired = running && remaining <= 0;

  const [minutesDraft, setMinutesDraft] = useState(String(Math.floor(remainingSec / 60)));
  const [secondsDraft, setSecondsDraft] = useState(String(remainingSec % 60).padStart(2, '0'));

  // Keep the editable fields in sync with the shared value while idle (e.g. someone else set it).
  useEffect(() => {
    if (running) return;
    setMinutesDraft(String(Math.floor(remainingSec / 60)));
    setSecondsDraft(String(remainingSec % 60).padStart(2, '0'));
  }, [remainingSec, running]);

  function commitDraft() {
    const total = Math.max(0, Math.min(99 * 60 + 59, (Number(minutesDraft) || 0) * 60 + (Number(secondsDraft) || 0)));
    timerDoc.set({ setSec: total, remainingSec: total, endsAt: null });
  }

  function start() {
    if (remaining <= 0) return;
    timerDoc.set({ setSec, remainingSec, endsAt: Date.now() + remaining * 1000 });
  }
  function pause() {
    timerDoc.set({ setSec, remainingSec: Math.max(0, remaining), endsAt: null });
  }
  function reset() {
    timerDoc.set({ setSec, remainingSec: setSec, endsAt: null });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {running ? (
        <span className={`font-mono text-2xl font-semibold tabular-nums ${expired ? 'text-danger' : 'text-ink'}`}>
          {expired ? "Time's up" : format(remaining)}
        </span>
      ) : (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={minutesDraft}
            onChange={(e) => setMinutesDraft(clampDigits(e.target.value, 99))}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label="Minutes"
            className="w-12 border-b border-line bg-transparent px-1.5 py-1 text-center font-mono text-2xl font-semibold text-ink outline-none focus:border-brand"
          />
          <span className="font-mono text-2xl font-semibold text-ink-faint">:</span>
          <input
            type="text"
            inputMode="numeric"
            value={secondsDraft}
            onChange={(e) => setSecondsDraft(clampDigits(e.target.value, 59))}
            onBlur={commitDraft}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            aria-label="Seconds"
            className="w-12 border-b border-line bg-transparent px-1.5 py-1 text-center font-mono text-2xl font-semibold text-ink outline-none focus:border-brand"
          />
          <span className="ml-0.5 text-xs text-ink-faint">min : sec</span>
        </div>
      )}

      <div className="flex gap-1.5">
        {running ? (
          <button
            onClick={pause}
            className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:border-brand"
          >
            <Pause size={12} />
            Pause
          </button>
        ) : (
          <button
            onClick={start}
            disabled={remaining <= 0}
            className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong disabled:opacity-40"
          >
            <Play size={12} />
            Start
          </button>
        )}
        <button
          onClick={reset}
          className="flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-ink hover:border-danger"
        >
          <RotateCcw size={12} />
          Reset
        </button>
      </div>
    </div>
  );
}
