import { useEffect, useState } from 'react';

function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 5);
}

export interface RoomController {
  /** The active room code, or null until one is created (fresh visit, no `?room=` link). */
  roomId: string | null;
  /** Mints a fresh room code, pushes it into the URL, and switches the app to it. */
  startRoom: () => string;
}

/** Reads the `room` query param; null means no room has been created/joined yet. */
export function useRoom(): RoomController {
  const [roomId, setRoomId] = useState<string | null>(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('room');
  });

  useEffect(() => {
    function onPopState() {
      const url = new URL(window.location.href);
      setRoomId(url.searchParams.get('room'));
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function startRoom(): string {
    const created = generateRoomCode();
    const url = new URL(window.location.href);
    url.searchParams.set('room', created);
    window.history.pushState({}, '', url.toString());
    setRoomId(created);
    return created;
  }

  return { roomId, startRoom };
}
