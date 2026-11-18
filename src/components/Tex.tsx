import katex from 'katex';
import { createContext, Fragment, memo, useContext } from 'react';

/**
 * כללי כתיבה לפי שלב הלימוד:
 * ביסודי כפל נכתב ×, ומכיתה ז' נכתב כנקודה (·). חילוק נכתב תמיד בנקודתיים (:).
 * התוכן נכתב פעם אחת, וההמרה נעשית בזמן התצוגה.
 */
export type Notation = 'elementary' | 'secondary';
export const NotationContext = createContext<Notation>('secondary');
export const notationForGrade = (firstGrade: number): Notation => (firstGrade <= 6 ? 'elementary' : 'secondary');

function applyNotation(tex: string, n: Notation): string {
  let t = tex.replace(/\\div(?![a-zA-Z])/g, '\\mathbin{:}').replace(/°/g, '^\\circ');
  t = n === 'elementary' ? t.replace(/\\cdot(?![a-zA-Z])/g, '\\times') : t.replace(/\\times(?![a-zA-Z])/g, '\\cdot');
  return t;
}

export function texToHtml(tex: string, display = false, n: Notation = 'secondary'): string {
  let t = applyNotation(tex, n);
  // שבר בתוך שורה מוצג בגודל מלא, כדי שהמונה והמכנה יהיו קריאים
  if (!display) t = t.replace(/\\frac(?![a-zA-Z])/g, '\\dfrac');
  // התיבה של המספר החסר מצוירת ב-CSS, כדי שתהיה בגובה הספרות וממורכזת אליהן
  return katex
    .renderToString(t, { displayMode: display, throwOnError: false, strict: false })
    .replaceAll('<span class="mord amsrm">□</span>', '<span class="mord blank-box"></span>');
}

/** ביטוי מתמטי בודד */
export const Tex = memo(function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const n = useContext(NotationContext);
  return <span dir="ltr" className={display ? 'block' : 'inline-block'} dangerouslySetInnerHTML={{ __html: texToHtml(tex, display, n) }} />;
});

/**
 * מה שמקלידים בתיבת התשובה נכתב בין גרשיים הפוכים (`1 1/2`).
 * הוא מוצג משמאל לימין ובמסגרת של מקש, כדי שהסדר לא יתהפך בתוך משפט בעברית.
 */
function typed(text: string) {
  if (!text.includes('`')) return text;
  return text.split('`').map((p, i) =>
    i % 2 === 1 ? (
      <kbd key={i} dir="ltr" className="typed">
        {p}
      </kbd>
    ) : (
      p
    ),
  );
}

/** משתנה או מספר בודד (x, ‏2x, ‏15) לא צריך מסגרת: הוא קורא כמו מילה במשפט */
const isTiny = (tex: string) => /^-?\d*[a-zA-Z]?$/.test(tex.trim()) && tex.trim().length <= 3;

/** טקסט בעברית שמשולבת בו מתמטיקה בין סימני $...$ */
export const Rich = memo(function Rich({ text }: { text: string }) {
  const n = useContext(NotationContext);
  const parts = text.split('$');
  // שורה שכולה מתמטיקה לא צריכה מסגרת; בתוך משפט, המסגרת מפרידה בין הטקסט לתרגיל
  const onlyMath = parts.length === 3 && !parts[0].trim() && !parts[2].trim();
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} dir="ltr" className={onlyMath || isTiny(p) ? 'inline-block' : /^[.,:;!?)]/.test(parts[i + 1] ?? '') ? 'mi mi-p' : 'mi'} dangerouslySetInnerHTML={{ __html: texToHtml(p, false, n) }} />
        ) : (
          <Fragment key={i}>{typed(p)}</Fragment>
        ),
      )}
    </>
  );
});
