import type { ReactNode } from 'react';

export interface ModalAction {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

interface ModalProps {
  title: string;
  subtitle?: string;
  actions: ModalAction[];
  onDismiss: () => void;
  children: ReactNode;
}

export function Modal({ title, subtitle, actions, onDismiss, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      style={{
        paddingTop: 'calc(1rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-surface p-5 shadow-lg">
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>}
        <div className="mt-3">{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={
                a.primary
                  ? 'rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-strong'
                  : 'rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-ink hover:border-ink-faint'
              }
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
