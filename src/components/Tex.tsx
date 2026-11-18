import katex from 'katex';
import { Fragment, memo } from 'react';

export function texToHtml(tex: string, display = false): string {
  return katex.renderToString(tex.replace(/°/g, '^\\circ'), { displayMode: display, throwOnError: false, strict: false });
}

/** ביטוי מתמטי בודד */
export const Tex = memo(function Tex({ tex, display = false }: { tex: string; display?: boolean }) {
  return <span dir="ltr" className={display ? 'block' : 'inline-block'} dangerouslySetInnerHTML={{ __html: texToHtml(tex, display) }} />;
});

/** טקסט בעברית שמשולבת בו מתמטיקה בין סימני $...$ */
export const Rich = memo(function Rich({ text }: { text: string }) {
  const parts = text.split('$');
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} dir="ltr" className="mx-0.5 inline-block" dangerouslySetInnerHTML={{ __html: texToHtml(p) }} />
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
});
