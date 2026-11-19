import { useSyncExternalStore } from 'react';
import type { Level, Units } from './types';

export const MASTERY_GOAL = 5;

export interface Profile {
  id: string;
  name: string;
  /** שדה ישן (דמות אימוג'י). נשמר לתאימות לאחור, לא מוצג */
  avatar?: string;
  /** אינדקס ב-PROFILE_COLORS */
  color?: number;
  grade: number;
  /** רמת הלימוד (יח"ל), רק בכיתות י'–י"ב */
  units?: Units;
  /** שפת הממשק והתוכן של הילד. חסר = עברית */
  lang?: string;
}

/** צבעי פרופיל. נפרדים מצבעי המסלולים כדי שלא יתבלבלו איתם */
export const PROFILE_COLORS = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9', '#f08c00', '#0c8599', '#c2255c', '#5c7cfa'];

export function profileColor(p: Profile): string {
  if (p.color !== undefined) return PROFILE_COLORS[p.color % PROFILE_COLORS.length];
  let h = 0;
  for (const ch of p.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PROFILE_COLORS[h % PROFILE_COLORS.length];
}

export interface LevelStat {
  /** ניקוד נוכחי בדרך לשליטה: עולה בתשובה נכונה, יורד בטעות */
  score: number;
  correct: number;
  total: number;
  mastered: boolean;
}

export interface TopicProgress {
  seen?: boolean;
  levels: Partial<Record<Level, LevelStat>>;
}

export interface State {
  profiles: Profile[];
  activeId: string | null;
  /** progress[profileId][topicId] */
  progress: Record<string, Record<string, TopicProgress>>;
  updatedAt: number;
  /** השפה במסכים שלפני בחירת פרופיל (רשימת הפרופילים, פתיחה) */
  lang?: string;
}

const KEY = 'matemati-kal:v1';
const empty: State = { profiles: [], activeId: null, progress: {}, updatedAt: 0 };

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...empty, ...JSON.parse(raw) };
  } catch {
    /* אחסון מקומי לא זמין: ממשיכים בלי שמירה */
  }
  return empty;
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State, touch = true) {
  state = touch ? { ...next, updatedAt: Date.now() } : next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ראו למעלה */
  }
  listeners.forEach((l) => l());
}

export const getState = () => state;
export const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useStore = () => useSyncExternalStore(subscribe, getState);

export const activeProfile = (s: State) => s.profiles.find((p) => p.id === s.activeId) ?? null;

export function addProfile(name: string, color: number, grade: number, units?: Units, lang?: string) {
  const id = Math.random().toString(36).slice(2, 10);
  const p: Profile = { id, name, color, grade, ...(grade >= 10 && units ? { units } : {}), ...(lang && lang !== 'he' ? { lang } : {}) };
  commit({ ...state, profiles: [...state.profiles, p], activeId: id });
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>) {
  const merge = (p: Profile): Profile => {
    const next: Profile = { ...p, ...patch };
    // שדה שקיבל undefined נמחק (Firestore לא שומר undefined)
    for (const k of Object.keys(next) as (keyof Profile)[]) if (next[k] === undefined) delete next[k];
    return next;
  };
  commit({ ...state, profiles: state.profiles.map((p) => (p.id === id ? merge(p) : p)) });
}

/** השפה שמוצגת עכשיו: של הילד הפעיל, ובלי ילד פעיל השפה של המכשיר */
export function currentLang(s: State): string {
  const p = activeProfile(s);
  return (p ? p.lang : s.lang) ?? 'he';
}

/** החלפת שפה מכל מסך: לילד הפעיל, וגם כשפת המכשיר */
export function setLanguage(code: string) {
  const lang = code === 'he' ? undefined : code;
  const profiles = state.activeId
    ? state.profiles.map((p) => {
        if (p.id !== state.activeId) return p;
        const next = { ...p, lang };
        if (!lang) delete next.lang;
        return next;
      })
    : state.profiles;
  const next: State = { ...state, profiles, lang };
  if (!lang) delete next.lang;
  commit(next);
}

export function selectProfile(id: string | null) {
  commit({ ...state, activeId: id });
}

export function deleteProfile(id: string) {
  const progress = { ...state.progress };
  delete progress[id];
  const profiles = state.profiles.filter((p) => p.id !== id);
  commit({ ...state, profiles, progress, activeId: state.activeId === id ? null : state.activeId });
}

