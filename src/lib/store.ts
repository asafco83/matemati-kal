import { useSyncExternalStore } from 'react';
import type { Level } from './types';

export const MASTERY_GOAL = 5;

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  grade: number;
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

export function addProfile(name: string, avatar: string, grade: number) {
  const id = Math.random().toString(36).slice(2, 10);
  commit({ ...state, profiles: [...state.profiles, { id, name, avatar, grade }], activeId: id });
}

export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id'>>) {
  commit({ ...state, profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
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

export function totals(s: State) {
  const pid = s.activeId;
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
