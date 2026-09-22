import { useEffect, useState } from 'react';
import type { RetroStore } from '../services/store';

export function useStoreDoc<T extends object>(
  store: RetroStore | null,
  name: string,
  fallback: T,
): T {
  const [data, setData] = useState<T>(fallback);

  useEffect(() => {
    if (!store) return;
    return store.doc<T>(name).subscribe((next) => setData(next ?? fallback));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, name]);

  return data;
}
