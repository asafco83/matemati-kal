/**
 * המחשבון: מתי מותר להשתמש בו, וחישוב של ביטוי (בלי eval).
 *
 * שני תנאים, ושניהם צריכים להתקיים:
 * 1. הכיתה (כללי משרד החינוך) קובעת אם מותר מחשבון ואיזה:
 *    - יסודי: תוכנית הלימודים לכיתות א'–ו' מגבילה את המחשבון לכיתה ו', כדי שהתלמידים
 *      יגיעו קודם לשליטה בחשבון.
 *    - חטיבת ביניים: מחשבון פשוט (במיצ"ב לכיתה ח' מותר מחשבון).
 *    - תיכון: בכל שאלוני הבגרות מותר מחשבון לא גרפי, ולכן מחשבון מדעי.
 * 2. הנושא והרמה: מחשבון מופיע רק כשיש בתרגיל חישוב שהוא לא מה שמתרגלים.
 *    בתרגול חשבון, בטכניקה אלגברית, בערכים מיוחדים, או כשהמספרים קטנים והחישוב
 *    בעל-פה הוא חלק מהמיומנות, אין מחשבון גם בכיתה שבה הוא מותר.
 */
import { topicById } from '../content';
import { teaches, type Level } from './types';

export type CalcKind = 'none' | 'basic' | 'scientific';

type Allow = 0 | 1;
/** לכל נושא: האם יש טעם במחשבון ברמה 1, 2, 3. כל נושא חייב להופיע כאן (נבדק ב-npm test) */
export const CALC_LEVELS: Record<string, [Allow, Allow, Allow]> = {
  // יסודי: תרגול החשבון עצמו
  'add-sub': [0, 0, 0],
  'mult-table': [0, 0, 0],
  'place-value': [0, 0, 0],
  'long-mult': [0, 0, 0],
  'long-division': [0, 0, 0],
  divisibility: [0, 0, 0],
  'order-of-ops': [0, 0, 0],
  rounding: [0, 0, 0],
  'compare-numbers': [0, 0, 0],
  'fractions-intro': [0, 0, 0],
  'fractions-add': [0, 0, 0],
  'mixed-numbers': [0, 0, 0],
  'fractions-mult': [0, 0, 0],
  decimals: [0, 0, 0],
  measures: [0, 0, 0],
  clock: [0, 0, 0],
  charts: [0, 0, 0],
  'word-problems-basic': [0, 0, 0],
  // יסודי: גאומטריה עם מספרים קטנים
  'perimeter-area': [0, 0, 0],
  shapes: [0, 0, 0],
  symmetry: [0, 0, 0],
  'angles-basic': [0, 0, 0],
  'triangle-area': [0, 0, 0],
  // כיתה ו' ואילך: חישוב עם π ועם מספרים גדולים, כשהעיקר הוא הנוסחה. מקצוע חסר בתיבה הוא חילוק פשוט
  volume: [1, 1, 0],
  circle: [1, 1, 1],
  // מהירות וקנה מידה: מספרים עגולים, והמרת היחידות היא המיומנות.
  speed: [0, 0, 0],
  scale: [0, 0, 0],
  // אחוזים: בונים כל אחוז מ-10% ומ-1% בעל-פה; רק בהנחה, בהתייקרות ובמציאת האחוז יש מחשבון.
  // יחס: השלמה וחלוקה בעל-פה; פרופורציה (כפל בהצלבה) עם מחשבון
  percent: [0, 0, 1],
  ratio: [0, 0, 1],
  // ממוצע של מעט מספרים קטנים, חציון ושכיח (סידור וספירה)
  averages: [0, 0, 0],
  // חטיבת ביניים: טכניקה אלגברית וחשבון במספרים מכוונים
  negatives: [0, 0, 0],
  'like-terms': [0, 0, 0],
  patterns: [0, 0, 0],
  expand: [0, 0, 0],
  'powers-roots': [0, 0, 0],
  'short-mult': [0, 0, 0],
  factoring: [0, 0, 0],
  'linear-eq': [0, 0, 0],
  inequalities: [0, 0, 0],
  systems: [0, 0, 0],
  'linear-function': [0, 0, 0],
  probability: [0, 0, 0],
  // בעיות מילוליות: בונים משוואה, והמספרים קטנים
  'word-problems': [0, 0, 0],
  // חטיבת ביניים: גאומטריה
  'angles-triangle': [0, 0, 0],
  'parallel-lines': [0, 0, 0],
  congruence: [0, 0, 0],
  pythagoras: [1, 1, 1],
  // אלכסון המלבן (פיתגורס)
  quadrilaterals: [0, 0, 1],
  // יחס השטחים: ריבוע של יחס דמיון עשרוני
  similarity: [0, 0, 1],
  // ט' ותיכון: אלגברה
  quadratics: [0, 0, 1],
  parabola: [0, 0, 0],
  'algebraic-fractions': [0, 0, 0],
  'quadratic-inequalities': [0, 0, 0],
  sequences: [0, 1, 0],
  'infinite-geometric': [0, 0, 0],
  exponential: [0, 1, 0],
  // סדרות: סכום של איברים רבים. מעריכית: גדילה ודעיכה באחוזים. לוגריתמים ומשוואות מעריכיות: המיומנות היא החוקים
  logarithms: [0, 0, 0],
  induction: [0, 0, 0],
  complex: [0, 1, 0],
  'linear-programming': [0, 0, 0],
  'quadratic-model': [0, 0, 0],
  // חשבון דיפרנציאלי ואינטגרלי: טכניקה עם מספרים שלמים; שטח בין גרף לציר יוצא שבר לעיגול
  derivatives: [0, 0, 0],
  'derivative-rules': [0, 0, 0],
  'derivatives-special': [0, 0, 0],
  investigation: [0, 0, 0],
  optimization: [0, 0, 0],
  integrals: [0, 0, 1],
  // ט' ותיכון: גאומטריה וטריגונומטריה
  'circle-angles': [0, 0, 0],
  thales: [0, 0, 0],
  analytic: [0, 1, 0],
  'circle-equation': [0, 1, 0],
  conics: [1, 1, 0],
  vectors: [1, 0, 0],
  solids: [1, 1, 1],
  'trig-right': [1, 1, 1],
  'sine-cosine-law': [1, 1, 1],
  'trig-3d': [1, 1, 1],
  'trig-equations': [0, 0, 0],
  // ערכים מיוחדים, זהויות ומשוואות טריגונומטריות בזוויות מיוחדות לומדים בלי מחשבון
  'unit-circle': [0, 0, 0],
  // סטטיסטיקה והסתברות בתיכון
  'tree-diagram': [1, 1, 1],
  binomial: [0, 1, 1],
  statistics: [1, 0, 1],
  regression: [0, 0, 1],
  normal: [0, 0, 0],
};

