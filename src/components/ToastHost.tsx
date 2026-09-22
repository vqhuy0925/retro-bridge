import { useToasts } from '../hooks/useToast';

export function ToastHost() {
  const toasts = useToasts();
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="max-w-[90vw] rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
