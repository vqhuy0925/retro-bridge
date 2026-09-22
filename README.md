# Retro Bridge

A lightweight sprint retro tool that syncs your team's physical sticky-note
board with a remote PO in real time: a "previous retro" carry-over panel, a
warm-up game with a shared timer, a 3-column shared board, AI photo capture
of paper notes, idea grouping + dot voting (with a host-adjustable vote
budget), and an action item / summary wrap-up.

Follows the team's usual ~1h30 retro flow: check last sprint's action items,
warm up, write notes silently, present them, group and vote, discuss and
capture new actions.

Stack: React 18 + TypeScript + Vite + Tailwind CSS, Firebase (Firestore +
Anonymous Auth) for realtime sync, a Vercel serverless function calling the
Gemini API for photo → note extraction. Everything fits in the free tiers of
Firebase (Spark plan), Vercel (Hobby plan) and Google AI Studio (Gemini free
tier).

## How it works

- Open the app, and it mints a room code in the URL (`?room=xxxxx`). Share
  that link (or use **Copy invite link** in the header) with your PO — anyone
  who opens it joins the same live session, no account needed.
- If Firebase isn't configured (or Firestore/Auth aren't reachable), the app
  falls back to a local-only mode (localStorage) so you can still try it out
  — a banner-free hint appears as a grey "Local demo (not synced)" badge in
  the header instead of the green "Live sync active" one.
- Photo capture posts the image to `/api/extract-notes` (a Vercel serverless
  function), which calls Gemini server-side — your Gemini key never reaches
  the browser.

## Local setup

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase + Gemini keys
npm run dev                  # http://localhost:3000
```

You can run the app without any keys — it just stays in local-only mode.

### Firebase project (free Spark plan)

1. Create a project at https://console.firebase.google.com.
2. Add a Web app (</> icon) and copy the config values into `.env.local`.
3. **Build > Authentication > Get started > Sign-in method** — enable
   **Anonymous**.
4. **Build > Firestore Database > Create database** — start in production
   mode (the rules in `firestore.rules` handle access).
5. Deploy the rules (optional, or paste them manually in the console):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes --project your-project-id
   ```

### Gemini key (free tier)

Get a free API key at https://aistudio.google.com/app/apikey and set it as
`GEMINI_API_KEY` (server-side only — do **not** prefix it with `VITE_`, or it
would be bundled into the client).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel (https://vercel.com/new) — it auto-detects Vite via
   `vercel.json`.
3. In Vercel Project Settings → Environment Variables, add every key from
   `.env.example` (the `VITE_*` ones and `GEMINI_API_KEY`).
4. Deploy. Share the deployed URL (with a `?room=...` your team generates by
   just opening the app) with your PO.

## Notes on the free-tier model

- Firestore/Auth on the Spark plan have generous daily free quotas for a
  small team's retro cadence; no billing account is required.
- Gemini's free tier has its own rate limits — if photo extraction starts
  failing under heavy use, check your Google AI Studio quota.
- There is no per-user login: the room code in the link is the only access
  boundary (see `firestore.rules`). Don't put sensitive company data in this
  tool if that's a concern for your org.
