import type { User } from 'firebase/auth';
import { db } from '../firebase/firebaseConfig';
import { createFirestoreStore } from './firestoreStore';
import { createLocalStore } from './localStore';
import type { RetroStore } from './types';

export function createRetroStore(roomId: string, user: User | null): RetroStore {
  if (db && user) return createFirestoreStore(db, roomId);
  return createLocalStore(roomId);
}

export type { RetroStore };
export type { DocStore, CollectionStore, WithId } from './types';