const blank = (): LevelStat => ({ score: 0, correct: 0, total: 0, mastered: false });

export function levelStat(s: State, topicId: string, level: Level): LevelStat {
  const pid = s.activeId;
  return (pid && s.progress[pid]?.[topicId]?.levels[level]) || blank();
}

/** כמה רמות (0 עד 3) הושלמו בנושא */
export function stars(s: State, topicId: string): number {
  const pid = s.activeId;
  const lv = pid ? s.progress[pid]?.[topicId]?.levels : undefined;
  if (!lv) return 0;
  return ([1, 2, 3] as Level[]).filter((l) => lv[l]?.mastered).length;
}

export function totals(s: State, profileId?: string) {
  const pid = profileId ?? s.activeId;
  const all = pid ? Object.values(s.progress[pid] ?? {}) : [];
  let correct = 0;
  let starCount = 0;
  for (const t of all)
    for (const l of [1, 2, 3] as Level[]) {
      correct += t.levels[l]?.correct ?? 0;
      if (t.levels[l]?.mastered) starCount++;
    }
  return { correct, stars: starCount };
}

function patchTopic(topicId: string, fn: (t: TopicProgress) => TopicProgress) {
  const pid = state.activeId;
  if (!pid) return;
  const mine = state.progress[pid] ?? {};
  const cur = mine[topicId] ?? { levels: {} };
  commit({ ...state, progress: { ...state.progress, [pid]: { ...mine, [topicId]: fn(cur) } } });
}

export function markSeen(topicId: string) {
  const pid = state.activeId;
  if (!pid || state.progress[pid]?.[topicId]?.seen) return;
  patchTopic(topicId, (t) => ({ ...t, seen: true }));
}

export function recordAnswer(topicId: string, level: Level, correct: boolean) {
  patchTopic(topicId, (t) => {
    const s = t.levels[level] ?? blank();
    const score = correct ? Math.min(MASTERY_GOAL, s.score + 1) : Math.max(0, s.score - 1);
    return {
      ...t,
      levels: {
        ...t.levels,
        [level]: {
          score,
          correct: s.correct + (correct ? 1 : 0),
          total: s.total + 1,
          mastered: s.mastered || score >= MASTERY_GOAL,
        },
      },
    };
  });
}

/** מתחילים סבב תרגול חדש באותה רמה (הכוכב נשמר) */
export function restartLevel(topicId: string, level: Level) {
  patchTopic(topicId, (t) => {
    const s = t.levels[level] ?? blank();
    return { ...t, levels: { ...t.levels, [level]: { ...s, score: 0 } } };
  });
}

/** מיזוג של מצב מקומי עם מצב מהענן: לא מאבדים התקדמות מאף צד */
export function mergeStates(a: State, b: State): State {
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  const older = newer === a ? b : a;
  const profiles = [...newer.profiles];
  for (const p of older.profiles) if (!profiles.some((q) => q.id === p.id)) profiles.push(p);
  const progress: State['progress'] = {};
  for (const pid of new Set([...Object.keys(a.progress), ...Object.keys(b.progress)])) {
    if (!profiles.some((p) => p.id === pid)) continue;
    const pa = a.progress[pid] ?? {};
    const pb = b.progress[pid] ?? {};
    progress[pid] = {};
    for (const tid of new Set([...Object.keys(pa), ...Object.keys(pb)])) {
      const ta = pa[tid];
      const tb = pb[tid];
      const levels: TopicProgress['levels'] = {};
      for (const l of [1, 2, 3] as Level[]) {
        const la = ta?.levels[l];
        const lb = tb?.levels[l];
        if (!la && !lb) continue;
        const best = (la?.total ?? -1) >= (lb?.total ?? -1) ? la! : lb!;
        levels[l] = { ...best, mastered: !!(la?.mastered || lb?.mastered) };
      }
      progress[pid][tid] = { seen: !!(ta?.seen || tb?.seen), levels };
    }
  }
  const activeId = profiles.some((p) => p.id === newer.activeId) ? newer.activeId : null;
  return { profiles, activeId, progress, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

/** מחליף את המצב כולו (אחרי טעינה מהענן) */
export function replaceState(next: State) {
  commit(next, false);
}
