import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { calcFor, evaluate, formatResult, type CalcKind } from '../lib/calc';
import { getLocale, localizeNumber, T } from '../i18n';
import { activeProfile, getState, useStore } from '../lib/store';
import { sheetContext, useScreen } from '../lib/sheet';

/**
 * מחשבון בחלון צף: אפשר להזיז אותו, למזער ולסגור. החישוב נשמר גם כשממזערים,
 * סוגרים או עוברים נושא, כי המצב נשמר מחוץ לרכיב.
 * הוא מופיע רק בנושאים שבהם מותר מחשבון (calcFor), פשוט או מדעי.
 */

interface CalcState {
  open: boolean;
  min: boolean;
  expr: string;
  /** התוצאה האחרונה, או null בזמן הקלדה */
  result: string | null;
  error: boolean;
  /** החישוב הקודם, מוצג מעל השורה */
  last: string;
  ans: number;
  deg: boolean;
  second: boolean;
  x: number | null;
  y: number | null;
}

const POS_KEY = 'matemati-kal:calc-pos';
const savedPos = (): { x: number | null; y: number | null } => {
  try {
    return JSON.parse(localStorage.getItem(POS_KEY) || '') ?? { x: null, y: null };
  } catch {
    return { x: null, y: null };
  }
};

let st: CalcState = { open: false, min: false, expr: '', result: null, error: false, last: '', ans: 0, deg: true, second: false, ...savedPos() };
const ls = new Set<() => void>();
const set = (p: Partial<CalcState>) => {
  st = { ...st, ...p };
  ls.forEach((l) => l());
};
const useCalc = () =>
  useSyncExternalStore(
    (l) => {
      ls.add(l);
      return () => {
        ls.delete(l);
      };
    },
    () => st,
  );

