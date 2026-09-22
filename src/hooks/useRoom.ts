import { useEffect, useState } from 'react';

/** 4-digit numeric code — short enough to read aloud or type in when a link can't be opened. */
function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const LAST_ROOM_KEY = 'rb_last_room';

/** The most recent room this browser visited — used to prefill "previous retro" when starting a new one. */
export function getLastRoomCode(): string | null {
  return localStorage.getItem(LAST_ROOM_KEY);
}

export interface RoomController {
  /** The active room code, or null until one is created (fresh visit, no `?room=` link). */
  roomId: string | null;
  /** Mints a fresh room code (or switches to a given one), pushes it into the URL. */
  startRoom: (code?: string) => string;
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

  useEffect(() => {
    if (roomId) localStorage.setItem(LAST_ROOM_KEY, roomId);
  }, [roomId]);

  function startRoom(code?: string): string {
    const target = code || generateRoomCode();
    const url = new URL(window.location.href);
    url.searchParams.set('room', target);
    window.history.pushState({}, '', url.toString());
    setRoomId(target);
    return target;
  }

  return { roomId, startRoom };
}
