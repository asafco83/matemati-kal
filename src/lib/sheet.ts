/**
 * דף הטיוטה: שכבה מעל האפליקציה שבה התלמיד כותב ביד (מגע, עט או עכבר),
 * ושעליה "המורה הפרטי" (סוכן AI שמפעיל את הדפדפן) יכול להוסיף הסברים ושרטוטים.
 *
 * כאן נמצאים המצב של הדף, ההקשר של המסך הנוכחי, והממשק לסוכן: window.mathTutor.
 * עיקרון: הממשק לא מחזיר תשובה או פתרון של התרגיל שהתלמיד פותר כרגע.
 */
import { useSyncExternalStore } from 'react';
import { topicById, topics, tracks } from '../content';
import { teaches, type Figure, type Level, type Pt, type Question, type Shape, type Step } from './types';
export type { Pt, Shape };
import { activeProfile, getState } from './store';
import { API_HELP, TUTOR_RULES } from './tutorGuide';
import { calcFor } from './calc';

/* ---------- בלוקים שהמורה מוסיף לדף ---------- */

export type Block =
  | { type: 'text'; text: string }
  | { type: 'title'; text: string }
  | { type: 'math'; tex: string }
  | { type: 'steps'; steps: Step[] }
  | { type: 'figure'; figure: Figure; caption?: string }
  /** שרטוט חופשי על משבצות. היחידות הן משבצות, y כלפי מעלה, והראשית ב-origin (ברירת מחדל: פינה שמאלית תחתונה) */
  | { type: 'draw'; width?: number; height?: number; origin?: Pt; axes?: boolean; grid?: boolean; shapes: Shape[]; caption?: string };

export interface SheetQuestion {
  text: string;
  latex?: string;
  figure?: Figure;
}

interface SheetState {
  open: boolean;
  /** חצי מסך (ליד האפליקציה) או מסך מלא */
  half: boolean;
  title: string;
  blocks: { id: number; block: Block }[];
  question: SheetQuestion | null;
  /** משתנה כשמנקים את הכתיבה ביד */
  inkKey: number;
  /** חלון "מורה פרטי AI" */
  tutorDialog: boolean;
}

