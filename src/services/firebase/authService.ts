import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig';

/**
 * Resolves once with the anonymous Firebase user, or null when Firebase
 * isn't configured or sign-in fails — callers fall back to local mode.
 */
export function ensureAnonymousUser(): Promise<User | null> {
  if (!isFirebaseConfigured || !auth) return Promise.resolve(null);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });
    signInAnonymously(auth!).catch((err) => {
      console.warn('Anonymous sign-in failed — falling back to local mode.', err);
      unsubscribe();
      resolve(null);
    });
  });
}
