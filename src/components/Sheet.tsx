import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { topicById } from '../content';
import { clearBlocks, closeSheet, openSheet, setTutorDialog, sheetContext, toggleHalf, useSheet, type Block } from '../lib/sheet';
import { activeProfile, useStore } from '../lib/store';
import { gradeName } from '../lib/types';
import { DrawBlock } from './Draw';
import { FigureView } from './FigureView';
import { StepView } from './StepView';
import { NotationContext, notationForGrade, Rich, Tex } from './Tex';
import { T } from '../i18n';

const INK = '#1d2433';

/** בלוק פגום (למשל שרטוט עם שדות חסרים) לא מפיל את האפליקציה */
class Safe extends Component<{ children: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() {
    return { bad: true };
  }
  render() {
    return this.state.bad ? <p className="text-sm text-muted">{T('לא ניתן להציג את החלק הזה.')}</p> : this.props.children;
  }
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'title':
      return <h3 className="font-display text-2xl font-semibold">{<Rich text={String(block.text)} />}</h3>;
    case 'text':
      return (
        <p className="text-lg leading-relaxed">
          <Rich text={String(block.text)} />
        </p>
      );
    case 'math':
      return (
        <div dir="ltr" className="overflow-x-auto text-xl">
          <Tex tex={String(block.tex)} display />
        </div>
      );
    case 'steps':
      return (
        <ol className="flex flex-col gap-3 text-lg">
          {(Array.isArray(block.steps) ? block.steps : []).map((s, i) => (
            <li key={i}>
              <StepView step={s} color="#c92a2a" />
            </li>
          ))}
        </ol>
      );
    case 'figure':
      return <StepView step={{ figure: block.figure, caption: block.caption }} color={INK} />;
    case 'draw':
      return <DrawBlock b={block} />;
  }
}

/* ---------- כתיבה ביד ---------- */

type Stroke = { color: string; w: number; pts: [number, number, number][] };
type Tool = 'pen' | 'erase' | 'scroll';

function InkLayer({ tool, color, strokes, bump, onBefore, onCancel }: { tool: Tool; color: string; strokes: { current: Stroke[] }; bump: number; /** נקרא לפני כל שינוי, כדי לשמור מצב ל"ביטול" */ onBefore: () => void; /** מבטל את השמירה האחרונה, כשקו שהתחיל התברר כגלילה בשתי אצבעות */ onCancel: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cur = useRef<Stroke | null>(null);
  const penSeen = useRef(false);
  /** האצבע או העט שמציירים עכשיו. מצביעים אחרים לא מוסיפים נקודות לאותו קו */
  const drawId = useRef<number | null>(null);
  /** אצבעות שנוגעות במסך. שתיים ומעלה: גוללים את הדף במקום לצייר */
  const touches = useRef(new Map<number, number>());
  const panY = useRef<number | null>(null);
  const meanY = () => [...touches.current.values()].reduce((a, b) => a + b, 0) / touches.current.size;

  const redraw = () => {
    const c = ref.current;
    if (!c) return;
    const g = c.getContext('2d')!;
    const dpr = c.width / Math.max(c.clientWidth, 1);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, c.clientWidth, c.clientHeight);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const s of strokes.current) {
      g.strokeStyle = s.color;
      g.fillStyle = s.color;
      if (s.pts.length === 1) {
        g.beginPath();
        g.arc(s.pts[0][0], s.pts[0][1], s.w / 2, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      for (let i = 1; i < s.pts.length; i++) {
        const [x0, y0] = s.pts[i - 1], [x1, y1, p] = s.pts[i];
        g.lineWidth = s.w * (0.55 + p);
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();
      }
    }
  };

  // גודל הקנבס עוקב אחרי גודל הדף
  useEffect(() => {
    const c = ref.current!;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
      redraw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);
  useEffect(redraw, [bump]);

  const pos = (e: PointerEvent | React.PointerEvent): [number, number, number] => {
    const r = ref.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top, e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5];
  };
  const erased = useRef(false);
  const eraseAt = (x: number, y: number) => {
    const left = strokes.current.filter((s) => !s.pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 16 ** 2));
    if (left.length === strokes.current.length) return;
    // כל תנועת מחיקה היא צעד אחד ב"ביטול"
    if (!erased.current) onBefore();
    erased.current = true;
    strokes.current = left;
    redraw();
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, e.clientY);
      if (touches.current.size >= 2) {
        // אצבע שנייה: מה שהאצבע הראשונה התחילה לצייר מתבטל, ומכאן גוללים
        if (cur.current && drawId.current !== null && tool !== 'erase') {
          strokes.current = strokes.current.filter((s) => s !== cur.current);
          onCancel();
          redraw();
        }
        cur.current = null;
        drawId.current = null;
        panY.current = meanY();
        return;
      }
      // כשכותבים בעט, כף היד שנוגעת במסך לא משאירה סימנים
      if (penSeen.current) return;
    }
    if (e.button !== 0 || drawId.current !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawId.current = e.pointerId;
    const p = pos(e);
    if (tool === 'erase') {
      erased.current = false;
      cur.current = { color: '', w: 0, pts: [] };
      eraseAt(p[0], p[1]);
      return;
    }
    onBefore();
    cur.current = { color, w: 3, pts: [p] };
    strokes.current = [...strokes.current, cur.current];
    redraw();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'touch' && touches.current.has(e.pointerId)) {
      touches.current.set(e.pointerId, e.clientY);
      if (touches.current.size >= 2 && panY.current !== null) {
        const y = meanY();
        ref.current?.closest('.overflow-y-auto')?.scrollBy(0, panY.current - y);
        panY.current = y;
        return;
      }
    }
    if (!cur.current || e.pointerId !== drawId.current) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = pos(ev);
      if (tool === 'erase') eraseAt(p[0], p[1]);
      else cur.current.pts.push(p);
    }
    if (tool !== 'erase') redraw();
  };
  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    touches.current.delete(e.pointerId);
    panY.current = touches.current.size >= 2 ? meanY() : null;
    if (e.pointerId === drawId.current) {
      cur.current = null;
      drawId.current = null;
    }
  };

  return (
    <canvas
      ref={ref}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: 'none', pointerEvents: tool === 'scroll' ? 'none' : 'auto', cursor: tool === 'erase' ? 'cell' : 'crosshair' }}
    />
  );
}