let state: SheetState = { open: false, half: typeof window !== 'undefined' && window.innerWidth >= 1024, title: '', blocks: [], question: null, inkKey: 0, tutorDialog: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<SheetState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
export const useSheet = () => useSyncExternalStore(subscribe, () => state);

export const openSheet = () => set({ open: true });
export const closeSheet = () => set({ open: false });
export const toggleHalf = () => set({ half: !state.half });
export const clearInk = () => set({ inkKey: state.inkKey + 1 });
export const clearBlocks = () => set({ blocks: [], title: '' });
export const setTutorDialog = (tutorDialog: boolean) => set({ tutorDialog });

/* ---------- ההקשר של המסך: איפה התלמיד נמצא עכשיו ---------- */

export type Tab = 'learn' | 'examples' | 'practice';
interface Ctx {
  topicId: string | null;
  tab: Tab | null;
  level: Level | null;
  question: Question | null;
  status: 'asking' | 'wrong' | 'correct' | 'revealed' | null;
  attempts: number;
}
let ctx: Ctx = { topicId: null, tab: null, level: null, question: null, status: null, attempts: 0 };

export const sheetContext = () => ({ topicId: ctx.topicId, level: ctx.level, tab: ctx.tab });

/** המסכים מדווחים על המצב שלהם. תרגיל חדש מנקה את הכתיבה ביד */
export function reportContext(patch: Partial<Ctx>) {
  const newQuestion = 'question' in patch && patch.question !== ctx.question;
  ctx = { ...ctx, ...patch };
  if (newQuestion) {
    const q = ctx.question;
    set({ question: q ? { text: q.text, latex: q.latex, figure: q.figure } : null, inkKey: state.inkKey + 1 });
  }
}

/** בקשה לעבור ללשונית בדף הנושא (מהסוכן) */
let tabRequest: Tab | null = null;
const tabListeners = new Set<() => void>();
export const takeTabRequest = () => {
  const t = tabRequest;
  tabRequest = null;
  return t;
};
export const onTabRequest = (l: () => void) => {
  tabListeners.add(l);
  return () => {
    tabListeners.delete(l);
  };
};

/* ---------- הממשק לסוכן ---------- */

const sectionText = (s: Step): string => (typeof s === 'string' ? s : 'figure' in s ? `[figure: ${s.figure.type}]${s.caption ? ' ' + s.caption : ''}` : `$${s.tex}$${s.op ? `   / ${s.op}` : ''}${s.why ? `   (${s.why})` : ''}`);

const topicInfo = (id: string) => {
  const t = topicById(id);
  if (!t) return null;
  return { id: t.id, title: t.title, grades: t.grades, taught: t.taught ?? null, units: t.units ?? null, track: tracks.find((x) => x.id === t.track)?.title ?? t.track, summary: t.summary, levels: t.levels, sections: t.lesson.sections.map((s) => s.title), url: `${location.origin}/#/topic/${t.id}` };
};

let nextId = 1;
const BLOCK_TYPES = new Set(['text', 'title', 'math', 'steps', 'figure', 'draw']);
const asBlocks = (b: unknown): Block[] => {
  const list = (Array.isArray(b) ? b : [b]).map((x) => (typeof x === 'string' ? { type: 'text', text: x } : x));
  const bad = list.find((x) => !x || typeof x !== 'object' || !BLOCK_TYPES.has((x as Block).type));
  if (bad !== undefined) throw new Error(`Unknown block: ${JSON.stringify(bad)}. See mathTutor.help().`);
  return list as Block[];
};

const sameExercise = (a: Question, b: Question | null) => !!b && a.text === b.text && a.latex === b.latex;

export const tutorApi = {
  rules: TUTOR_RULES,
  help: () => API_HELP,
  context() {
    const p = activeProfile(getState());
    const q = ctx.question;
    const onTopic = /^#\/topic\//.test(location.hash);
    return {
      student: p ? { grade: p.grade, units: p.units ?? null } : null,
      topic: onTopic && ctx.topicId ? topicInfo(ctx.topicId) : null,
      tab: onTopic ? ctx.tab : null,
      level: onTopic && ctx.tab === 'practice' ? ctx.level : null,
      calculator: onTopic ? calcFor(ctx.topicId, p?.grade) : 'none',
      exercise: onTopic && ctx.tab === 'practice' && q ? { text: q.text, latex: q.latex ?? null, figure: q.figure ?? null, answerKind: q.answer.type, attempts: ctx.attempts, status: ctx.status } : null,
      reminder: 'Do not give the answer to this exercise. Guide the student to it.',
    };
  },
  curriculum(f: { grade?: number; units?: number; query?: string } = {}) {
    const q = f.query?.trim();
    return topics
      .filter((t) => (f.grade == null || teaches(t, f.grade)) && (f.units == null || !t.units || t.units.includes(f.units as 3)))
      .filter((t) => !q || [t.title, t.summary, ...t.levels, ...t.lesson.sections.map((s) => s.title)].some((s) => s.includes(q)))
      .map((t) => topicInfo(t.id));
  },
  lesson(id: string) {
    const t = topicById(id);
    if (!t) throw new Error(`No topic "${id}". Use mathTutor.curriculum() to list topic ids.`);
    const l = t.lesson;
    return {
      ...topicInfo(id),
      intro: l.intro,
      prerequisites: l.before ?? [],
      sections: l.sections.map((s) => ({ title: s.title, short: s.body, stepByStep: (s.detail ?? []).map(sectionText) })),
      method: l.method,
      workedExamples: l.examples.map((e) => ({ problem: e.problem, steps: e.steps.map(sectionText) })),
      tips: l.tips,
    };
  },
  open(id: string, tab: Tab = 'learn') {
    if (!topicById(id)) throw new Error(`No topic "${id}". Use mathTutor.curriculum() to list topic ids.`);
    tabRequest = tab;
    // באותו נושא הדף הקיים מחליף לשונית. בנושא אחר הדף החדש לוקח את הבקשה כשהוא נטען
    const same = ctx.topicId === id && location.hash.startsWith(`#/topic/${id}`);
    location.hash = `#/topic/${id}`;
    if (same) tabListeners.forEach((l) => l());
    return `Opened ${id} (${tab}).`;
  },
  example(id: string, level: Level = 1) {
    const t = topicById(id);
    if (!t) throw new Error(`No topic "${id}".`);
    for (let i = 0; i < 30; i++) {
      const q = t.generate(([1, 2, 3].includes(level) ? level : 1) as Level);
      if (sameExercise(q, ctx.question)) continue;
      return { note: "A demonstration exercise. It is not the student's exercise.", text: q.text, latex: q.latex ?? null, figure: q.figure ?? null, solution: q.solution.map(sectionText) };
    }
    throw new Error('Could not produce a different exercise. Demonstrate with numbers of your own.');
  },
  board: {
    show(blocks: unknown, title = '') {
      const list = asBlocks(blocks).map((block) => ({ id: nextId++, block }));
      set({ open: true, blocks: list, title: String(title).slice(0, 80) });
      return list.map((b) => b.id);
    },
    add(block: unknown) {
      const list = asBlocks(block).map((b) => ({ id: nextId++, block: b }));
      set({ open: true, blocks: [...state.blocks, ...list] });
      return list.length === 1 ? list[0].id : list.map((b) => b.id);
    },
    remove(id: number) {
      set({ blocks: state.blocks.filter((b) => b.id !== id) });
    },
    clear: () => clearBlocks(),
    open: () => openSheet(),
    close: () => closeSheet(),
  },
};

export function installTutorApi() {
  (window as unknown as { mathTutor: typeof tutorApi }).mathTutor = tutorApi;
}
