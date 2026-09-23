// Each board photo is its own Firestore document on the free Spark plan (see
// createBoardPhoto in services/aiExtract.ts) — capping how many a room can
// keep around bounds both storage and the read/write volume from realtime
// listeners. Shared across every tab that can capture a board photo (Board,
// Group & Vote) since they all read/write the same `photos` collection.
export const MAX_BOARD_PHOTOS = 5;

// Temporarily hides Group & Vote's "AI grouping" photo capture (the button
// that sends a photo to Gemini/Cloud Vision to cluster notes into groups).
// Flip back to true to bring it back — the handling code is untouched.
export const AI_GROUPING_ENABLED = false;
