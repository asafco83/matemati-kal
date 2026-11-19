import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { topicById } from '../content';
import { clearBlocks, clearInk, closeSheet, openSheet, setTutorDialog, toggleHalf, useSheet, type Block, type Pt, type Shape } from '../lib/sheet';
import { activeProfile, useStore } from '../lib/store';
import { gradeName } from '../lib/types';
import { FigureView } from './FigureView';
import { StepView } from './StepView';
import { NotationContext, notationForGrade, Rich, Tex } from './Tex';
import { T } from '../i18n';

const INK = '#1d2433';
const COLORS: Record<string, string> = { ink: INK, red: '#c92a2a', blue: '#1c7ed6', green: '#2f9e44', orange: '#e8590c', purple: '#7c3aed' };
const col = (c: string | undefined, fallback = INK) => (c && COLORS[c]) || fallback;
const fillOf = (c: string | undefined) => (c && COLORS[c] ? `color-mix(in srgb, ${COLORS[c]} 18%, white)` : 'none');

/* ---------- שרטוט חופשי של המורה ---------- */

const U = 36; // פיקסלים למשבצת
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const pt = (p: unknown): Pt => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [0, 0]);

function DrawBlock({ b }: { b: Extract<Block, { type: 'draw' }> }) {
  const w = Math.min(Math.max(num(b.width, 12), 2), 24), h = Math.min(Math.max(num(b.height, 8), 2), 24);
  const [ox, oy] = b.origin ? pt(b.origin) : [0, 0];
  const X = (x: number) => (x + ox) * U, Y = (y: number) => (h - y - oy) * U;
  const shape = (s: Shape, i: number): ReactNode => {
    const stroke = col(s.color);
    const dash = 'dashed' in s && s.dashed ? '6 5' : undefined;
    switch (s.kind) {
      case 'line':
      case 'arrow': {
        const [x1, y1] = pt(s.from), [x2, y2] = pt(s.to);
        return (
          <g key={i}>
            <line x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dash} markerEnd={s.kind === 'arrow' ? `url(#arr-${s.color && COLORS[s.color] ? s.color : 'ink'})` : undefined} />
            {s.label && (
              <text x={X((x1 + x2) / 2)} y={Y((y1 + y2) / 2) - 9} textAnchor="middle" fontSize="15" fontWeight="600" fill={stroke}>
                {String(s.label)}
              </text>
            )}
          </g>
        );
      }
      case 'circle':
        return <circle key={i} cx={X(pt(s.center)[0])} cy={Y(pt(s.center)[1])} r={Math.abs(num(s.r, 1)) * U} stroke={stroke} strokeWidth="2.5" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} />;
      case 'rect': {
        const [x, y] = pt(s.at), [rw, rh] = pt(s.size);
        return <rect key={i} x={X(x)} y={Y(y + rh)} width={Math.abs(rw) * U} height={Math.abs(rh) * U} stroke={stroke} strokeWidth="2.5" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} />;
      }
      case 'polygon':
      case 'path': {
        const d = (Array.isArray(s.points) ? s.points : []).map(pt).map(([x, y]) => `${X(x)},${Y(y)}`).join(' ');
        return s.kind === 'polygon' ? <polygon key={i} points={d} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} /> : <polyline key={i} points={d} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} fill="none" />;
      }
      case 'point': {
        const [x, y] = pt(s.at);
        return (
          <g key={i}>
            <circle cx={X(x)} cy={Y(y)} r="4.5" fill={stroke} />
            {s.label && (
              <text x={X(x) + 9} y={Y(y) - 9} fontSize="15" fontWeight="600" fill={stroke}>
                {String(s.label)}
              </text>
            )}
          </g>
        );
      }
      case 'text': {
        const [x, y] = pt(s.at);
        return (
          <text key={i} x={X(x)} y={Y(y)} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(Math.max(num(s.size, 16), 10), 40)} fontWeight="600" fill={stroke} style={{ unicodeBidi: 'plaintext' }}>
            {String(s.text ?? '')}
          </text>
        );
      }
      default:
        return null;
    }
  };
  return (
    <figure className="flex flex-col items-start gap-2">
      <svg viewBox={`0 0 ${w * U} ${h * U}`} className="w-full rounded-lg border border-line bg-white" style={{ maxWidth: w * U }} role="img" aria-label={b.caption ?? T('שרטוט')} fontFamily="Fredoka, Arial, sans-serif">
        <defs>
          {Object.entries(COLORS).map(([name, c]) => (
            <marker key={name} id={`arr-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {b.grid !== false && (
          <g stroke="#dfe6f1" strokeWidth="1">
            {Array.from({ length: w + 1 }, (_, i) => <line key={`v${i}`} x1={i * U} y1="0" x2={i * U} y2={h * U} />)}
            {Array.from({ length: h + 1 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * U} x2={w * U} y2={i * U} />)}
          </g>
        )}
        {b.axes && (
          <g stroke={INK} strokeWidth="1.8">
            <line x1="0" y1={Y(0)} x2={w * U} y2={Y(0)} markerEnd="url(#arr-ink)" />
            <line x1={X(0)} y1={h * U} x2={X(0)} y2="0" markerEnd="url(#arr-ink)" />
          </g>
        )}
        {(Array.isArray(b.shapes) ? b.shapes : []).slice(0, 200).map(shape)}
      </svg>
      {b.caption && (
        <figcaption className="text-base text-muted">
          <Rich text={String(b.caption)} />
        </figcaption>
      )}
    </figure>
  );
}

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

function InkLayer({ tool, color, strokes, bump }: { tool: Tool; color: string; strokes: { current: Stroke[] }; bump: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cur = useRef<Stroke | null>(null);
  const penSeen = useRef(false);

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
  const eraseAt = (x: number, y: number) => {
    const before = strokes.current.length;
    strokes.current = strokes.current.filter((s) => !s.pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < 16 ** 2));
    if (strokes.current.length !== before) redraw();
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === 'pen') penSeen.current = true;
    // כשכותבים בעט, כף היד שנוגעת במסך לא משאירה סימנים
    if (e.pointerType === 'touch' && penSeen.current) return;
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pos(e);
    if (tool === 'erase') {
      cur.current = { color: '', w: 0, pts: [] };
      eraseAt(p[0], p[1]);
      return;
    }
    cur.current = { color, w: 3, pts: [p] };
    strokes.current.push(cur.current);
    redraw();
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!cur.current) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const p = pos(ev);
      if (tool === 'erase') eraseAt(p[0], p[1]);
      else cur.current.pts.push(p);
    }
    if (tool !== 'erase') redraw();
  };
  const up = () => {
    cur.current = null;
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

/* ---------- הדף ---------- */

const PEN_COLORS = [INK, '#1c7ed6', '#c92a2a', '#2f9e44'];

function ToolBtn({ on, onClick, label, children }: { on?: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label} title={label} className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-bold ${on ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-sand'}`}>
      {children}
    </button>
  );
}

export function Sheet() {
  const s = useSheet();
  const profile = activeProfile(useStore());
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(INK);
  const [extra, setExtra] = useState(0);
  const [bump, setBump] = useState(0);
  const strokes = useRef<Stroke[]>([]);

  useEffect(() => {
    strokes.current = [];
    setExtra(0);
    setBump((b) => b + 1);
  }, [s.inkKey]);
  useEffect(() => {
    document.documentElement.classList.toggle('sheet-half', s.open && s.half);
    return () => document.documentElement.classList.remove('sheet-half');
  }, [s.open, s.half]);

  if (!profile) return null;
  if (!s.open)
    return (
      <>
        <div className="fixed bottom-3 left-3 z-40 flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => setTutorDialog(true)} className="flex h-11 items-center gap-2 rounded-full bg-ink px-4 font-display text-[15px] font-semibold text-white shadow-lg">
            <span aria-hidden="true">🎓</span>
            {T('מורה פרטי AI')}
          </button>
          <button type="button" onClick={openSheet} className="flex h-11 items-center gap-2 rounded-full bg-white px-4 font-display text-[15px] font-semibold text-ink shadow-lg ring-2 ring-ink">
            <span aria-hidden="true">✏️</span>
            {T('דף טיוטה')}
          </button>
        </div>
        {s.tutorDialog && <TutorDialog />}
      </>
    );

  const undo = () => {
    strokes.current.pop();
    setBump((b) => b + 1);
  };

  return (
    <aside className={`sheet fixed inset-y-0 left-0 z-50 flex flex-col bg-[#fbfaf5] shadow-2xl ${s.half ? 'w-full lg:w-1/2 lg:border-r-2 lg:border-ink' : 'w-full'}`} aria-label={T('דף טיוטה')}>
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-ink bg-sand px-3 py-2">
        <strong className="me-auto font-display text-lg">{s.title ? <Rich text={s.title} /> : T('דף טיוטה')}</strong>
        <ToolBtn on={tool === 'pen'} onClick={() => setTool('pen')} label={T('עט')}>
          ✏️
        </ToolBtn>
        {PEN_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={T('צבע')}
            aria-pressed={tool === 'pen' && color === c}
            onClick={() => {
              setColor(c);
              setTool('pen');
            }}
            className="h-9 w-9 rounded-full border-2 border-white"
            style={{ background: c, boxShadow: tool === 'pen' && color === c ? `0 0 0 3px ${INK}` : `0 0 0 1px #c9c4b6` }}
          />
        ))}
        <ToolBtn on={tool === 'erase'} onClick={() => setTool('erase')} label={T('מחק')}>
          {T('מחק')}
        </ToolBtn>
        <ToolBtn on={tool === 'scroll'} onClick={() => setTool('scroll')} label={T('גלילה')}>
          ✋
        </ToolBtn>
        <ToolBtn onClick={undo} label={T('ביטול הקו האחרון')}>
          ↶
        </ToolBtn>
        <ToolBtn onClick={clearInk} label={T('דף חדש')}>
          {T('דף חדש')}
        </ToolBtn>
        <span className="hidden lg:inline-flex">
          <ToolBtn onClick={toggleHalf} label={s.half ? T('מסך מלא') : T('חצי מסך')}>
            {s.half ? '⤢' : '◧'}
          </ToolBtn>
        </span>
        <ToolBtn onClick={closeSheet} label={T('סגירה')}>
          ✕
        </ToolBtn>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="sheet-paper relative" style={{ minHeight: `calc(100% + ${extra * 600}px)` }}>
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
                  {s.question.figure && (
                    <div className="mt-2 max-w-[300px]">
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
                    <button type="button" onClick={clearBlocks} className="relative z-10 ms-auto min-h-9 underline">
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
          <InkLayer tool={tool} color={color} strokes={strokes} bump={bump} />
        </div>
        <div className="flex justify-center p-3">
          <button type="button" onClick={() => setExtra((e) => Math.min(e + 1, 8))} className="min-h-11 rounded-full bg-sand px-5 font-semibold">
            {T('עוד מקום לכתיבה')}
          </button>
        </div>
      </div>
    </aside>
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-3 sm:items-center" onClick={() => setTutorDialog(false)}>
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
