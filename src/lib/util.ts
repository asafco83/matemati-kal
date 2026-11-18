import type { Answer } from './types';

/** מספר שלם אקראי בין a ל-b, כולל */
export const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

/** LaTeX עם שילוב ערכים, בלי צורך להכפיל לוכסנים */
export const L = String.raw;

/** שבר מצומצם ב-LaTeX (או מספר שלם אם המכנה 1) */
export function fracTex(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  let a = n / g;
  let b = d / g;
  if (b < 0) {
    a = -a;
    b = -b;
  }
  if (b === 1) return `${a}`;
  return a < 0 ? L`-\frac{${-a}}{${b}}` : L`\frac{${a}}{${b}}`;
}

/** שבר כפי שנכתב, בלי צמצום */
export const rawFrac = (n: number, d: number) => L`\frac{${n}}{${d}}`;

/** "+ 5" או "- 5" */
export const sgn = (n: number) => (n < 0 ? `- ${-n}` : `+ ${n}`);

/** מספר בסוגריים אם הוא שלילי */
export const par = (n: number) => (n < 0 ? `(${n})` : `${n}`);

/** פולינום ב-LaTeX. coefs מהחזקה הגבוהה לנמוכה: [2,-3,5] => 2x^2 - 3x + 5 */
export function polyTex(coefs: number[], v = 'x'): string {
  const deg = coefs.length - 1;
  let out = '';
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const abs = Math.abs(c);
    const vpart = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`;
    const num = abs === 1 && p !== 0 ? '' : `${abs}`;
    if (out === '') out += (c < 0 ? '-' : '') + num + vpart;
    else out += (c < 0 ? ' - ' : ' + ') + num + vpart;
  });
  return out || '0';
}

/** עיגול למספר ספרות אחרי הנקודה */
export const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

/** קריאת מספר שהתלמיד הקליד: שלם, עשרוני, שבר (3/4) או מספר מעורב (1 1/2) */
export function parseNum(raw: string): number | null {
  let s = raw
    .trim()
    .replace(/[−–—]/g, '-')
    .replace(/,/g, '.')
    .replace(/[°%]/g, '')
    .replace(/^[a-zA-Z]\s*=\s*/, '');
  if (s === '') return null;
  const mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const w = Number(mixed[1]);
    const d = Number(mixed[3]);
    if (d === 0) return null;
    const f = Number(mixed[2]) / d;
    return w < 0 || mixed[1].startsWith('-') ? w - f : w + f;
  }
  s = s.replace(/\s+/g, '');
  const fr = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fr) {
    const d = Number(fr[2]);
    return d === 0 ? null : Number(fr[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

const close = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol + 1e-9;

/** בדיקת תשובה. fields: מה שהוקלד בשדות, או אינדקס הבחירה בשאלה אמריקאית */
export function checkAnswer(ans: Answer, fields: string[], choice: number | null): boolean {
  if (ans.type === 'choice') return choice === ans.correct;
  if (ans.type === 'number') {
    const v = parseNum(fields[0] ?? '');
    return v !== null && close(v, ans.value, ans.tol ?? 1e-6);
  }
  const vals = fields.map(parseNum);
  if (vals.length !== ans.values.length || vals.some((v) => v === null)) return false;
  const got = vals as number[];
  const tol = ans.tol ?? 1e-6;
  if (ans.ordered) return got.every((v, i) => close(v, ans.values[i], tol));
  const a = [...got].sort((x, y) => x - y);
  const b = [...ans.values].sort((x, y) => x - y);
  return a.every((v, i) => close(v, b[i], tol));
}

/** האם התשובה מלאה מספיק כדי לבדוק */
export function isFilled(ans: Answer, fields: string[], choice: number | null): boolean {
  if (ans.type === 'choice') return choice !== null;
  const n = ans.type === 'number' ? 1 : ans.values.length;
  for (let i = 0; i < n; i++) if (!(fields[i] ?? '').trim()) return false;
  return true;
}
