import { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { createRetroStore } from '../services/store';
import type { ActionItem, RetroConfig } from '../types';

export interface PreviousRetro {
  roomId: string;
  config: RetroConfig | null;
  actions: ActionItem[];
  toggleAction: (id: string, done: boolean) => void;
}

/**
 * Reads (and lets you check off) the action items from the retro this one was
 * linked to at creation time — covers the "look back at last sprint's actions"
 * step teams do before introducing the new topic.
 */
export function usePreviousRetro(
  previousRoomId: string | null | undefined,
  user: User | null,
): PreviousRetro | null {
  const store = useMemo(
    () => (previousRoomId ? createRetroStore(previousRoomId, user) : null),
    [previousRoomId, user],
  );
  const [config, setConfig] = useState<RetroConfig | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);

  useEffect(() => {
    if (!store) {
      setConfig(null);
      setActions([]);
      return;
    }
    const unsubConfig = store.doc<RetroConfig>('config').subscribe(setConfig);
    const unsubActions = store.collection<ActionItem>('actions').subscribe(setActions);
    return () => {
      unsubConfig();
      unsubActions();
    };
  }, [store]);

  if (!store || !previousRoomId) return null;

  return {
    roomId: previousRoomId,
    config,
    actions,
    toggleAction: (id, done) => store.collection<ActionItem>('actions').update(id, { done }),
  };
}
