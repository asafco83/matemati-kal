import { useState } from 'react';
import { signIn, signOutUser, useAuth } from '../lib/cloud';
import { go } from '../lib/nav';
import { addProfile, deleteProfile, PROFILE_COLORS, selectProfile, totals, useStore } from '../lib/store';
import { GRADE_NAMES } from '../lib/types';
import { Avatar, CheckIcon, Logo, StarIcon, StepNum } from './ui';

function BareHeader({ end }: { end?: React.ReactNode }) {
  return (
    <header className="bg-ink">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex-1" />
        {end}
      </div>
    </header>
  );
}

function AuthCorner() {
  const auth = useAuth();
  if (!auth.configured || !auth.ready) return null;
  return auth.user ? (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-[#c9cfdb] sm:inline">מחובר: {auth.user.name}</span>
      <button type="button" onClick={signOutUser} className="min-h-10 rounded-full border border-[#c9cfdb] px-4 text-[15px] font-semibold text-white">
        התנתקות
      </button>
    </div>
  ) : (
    <button type="button" onClick={signIn} className="min-h-10 rounded-full bg-white px-4 text-[15px] font-bold text-ink">
      התחברות
    </button>
  );
}

/* ---------- ברוכים הבאים ---------- */

const STEPS = [
  ['לומדים', 'הסבר קצר וברור, עם שרטוטים ושיטת עבודה.', '#db2777'],
  ['דוגמאות פתורות', 'פתרון שנחשף צעד אחר צעד.', '#059669'],
  ['מתרגלים', 'שלוש רמות, רמז כשנתקעים ופתרון מלא לכל שאלה.', '#4f46e5'],
] as const;

function Frac({ n, d }: { n: number; d: number }) {
  return (
    <span className="inline-flex flex-col items-center leading-[1.15]">
      <span className="border-b-2 border-current px-1.5">{n}</span>
      <span>{d}</span>
    </span>
  );
}

export function Welcome() {
  const auth = useAuth();
  const pink = '#db2777';
  return (
    <>
      <BareHeader />
      <main className="mx-auto flex max-w-[1040px] flex-col gap-5 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <section className="card flex flex-wrap items-center gap-x-14 gap-y-10 sm:p-10">
          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-7">
            <div>
              <h1 className="font-display text-[44px] font-semibold leading-tight sm:text-[52px]">מתמטי-קל</h1>
              <p className="mt-2 text-[22px] leading-normal">
                מתמטיקה <span className="marker">מאפס לאינסוף</span>, מכיתה א' ועד י"ב, בקצב שלכם.
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {STEPS.map(([t, d, c], i) => (
                <li key={t} className="flex items-start gap-3.5">
                  <StepNum n={i + 1} color={c} />
                  <span className="flex flex-col">
                    <span className="font-display text-xl font-semibold">{t}</span>
                    <span className="text-[17px] text-muted">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div aria-hidden="true" className="flex min-w-[260px] flex-[0_1_380px] flex-col gap-4 rounded-2xl border-t-4 bg-white p-6 shadow-[0_1px_3px_rgba(29,36,51,0.12)]" style={{ borderColor: pink }}>
            <p className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: pink }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: pink }} />
              שברים ואחוזים · תרגול
            </p>
            <div dir="ltr" className="flex items-center justify-center gap-3 font-display text-[32px] font-medium">
              <Frac n={2} d={7} />+<Frac n={3} d={7} />=
              <span className="rounded-md bg-marker px-2 py-1">
                <Frac n={5} d={7} />
              </span>
            </div>
            <p className="tint flex items-center gap-2 self-center rounded-full px-4 py-2 font-display text-lg font-semibold" style={{ ['--tc' as string]: pink, color: pink }}>
              <CheckIcon size={20} />
              נכון מאוד!
            </p>
          </div>
        </section>
        <section className="card flex flex-wrap items-center gap-x-12 gap-y-6 sm:px-10 sm:py-8">
          <div className="flex flex-[1_1_360px] flex-col gap-1.5">
            <h2 className="font-display text-[26px] font-semibold">מתחילים</h2>
            <p className="text-[17px] leading-relaxed text-muted">
              חשבון אחד למשפחה, עם פרופיל נפרד לכל ילד.
              {auth.configured && ' מתחברים עם חשבון Google של ההורה, ולילדים לא צריך אימייל.'}
            </p>
          </div>
          <div className="flex flex-[0_1_340px] flex-col gap-2.5">
            {auth.configured && (
              <>
                <button type="button" onClick={signIn} className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-ink font-display text-[19px] font-semibold text-white">
                  התחברות עם Google
                </button>
                <p className="text-center text-sm text-muted">ההתקדמות נשמרת, ואפשר להמשיך מכל מכשיר.</p>
              </>
            )}
            <a href="#/new-profile" className="mt-1.5 flex min-h-12 items-center justify-center rounded-full bg-sand text-[17px] font-semibold text-ink no-underline">
              {auth.configured ? 'להמשיך בלי חשבון' : 'יוצאים לדרך'}
            </a>
            {auth.configured && <p className="text-center text-sm text-muted">ההתקדמות תישמר רק במכשיר הזה.</p>}
          </div>
        </section>
      </main>
    </>
  );
}

/* ---------- מי לומד עכשיו? ---------- */

export function ProfileList() {
  const state = useStore();
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <>
      <BareHeader end={<AuthCorner />} />
      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-9 sm:px-6">
        <section className="card sm:p-8">
          <h1 className="font-display text-4xl font-semibold">מי לומד עכשיו?</h1>
          <p className="mb-5 mt-1 text-lg text-muted">בחרו פרופיל כדי להמשיך מאיפה שעצרתם.</p>
          <ul className="flex flex-col gap-2.5">
            {state.profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button type="button" onClick={() => selectProfile(p.id)} className="flex min-h-16 flex-1 items-center gap-3.5 rounded-[14px] bg-[#f6f4ee] px-3.5 py-2 text-start hover:bg-sand">
                  <Avatar profile={p} />
                  <span className="flex flex-1 flex-col">
                    <span className="font-display text-xl font-semibold">{p.name}</span>
                    <span className="text-[15px] text-muted">כיתה {GRADE_NAMES[p.grade]}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#b7791f]">
                    <StarIcon />
                    <span className="text-ink">{totals(state, p.id).stars}</span>
                  </span>
                </button>
                {confirm === p.id ? (
                  <button type="button" onClick={() => deleteProfile(p.id)} className="min-h-11 rounded-full bg-red-700 px-3 text-sm font-bold text-white">
                    למחוק?
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirm(p.id)} aria-label={`מחיקת הפרופיל של ${p.name}`} className="grid h-11 w-11 place-items-center rounded-full text-xl text-muted hover:text-red-700">
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <a href="#/new-profile" className="mt-5 inline-flex min-h-11 items-center font-display text-lg font-semibold text-ink">
            + פרופיל חדש
          </a>
        </section>
      </main>
    </>
  );
}

/* ---------- פרופיל חדש ---------- */

export function NewProfile() {
  const state = useStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState(1);
  const [grade, setGrade] = useState(4);
  const initial = name.trim().charAt(0) || '?';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(name.trim(), color, grade);
    go('#/');
  };

  return (
    <>
      <BareHeader
        end={
          state.profiles.length > 0 && (
            <a href="#/" className="text-[15px] font-semibold text-white">
              → חזרה לרשימת הפרופילים
            </a>
          )
        }
      />
      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-9 sm:px-6">
        <form onSubmit={submit} className="card flex flex-col gap-7 sm:p-8">
          <div>
            <h1 className="font-display text-[40px] font-semibold">פרופיל חדש</h1>
            <p className="mt-1 text-[19px] text-muted">כמה פרטים קטנים, ומתחילים ללמוד.</p>
          </div>
          <div>
            <label htmlFor="pname" className="mb-2 block font-display text-xl font-semibold">
              איך קוראים לך?
            </label>
            <input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus className="h-14 w-full max-w-[360px] rounded-[14px] border-2 border-ink bg-white px-4 text-xl" />
          </div>
          <fieldset>
            <legend className="font-display text-xl font-semibold">בחרו צבע לפרופיל שלך</legend>
            <p className="mb-2.5 text-[15px] text-muted">כך נזהה אותך ברשימת הפרופילים.</p>
            <div className="flex flex-wrap gap-3">
              {PROFILE_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`צבע ${i + 1}`}
                  aria-pressed={color === i}
                  onClick={() => setColor(i)}
                  className="grid h-12 w-12 place-items-center rounded-full font-display text-[22px] font-semibold text-white"
                  style={{ background: c, boxShadow: color === i ? '0 0 0 3px #fff, 0 0 0 6px #1d2433' : undefined }}
                >
                  {initial}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-display text-xl font-semibold">באיזו כיתה?</legend>
            <div className="flex flex-wrap gap-2">
              {GRADE_NAMES.slice(1).map((g, i) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grade === i + 1}
                  onClick={() => setGrade(i + 1)}
                  className={`min-h-12 min-w-12 rounded-[14px] px-3 font-display text-lg ${grade === i + 1 ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[15px] text-muted">לפי הכיתה נבחר אילו נושאים להציג קודם. תמיד אפשר לעבור לכיתות אחרות.</p>
          </fieldset>
          <div>
            <button type="submit" disabled={!name.trim()} className="rounded-full bg-ink px-10 py-4 font-display text-xl font-semibold text-white disabled:bg-[#9a978e]">
              יוצאים לדרך ←
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