/** איזה מחשבון מותר בכיתה הזו */
function kindForGrade(g: number): CalcKind {
  if (g >= 10) return 'scientific';
  if (g >= 6) return 'basic';
  return 'none';
}

/**
 * grade: הכיתה של התלמיד. אם הנושא נלמד בכיתה שלו קובעים לפיה, אחרת לפי הכיתה הראשונה שבה הנושא נלמד.
 * level: הרמה שמתרגלים עכשיו. בלי רמה (למידה, דוגמאות) המחשבון מופיע אם הוא שימושי באחת הרמות.
 */
export function calcFor(topicId: string | null | undefined, grade?: number | null, level?: Level | null): CalcKind {
  const t = topicId ? topicById(topicId) : undefined;
  if (!t) return 'none';
  const allow = CALC_LEVELS[t.id];
  if (!allow || !(level ? allow[level - 1] : allow.some(Boolean))) return 'none';
  return kindForGrade(grade != null && teaches(t, grade) ? grade : t.grades[0]);
}

/* ---------- חישוב ---------- */

const FUNCS = ['sin⁻¹', 'cos⁻¹', 'tan⁻¹', 'sin', 'cos', 'tan', 'ln', 'log', '√'] as const;
type Func = (typeof FUNCS)[number];
type Tok = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'fn'; v: Func } | { t: '(' } | { t: ')' };

function tokenize(src: string, ans: number): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(src.slice(i));
    if (num) {
      out.push({ t: 'num', v: parseFloat(num[0]) });
      i += num[0].length;
      continue;
    }
    const fn = FUNCS.find((f) => src.startsWith(f, i));
    if (fn) {
      out.push({ t: 'fn', v: fn });
      i += fn.length;
      continue;
    }
    if (src.startsWith('Ans', i)) {
      out.push({ t: 'num', v: ans });
      i += 3;
      continue;
    }
    if (c === 'π') out.push({ t: 'num', v: Math.PI });
    else if (c === 'e') out.push({ t: 'num', v: Math.E });
    else if (c === '(') out.push({ t: '(' });
    else if (c === ')') out.push({ t: ')' });
    else if ('+-−×*÷/^!%²'.includes(c)) out.push({ t: 'op', v: c === '-' ? '−' : c === '*' ? '×' : c === '/' ? '÷' : c });
    else throw new Error('bad');
    i++;
  }
  return out;
}

