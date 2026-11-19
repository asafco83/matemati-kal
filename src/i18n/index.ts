/**
 * תרגום האפליקציה.
 *
 * העברית היא שפת המקור, והמשפט בעברית הוא מפתח התרגום (ראו mask.ts).
 * כל שפה היא קובץ JSON אחד ב-src/i18n/locales, שנטען רק כשבוחרים בה.
 *
 * הוספת שפה חדשה:
 *  1. מוסיפים שורה ל-LOCALES (קוד, שם בשפה עצמה, כיוון, ואם צריך גופן).
 *  2. מריצים npx tsx scripts/i18n-extract.ts כדי לעדכן את רשימת המפתחות.
 *  3. מתרגמים: npx tsx scripts/i18n-todo.ts <code> מציג מה חסר, ו-i18n-merge.ts שומר.
 *  4. npx tsx scripts/i18n-check.ts <code> בודק שהכול מתורגם ושהסימנים ⟨i⟩ במקום.
 */
import { HEBREW, mask, TEX_TEXT_RE, unmask } from './mask';

export type LocaleCode = 'he' | 'ar' | 'en' | 'yi' | 'ru' | 'fr' | 'am' | 'es' | 'de' | 'it' | 'ro';

export interface LocaleInfo {
  code: LocaleCode;
  /** שם השפה בשפה עצמה */
  name: string;
  dir: 'rtl' | 'ltr';
  /** בבית הספר כותבים שבר עשרוני עם פסיק (3,5). אז נקודה במערכת צירים נכתבת עם pointSep */
  decimalComma?: boolean;
  /** המפריד בין שיעורי נקודה כשיש פסיק עשרוני: A(2; 3) או A(2 | 3) בגרמנית */
  pointSep?: ';' | '|';
  /** גופן נוסף מ-Google Fonts, לכתב שהגופנים הרגילים לא מכסים */
  font?: { family: string; css: string };
}

const RUBIK = { family: 'Rubik', css: 'family=Rubik:wght@400;500;600;700' };

