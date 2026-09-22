import { useEffect, useState } from 'react';

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5);
}

/** Reads the `room` query param, minting and persisting a fresh code if absent. */
export function useRoom(): string {
  const [roomId] = useState<string>(() => {
    const url = new URL(window.location.href);
    const existing = url.searchParams.get('room');
    if (existing) return existing;
    const created = generateRoomCode();
    url.searchParams.set('room', created);
    window.history.replaceState({}, '', url.toString());
    return created;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('room') !== roomId) {
      url.searchParams.set('room', roomId);
      window.history.replaceState({}, '', url.toString());
    }
  }, [roomId]);

  return roomId;
}
