import type { PreviousRetro } from '../hooks/usePreviousRetro';
import { PreviousRetroPanel } from './PreviousRetroPanel';

interface PreviousRetroTabProps {
  previous: PreviousRetro | null;
}

export function PreviousRetroTab({ previous }: PreviousRetroTabProps) {
  return (
    <section>
      <div className="mb-3.5">
        <h2 className="text-2xl">Previous Retro Actions</h2>
        <p className="mt-0.5 text-base text-ink-soft">
          Check in on what the team committed to last time before diving into today's topic.
        </p>
      </div>

      {previous ? (
        <PreviousRetroPanel previous={previous} />
      ) : (
        <div className="border-l-2 border-line-soft pl-4 text-base text-ink-faint">
          This retro isn't linked to a previous one, so there are no carried-over actions to review.
        </div>
      )}
    </section>
  );
}
