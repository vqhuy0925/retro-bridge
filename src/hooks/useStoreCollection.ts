import { useEffect, useState } from 'react';
import type { RetroStore, WithId } from '../services/store';

export function useStoreCollection<T extends WithId>(
  store: RetroStore | null,
  name: string,
): T[] {
  const [items, setItems] = useState<T[]>([]);

  useEffect(() => {
    if (!store) return;
    return store.collection<T>(name).subscribe(setItems);
  }, [store, name]);

  return items;
}
