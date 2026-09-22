export type Unsubscribe = () => void;

export interface DocStore<T extends object> {
  get(): Promise<T | null>;
  set(data: T): Promise<void>;
  update(data: Partial<T>): Promise<void>;
  subscribe(cb: (data: T | null) => void): Unsubscribe;
}

export interface WithId {
  id: string;
}

export interface CollectionStore<T extends WithId> {
  add(data: Omit<T, 'id'>): Promise<string>;
  set(id: string, data: Omit<T, 'id'>): Promise<void>;
  update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void>;
  remove(id: string): Promise<void>;
  subscribe(cb: (items: T[]) => void): Unsubscribe;
}

export interface RetroStore {
  mode: 'firestore' | 'local';
  doc<T extends object>(path: string): DocStore<T>;
  collection<T extends WithId>(name: string): CollectionStore<T>;
}
