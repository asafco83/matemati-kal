import { useId, type CSSProperties, type ReactNode } from 'react';
import { profileColor, type Profile } from '../lib/store';

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
      מתמטי-קל
    </a>
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
    <div role="group" aria-label={label} className="flex w-full gap-1 rounded-[24px] bg-sand p-1 sm:w-auto">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={value === it.id}
          onClick={() => onChange(it.id)}
          className={`flex-1 rounded-[20px] px-2.5 leading-tight sm:flex-none ${small ? 'min-h-9 text-[15px] sm:px-4' : 'min-h-11 text-base sm:px-5'} ${value === it.id ? 'bg-white font-bold shadow-sm' : 'font-semibold text-muted hover:text-ink'}`}
        >
          {it.label}
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
