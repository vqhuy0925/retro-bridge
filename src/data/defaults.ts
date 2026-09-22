import { GitFork, MessageCircleQuestion, Palmtree, Smile, Zap } from 'lucide-react';
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
    icon: Palmtree,
    instruction:
      "Stranded on a desert island — name one snack, one song, and one useless superpower you'd bring. No explanations, just go.",
    steps: [
      "Host reads the prompt: \"You're stranded on a desert island.\"",
      'Each person names one snack, one song, and one useless superpower they\'d bring.',
      'No explaining or justifying — just call it out and move to the next person.',
      "Optional: vote on whose pick you'd most want to be stranded with.",
    ],
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
  },
  {
    id: 'wouldyourather',
    title: 'Would You Rather',
    duration: '3 min',
    icon: GitFork,
    instruction:
      'Fire off a couple of silly "would you rather" dilemmas (e.g. fight one horse-sized duck, or 100 duck-sized horses?). Hands up for A or B.',
    steps: [
      'Host reads one prepared dilemma out loud (use "New prompt" below — no need to write your own).',
      'Everyone picks a side — hands up, or call out A or B.',
      'Ask a couple of people to justify their pick for a laugh.',
      'Grab a new prompt and repeat for 2-3 rounds.',
    ],
    prompts: [
      'Fight one horse-sized duck, or 100 duck-sized horses?',
      'Only be able to whisper for the rest of your life, or only be able to shout?',
      'Have to sing everything you say for a day, or have to rhyme everything you say for a day?',
      'Always be 10 minutes late, or always be 20 minutes early?',
      'Have unlimited free coffee for life, or unlimited free travel for life?',
      'Be able to time-travel to the past, or teleport anywhere in the present?',
      'Never be able to use emoji again, or never be able to use GIFs again?',
      'Have to work with one hand tied behind your back, or with your eyes closed for 10 minutes a day?',
    ],
  },
  {
    id: 'rapidfire',
    title: 'Rapid-Fire Favorites',
    duration: '3 min',
    icon: Zap,
    instruction:
      'Go around the group: favorite comfort food, guilty-pleasure show, dream vacation — 5 seconds each, no overthinking.',
    steps: [
      'Host reads the current category out loud (use "New prompt" below — no need to prep your own).',
      'Go around the group, 5 seconds each, first answer that comes to mind — no overthinking.',
      'Once everyone has answered, grab a new prompt for the next category.',
      'Repeat for 3-4 rounds.',
    ],
    prompts: [
      'Favorite comfort food',
      'Guilty-pleasure show or movie',
      'Dream vacation spot',
      'Favorite way to waste 10 minutes',
      'Song stuck in your head lately',
      'Most-used emoji',
      'Snack you always keep at your desk',
      'App you spend too much time on',
    ],
  },
];

// Matches the team's usual dot-voting cadence (2-3 votes each); host can
// still adjust it per retro from the Group & Vote tab.
export const VOTE_BUDGET = 3;