/**
 * עוזר AI שמפעיל את הדפדפן (כמו Claude in Chrome) קיים רק בדפדפני מחשב.
 * בטלפונים ובטאבלטים אין תוספים כאלה, ולכן שם לא מציגים את "מורה פרטי AI".
 */
function browserAssistantDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (nav.userAgentData?.mobile) return false;
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(nav.userAgent)) return false;
  // iPad מציג את עצמו כ-Mac, אבל יש לו מסך מגע
  if (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1) return false;
  return true;
}

/* ---------- הדף ---------- */

const PEN_COLORS = [INK, '#1c7ed6', '#c92a2a', '#2f9e44'];

/** Ctrl במחשב, ⌘ במק ובאייפד */
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl+';

function ToolBtn({ on, onClick, label, disabled, kbd, children }: { on?: boolean; onClick: () => void; label: string; disabled?: boolean; /** קיצור מקלדת, מוצג ברמז */ kbd?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={on} aria-label={label} aria-keyshortcuts={kbd} title={kbd ? `${label} (${kbd})` : label} className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-bold disabled:opacity-40 ${on ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-[#f3efe4]'}`}>
      {children}
    </button>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** שם הקובץ: תלמיד - נושא - רמה */
function sheetFileName(student: string) {
  const { topicId, level, tab } = sheetContext();
  const topic = topicId ? topicById(topicId) : undefined;
  const parts = [student, topic ? T(topic.title) : T('דף טיוטה'), topic && tab === 'practice' && level ? T(topic.levels[level - 1]) : ''];
  return (
    parts
      .map((p) => p.replace(/\$/g, '').replace(/[\\/:*?"<>|]/g, '').trim())
      .filter(Boolean)
      .join(' - ') + '.png'
  );
}

/** שומר את הדף (התרגיל, ההסברים והכתיבה ביד) כתמונה: שיתוף במכשירי מגע, הורדה במחשב */
async function saveSheetImage(el: HTMLElement, name: string) {
  let blob: Blob | null = null;
  try {
    const { toBlob } = await import('html-to-image');
    const opts = { backgroundColor: '#fbfaf5', pixelRatio: el.offsetHeight > 3000 ? 1 : 2, filter: (n: HTMLElement) => !(n instanceof HTMLElement && 'noexport' in n.dataset) };
    // ב-Safari הציור הראשון יוצא לפעמים בלי גופנים ותמונות, ולכן מציירים פעמיים
    if (/AppleWebKit/.test(navigator.userAgent) && !/Chrome\//.test(navigator.userAgent)) await toBlob(el, opts).catch(() => null);
    blob = await toBlob(el, opts);
  } catch {
    blob = null;
  }
  if (!blob) {
    // גיבוי: רק הכתיבה ביד, על רקע הדף
    const ink = el.querySelector('canvas');
    if (!ink) return;
    const c = document.createElement('canvas');
    c.width = ink.width;
    c.height = ink.height;
    const g = c.getContext('2d')!;
    g.fillStyle = '#fbfaf5';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(ink, 0, 0);
    blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
    if (!blob) return;
  }
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.maxTouchPoints > 0 && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name.replace(/\.png$/, '') });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function Sheet() {
  const s = useSheet();
  const profile = activeProfile(useStore());
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(INK);
  const [extra, setExtra] = useState(0);
  const [showFig, setShowFig] = useState(true);
  const [bump, setBump] = useState(0);
  const strokes = useRef<Stroke[]>([]);
  /** מצבים קודמים של הכתיבה, ל"ביטול". גם "דף חדש" הוא צעד שאפשר לבטל */
  const history = useRef<Stroke[][]>([]);
  const paper = useRef<HTMLDivElement>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  /** מצבים שבוטלו, ל"ביצוע מחדש". פעולה חדשה מוחקת אותם */
  const future = useRef<Stroke[][]>([]);
  const [canRedo, setCanRedo] = useState(false);
  const remember = () => {
    history.current = [...history.current.slice(-59), strokes.current];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  };

  const forget = () => {
    history.current.pop();
    setCanUndo(history.current.length > 0);
  };

  /** הפעולות של הסרגל, לקיצורי המקלדת. מתעדכן בכל ציור של הרכיב */
  const keys = useRef<Record<string, () => void>>({});
  const confirmRef = useRef(confirmNew);
  confirmRef.current = confirmNew;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  useEffect(() => {
    if (!s.open) return;
    /** כלי שהיה לפני שהחזיקו רווח (גלילה זמנית) */
    let beforeSpace: Tool | null = null;
    const down = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      // חלון אחר פתוח מעל הדף (חיפוש, מורה פרטי): לא מפריעים לו
      if (!confirmRef.current && document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const mod = e.ctrlKey || e.metaKey;
      // לפי מיקום המקש ולא לפי האות, כדי שיעבוד גם במקלדת בעברית
      const k = e.code;
      let act: string | null = null;
      if (mod && k === 'KeyA') act = 'none';
      else if (mod && k === 'KeyZ') act = e.shiftKey ? 'redo' : 'undo';
      else if (mod && k === 'KeyY') act = 'redo';
      else if (mod && k === 'KeyS') act = 'save';
      else if (mod || e.altKey) return;
      else if (confirmRef.current) act = k === 'Escape' ? 'cancelNew' : k === 'Enter' ? 'confirmNew' : null;
      else if (k === 'KeyP') act = 'pen';
      else if (k === 'KeyE') act = 'erase';
      else if (k === 'KeyH') act = 'scroll';
      else if (k === 'KeyN') act = 'new';
      else if (/^Digit[1-4]$/.test(k)) act = `color${k.slice(5)}`;
      else if (k === 'Space') {
        if (!e.repeat && beforeSpace === null) {
          beforeSpace = toolRef.current;
          keys.current.scroll();
        }
        e.preventDefault();
        return;
      }
      if (!act) return;
      e.preventDefault();
      keys.current[act]?.();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space' && beforeSpace !== null) {
        keys.current[beforeSpace]?.();
        beforeSpace = null;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [s.open]);

  useEffect(() => {
    strokes.current = [];
    history.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
    setConfirmNew(false);
    setExtra(0);
    setShowFig(true);
    setBump((b) => b + 1);
  }, [s.inkKey]);
  useEffect(() => {
    document.documentElement.classList.toggle('sheet-half', s.open && s.half);
    return () => document.documentElement.classList.remove('sheet-half');
  }, [s.open, s.half]);

  if (!profile) return null;
  /** הכפתורים הצפים. "מורה פרטי AI" נשאר גם מעל דף הטיוטה הפתוח */
  const floating = (
    <div className="fixed bottom-3 left-3 z-[55] flex flex-wrap gap-2 print:hidden">
      {!s.open && (
        <button type="button" onClick={openSheet} className="flex h-11 items-center gap-2 rounded-full bg-white px-4 font-display text-[15px] font-semibold text-ink shadow-lg ring-2 ring-ink">
          <span aria-hidden="true">✏️</span>
          {T('דף טיוטה')}
        </button>
      )}
      {browserAssistantDevice() && (
        <button type="button" onClick={() => setTutorDialog(true)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 font-display text-[15px] font-semibold text-white shadow-lg">
          <span aria-hidden="true">🎓</span>
          {T('מורה פרטי AI')}
        </button>
      )}
    </div>
  );
  if (!s.open)
    return (
      <>
        {floating}
        {s.tutorDialog && <TutorDialog />}
      </>
    );

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(strokes.current);
    strokes.current = prev;
    setCanUndo(history.current.length > 0);
    setCanRedo(true);
    setBump((b) => b + 1);
  };
  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(strokes.current);
    strokes.current = next;
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
    setBump((b) => b + 1);
  };
  const newSheet = () => {
    setConfirmNew(false);
    if (!strokes.current.length) return;
    remember();
    strokes.current = [];
    setBump((b) => b + 1);
  };
  const save = async () => {
    if (!paper.current || saving) return;
    setSaving(true);
    try {
      await saveSheetImage(paper.current, sheetFileName(profile.name));
    } finally {
      setSaving(false);
    }
  };
  const sep = <span aria-hidden="true" className="mx-1 h-8 w-px bg-[#c9c4b6]" />;
  const askNew = () => (strokes.current.length ? setConfirmNew(true) : newSheet());
  keys.current = {
    none: () => {},
    undo,
    redo,
    save: () => void save(),
    pen: () => setTool('pen'),
    erase: () => setTool('erase'),
    scroll: () => setTool('scroll'),
    new: askNew,
    cancelNew: () => setConfirmNew(false),
    confirmNew: newSheet,
    ...Object.fromEntries(
      PEN_COLORS.map((c, i) => [
        `color${i + 1}`,
        () => {
          setColor(c);
          setTool('pen');
        },
      ]),
    ),
  };

  return (
    <>
    {floating}
    <aside className={`sheet fixed inset-y-0 left-0 z-50 flex select-none flex-col bg-[#fbfaf5] shadow-2xl [-webkit-touch-callout:none] ${s.half ? 'w-full lg:w-1/2 lg:border-r-2 lg:border-ink' : 'w-full'}`} aria-label={T('דף טיוטה')}>
      <div className="@container border-b-2 border-ink bg-sand">
      <div className="flex flex-col-reverse items-center gap-x-2 gap-y-2 px-3 py-2 @min-[820px]:flex-row @min-[820px]:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={T('צבע')}
              title={`${T('צבע')} (${PEN_COLORS.indexOf(c) + 1})`}
              aria-keyshortcuts={String(PEN_COLORS.indexOf(c) + 1)}
              aria-pressed={tool === 'pen' && color === c}
              onClick={() => {
                setColor(c);
                setTool('pen');
              }}
              className="h-10 w-10 rounded-full border-[3px] border-white"
              style={{ background: c, boxShadow: tool === 'pen' && color === c ? `0 0 0 3px ${INK}` : `0 0 0 1px #c9c4b6` }}
            />
          ))}
          {sep}
          <ToolBtn on={tool === 'pen'} onClick={() => setTool('pen')} label={T('עט')} kbd="P">
            <Icon d="M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5 4 20zM14.5 6l3 3" />
          </ToolBtn>
          <ToolBtn on={tool === 'erase'} onClick={() => setTool('erase')} label={T('מחק')} kbd="E">
            <Icon d="M20 20H10l-5.6-5.6a2 2 0 0 1 0-2.8l7.2-7.2a2 2 0 0 1 2.8 0l5.2 5.2a2 2 0 0 1 0 2.8L12 20M8.5 8.5l7 7" />
          </ToolBtn>
          <ToolBtn on={tool === 'scroll'} onClick={() => setTool('scroll')} label={T('גלילה')} kbd="H">
            <Icon d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V12m0-2.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.9-2.6L4.4 14a1.6 1.6 0 0 1 2.5-2L8 13" />
          </ToolBtn>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ToolBtn onClick={undo} disabled={!canUndo} label={T('ביטול הפעולה האחרונה')} kbd={`${MOD}Z`}>
            <Icon d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
          </ToolBtn>
          <ToolBtn onClick={redo} disabled={!canRedo} label={T('ביצוע מחדש')} kbd={`${MOD}Shift+Z`}>
            <Icon d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
          </ToolBtn>
          <ToolBtn onClick={askNew} label={T('דף חדש')} kbd="N">
            {T('דף חדש')}
          </ToolBtn>
          <ToolBtn onClick={save} disabled={saving} label={T('שמירה כתמונה')} kbd={`${MOD}S`}>
            <Icon d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
          </ToolBtn>
          <span className="hidden lg:inline-flex">
            <ToolBtn onClick={toggleHalf} label={s.half ? T('מסך מלא') : T('חצי מסך')}>
              <Icon d={s.half ? 'M14 10l6-6m0 0h-5m5 0v5M10 14l-6 6m0 0h5m-5 0v-5' : 'M20 4l-6 6m0 0h5m-5 0V5M4 20l6-6m0 0H5m5 0v5'} />
            </ToolBtn>
          </span>
          <ToolBtn onClick={closeSheet} label={T('סגירה')}>
            <Icon d="M6 6l12 12M18 6 6 18" />
          </ToolBtn>
        </div>
      </div>
      </div>
      {confirmNew && (
        <div className="absolute inset-0 z-20 flex items-start justify-center bg-ink/40 p-4 pt-24" onClick={() => setConfirmNew(false)}>
          <div role="alertdialog" aria-modal="true" aria-label={T('דף חדש')} className="card flex w-full max-w-[420px] flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <p className="font-display text-xl font-semibold">{T('לפתוח דף חדש?')}</p>
            <p className="text-lg">{T('כל מה שכתבתם על הדף יימחק. אפשר להחזיר אותו בכפתור הביטול.')}</p>
            <div className="flex gap-2">
              <button type="button" onClick={newSheet} className="min-h-12 flex-1 rounded-full bg-ink px-4 font-display text-lg font-semibold text-white">
                {T('דף חדש')}
              </button>
              <button type="button" onClick={() => setConfirmNew(false)} className="min-h-12 flex-1 rounded-full bg-sand px-4 font-display text-lg font-semibold">
                {T('להשאיר')}
              </button>
            </div>
          </div>
        </div>
      )}
      {s.tutorDialog && <TutorDialog />}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div ref={paper} className="sheet-paper relative" style={{ minHeight: `calc(100% - 68px + ${extra * 600}px)` }}>
          <NotationContext.Provider value={notationForGrade(profile.grade)}>
            <div className="flex flex-col gap-5 p-5 sm:p-7">
              {s.question && (
                <section className="rounded-2xl border-2 border-ink bg-white/85 p-4">
                  <p className="text-sm font-semibold text-muted">{T('התרגיל')}</p>
                  <p className="mt-1 font-display text-xl font-semibold leading-relaxed">
                    <Rich text={s.question.text} />
                  </p>
                  {s.question.latex && (
                    <div className="q-latex mt-2 overflow-x-auto">
                      <Tex tex={s.question.latex} display />
                    </div>
                  )}
                </section>
              )}
              {s.question?.figure && (
                <section className="rounded-2xl border-2 border-ink bg-white/85 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-muted">
                    {T('השרטוט')}
                    {/* מעל שכבת הכתיבה, כדי שאפשר יהיה ללחוץ עליו גם במצב עט */}
                    <button type="button" data-noexport onClick={() => setShowFig((v) => !v)} aria-expanded={showFig} className="relative z-10 ms-auto min-h-9 rounded-full bg-sand px-3 font-semibold text-ink">
                      {showFig ? T('הסתרת השרטוט') : T('הצגת השרטוט')}
                    </button>
                  </p>
                  {showFig && (
                    <div className="sheet-figure mx-auto mt-2 max-w-[520px]">
                      <FigureView fig={s.question.figure} />
                    </div>
                  )}
                </section>
              )}
              {s.blocks.length > 0 && (
                <section className="flex flex-col gap-4 rounded-2xl border-2 border-dashed border-[#c92a2a] bg-white/85 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#c92a2a]">
                    <span aria-hidden="true">🎓</span>
                    {T('המורה הפרטי')}
                    {s.title && (
                      <strong className="text-ink">
                        <Rich text={s.title} />
                      </strong>
                    )}
                    <button type="button" data-noexport onClick={clearBlocks} className="relative z-10 ms-auto min-h-9 underline">
                      {T('ניקוי')}
                    </button>
                  </p>
                  {s.blocks.map(({ id, block }) => (
                    <Safe key={id}>
                      <BlockView block={block} />
                    </Safe>
                  ))}
                </section>
              )}
            </div>
          </NotationContext.Provider>
          <InkLayer tool={tool} color={color} strokes={strokes} bump={bump} onBefore={remember} onCancel={forget} />
        </div>
        <div className="flex justify-center p-3">
          <button type="button" onClick={() => setExtra((e) => Math.min(e + 1, 8))} className="min-h-11 rounded-full bg-sand px-5 font-semibold">
            {T('עוד מקום לכתיבה')}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

/* ---------- חלון "מורה פרטי AI" ---------- */

const TUTOR_URL = 'https://matemati-kal.web.app/tutor.md';

function TutorDialog() {
  const s = useSheet();
  const profile = activeProfile(useStore())!;
  const topicId = location.hash.match(/^#\/topic\/([\w-]+)/)?.[1];
  const topic = topicId ? topicById(topicId) : undefined;
  const ideas = topic
    ? [T`למדו אותי את הנושא "${T(topic.title)}"`, T`קשה לי להבין את הנושא "${T(topic.title)}"`, T('עזרו לי להבין את התרגיל שאני פותר עכשיו, בלי לגלות לי את התשובה')]
    : [T('למדו אותי חיבור של שברים'), T('קשה לי להבין חזקות'), T('איך ניגשים לפתרון של בעיות מילוליות?')];
  const [ask, setAsk] = useState(ideas[0]);
  const [copied, setCopied] = useState(false);
  const prompt = [
    T('אתם המורה הפרטי שלי למתמטיקה באתר "מתמטי-קל", שפתוח אצלי בדפדפן.'),
    T`לפני שמתחילים, קראו את ההוראות למורה בכתובת ${TUTOR_URL} ופעלו לפיהן.`,
    T`אני בכיתה ${gradeName(profile.grade)}.`,
    T('חשוב: אל תגלו לי תשובות לתרגילים ואל תפתרו במקומי. הסבירו, שאלו שאלות מכוונות ותנו רמזים, עד שאפתור בעצמי.'),
    T`הבקשה שלי: ${ask}`,
  ].join('\n');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  if (!s.tutorDialog) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-3 sm:items-center" onClick={() => setTutorDialog(false)}>
      <div role="dialog" aria-modal="true" aria-label={T('מורה פרטי AI')} className="card flex max-h-[92vh] w-full max-w-[620px] flex-col gap-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <h2 className="me-auto font-display text-[28px] font-semibold">🎓 {T('מורה פרטי AI')}</h2>
          <button type="button" onClick={() => setTutorDialog(false)} aria-label={T('סגירה')} className="h-11 w-11 rounded-full bg-sand text-lg font-bold">
            ✕
          </button>
        </div>
        <p className="text-lg leading-relaxed">{T('המורה הפרטי הוא עוזר AI שפועל בדפדפן שלכם (למשל Claude בדפדפן Chrome). הוא רואה את האתר יחד איתכם, מסביר, שואל שאלות מכוונות ומשרטט על דף הטיוטה. הוא לא פותר במקומכם: את התשובה מוצאים לבד.')}</p>
        <ol className="flex list-decimal flex-col gap-1 ps-6 text-lg">
          <li>{T('כתבו או בחרו מה תרצו ללמוד.')}</li>
          <li>{T('העתיקו את ההודעה.')}</li>
          <li>{T('פתחו את עוזר ה-AI בדפדפן, והדביקו לו את ההודעה.')}</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          {ideas.map((i) => (
            <button key={i} type="button" onClick={() => setAsk(i)} className={`rounded-full border-2 px-3 py-1.5 text-start text-[15px] font-semibold ${ask === i ? 'border-ink bg-sand' : 'border-line'}`}>
              {i}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 font-semibold">
          {T('מה תרצו ללמוד?')}
          <input value={ask} onChange={(e) => setAsk(e.target.value)} className="h-12 rounded-xl border-2 border-ink bg-white px-3 text-lg font-normal" />
        </label>
        <pre className="whitespace-pre-wrap rounded-xl bg-sand p-3 font-sans text-[15px] leading-relaxed">{prompt}</pre>
        <button type="button" onClick={copy} className="min-h-12 rounded-full bg-ink px-6 font-display text-lg font-semibold text-white">
          {copied ? T('ההודעה הועתקה ✓') : T('העתקת ההודעה')}
        </button>
        <p className="text-base text-muted">{T('אפשר להשתמש בכל עוזר AI. עוזר שלא מפעיל את הדפדפן יוכל להסביר בשיחה, אבל לא יראה את האתר ולא ישרטט על דף הטיוטה.')}</p>
      </div>
    </div>
  );
}
