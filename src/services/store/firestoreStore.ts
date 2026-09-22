import {
  addDoc,
  collection as fsCollection,
  deleteDoc,
  doc as fsDoc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { CollectionStore, DocStore, RetroStore, WithId } from './types';

/**
 * Firestore-backed store scoped to one retro room:
 * single docs live under retros/{roomId}/meta/{name},
 * collections live under retros/{roomId}/{name}.
 */
export function createFirestoreStore(db: Firestore, roomId: string): RetroStore {
  function doc<T extends object>(name: string): DocStore<T> {
    const ref = fsDoc(db, 'retros', roomId, 'meta', name);
    return {
      get: async () => {
        const snap = await getDoc(ref);
        return snap.exists() ? (snap.data() as T) : null;
      },
      set: (data) => setDoc(ref, data as Record<string, unknown>),
      update: async (data) => {
        const snap = await getDoc(ref);
        if (snap.exists()) await updateDoc(ref, data as Record<string, unknown>);
        else await setDoc(ref, data as Record<string, unknown>);
      },
      subscribe: (cb) =>
        onSnapshot(
          ref,
          (snap) => cb(snap.exists() ? (snap.data() as T) : null),
          () => cb(null),
        ),
    };
  }

  function collection<T extends WithId>(name: string): CollectionStore<T> {
    const ref = fsCollection(db, 'retros', roomId, name);
    return {
      add: async (data) => {
        const created = await addDoc(ref, data as Record<string, unknown>);
        return created.id;
      },
      set: (id, data) => setDoc(fsDoc(ref, id), data as Record<string, unknown>),
      update: (id, data) => updateDoc(fsDoc(ref, id), data as Record<string, unknown>),
      remove: (id) => deleteDoc(fsDoc(ref, id)),
      subscribe: (cb) =>
        onSnapshot(
          ref,
          (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
          () => cb([]),
        ),
    };
  }

  return { mode: 'firestore', doc, collection };
}
