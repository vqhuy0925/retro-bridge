import type { Column, WarmupGame } from '../types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'well', name: 'Well-done', color: 'var(--well)' },
  { id: 'improve', name: 'Needs improvement', color: 'var(--improve)' },
  { id: 'park', name: 'Parking Lot', color: 'var(--park)' },
];

export const WARMUP_GAMES: WarmupGame[] = [
  {
    id: 'desertisland',
    title: 'Desert Island Pick',
    duration: '4 min',
    instruction:
      "Stranded on a desert island — name one snack, one song, and one useless superpower you'd bring. No explanations, just go.",
  },
  {
    id: 'twotruths',
    title: 'Two Truths and a Lie',
    duration: '5 min',
    instruction:
      'Everyone shares 3 fun facts about themselves (nothing work-related) — 2 true, 1 made up. The group guesses the lie.',
  },
  {
    id: 'emojimood',
    title: 'Emoji Mood Check',
    duration: '2 min',
    instruction:
      "Everyone reacts with exactly 3 emojis that sum up their week — no words allowed. Guess each other's stories.",
  },
  {
    id: 'wouldyourather',
    title: 'Would You Rather',
    duration: '3 min',
    instruction:
      'Fire off a couple of silly "would you rather" dilemmas (e.g. fight one horse-sized duck, or 100 duck-sized horses?). Hands up for A or B.',
  },
  {
    id: 'rapidfire',
    title: 'Rapid-Fire Favorites',
    duration: '3 min',
    instruction:
      'Go around the group: favorite comfort food, guilty-pleasure show, dream vacation — 5 seconds each, no overthinking.',
  },
];

export const VOTE_BUDGET = 5;