export const toggleCalc = () => set(st.open ? { open: false } : { open: true, min: false });
export const useCalcOpen = () => useCalc().open;
/** סוג המחשבון שמותר בעמוד הנוכחי */
export const currentCalcKind = (): CalcKind => {
  const c = sheetContext();
  return calcFor(location.hash.match(/^#\/topic\/([\w-]+)/)?.[1], activeProfile(getState())?.grade, c.tab === 'practice' ? c.level : null);
};

const FN_INSERT: Record<string, string> = { sin: 'sin(', cos: 'cos(', tan: 'tan(', 'sin⁻¹': 'sin⁻¹(', 'cos⁻¹': 'cos⁻¹(', 'tan⁻¹': 'tan⁻¹(', ln: 'ln(', log: 'log(', '√': '√(', eˣ: 'e^(', '10ˣ': '10^(' };
const TOKENS = ['sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(', 'sin(', 'cos(', 'tan(', 'ln(', 'log(', '√(', 'Ans'];

function press(k: string) {
  const fresh = st.result !== null || st.error;
  let expr = st.error ? '' : st.expr;
  if (k === 'C') return set({ expr: '', result: null, error: false });
  if (k === '=') {
    if (!expr) return;
    try {
      const v = evaluate(expr, st.deg, st.ans);
      const r = formatResult(v);
      return set({ result: r, error: false, ans: v, last: `${expr} =` });
    } catch {
      return set({ error: true, result: null });
    }
  }
  if (k === '⌫') {
    if (fresh) return set({ expr: st.error ? '' : expr, result: null, error: false });
    const tok = TOKENS.find((t) => expr.endsWith(t));
    return set({ expr: expr.slice(0, -(tok ? tok.length : 1)) });
  }
  if (k === 'deg') return set({ deg: !st.deg });
  if (k === '2nd') return set({ second: !st.second });
  // אחרי "=": ספרה מתחילה חישוב חדש, ופעולה ממשיכה מהתוצאה
  const continues = /^[+−×÷^²!%]$/.test(k);
  if (fresh) expr = continues ? 'Ans' : '';
  if (k === '±') {
    const m = /(\(−)?(\d+\.?\d*|\.\d+|π|e|Ans)$/.exec(expr);
    expr = m ? (m[1] ? expr.slice(0, m.index) + m[2] : `${expr.slice(0, m.index)}(−${m[2]}`) : `${expr}−`;
  } else if (k === '.') {
    // נקודה עשרונית אחת בכל מספר
    const tail = /[\d.]*$/.exec(expr)![0];
    if (tail.includes('.')) return;
    expr += tail ? '.' : '0.';
  } else expr += FN_INSERT[k] ?? k;
  set({ expr, result: null, error: false, second: k === '2nd' ? st.second : false });
}

/** ביטוי להצגה: עם פסיק עשרוני בשפות שבהן כותבים כך */
const show = (s: string) => localizeNumber(s.replace(/E/g, '·10^'));

function Key({ k, label, kind = 'num', wide, aria }: { k: string; label?: ReactNode; kind?: 'num' | 'op' | 'fn' | 'eq' | 'on'; wide?: boolean; aria?: string }) {
  const cls = { num: 'bg-white text-ink', op: 'bg-[#e9e4d6] text-ink', fn: 'bg-[#f3efe4] text-ink text-[14px]', eq: 'bg-ink text-white', on: 'bg-ink text-white text-[14px]' }[kind];
  return (
    <button
      type="button"
      onClick={() => press(k)}
      aria-label={aria}
      className={`h-11 rounded-xl font-display text-lg font-semibold shadow-[0_1px_0_#c9c4b6] active:translate-y-px ${cls} ${wide ? 'col-span-2' : ''}`}
    >
      {label ?? k}
    </button>
  );
}

export function Calculator() {
  const s = useCalc();
  // מתעדכן כשעוברים רמה, לשונית או פרופיל
  useScreen();
  useStore();
  const kind = currentCalcKind();
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  // נפתח: הפוקוס עובר למחשבון, כדי שאפשר יהיה להקליד מהמקלדת
  useEffect(() => {
    if (s.open && !s.min && kind !== 'none') box.current?.focus({ preventScroll: true });
  }, [s.open, s.min, kind]);
  // המסך השתנה: החלון נשאר בתוכו
  useEffect(() => {
    const fit = () => set({});
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  if (!s.open || kind === 'none') return null;
  const sci = kind === 'scientific';
  const W = sci ? 316 : 272;
  const vw = window.innerWidth, vh = window.innerHeight;
  const H = box.current?.offsetHeight ?? (sci ? 560 : 470);
  const x = Math.min(Math.max(s.x ?? 12, 0), Math.max(vw - W, 0));
  // עד שמזיזים אותו, החלון יושב מעל הכפתורים הצפים בפינה
  const y = s.y === null ? Math.max(vh - H - 68, 0) : Math.min(Math.max(s.y, 0), Math.max(vh - (s.min ? 52 : Math.min(H, vh)), 0));
  const dot = getLocale().decimalComma ? ',' : '.';
  const preview = (() => {
    if (s.result !== null || s.error || !s.expr) return '';
    try {
      return formatResult(evaluate(s.expr, s.deg, s.ans));
    } catch {
      return '';
    }
  })();

  const onKey = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const map: Record<string, string> = { Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', Delete: 'C', '*': '×', x: '×', '/': '÷', ':': '÷', '-': '−', ',': '.' };
    const k = map[e.key] ?? (/^[\d.+^()%!]$/.test(e.key) ? e.key : null);
    if (!k) return;
    e.preventDefault();
    // לא מגיע לקיצורים של דף הטיוטה
    e.stopPropagation();
    press(k);
  };

  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - x, dy: e.clientY - y };
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    set({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy });
  };
  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ x, y }));
    } catch {
      /* לא חובה */
    }
  };

  const shown = s.error ? T('שגיאה') : s.result !== null ? s.result : s.expr || '0';
  return (
    <div
      ref={box}
      data-calc
      tabIndex={-1}
      onKeyDown={onKey}
      role="dialog"
      aria-label={sci ? T('מחשבון מדעי') : T('מחשבון')}
      className="fixed z-[56] flex select-none flex-col overflow-hidden rounded-2xl border-2 border-ink bg-[#fbfaf5] shadow-2xl outline-none [-webkit-touch-callout:none]"
      style={s.y === null ? { left: x, bottom: Math.min(68, Math.max(vh - H, 0)), width: W } : { left: x, top: y, width: W }}
    >
      <div onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="flex cursor-grab touch-none items-center gap-1 bg-ink py-1 ps-3 pe-1 text-white active:cursor-grabbing">
        <span aria-hidden="true">🧮</span>
        <strong className="me-auto truncate text-[15px]">
          {sci ? T('מחשבון מדעי') : T('מחשבון')}
          {s.min && (s.result ?? s.expr) && <span dir="ltr" className="ms-2 font-normal text-[#c9cfdb]">{show(s.result ?? s.expr)}</span>}
        </strong>
        <button type="button" onClick={() => set({ min: !s.min })} aria-label={s.min ? T('הגדלה') : T('מזעור')} title={s.min ? T('הגדלה') : T('מזעור')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d={s.min ? 'M5 15l7-7 7 7' : 'M5 12h14'} />
          </svg>
        </button>
        <button type="button" onClick={() => set({ open: false })} aria-label={T('סגירה')} title={T('סגירה')} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      {!s.min && (
        <div className="flex flex-col gap-2 p-2.5">
          {/* המסך של המחשבון נכתב משמאל לימין, כמו במחשבון אמיתי */}
          <div dir="ltr" className="flex min-h-[78px] flex-col items-end justify-end rounded-xl bg-white px-3 py-1.5 ring-1 ring-line" aria-live="polite">
            <span dir="ltr" className="min-h-5 max-w-full truncate text-[13px] text-muted [unicode-bidi:isolate]">{s.result !== null ? show(s.last) : sci ? (s.deg ? 'DEG' : 'RAD') : ''}</span>
            <span className={`max-w-full break-all text-end font-display font-semibold leading-tight ${shown.length > 14 ? 'text-xl' : 'text-[28px]'} ${s.error ? 'text-[#c92a2a]' : ''}`}>{s.error ? shown : show(shown)}</span>
            <span className="min-h-5 text-[15px] text-muted">{preview && preview !== s.expr ? `= ${show(preview)}` : ''}</span>
          </div>
          {sci && (
            <div dir="ltr" className="grid grid-cols-5 gap-1.5">
              <Key k="2nd" label="2nd" kind={s.second ? 'on' : 'fn'} />
              <Key k="deg" label={s.deg ? 'DEG' : 'RAD'} kind="fn" aria={T('מעלות או רדיאנים')} />
              <Key k="π" kind="fn" />
              <Key k="e" kind="fn" />
              <Key k="!" label="n!" kind="fn" />
              {s.second ? (
                <>
                  <Key k="sin⁻¹" kind="fn" />
                  <Key k="cos⁻¹" kind="fn" />
                  <Key k="tan⁻¹" kind="fn" />
                  <Key k="eˣ" kind="fn" />
                  <Key k="10ˣ" kind="fn" />
                </>
              ) : (
                <>
                  <Key k="sin" kind="fn" />
                  <Key k="cos" kind="fn" />
                  <Key k="tan" kind="fn" />
                  <Key k="ln" kind="fn" />
                  <Key k="log" kind="fn" />
                </>
              )}
              <Key k="(" kind="fn" />
              <Key k=")" kind="fn" />
              <Key k="²" label="x²" kind="fn" />
              <Key k="^" label="xʸ" kind="fn" />
              <Key k="√" kind="fn" />
            </div>
          )}
          <div dir="ltr" className="grid grid-cols-4 gap-1.5">
            {!sci && (
              <>
                <Key k="(" kind="fn" />
                <Key k=")" kind="fn" />
                <Key k="²" label="x²" kind="fn" />
                <Key k="√" kind="fn" />
              </>
            )}
            <Key k="C" kind="op" aria={T('ניקוי')} />
            <Key k="⌫" kind="op" aria={T('מחיקה')} />
            <Key k="%" kind="op" />
            <Key k="÷" kind="op" />
            {['7', '8', '9'].map((d) => (
              <Key key={d} k={d} />
            ))}
            <Key k="×" kind="op" />
            {['4', '5', '6'].map((d) => (
              <Key key={d} k={d} />
            ))}
            <Key k="−" kind="op" />
            {['1', '2', '3'].map((d) => (
              <Key key={d} k={d} />
            ))}
            <Key k="+" kind="op" />
            <Key k="±" kind="op" aria={T('החלפת סימן')} />
            <Key k="0" />
            <Key k="." label={dot} />
            <Key k="=" kind="eq" />
          </div>
        </div>
      )}
    </div>
  );
}
