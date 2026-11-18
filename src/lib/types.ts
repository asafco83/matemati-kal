export type Level = 1 | 2 | 3;

/** שרטוטים פשוטים שמלווים שיעורים ושאלות */
export type Figure =
  | { type: 'rect'; w: string; h: string }
  | { type: 'rtri'; bottom?: string; left?: string; hyp?: string; angle?: string }
  | { type: 'tri'; angles: [string, string, string]; ext?: string }
  | { type: 'graph'; lines: { m: number; b: number }[]; points?: [number, number][] }
  | { type: 'fracbar'; parts: number; filled: number }
  | { type: 'array'; rows: number; cols: number }
  | { type: 'numline'; from: number; to: number; jumps?: number[]; start?: number };

export type Answer =
  /** מספר אחד (מקבל גם שבר כמו 3/4) */
  | { type: 'number'; value: number; tol?: number; unit?: string; placeholder?: string }
  /** כמה שדות. ordered=false: הסדר לא משנה (למשל שני פתרונות) */
  | { type: 'multi'; labels: string[]; values: number[]; ordered: boolean; tol?: number }
  | { type: 'choice'; options: string[]; correct: number };

export interface Question {
  /** ניסוח השאלה. $...$ מסמן מתמטיקה */
  text: string;
  /** ביטוי מתמטי גדול להצגה (LaTeX) */
  latex?: string;
  figure?: Figure;
  answer: Answer;
  hint: string;
  /** פתרון מלא, צעד אחר צעד */
  solution: string[];
}

export interface Example {
  problem: string;
  figure?: Figure;
  steps: string[];
}

export interface Lesson {
  intro: string;
  sections: { title: string; body: string; figure?: Figure }[];
  /** שיטת העבודה, לפי הסדר */
  method: string[];
  examples: Example[];
  /** טעויות נפוצות וטיפים */
  tips: string[];
}

export interface Topic {
  id: string;
  track: string;
  title: string;
  /** טווח כיתות: 1 = א', 12 = י"ב */
  grades: [number, number];
  summary: string;
  icon: string;
  lesson: Lesson;
  /** תיאור קצר של כל רמה */
  levels: [string, string, string];
  generate: (level: Level) => Question;
}

export interface SoonTopic {
  id: string;
  track: string;
  title: string;
  grades: [number, number];
  soon: true;
}

export interface Track {
  id: string;
  title: string;
  icon: string;
  color: string;
}

export const GRADE_NAMES = ['', "א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ז'", "ח'", "ט'", "י'", 'י"א', 'י"ב'];

export type Stage = 'all' | 'elementary' | 'middle' | 'high';

export const STAGES: { id: Stage; title: string; range: [number, number] }[] = [
  { id: 'all', title: 'הכול', range: [1, 12] },
  { id: 'elementary', title: "יסודי (א'-ו')", range: [1, 6] },
  { id: 'middle', title: "חטיבת ביניים (ז'-ט')", range: [7, 9] },
  { id: 'high', title: 'תיכון (י\'-י"ב)', range: [10, 12] },
];

export function gradeLabel([a, b]: [number, number]): string {
  return a === b ? `כיתה ${GRADE_NAMES[a]}` : `כיתות ${GRADE_NAMES[a]}–${GRADE_NAMES[b]}`;
}

export function stageOfGrade(g: number): Stage {
  return g <= 6 ? 'elementary' : g <= 9 ? 'middle' : 'high';
}
