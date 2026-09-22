export type Role = 'team' | 'po';

export interface Column {
  id: string;
  name: string;
  color: string;
}

export interface RetroConfig {
  title: string;
  columns: Column[];
  /** How many discussion votes each person gets in Group & Vote (host-adjustable). */
  voteBudget?: number;
  /** Room code of the retro this one follows on from, for the "previous retro" carry-over panel. */
  previousRoomId?: string;
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

export interface BoardPhoto {
  id: string;
  dataUrl: string;
  role: Role;
  author: string;
  createdAt: number;
}

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

/** A shared countdown any client can start — used for the writing/presenting/warm-up phases. */
export interface TimerState {
  label: string;
  durationSec: number;
  /** Timestamp the countdown reaches zero, or null while idle. */
  endsAt: number | null;
}

export interface ExtractedNoteRow {
  text: string;
  column: string;
}

export interface ExtractedGroup {
  label: string;
  items: string[];
}
