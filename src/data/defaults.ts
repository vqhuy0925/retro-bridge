import { MessageCircleQuestion, Palmtree, Smile } from 'lucide-react';
import type { Column, WarmupGame } from '../types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'well', name: 'Well-done', color: 'var(--well)' },
  { id: 'improve', name: 'Needs improvement', color: 'var(--improve)' },
  { id: 'park', name: 'Parking Lot', color: 'var(--park)' },
];

export const WARMUP_GAMES: WarmupGame[] = [
  {
    id: 'desertisland',
    title: 'Desert Island Chain',
    duration: '6 min',
    icon: Palmtree,
    instruction:
      "Stranded on a desert island — each person repeats the full list of items everyone before them brought, in order, then adds one of their own. Forget or flub the order and you're out; last person standing wins.",
    steps: [
      'Person 1 says: "I\'m stranded on a desert island, I\'m bringing a [item]."',
      'Person 2 repeats the full list in order, then adds their own item — e.g. "…bringing a knife, a fork."',
      'Keep going around the group; the list gets one item longer each turn.',
      'Forget an item, get the order wrong, or repeat one already said — you\'re out.',
      'Keep looping through the remaining players until only one is left standing — that person wins.',
    ],
    example:
      'An: "I\'m stranded on a desert island, I\'m bringing a knife." → Binh: "…bringing a knife, a flashlight." → Chi: "…bringing a knife, a flashlight, a hammock." → Binh forgets the order on the next round and is out — the chain keeps going until only one player is left.',
  },
  {
    id: 'twotruths',
    title: 'Two Truths and a Lie',
    duration: '5 min',
    icon: MessageCircleQuestion,
    instruction:
      'Everyone shares 3 fun facts about themselves (nothing work-related) — 2 true, 1 made up. The group guesses the lie.',
    steps: [
      'Each person privately thinks of 3 personal fun facts: 2 true, 1 made up.',
      'One at a time, they say all 3 out loud in any order.',
      'The rest of the group discusses and votes on which one is the lie.',
      'The person reveals the answer, then it\'s the next person\'s turn.',
    ],
    example:
      '"(1) I once climbed Fansipan. (2) I\'m scared of butterflies. (3) I have a cat named Boss." — the group debates and votes, then the person reveals which one was the lie.',
  },
  {
    id: 'emojimood',
    title: 'Emoji Mood Check',
    duration: '2 min',
    icon: Smile,
    instruction:
      "Everyone reacts with exactly 3 emojis that sum up their week — no words allowed. Guess each other's stories.",
    steps: [
      'Everyone picks exactly 3 emojis that sum up their week.',
      'Post or say all 3 at once — no words, no explaining yet.',
      'The group guesses what story or mood each set of emojis tells.',
      'The person confirms or corrects the guess, then reveals what actually happened.',
    ],
    example:
      '🔥😅☕ → the group guesses "buried in deadlines, running on fumes, survived on coffee" — the person confirms and tells the real story.',
  },
];

// Matches the team's usual dot-voting cadence (2-3 votes each); host can
// still adjust it per retro from the Group & Vote tab.
export const VOTE_BUDGET = 3;