export const LOCALES: LocaleInfo[] = [
  { code: 'he', name: 'עברית', dir: 'rtl' },
  { code: 'yi', name: 'ייִדיש', dir: 'rtl' },
  { code: 'ar', name: 'العربية', dir: 'rtl', font: { family: 'Noto Sans Arabic', css: 'family=Noto+Sans+Arabic:wght@400;500;600;700' } },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr', font: RUBIK, decimalComma: true, pointSep: ';' },
  { code: 'fr', name: 'Français', dir: 'ltr', decimalComma: true, pointSep: ';' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr', decimalComma: true, pointSep: '|' },
  { code: 'it', name: 'Italiano', dir: 'ltr', decimalComma: true, pointSep: ';' },
  { code: 'ro', name: 'Română', dir: 'ltr', decimalComma: true, pointSep: ';' },
  { code: 'am', name: 'አማርኛ', dir: 'ltr', font: { family: 'Noto Sans Ethiopic', css: 'family=Noto+Sans+Ethiopic:wght@400;500;600;700' } },
];

export const DEFAULT_LOCALE: LocaleCode = 'he';
export const localeInfo = (code: string | undefined): LocaleInfo => LOCALES.find((l) => l.code === code) ?? LOCALES[0];

// כל קובץ שפה נטען בנפרד, רק כשצריך אותו
// Vite מחליף את import.meta.glob ברשימת הקבצים בזמן הבנייה. מחוץ ל-Vite (סקריפטים) אין שפות לטעון
let loaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {};
try {
  loaders = import.meta.glob<{ default: Record<string, string> }>('./locales/*.json');
} catch {
  /* מחוץ ל-Vite */
}

let current: LocaleInfo = LOCALES[0];
let dict: Record<string, string> = {};

export const getLocale = () => current;

/** טוען שפה ומעדכן את כיוון הדף, השפה והגופן. מחזיר אחרי שהתרגום מוכן */
export async function setLocale(code: string | undefined): Promise<void> {
  const info = localeInfo(code);
  const load = loaders[`./locales/${info.code}.json`];
  dict = info.code === DEFAULT_LOCALE || !load ? {} : (await load()).default;
  current = info;
  const root = document.documentElement;
  root.lang = info.code;
  root.dir = info.dir;
  if (info.font && !document.getElementById(`font-${info.code}`)) {
    const link = document.createElement('link');
    link.id = `font-${info.code}`;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${info.font.css}&display=swap`;
    document.head.appendChild(link);
  }
}

/** בשפה שנכתבת משמאל לימין, חץ "קדימה" ו"אחורה" מתהפכים */
const flipArrows = (s: string) => (current.dir === 'ltr' ? s.replace(/[→←]/g, (a) => (a === '→' ? '←' : '→')) : s);

/** עברית שבתוך \text{...} בביטוי מתמטי */
export function trTex(tex: string): string {
  if (current.code === DEFAULT_LOCALE || !HEBREW.test(tex)) return tex;
  return tex.replace(TEX_TEXT_RE, (all, inner: string) => {
    const tr = lookup(inner);
    return tr === inner ? all : `\\text{${tr}}`;
  });
}

/* ---------- פסיק עשרוני ---------- */

// שיעור של נקודה: מספר, משתנה (עם אינדקס), שבר, או cos/sin של זווית
const COORD = String.raw`-?(?:\d+(?:\.\d+)?|[a-zA-Z](?:_\{?[\w,]+\}?)?|\\frac\{[^{}]*\}\{[^{}]*\}|\\(?:cos|sin) \\alpha)`;
const POINT_RE = new RegExp(String.raw`\(\s*(${COORD})\s*,\s*(${COORD})\s*\)`, 'g');

/**
 * בשפות שבהן כותבים פסיק עשרוני: 3.5 נכתב 3,5, ולכן נקודה (2, 3.5) נכתבת
 * (2; 3,5), ובגרמנית (2 | 3,5), כמו בספרי הלימוד שם.
 */
export function localizeMath(tex: string): string {
  if (!current.decimalComma) return tex;
  const sep = current.pointSep === '|' ? ' \\mid ' : ';\\ ';
  return tex.replace(POINT_RE, (_, a: string, b: string) => `(${a}${sep}${b})`).replace(/(\d)\.(\d)/g, '$1{,}$2');
}

/** מספר בטקסט רגיל (לא בתוך מתמטיקה) */
export const localizeNumber = (s: string) => (current.decimalComma ? s.replace(/(\d)\.(\d)/g, '$1,$2') : s);

function lookup(text: string): string {
  const { key, tokens } = mask(text);
  const hit = dict[key];
  if (hit === undefined) return text;
  return unmask(hit, tokens, (tok) => (tok.startsWith('$') ? `$${trTex(tok.slice(1, -1))}$` : localizeNumber(dict[tok] ?? tok)));
}

/** תרגום של משפט מהתוכן (שיעור, שאלה, פתרון). בלי תרגום, נשאר המקור */
export function tr(text: string): string {
  if (current.code === DEFAULT_LOCALE || !text || !HEBREW.test(text)) return text;
  return flipArrows(lookup(text));
}

/**
 * תרגום של מחרוזת בממשק או בתוכן.
 * T('שמירה') למחרוזת קבועה (מספרים ותרגילים בתוכה מזוהים לבד),
 * ו-T`שלום ${name}` כשיש בה ערך משתנה אחר (שם, כותרת).
 */
export function T(strings: TemplateStringsArray | string, ...values: unknown[]): string {
  if (typeof strings === 'string') return tr(strings);
  const plain = strings.reduce((a, s, i) => a + (i ? String(values[i - 1]) : '') + s, '');
  if (current.code === DEFAULT_LOCALE) return plain;
  const key = strings.reduce((a, s, i) => a + (i ? `⟨${i - 1}⟩` : '') + s, '').replace(/\s+/g, ' ').trim();
  const hit = dict[key];
  if (hit === undefined) return plain;
  return flipArrows(unmask(hit, values.map(String)));
}

/** מסמן מחרוזת לתרגום בלי לתרגם אותה עכשיו (התרגום נעשה כשמציגים אותה) */
export const N = (s: string) => s;

/** לבדיקות בלבד (מחוץ לדפדפן): קובע שפה ומילון בלי לטעון קובץ ובלי לגעת בדף */
export function setLocaleForTest(code: string, d: Record<string, string>) {
  current = localeInfo(code);
  dict = code === DEFAULT_LOCALE ? {} : d;
}
