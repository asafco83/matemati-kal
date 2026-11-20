import { SearchButton } from './Search';
import { useEffect, useRef, useState } from 'react';
import { tracks } from '../content';
import { useAuth } from '../lib/cloud';
import { gradeTopics, hasUnits, inGrade, isSoon, setGrade, setMode, setUnits, trackTopics, useNav, type AnyTopic, type GradeFilter, type Route, type UnitsFilter } from '../lib/nav';
import { UNITS } from '../lib/types';
import { activeProfile, selectProfile, stars, totals, useStore } from '../lib/store';
import { GRADE_NAMES, gradeName } from '../lib/types';
import { LanguageSwitch, Logo, StarIcon } from './ui';
import { T } from '../i18n';

const gname = (g: GradeFilter) => (g === 'all' ? T('כל הכיתות') : T`כיתה ${gradeName(g)}`);

/** האדר בשתי שורות: מסלולים (או כיתות) למעלה, הנושאים מתחת */
export function Header({ route }: { route: Route }) {
  const state = useStore();
  const nav = useNav();
  const auth = useAuth();
  const profile = activeProfile(state)!;
  const currentTrack = route.name === 'topic' ? route.topic.track : route.name === 'track' ? route.id : null;
  const currentTopic = route.name === 'topic' ? route.topic.id : null;
  const track = tracks.find((t) => t.id === currentTrack);

  /** כשהמסלולים לא נכנסים בשורה, החיפוש והשפה מצטמצמים לסמל בלבד */
  const [compact, setCompact] = useState(false);
  const [showSoon, setShowSoon] = useState(false);
  useEffect(() => setShowSoon(false), [nav.mode, nav.grade, currentTrack]);
  /** נושאים מוכנים קודם, ונושאים שבהכנה מתקפלים לכפתור אחד */
  const pills = (list: AnyTopic[], dotOf?: (t: AnyTopic) => string | undefined) => {
    const ready = list.filter((t) => !isSoon(t));
    const soon = list.filter((t) => isSoon(t));
    return (
      <>
        {ready.map((t) => pill(t, dotOf?.(t)))}
        {soon.length > 0 &&
          (showSoon ? (
            soon.map((t) => pill(t, dotOf?.(t)))
          ) : (
            <button
              type="button"
              onClick={() => setShowSoon(true)}
              className="min-h-9 shrink-0 whitespace-nowrap rounded-full border border-dashed border-white/70 px-3.5 text-[15px] text-white hover:bg-white/10"
            >
              {T`ועוד ${soon.length} בהכנה`}
            </button>
          ))}
      </>
    );
  };

  const pill = (t: AnyTopic, dot?: string) => {
    const d = dot ? <span className="h-2.5 w-2.5 shrink-0 rounded-full ring-[1.5px] ring-white" style={{ background: dot }} /> : null;
    if (isSoon(t))
      return (
        <span key={t.id} className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-white/70 px-3.5 py-1.5 text-[15px] text-white">
          {d}
          {T(t.title)} · {T('בקרוב')}
        </span>
      );
    const active = t.id === currentTopic;
    const n = stars(state, t.id);
    return (
      <a
        key={t.id}
        href={`#/topic/${t.id}`}
        aria-current={active ? 'page' : undefined}
        className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-[15px] no-underline ${active ? 'bg-white font-bold' : 'bg-white/20 font-semibold text-white hover:bg-white/30'}`}
        style={active ? { color: track?.color ?? '#1d2433' } : undefined}
      >
        {d}
        {T(t.title)}
        {n > 0 && (
          <span className="flex">
            {Array.from({ length: n }, (_, i) => (
              <StarIcon key={i} />
            ))}
          </span>
        )}
      </a>
    );
  };

  let row2: React.ReactNode;
  let row2bg = '#33405e';
  if (nav.mode === 'grade') {
    const list = gradeTopics(nav.grade);
    row2 = (
      <>
        <span className="shrink-0 text-sm font-semibold text-white">
          {gname(nav.grade)}
          {nav.grade === profile.grade && ` · ${T`הכיתה של ${profile.name}`}`}
        </span>
        {hasUnits(nav.grade) && <UnitsSwitch own={profile.units} />}
        {pills(list, (t) => tracks.find((tr) => tr.id === t.track)?.color)}
      </>
    );
  } else if (track) {
    row2bg = track.color;
    const all = trackTopics(track.id);
    const shown = all.filter((t) => inGrade(t, nav.grade) || t.id === currentTopic);
    const hidden = all.length - shown.length;
    row2 = (
      <>
        <GradeMenu own={profile.grade} ownUnits={profile.units} />
        <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-white/55" />
        {pills(shown)}
        {shown.length === 0 && <span className="text-[15px] text-white">{T`אין במסלול הזה נושאים ל${gname(nav.grade)}`}</span>}
        {hidden > 0 && (
          <button type="button" onClick={() => setGrade('all')} className="min-h-9 shrink-0 text-sm font-semibold text-white underline">
            {T`ועוד ${hidden} נושאים בכיתות אחרות`}
          </button>
        )}
      </>
    );
  } else {
    row2 = (
      <>
        <GradeMenu own={profile.grade} ownUnits={profile.units} />
        <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-white/55" />
        <span className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-white">{T('בחרו מסלול למעלה כדי לראות את הנושאים שלו')}</span>
      </>
    );
  }

  const t = totals(state);
  return (
    <>
      {/* רק השורה העליונה נצמדת למעלה; שורת הנושאים נגללת עם הדף כדי לא לתפוס חצי מסך */}
      <header className="sticky top-0 z-30 shadow-md">
        <div className="@container bg-ink text-white">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 px-4 sm:gap-x-4 sm:px-6">
            <div className="order-1 flex min-h-14 items-center">
              <Logo />
            </div>
            <span aria-hidden="true" className="order-3 h-0 basis-full @5xl:hidden" />
            <div className="order-4 @5xl:order-2">
              <ModeSwitch />
            </div>
            <Scroller label={nav.mode === 'grade' ? T('כיתות') : T('מסלולים')} className="order-5 @5xl:order-3" watch={`${nav.mode}|${nav.grade}|${currentTrack}`} onFit={setCompact} compact={compact}>
              {nav.mode === 'grade'
                ? GRADE_NAMES.slice(1).map((g, i) => {
                    const on = nav.grade === i + 1;
                    return (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setGrade(i + 1)}
                        className={`shrink-0 border-b-[3px] px-3 pb-3 pt-4 font-display text-[17px] ${on ? 'border-sun font-semibold text-white' : 'border-transparent font-medium text-[#c9cfdb] hover:text-white'}`}
                      >
                        {gradeName(i + 1)}
                      </button>
                    );
                  })
                : tracks.map((tr) => {
                    const on = tr.id === currentTrack;
                    const empty = !trackTopics(tr.id).some((x) => inGrade(x, nav.grade));
                    return (
                      <a
                        key={tr.id}
                        href={`#/track/${tr.id}`}
                        aria-current={on ? 'page' : undefined}
                        className={`shrink-0 whitespace-nowrap border-b-[3px] px-3 pb-3 pt-4 text-base no-underline ${on ? 'border-sun font-bold text-white' : `border-transparent font-medium hover:text-white ${empty ? 'text-dim' : 'text-[#c9cfdb]'}`}`}
                      >
                        {T(tr.short)}
                      </a>
                    );
                  })}
            </Scroller>
            <button
              type="button"
              onClick={() => selectProfile(null)}
              title={T('החלפת פרופיל')}
              className="order-2 ms-auto flex shrink-0 items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[15px] font-semibold text-white hover:bg-white/25 @5xl:order-4 @5xl:ms-0"
            >
              {profile.name}
              <span className="flex items-center gap-0.5 text-sun">
                <StarIcon />
                {t.stars}
              </span>
            </button>
            <SearchButton className="order-2 @5xl:order-4" compact={compact} />
            <LanguageSwitch className="order-2 @5xl:order-5" compact={compact} />
          </div>
        </div>
      </header>
      <div className="relative z-20 shadow-md" style={{ background: row2bg }}>
        <div className="hide-scrollbar mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 py-2.5 sm:flex-wrap sm:overflow-visible sm:px-6">{row2}</div>
      </div>
      {auth.error && <div className="bg-red-700 px-4 py-1 text-center text-sm text-white">{T(auth.error)}</div>}
    </>
  );
}

