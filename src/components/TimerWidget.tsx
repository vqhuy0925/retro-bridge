import { useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import type { DocStore } from '../services/store';
import type { TimerState } from '../types';

interface TimerWidgetProps {
  timer: TimerState;
  timerDoc: DocStore<TimerState>;
  presets: { label: string; minutes: number }[];
}

function format(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** A countdown synced via Firestore/localStorage so the whole team and the remote PO see the same clock. */
export function TimerWidget({ timer, timerDoc, presets }: TimerWidgetProps) {
  const running = timer.endsAt != null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  const remaining = running ? (timer.endsAt! - now) / 1000 : timer.durationSec;
  const expired = running && remaining <= 0;

  function start(minutes: number, label: string) {
    timerDoc.set({ label, durationSec: minutes * 60, endsAt: Date.now() + minutes * 60 * 1000 });
  }
  function reset() {
    timerDoc.set({ label: timer.label, durationSec: timer.durationSec, endsAt: null });
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border p-3.5 ${
        expired ? 'border-danger' : 'border-line'
      } bg-surface`}
    >
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-2xl font-semibold tabular-nums ${expired ? 'text-danger' : 'text-ink'}`}>
          {format(remaining)}
        </span>
        <span className="text-xs text-ink-faint">
          {expired ? "Time's up" : timer.label || 'No timer running'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => start(p.minutes, p.label)}
            className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-brand"
          >
            <Play size={11} />
            {p.label} · {p.minutes}m
          </button>
        ))}
        {running && (
          <button
            onClick={reset}
            className="flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:border-danger"
          >
            <RotateCcw size={11} />
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
