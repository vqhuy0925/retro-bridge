import type { CollectionStore, DocStore, RetroStore, Unsubscribe, WithId } from './types';

/**
 * Pure-browser fallback used when Firebase isn't configured (or sign-in
 * failed). Persists to localStorage and broadcasts changes to other tabs
 * on this same browser via BroadcastChannel, so the app is still usable
 * for local development or a single-machine demo.
 */
export function createLocalStore(roomId: string): RetroStore {
  const prefix = `rb_local_${roomId}::`;
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(`rb_local_${roomId}`);
  } catch {
    channel = null;
  }

  function read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(prefix + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  function write(key: string, value: unknown): void {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
    channel?.postMessage({ key });
  }
  function watch(key: string, onChange: () => void): Unsubscribe {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.key === key) onChange();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === prefix + key) onChange();
    };
    channel?.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
    };
  }

  function doc<T extends object>(path: string): DocStore<T> {
    const key = `doc:${path}`;
    return {
      get: () => Promise.resolve(read<T>(key)),
      set: (data) => {
        write(key, data);
        return Promise.resolve();
      },
      update: (data) => {
        const cur = read<T>(key) || ({} as T);
        write(key, { ...cur, ...data });
        return Promise.resolve();
      },
      subscribe: (cb) => {
        cb(read<T>(key));
        return watch(key, () => cb(read<T>(key)));
      },
    };
  }

  function collection<T extends WithId>(name: string): CollectionStore<T> {
    const key = `col:${name}`;
    function readMap(): Record<string, Omit<T, 'id'>> {
      return read<Record<string, Omit<T, 'id'>>>(key) || {};
    }
    function writeMap(map: Record<string, Omit<T, 'id'>>): void {
      write(key, map);
    }
    function emit(cb: (items: T[]) => void): void {
      const map = readMap();
      cb(Object.entries(map).map(([id, data]) => ({ id, ...data }) as T));
    }
    return {
      add: (data) => {
        const id = 'l' + Math.random().toString(36).slice(2, 10);
        const map = readMap();
        map[id] = data;
        writeMap(map);
        return Promise.resolve(id);
      },
      set: (id, data) => {
        const map = readMap();
        map[id] = data;
        writeMap(map);
        return Promise.resolve();
      },
      update: (id, data) => {
        const map = readMap();
        map[id] = { ...(map[id] || {}), ...data } as Omit<T, 'id'>;
        writeMap(map);
        return Promise.resolve();
      },
      remove: (id) => {
        const map = readMap();
        delete map[id];
        writeMap(map);
        return Promise.resolve();
      },
      subscribe: (cb) => {
        emit(cb);
        return watch(key, () => emit(cb));
      },
    };
  }

  return { mode: 'local', doc, collection };
}