const fact = (n: number) => {
  if (n < 0 || !Number.isInteger(n) || n > 170) throw new Error('bad');
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

/** מחשב ביטוי כמו שהוא מוקלד במחשבון. סוגריים שלא נסגרו נסגרים בסוף */
export function evaluate(src: string, deg: boolean, ans = 0): number {
  const toks = tokenize(src, ans);
  let p = 0;
  const peek = () => toks[p];
  const isOp = (v: string) => peek()?.t === 'op' && (peek() as { v: string }).v === v;
  const toRad = (x: number) => (deg ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (deg ? (x * 180) / Math.PI : x);
  const apply = (f: Func, x: number) => {
    switch (f) {
      case 'sin':
        return Math.sin(toRad(x));
      case 'cos':
        return Math.cos(toRad(x));
      case 'tan': {
        // tan של 90° (וכל זווית שהקוסינוס שלה 0) לא מוגדר
        if (Math.abs(Math.cos(toRad(x))) < 1e-12) throw new Error('bad');
        return Math.tan(toRad(x));
      }
      case 'sin⁻¹':
        return fromRad(Math.asin(x));
      case 'cos⁻¹':
        return fromRad(Math.acos(x));
      case 'tan⁻¹':
        return fromRad(Math.atan(x));
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log10(x);
      case '√':
        return Math.sqrt(x);
    }
  };
  // ביטוי := איבר (± איבר)*
  const expr = (): number => {
    let v = term();
    while (isOp('+') || isOp('−')) {
      const o = (toks[p++] as { v: string }).v;
      const r = term();
      v = o === '+' ? v + r : v - r;
    }
    return v;
  };
  // איבר := גורם (×÷ גורם, או כפל בלי סימן כמו 2π או 3(4))*
  const term = (): number => {
    let v = unary();
    for (;;) {
      if (isOp('×') || isOp('÷')) {
        const o = (toks[p++] as { v: string }).v;
        const r = unary();
        if (o === '÷' && r === 0) throw new Error('bad');
        v = o === '×' ? v * r : v / r;
      } else if (peek() && (peek().t === 'num' || peek().t === '(' || peek().t === 'fn')) v *= unary();
      else return v;
    }
  };
  const unary = (): number => {
    if (isOp('−')) {
      p++;
      return -unary();
    }
    if (isOp('+')) {
      p++;
      return unary();
    }
    return power();
  };
  // חזקה מימין לשמאל: 2^3^2 = 2^9, ו-−2^2 = −4 כמו במחשבון מדעי
  const power = (): number => {
    const b = postfix();
    if (isOp('^')) {
      p++;
      return b ** unary();
    }
    return b;
  };
  const postfix = (): number => {
    let v = primary();
    for (;;) {
      if (isOp('!')) v = fact(v);
      else if (isOp('%')) v = v / 100;
      else if (isOp('²')) v = v * v;
      else return v;
      p++;
    }
  };
  const primary = (): number => {
    const tk = toks[p++];
    if (!tk) throw new Error('bad');
    if (tk.t === 'num') return tk.v;
    if (tk.t === '(') {
      const v = expr();
      if (peek()?.t === ')') p++;
      return v;
    }
    if (tk.t === 'fn') return apply(tk.v, tk.v === '√' ? power() : peek()?.t === '(' ? primary() : power());
    throw new Error('bad');
  };
  const v = expr();
  while (peek()?.t === ')') p++;
  if (p < toks.length || !Number.isFinite(v)) throw new Error('bad');
  return v;
}

/** תוצאה להצגה: עד 10 ספרות משמעותיות, בלי רעש של שברים בינאריים */
export function formatResult(v: number): string {
  if (Object.is(v, -0) || Math.abs(v) < 1e-12) return '0';
  const r = Number(v.toPrecision(10));
  const a = Math.abs(r);
  if (a >= 1e12 || a < 1e-6) return r.toExponential(6).replace(/\.?0+e/, 'E').replace('E+', 'E');
  return String(r);
}
