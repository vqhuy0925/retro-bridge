import { useCallback, useState } from 'react';
import type { User } from 'firebase/auth';
import type { Role } from '../types';

function getOrCreateLocalId(): string {
  let id = localStorage.getItem('rb_local_id');
  if (!id) {
    id = 'v' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('rb_local_id', id);
  }
  return id;
}

export function useIdentity(user: User | null) {
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem('rb_role') as Role) || 'team');
  const [displayName, setDisplayNameState] = useState<string>(
    () => localStorage.getItem('rb_name') || '',
  );

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
    localStorage.setItem('rb_role', next);
  }, []);

  const setDisplayName = useCallback((next: string) => {
    setDisplayNameState(next);
    localStorage.setItem('rb_name', next);
  }, []);

  const voterId = user?.uid || getOrCreateLocalId();
  const name = displayName || (role === 'po' ? 'PO' : 'Team member');

  return { role, setRole, displayName: name, setDisplayName, voterId };
}
