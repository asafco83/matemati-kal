import { useEffect, useState, useSyncExternalStore } from 'react';
import { soonTopics, topicById, topics, tracks } from '../content';
import type { SoonTopic, Topic } from './types';

/**
 * מצב הניווט של המסך (לא נשמר בין ביקורים):
 * mode – ניווט לפי נושאים או לפי כיתה
 * grade – הכיתה שלפיה מסננים, או 'all'. ברירת המחדל היא הכיתה של הילד.
 */
export type NavMode = 'topics' | 'grade';
export type GradeFilter = number | 'all';

interface NavState {
  mode: NavMode;
  grade: GradeFilter;
  /** הפרופיל שעבורו נקבעה הכיתה; כשמחליפים פרופיל חוזרים לכיתה שלו */
  forProfile: string | null;
}

let nav: NavState = { mode: 'topics', grade: 'all', forProfile: null };
const listeners = new Set<() => void>();
const set = (patch: Partial<NavState>) => {
  nav = { ...nav, ...patch };
  listeners.forEach((l) => l());
};

export const useNav = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => nav,
  );

export const setMode = (mode: NavMode) => set({ mode });
export const setGrade = (grade: GradeFilter) => set({ grade });

/** קובע את הכיתה של הילד כברירת מחדל בכל פעם שהפרופיל הפעיל מתחלף */
export function syncProfile(id: string | null, grade: number | null) {
  if (id !== nav.forProfile) set({ forProfile: id, grade: grade ?? 'all', mode: 'topics' });
}

export const inGrade = (t: { grades: [number, number] }, g: GradeFilter) => g === 'all' || (t.grades[0] <= g && g <= t.grades[1]);

export type AnyTopic = Topic | SoonTopic;
export const isSoon = (t: AnyTopic): t is SoonTopic => 'soon' in t;

/** כל הנושאים של מסלול (מוכנים ובקרוב), לפי סדר הכיתות */
export function trackTopics(trackId: string): AnyTopic[] {
  return [...topics, ...soonTopics].filter((t) => t.track === trackId).sort((a, b) => a.grades[0] - b.grades[0] || a.grades[1] - b.grades[1]);
}

export function gradeTopics(g: GradeFilter): AnyTopic[] {
  // מקובצים לפי סדר המסלולים, ובתוך מסלול לפי כיתה
  const order = (t: AnyTopic) => tracks.findIndex((tr) => tr.id === t.track);
  return [...topics, ...soonTopics]
    .filter((t) => inGrade(t, g))
    .sort((a, b) => Number(isSoon(a)) - Number(isSoon(b)) || order(a) - order(b) || a.grades[0] - b.grades[0]);
}

/* ---------- ניתוב לפי ה-hash ---------- */

export type Route = { name: 'home' } | { name: 'track'; id: string } | { name: 'topic'; topic: Topic } | { name: 'new-profile' };

function parse(hash: string): Route {
  const topic = hash.match(/^#\/topic\/([\w-]+)/);
  if (topic) {
    const t = topicById(topic[1]);
    if (t) return { name: 'topic', topic: t };
  }
  const track = hash.match(/^#\/track\/([\w-]+)/);
  if (track) return { name: 'track', id: track[1] };
  if (hash.startsWith('#/new-profile')) return { name: 'new-profile' };
  return { name: 'home' };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parse(hash);
}

export const go = (hash: string) => {
  window.location.hash = hash;
};
