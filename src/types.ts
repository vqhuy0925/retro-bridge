import type { LucideIcon } from 'lucide-react';

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
  /** Icon shown on the game's card so games are recognizable at a glance. */
  icon: LucideIcon;
  /** Step-by-step "how to play" guide, shown once the game is picked. */
  steps: string[];
  /** Ready-made prompts a host can use as-is, for games that otherwise need the host to write their own content. */
  prompts?: string[];
}

export interface WarmupState {
  gameId: string;
  pickedAt: number;
  /** Index into the picked game's `prompts` bank, synced so the whole room sees the same prompt. */
  promptIndex?: number;
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

/** A shared countdown any client can set/start/pause — the whole room sees the same clock. */
export interface TimerState {
  /** The duration "Reset" returns to, in seconds — set by whoever last typed a time in. */
  setSec: number;
  /** Time left, in seconds, while idle or paused (ignored while running). */
  remainingSec: number;
  /** Timestamp the countdown reaches zero, or null while idle/paused. */
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