/** כמה רוחב מתפנה כשהחיפוש והשפה מצטמצמים לסמל. משמש כדי לא לקפוץ הלוך ושוב בין שני המצבים */
const LABELS_WIDTH = 240;

/**
 * שורת המסלולים (או הכיתות): נגללת לרוחב כשאין מקום, בגרירה או בחיצים.
 * מדווחת ב-onFit אם צריך לצמצם את הכפתורים שלידה כדי לפנות מקום.
 */
function Scroller({ label, className, watch, compact, onFit, children }: { label: string; className: string; watch: string; compact: boolean; onFit: (compact: boolean) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const [edge, setEdge] = useState({ start: false, end: false });
  const drag = useRef({ x: 0, left: 0, active: false, moved: false });
  const compactRef = useRef(compact);
  compactRef.current = compact;

  useEffect(() => {
    const el = ref.current!;
    const measure = () => {
      const content = [...el.children].reduce((w, c) => w + (c as HTMLElement).offsetWidth, 0);
      const free = el.clientWidth - content;
      if (!compactRef.current && free < 0) onFit(true);
      else if (compactRef.current && free > LABELS_WIDTH) onFit(false);
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft);
      setEdge({ start: pos > 2, end: pos < max - 2 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [watch, compact, onFit]);
  // הפריט הנבחר תמיד נראה
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"], [aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [watch]);

  const step = (toEnd: boolean) => {
    const el = ref.current!;
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.scrollBy({ left: (toEnd ? 1 : -1) * (rtl ? -1 : 1) * Math.max(el.clientWidth * 0.7, 120), behavior: 'smooth' });
  };
  const arrow = (toEnd: boolean) => (
    <button
      type="button"
      onClick={() => step(toEnd)}
      aria-label={toEnd ? T('הבא') : T('הקודם')}
      className={`absolute inset-y-0 z-10 flex w-10 items-center from-ink from-60% to-transparent text-white ${toEnd ? 'end-0 justify-end bg-linear-to-l rtl:bg-linear-to-r' : 'start-0 justify-start bg-linear-to-r rtl:bg-linear-to-l'}`}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={toEnd ? 'rtl:rotate-180' : 'rotate-180 rtl:rotate-0'}>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );

  return (
    <div className={`relative flex min-w-0 flex-1 basis-0 ${className}`}>
      {edge.start && arrow(false)}
      <nav
        ref={ref}
        aria-label={label}
        className="hide-scrollbar flex min-w-0 flex-1 overflow-x-auto"
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          drag.current = { x: e.clientX, left: ref.current!.scrollLeft, active: true, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d.active) return;
          if (Math.abs(e.clientX - d.x) > 5) d.moved = true;
          if (d.moved) ref.current!.scrollLeft = d.left - (e.clientX - d.x);
        }}
        onPointerUp={() => (drag.current.active = false)}
        onPointerLeave={() => (drag.current.active = false)}
        onClickCapture={(e) => {
          // גרירה היא לא לחיצה על מסלול
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        {children}
      </nav>
      {edge.end && arrow(true)}
    </div>
  );
}

function ModeSwitch() {
  const nav = useNav();
  return (
    <div role="group" aria-label={T('סידור הניווט')} className="flex shrink-0 gap-0.5 rounded-full bg-white/15 p-[3px]">
      {(
        [
          ['topics', T('לפי נושאים')],
          ['grade', T('לפי כיתה')],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={nav.mode === id}
          onClick={() => setMode(id)}
          className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] sm:px-3.5 sm:text-sm ${nav.mode === id ? 'bg-white font-bold text-ink' : 'font-semibold text-white'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** תפריט נפתח לבחירת הכיתה שלפיה מסננים */
/** בחירת יח"ל בתוך שורת הנושאים, במצב "לפי כיתה" */
function UnitsSwitch({ own }: { own?: number }) {
  const nav = useNav();
  return (
    <div role="group" aria-label={T('רמת לימוד')} className="flex shrink-0 items-center gap-0.5 rounded-full bg-white/15 p-0.5">
      {([...UNITS, 'all'] as UnitsFilter[]).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={nav.units === u}
          onClick={() => setUnits(u)}
          className={`min-h-8 rounded-full px-2.5 text-[13px] font-semibold ${nav.units === u ? 'bg-white text-ink' : 'text-white'} ${u === own && nav.units !== u ? 'underline' : ''}`}
        >
          {u === 'all' ? T('כל הרמות') : T`${u} יח"ל`}
        </button>
      ))}
    </div>
  );
}

function GradeMenu({ own, ownUnits }: { own: number; ownUnits?: number }) {
  const nav = useNav();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const pick = (g: GradeFilter) => {
    setGrade(g);
    setOpen(false);
  };

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex min-h-10 items-center gap-2 rounded-full bg-white px-3.5 text-[15px] font-bold text-ink"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
        {gname(nav.grade)}
        {hasUnits(nav.grade) && nav.units !== 'all' && ` · ${T`${nav.units} יח"ל`}`}
        {nav.grade === own && (!hasUnits(nav.grade) || nav.units === (ownUnits ?? 'all')) && ` · ${T('הכיתה שלי')}`}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
        </svg>
      </button>
      {open && (
        <div className="pop fixed inset-x-3 top-auto z-40 mt-2 flex flex-col gap-2 rounded-[14px] bg-white p-2.5 text-ink shadow-[0_8px_24px_rgba(29,36,51,0.28)] sm:absolute sm:inset-x-auto sm:start-0 sm:w-[264px]">
          <div className="grid grid-cols-6 gap-1">
            {GRADE_NAMES.slice(1).map((g, i) => {
              const v = i + 1;
              const on = nav.grade === v;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(v)}
                  className={`min-h-[34px] rounded-lg border-2 font-display text-[15px] ${v === own ? 'border-ink' : 'border-transparent'} ${on ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                >
                  {gradeName(v)}
                </button>
              );
            })}
          </div>
          {hasUnits(nav.grade) && (
            <div role="group" aria-label={T('רמת לימוד')} className="flex items-center gap-1">
              <span className="ms-1 me-1 text-[13px] font-semibold text-muted">{T('יח"ל')}</span>
              {([...UNITS, 'all'] as UnitsFilter[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  aria-pressed={nav.units === u}
                  onClick={() => setUnits(u)}
                  className={`min-h-[34px] flex-1 rounded-lg border-2 font-display text-[15px] ${u === ownUnits ? 'border-ink' : 'border-transparent'} ${nav.units === u ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                >
                  {u === 'all' ? T('הכול') : u}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                setUnits(ownUnits ? (ownUnits as UnitsFilter) : 'all');
                pick(own);
              }} className="min-h-[34px] flex-1 rounded-lg border-2 border-ink bg-white px-2 text-[13px] font-bold">
              {T('הכיתה שלי')} ({gradeName(own)}
              {ownUnits ? ` · ${T`${ownUnits} יח"ל`}` : ''})
            </button>
            <button
              type="button"
              aria-pressed={nav.grade === 'all'}
              onClick={() => pick('all')}
              className={`min-h-[34px] flex-1 rounded-lg px-2 text-[13px] font-semibold ${nav.grade === 'all' ? 'bg-ink text-white' : 'bg-sand'}`}
            >
              {T('כל הכיתות')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
