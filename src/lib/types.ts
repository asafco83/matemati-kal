export type Level = 1 | 2 | 3;

/** שרטוטים פשוטים שמלווים שיעורים ושאלות */
export type Figure =
  | { type: 'rect'; w: string; h: string }
  | { type: 'rtri'; bottom?: string; left?: string; hyp?: string; angle?: string }
  | { type: 'tri'; angles: [string, string, string]; ext?: string }
  | { type: 'graph'; lines: { m: number; b: number }[]; points?: [number, number][]; curves?: [number, number][][]; range?: number }
  /** משולש עם שמות קודקודים: A למטה משמאל, B למטה מימין, C למעלה. a מול A וכו' */
  | { type: 'triS'; a?: string; b?: string; c?: string; A?: string; B?: string; C?: string }
  | { type: 'fracbar'; parts: number; filled: number }
  | { type: 'array'; rows: number; cols: number }
  | { type: 'numline'; from: number; to: number; jumps?: number[]; start?: number }
  /** משולש עם גובה מקווקו */
  | { type: 'triH'; b: string; h: string }
  /** מקבילית או טרפז עם גובה */
  | { type: 'quad'; kind: 'parallelogram' | 'trapezoid'; b: string; h: string; top?: string }
  | { type: 'circle'; r?: string; d?: string }
  /** תיבה: אורך, רוחב, גובה */
  | { type: 'box'; a: string; b: string; c: string }
  | { type: 'polygon'; n: number; side?: string }
  /** דיאגרמת עמודות */
  | { type: 'bars'; labels: string[]; values: number[]; step: number }
  /** חילוק ארוך כמו במחברת: המנה מעל, המחלק מימין לקו */
  | { type: 'longdiv'; n: number; d: number }
  /** שני ישרים מקבילים וחותך. at: 0 = הצומת העליון, 1 = התחתון. q: הרביע של הזווית */
  | { type: 'parallel'; marks: { at: 0 | 1; q: 'tl' | 'tr' | 'bl' | 'br'; label: string }[] };

export type Answer =
  /** מספר אחד (מקבל גם שבר כמו 3/4) */
  | { type: 'number'; value: number; tol?: number; unit?: string; placeholder?: string }
  /** כמה שדות. ordered=false: הסדר לא משנה (למשל שני פתרונות) */
  | { type: 'multi'; labels: string[]; values: number[]; ordered: boolean; tol?: number }
  | { type: 'choice'; options: string[]; correct: number };

/**
 * שורה בפתרון. מחרוזת היא טקסט חופשי עם $...$.
 * שורת מחברת: tex היא המשוואה כפי שכותבים אותה, op היא הפעולה שכותבים לצידה (למשל "- 8" או "\\div 5"),
 * ו-why מסבירה במילים למה עושים את הצעד (מוצגת בפתרון המלא).
 */
export type Step = string | { tex: string; op?: string; why?: string } | { figure: Figure; caption?: string };

export interface Question {
  /** ניסוח השאלה. $...$ מסמן מתמטיקה */
  text: string;
  /** ביטוי מתמטי גדול להצגה (LaTeX) */
  latex?: string;
  figure?: Figure;
  answer: Answer;
  hint: string;
  /** פתרון מלא: כל שורה שהתלמיד כותב במחברת */
  solution: Step[];
  /** פתרון רגיל, בלי שורות הביניים. אם חסר, מוצג רק הפתרון המלא */
  short?: Step[];
}

export interface Example {
  problem: string;
  figure?: Figure;
  steps: Step[];
}

/** צעד בהסבר המלא: שורת טקסט או מחברת, או שרטוט עם כיתוב */
export type LessonStep = Step;

export interface LessonSection {
  title: string;
  /** ההסבר המקוצר: העיקרון בכמה משפטים */
  body: string;
  figure?: Figure;
  /** ההסבר המלא: צעד אחר צעד, בלי להניח ידע קודם */
  detail?: LessonStep[];
}

export interface Lesson {
  intro: string;
  /** תזכורות לפני שמתחילים: מה צריך לדעת (מוצג בהסבר המלא) */
  before?: string[];
  sections: LessonSection[];
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
  /** שם קצר ללשונית בהאדר */
  short: string;
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
