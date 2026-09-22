import { useEffect, useState } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  sticky?: boolean;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit(): void {
  listeners.forEach((l) => l([...toasts]));
}

export function showToast(message: string, sticky = false): number {
  const id = nextId++;
  toasts = [...toasts, { id, message, sticky }];
  emit();
  if (!sticky) {
    setTimeout(() => dismissToast(id), 3400);
  }
  return id;
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function useToasts(): ToastItem[] {
  const [state, setState] = useState<ToastItem[]>(toasts);
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}
