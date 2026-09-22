export type Role = 'team' | 'po';

export interface Column {
  id: string;
  name: string;
  color: string;
}

export interface RetroConfig {
  title: string;
  columns: Column[];
}

export interface WarmupGame {
  id: string;
  title: string;
  duration: string;
  instruction: string;
}

export interface WarmupState {
  gameId: string;
  pickedAt: number;
}

export type NoteSource = 'manual' | 'photo';

export interface Note {
  id: string;
  text: string;
  columnId: string;
  role: Role;
  author: string;
  source: NoteSource;
  createdAt: number;
  groupId?: string | null;
}

export interface Group {
  id: string;
  title: string;
  createdAt: number;
}

export interface Vote {
  id: string;
  targetKey: string;
  voterId: string;
  voterName: string;
  count: number;
  updatedAt: number;
}

export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  dueDate: string;
  done: boolean;
  createdAt: number;
}

export type TabId = 'warmup' | 'board' | 'group' | 'wrap';

export interface ExtractedNoteRow {
  text: string;
  column: string;
}

export interface ExtractedGroup {
  label: string;
  items: string[];
}
