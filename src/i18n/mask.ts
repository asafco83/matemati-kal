/**
 * מפתח תרגום של משפט.
 *
 * הטקסט המקורי (עברית) הוא המפתח. כדי שמשפט שנוצר עם מספרים או תרגילים שונים
 * יתורגם פעם אחת, מחליפים בו כל קטע מתמטי ($...$), כל קטע מוקלד (`...`), כל מספר
 * וכל שם של דמות בסימן ⟨0⟩, ⟨1⟩, ... לפי הסדר. בתרגום מופיעים אותם סימנים,
 * בכל סדר שמתאים לשפה, ובזמן התצוגה מחזירים אליהם את הקטעים המקוריים.
 */

/** שמות הדמויות בבעיות מילוליות. מתורגמים בנפרד, כמילה אחת */
export const NAME_TOKENS = ['דני', 'נועה', 'יואב', 'מאיה', 'עומר', 'תמר'];

const NAMES_RE = NAME_TOKENS.join('|');
// סדר החלופות קובע: קודם מתמטיקה, אחר כך הקלדה, שמות ומספרים
const TOKEN_RE = new RegExp(
  String.raw`\$[^$]*\$|` + '`[^`]*`|' + `(?<![\\u0590-\\u05FF])(?:${NAMES_RE})(?![\\u0590-\\u05FF])|` + String.raw`(?<![\w.])-?\d+(?:[.,]\d+)*(?![\w])`,
  'g',
);

export interface Masked {
  key: string;
  tokens: string[];
}

export function mask(text: string): Masked {
  const tokens: string[] = [];
  const key = text.replace(TOKEN_RE, (m, offset: number) => {
    // "ב-4": המקף שייך לאות היחס שלפניו, לא למספר. המפתח לא משתנה, אבל המספר שחוזר לתרגום הוא 4 ולא -4
    tokens.push(m[0] === '-' && /[\u0590-\u05FF]/.test(text[offset - 1] ?? '') ? m.slice(1) : m);
    return `⟨${tokens.length - 1}⟩`;
  });
  return { key: key.replace(/\s+/g, ' ').trim(), tokens };
}

export function unmask(template: string, tokens: string[], mapToken: (t: string) => string = (t) => t): string {
  return template.replace(/⟨(\d+)⟩/g, (_, i) => mapToken(tokens[Number(i)] ?? ''));
}

export const HEBREW = /[֐-׿]/;

/** קטעי \text{...} בעברית שבתוך ביטוי מתמטי */
export const TEX_TEXT_RE = /\\text\{([^{}]*[֐-׿][^{}]*)\}/g;
