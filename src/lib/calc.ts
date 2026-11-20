/**
 * המחשבון: מתי מותר להשתמש בו, וחישוב של ביטוי (בלי eval).
 *
 * הכללים, לפי משרד החינוך:
 * - יסודי: תוכנית הלימודים לכיתות א'–ו' מגבילה את המחשבון לכיתה ו', כדי שהתלמידים
 *   יגיעו קודם לשליטה בחשבון. גם בכיתה ו' לא בנושאים שבהם החישוב הוא מה שמתרגלים.
 * - חטיבת ביניים: במבחני המיצ"ב לכיתה ח' מותר מחשבון (בחלק מהשנים חלק מהמבחן בלעדיו).
 *   מחשבון פשוט, חוץ מנושאים שבהם החישוב או הטכניקה האלגברית הם העיקר.
 * - תיכון: בכל שאלוני הבגרות מותר מחשבון לא גרפי, ולכן מחשבון מדעי.
 */
import { topicById } from '../content';

export type CalcKind = 'none' | 'basic' | 'scientific';

/** נושאים של כיתה ו' שבהם החישוב הוא לא העיקר */
const GRADE6_ALLOWED = new Set(['scale', 'circle', 'percent', 'ratio', 'speed', 'volume']);
/** נושאים של חטיבת הביניים שבהם מתרגלים את החישוב או את הטכניקה עצמה */
const MIDDLE_NONE = new Set(['negatives', 'like-terms', 'patterns', 'expand', 'powers-roots', 'factoring', 'short-mult', 'algebraic-fractions', 'congruence', 'order-of-ops', 'divisibility', 'fractions-mult']);

export function calcFor(topicId: string | null | undefined): CalcKind {
  const t = topicId ? topicById(topicId) : undefined;
  if (!t) return 'none';
  const g = t.grades[0];
  if (g >= 10) return 'scientific';
  if (g >= 7) return MIDDLE_NONE.has(t.id) ? 'none' : 'basic';
  if (g === 6) return GRADE6_ALLOWED.has(t.id) ? 'basic' : 'none';
  return 'none';
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
