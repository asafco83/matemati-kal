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
  return katex.renderToString(applyNotation(tex, n), { displayMode: display, throwOnError: false, strict: false });
}

/** ביטוי מתמטי בודד */
export const Tex = memo(function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  const n = useContext(NotationContext);
  return <span dir="ltr" className={display ? 'block' : 'inline-block'} dangerouslySetInnerHTML={{ __html: texToHtml(tex, display, n) }} />;
});

/** טקסט בעברית שמשולבת בו מתמטיקה בין סימני $...$ */
export const Rich = memo(function Rich({ text }: { text: string }) {
  const n = useContext(NotationContext);
  const parts = text.split('$');
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} dir="ltr" className="mx-0.5 inline-block" dangerouslySetInnerHTML={{ __html: texToHtml(p, false, n) }} />
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
});
