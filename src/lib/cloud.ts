import { useSyncExternalStore } from 'react';
import { firebaseConfig, isFirebaseConfigured } from '../firebaseConfig';
import { getState, mergeStates, replaceState, subscribe as subscribeStore, type State } from './store';

/**
 * התחברות וסנכרון התקדמות מול Firebase.
 * ה-SDK נטען רק כשצריך אותו, כך שבמצב מקומי הוא לא מכביד על הטעינה.
 * מודל הנתונים: מסמך אחד לכל חשבון, users/{uid}, ובו הפרופילים וההתקדמות.
 */

export interface AuthInfo {
  configured: boolean;
  ready: boolean;
  user: { uid: string; name: string; photo: string | null } | null;
  error: string | null;
}

let auth: AuthInfo = { configured: isFirebaseConfigured, ready: !isFirebaseConfigured, user: null, error: null };
const listeners = new Set<() => void>();
const setAuth = (patch: Partial<AuthInfo>) => {
  auth = { ...auth, ...patch };
  listeners.forEach((l) => l());
};

export const useAuth = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => auth,
  );

async function sdk() {
  const [{ initializeApp, getApps }, authMod, fs] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return { authMod, fs, fbAuth: authMod.getAuth(app), db: fs.getFirestore(app) };
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let lastSaved = 0;

async function save(uid: string) {
  const s = getState();
  if (s.updatedAt <= lastSaved) return;
  try {
    const { fs, db } = await sdk();
    await fs.setDoc(fs.doc(db, 'users', uid), { state: JSON.stringify(s), updatedAt: s.updatedAt });
    lastSaved = s.updatedAt;
  } catch {
    setAuth({ error: 'השמירה בענן נכשלה. ההתקדמות נשמרת במכשיר הזה.' });
  }
}

export async function initCloud() {
  if (!isFirebaseConfigured) return;
  try {
    const { authMod, fs, fbAuth, db } = await sdk();
    authMod.onAuthStateChanged(fbAuth, async (u) => {
      if (!u) {
        setAuth({ ready: true, user: null });
        return;
      }
      setAuth({ ready: true, error: null, user: { uid: u.uid, name: u.displayName ?? 'משתמש', photo: u.photoURL } });
      try {
        const snap = await fs.getDoc(fs.doc(db, 'users', u.uid));
        const raw = snap.data()?.state as string | undefined;
        if (raw) {
          const cloud = JSON.parse(raw) as State;
          lastSaved = cloud.updatedAt;
          replaceState(mergeStates(getState(), cloud));
        }
        // אם המיזוג הוסיף משהו מקומי שלא היה בענן, שומרים אותו
        if (getState().profiles.length) {
          lastSaved = 0;
          await save(u.uid);
        }
      } catch {
        setAuth({ error: 'לא הצלחנו לטעון את ההתקדמות מהענן.' });
      }
    });
    subscribeStore(() => {
      const uid = auth.user?.uid;
      if (!uid) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => save(uid), 1500);
    });
  } catch {
    setAuth({ ready: true, error: 'החיבור ל-Firebase נכשל.' });
  }
}

export async function signIn() {
  try {
    const { authMod, fbAuth } = await sdk();
    await authMod.signInWithPopup(fbAuth, new authMod.GoogleAuthProvider());
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request')
      setAuth({ error: 'ההתחברות נכשלה. נסו שוב.' });
  }
}

export async function signOutUser() {
  const { authMod, fbAuth } = await sdk();
  await authMod.signOut(fbAuth);
}
