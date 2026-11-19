import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { getLocale, LOCALES, T } from '../i18n';
import { profileColor, setLanguage, type Profile } from '../lib/store';

/** משתנה CSS עם צבע המסלול, לשימוש ב-.tint ובמחלקות שמבוססות על --tc */
export const tc = (color: string): CSSProperties => ({ ['--tc' as string]: color });

const TICK_SHAPE =
  'M2.5 12.4C4.5 10.9 6.9 12.7 9 15.2C11.9 9.5 15.6 5.1 20.2 2.1C21.7 1.2 23.1 2.9 21.9 4.1C17.7 8 13.9 13.3 11.3 20C10.6 21.7 8.4 21.9 7.4 20.4C6 18.2 4.3 15.8 2.7 14.6C1.9 14 1.8 13 2.5 12.4Z';
/** קו האמצע של הסימן, בכיוון שבו כותבים אותו: למטה ואז למעלה */
const TICK_STROKE = 'M2.6 13.4C5 13 7.2 15.6 9.2 19.4C12.4 11.8 16.4 6.4 21.2 2.9';

/**
 * סימן ✔ מצויר, כמו סימון של מורה על תשובה נכונה.
 * עם draw הוא נכתב כמו בעט: קו קצר למטה ומשיכה מהירה למעלה.
 */
export function Tick({ size = 26, color = 'currentColor', draw = false }: { size?: number; color?: string; draw?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ transform: 'rotate(-6deg)', overflow: 'visible' }}>
      {draw && (
        <mask id={id} maskUnits="userSpaceOnUse" x="-2" y="-2" width="28" height="28">
          <path className="tick-pen" d={TICK_STROKE} pathLength={1} fill="none" stroke="white" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      )}
      <path d={TICK_SHAPE} fill={color} mask={draw ? `url(#${id})` : undefined} />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="#/" className="flex shrink-0 items-center gap-2.5 py-2.5 font-display text-[22px] font-semibold text-white no-underline">
      <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-sun text-ink">
        <Tick />
      </span>
      {T('מתמטי-קל')}
    </a>
  );
}

export function PencilIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="shrink-0">
      <path d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.4l7-.9z" fill="currentColor" />
    </svg>
  );
}

/** עיגול פרופיל: האות הראשונה של השם על צבע הפרופיל */
export function Avatar({ profile, size = 48 }: { profile: Profile; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-white"
      style={{ width: size, height: size, background: profileColor(profile), fontSize: size * 0.46 }}
    >
      {profile.name.trim().charAt(0)}
    </span>
  );
}

/** מספר שלב בעיגול בצבע המסלול */
export function StepNum({ n, color, size = 34 }: { n: number; color: string; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-display font-semibold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.53 }}>
      {n}
    </span>
  );
}

/** מתג מקטעים בסגנון אחיד */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  small,
}: {
  items: { id: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  small?: boolean;
}) {
  return (
    <div role="group" aria-label={T(label)} className="flex w-full gap-1 rounded-[24px] bg-sand p-1 sm:w-auto">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={value === it.id}
          onClick={() => onChange(it.id)}
          className={`flex-1 rounded-[20px] px-2.5 leading-tight sm:flex-none ${small ? 'min-h-9 text-[15px] sm:px-4' : 'min-h-11 text-base sm:px-5'} ${value === it.id ? 'bg-white font-bold shadow-sm' : 'font-semibold text-muted hover:text-ink'}`}
        >
          {typeof it.label === 'string' ? T(it.label) : it.label}
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton({ color, children, onClick, href }: { color: string; children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = 'inline-block rounded-full px-8 py-3.5 font-display text-[19px] font-semibold text-white no-underline shadow-md hover:brightness-110';
  return href ? (
    <a href={href} className={cls} style={{ background: color }}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} style={{ background: color }}>
      {children}
    </button>
  );
}

/* ---------- בחירת שפה: מהכותרת, מכל מסך ---------- */

export function LanguageSwitch({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = getLocale();
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={T('שפה')}
        className="flex min-h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[15px] font-semibold text-white hover:bg-white/25"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9M12 3C9.5 5.5 8.2 8.5 8.2 12s1.3 6.5 3.8 9" />
        </svg>
        <span lang={cur.code}>{cur.name}</span>
      </button>
      {open && (
        <ul role="listbox" aria-label={T('שפה')} className="absolute end-0 top-full z-50 mt-2 grid max-h-[70vh] w-56 overflow-y-auto rounded-2xl bg-white p-1.5 text-ink shadow-xl">
          {LOCALES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === cur.code}
                lang={l.code}
                dir={l.dir}
                onClick={() => {
                  setOpen(false);
                  setLanguage(l.code);
                }}
                className={`flex min-h-10 w-full items-center rounded-xl px-3 text-start text-[16px] ${l.code === cur.code ? 'bg-ink font-semibold text-white' : 'hover:bg-sand'}`}
              >
                {l.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
