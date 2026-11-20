import { useEffect, useState } from 'react';
import { signIn, signOutUser, useAuth } from '../lib/cloud';
import { go, setGrade as setNavGrade, setUnits as setNavUnits } from '../lib/nav';
import { addProfile, deleteProfile, PROFILE_COLORS, profileColor, selectProfile, totals, updateProfile, useStore, type Profile } from '../lib/store';
import { GRADE_NAMES, gradeName, UNITS, type Units } from '../lib/types';
import { Avatar, LanguageSwitch, Logo, PencilIcon, StarIcon, StepNum, Tick } from './ui';
import { LOCALES, N, T } from '../i18n';
import { topics } from '../content';
import { browserAssistantDevice } from '../lib/device';

function BareHeader({ end }: { end?: React.ReactNode }) {
  return (
    <header className="bg-ink">
      <div className="mx-auto flex max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex-1" />
        <LanguageSwitch />
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
      <span className="hidden text-sm text-[#c9cfdb] sm:inline">{T`מחובר: ${auth.user.name}`}</span>
      <button type="button" onClick={signOutUser} className="min-h-10 rounded-full border border-[#c9cfdb] px-4 text-[15px] font-semibold text-white">
        {T('התנתקות')}
      </button>
    </div>
  ) : (
    <button type="button" onClick={signIn} className="min-h-10 rounded-full bg-white px-4 text-[15px] font-bold text-ink">
      {T('התחברות')}
    </button>
  );
}

/* ---------- ברוכים הבאים ---------- */

const STEPS = [
  [N('לומדים'), N('הסבר קצר וברור, עם שרטוטים ושיטת עבודה.'), '#db2777'],
  [N('דוגמאות פתורות'), N('פתרון שנחשף צעד אחר צעד.'), '#059669'],
  [N('מתרגלים'), N('שלוש רמות, רמז כשנתקעים ופתרון מלא לכל שאלה.'), '#4f46e5'],
] as const;

function Frac({ n, d }: { n: number; d: number }) {
  return (
    <span className="inline-flex flex-col items-center leading-[1.15]">
      <span className="border-b-2 border-current px-1.5">{n}</span>
      <span>{d}</span>
    </span>
  );
}

/** מה יש באפליקציה: מספרים אמיתיים, שמחושבים מהתוכן עצמו */
function Highlights() {
  const facts: [string, string][] = [
    [String(topics.length), T('נושאים, מכיתה א\' ועד י"ב')],
    [String(topics.length * 3), T('רמות תרגול, מקל למאתגר')],
    ['∞', T('שאלות: כל תרגיל נוצר מחדש, עם פתרון מלא')],
    [String(LOCALES.length), T('שפות, עם תרגום לכל הסבר')],
  ];
  const tutor = browserAssistantDevice();
  const features: [string, string, string][] = [
    ['📘', T('כמו במחברת'), T('כל תרגיל כתוב כמו שכותבים בכיתה: שברים כשברים, תרגילים במאונך שלב אחר שלב, והפעולה ליד השורה.')],
    ['✏️', T('דף טיוטה'), T('פותחים דף משבצות מעל התרגיל ומחשבים ביד, באצבע, בעט או בעכבר. אפשר לשמור אותו כתמונה.')],
    ['🧮', T('מחשבון רק כשמותר'), T('מחשבון פשוט או מדעי מופיע רק בנושאים שבהם מותר להשתמש בו בבית הספר.')],
    ['🎓', T('מורה פרטי AI'), tutor ? T('עוזר AI בדפדפן מסביר, שואל שאלות מכוונות ומשרטט על דף הטיוטה, אבל לא פותר במקומכם.') : T('במחשב: עוזר AI בדפדפן מסביר, שואל שאלות מכוונות ומשרטט על דף הטיוטה, אבל לא פותר במקומכם.')],
    ['⭐', T('התקדמות לכל ילד'), T('פרופיל נפרד לכל ילד, כוכבים על כל רמה, והמלצה מה ללמוד עכשיו.')],
    ['🎯', T('לפי תוכנית הלימודים'), T('הנושאים מסודרים לפי כיתה ולפי תוכנית משרד החינוך, ובתיכון גם לפי 3, 4 או 5 יח"ל.')],
  ];
  return (
    <section className="card flex flex-col gap-7 sm:p-10">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map(([n, label]) => (
          <li key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-[#f6f4ee] px-3 py-4 text-center">
            <span className="font-display text-[40px] font-semibold leading-none">{n}</span>
            <span className="text-[15px] leading-snug text-muted">{label}</span>
          </li>
        ))}
      </ul>
      <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(([icon, title, text]) => (
          <li key={title} className="flex items-start gap-3">
            <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sand text-[22px]">
              {icon}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-xl font-semibold">{title}</span>
              <span className="text-[16px] leading-relaxed text-muted">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
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
              <h1 className="font-display text-[44px] font-semibold leading-tight sm:text-[52px]">{T('מתמטי-קל')}</h1>
              <p className="mt-2 text-[22px] leading-normal">
                {T('מתמטיקה')} <span className="marker">{T('מאפס לאינסוף')}</span>{T(', מכיתה א\' ועד י"ב, בקצב שלכם.')}
              </p>
            </div>
            <ol className="flex flex-col gap-4">
              {STEPS.map(([t, d, c], i) => (
                <li key={t} className="flex items-start gap-3.5">
                  <StepNum n={i + 1} color={c} />
                  <span className="flex flex-col">
                    <span className="font-display text-xl font-semibold">{T(t)}</span>
                    <span className="text-[17px] text-muted">{T(d)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div aria-hidden="true" className="flex min-w-[260px] flex-[0_1_380px] flex-col gap-4 rounded-2xl border-t-4 bg-white p-6 shadow-[0_1px_3px_rgba(29,36,51,0.12)]" style={{ borderColor: pink }}>
            <p className="flex items-center gap-2 text-[15px] font-semibold" style={{ color: pink }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: pink }} />
              {T('שברים ואחוזים · תרגול')}
            </p>
            <div dir="ltr" className="flex items-center justify-center gap-3 font-display text-[32px] font-medium">
              <Frac n={2} d={7} />+<Frac n={3} d={7} />=
              <span className="rounded-md bg-marker px-2 py-1">
                <Frac n={5} d={7} />
              </span>
            </div>
            <p className="tint flex items-center gap-2 self-center rounded-full px-4 py-2 font-display text-lg font-semibold" style={{ ['--tc' as string]: pink, color: pink }}>
              <Tick size={24} />
              {T('נכון מאוד!')}
            </p>
          </div>
        </section>
        <Highlights />
        <section className="card flex flex-wrap items-center gap-x-12 gap-y-6 sm:px-10 sm:py-8">
          <div className="flex flex-[1_1_360px] flex-col gap-1.5">
            <h2 className="font-display text-[26px] font-semibold">{T('מתחילים')}</h2>
            <p className="text-[17px] leading-relaxed text-muted">
              {T('חשבון אחד למשפחה, עם פרופיל נפרד לכל ילד.')}
              {auth.configured && ` ${T('מתחברים עם חשבון Google של ההורה, ולילדים לא צריך אימייל.')}`}
            </p>
          </div>
          <div className="flex flex-[0_1_340px] flex-col gap-2.5">
            {auth.configured && (
              <>
                <button type="button" onClick={signIn} className="flex min-h-14 items-center justify-center gap-3 rounded-full bg-ink font-display text-[19px] font-semibold text-white">
                  {T('התחברות עם Google')}
                </button>
                <p className="text-center text-sm text-muted">{T('ההתקדמות נשמרת, ואפשר להמשיך מכל מכשיר.')}</p>
              </>
            )}
            <a href="#/new-profile" className="mt-1.5 flex min-h-12 items-center justify-center rounded-full bg-sand text-[17px] font-semibold text-ink no-underline">
              {auth.configured ? T('להמשיך בלי חשבון') : T('יוצאים לדרך')}
            </a>
            {auth.configured && <p className="text-center text-sm text-muted">{T('ההתקדמות תישמר רק במכשיר הזה.')}</p>}
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
          <h1 className="font-display text-4xl font-semibold">{T('מי לומד עכשיו?')}</h1>
          <p className="mb-5 mt-1 text-lg text-muted">{T('בחרו פרופיל כדי להמשיך מאיפה שעצרתם.')}</p>
          <ul className="flex flex-col gap-2.5">
            {state.profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button type="button" onClick={() => selectProfile(p.id)} className="flex min-h-16 flex-1 items-center gap-3.5 rounded-[14px] bg-[#f6f4ee] px-3.5 py-2 text-start hover:bg-sand">
                  <Avatar profile={p} />
                  <span className="flex flex-1 flex-col">
                    <span className="font-display text-xl font-semibold">{p.name}</span>
                    <span className="text-[15px] text-muted">
                      {T`כיתה ${gradeName(p.grade)}`}
                      {p.grade >= 10 && p.units ? ` · ${T`${p.units} יח"ל`}` : ''}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-[#b7791f]">
                    <StarIcon />
                    <span className="text-ink">{totals(state, p.id).stars}</span>
                  </span>
                </button>
                <a href={`#/edit-profile/${p.id}`} aria-label={T`עריכת הפרופיל של ${p.name}`} title={T('עריכה')} className="grid h-11 w-11 place-items-center rounded-full text-muted no-underline hover:text-ink">
                  <PencilIcon />
                </a>
                {confirm === p.id ? (
                  <button type="button" onClick={() => deleteProfile(p.id)} className="min-h-11 rounded-full bg-red-700 px-3 text-sm font-bold text-white">
                    {T('למחוק?')}
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirm(p.id)} aria-label={T`מחיקת הפרופיל של ${p.name}`} className="grid h-11 w-11 place-items-center rounded-full text-xl text-muted hover:text-red-700">
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <a href="#/new-profile" className="mt-5 inline-flex min-h-11 items-center font-display text-lg font-semibold text-ink">
            {T('+ פרופיל חדש')}
          </a>
        </section>
      </main>
    </>
  );
}

/* ---------- פרופיל חדש ---------- */

export function NewProfile() {
  return <ProfileForm />;
}

/* ---------- עריכת פרופיל: שם, צבע, כיתה ויח"ל. ההתקדמות נשמרת ---------- */

export function EditProfile({ id }: { id: string }) {
  const state = useStore();
  const profile = state.profiles.find((p) => p.id === id);
  useEffect(() => {
    if (!profile) go('#/');
  }, [profile]);
  return profile ? <ProfileForm edit={profile} /> : null;
}

function ProfileForm({ edit }: { edit?: Profile }) {
  const state = useStore();
  const [name, setName] = useState(edit?.name ?? '');
  const [color, setColor] = useState(edit ? PROFILE_COLORS.indexOf(profileColor(edit)) : 1);
  const [grade, setGrade] = useState(edit?.grade ?? 4);
  const [units, setUnits] = useState<Units>(edit?.units ?? 4);
  const [lang, setLang] = useState<string>(edit?.lang ?? 'he');
  const initial = name.trim().charAt(0) || '?';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (edit) {
      updateProfile(edit.id, { name: name.trim(), color, grade, units: grade >= 10 ? units : undefined, lang: lang === 'he' ? undefined : lang });
      // אם זה הפרופיל הפעיל, התפריט עובר לכיתה החדשה
      if (state.activeId === edit.id) {
        setNavGrade(grade);
        setNavUnits(grade >= 10 ? units : 'all');
      }
    } else addProfile(name.trim(), color, grade, units, lang);
    go('#/');
  };

  return (
    <>
      <BareHeader
        end={
          state.profiles.length > 0 && (
            <a href="#/" className="text-[15px] font-semibold text-white">
              → {edit && state.activeId === edit.id ? T('חזרה') : T('חזרה לרשימת הפרופילים')}
            </a>
          )
        }
      />
      <main className="mx-auto max-w-[640px] px-4 pb-16 pt-9 sm:px-6">
        <form onSubmit={submit} className="card flex flex-col gap-7 sm:p-8">
          <div>
            <h1 className="font-display text-[40px] font-semibold">{edit ? T('עריכת פרופיל') : T('פרופיל חדש')}</h1>
            <p className="mt-1 text-[19px] text-muted">{edit ? T('אפשר לתקן את השם או לעבור כיתה. הכוכבים וההתקדמות נשמרים.') : T('כמה פרטים קטנים, ומתחילים ללמוד.')}</p>
          </div>
          <div>
            <label htmlFor="pname" className="mb-2 block font-display text-xl font-semibold">
              {edit ? T('שם') : T('איך קוראים לך?')}
            </label>
            <input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus={!edit} className="h-14 w-full max-w-[360px] rounded-[14px] border-2 border-ink bg-white px-4 text-xl" />
          </div>
          <fieldset>
            <legend className="font-display text-xl font-semibold">{T('בחרו צבע לפרופיל שלך')}</legend>
            <p className="mb-2.5 text-[15px] text-muted">{T('כך נזהה אותך ברשימת הפרופילים.')}</p>
            <div className="flex flex-wrap gap-3">
              {PROFILE_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  aria-label={T(`צבע ${i + 1}`)}
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
            <legend className="mb-2 font-display text-xl font-semibold">{T('באיזו כיתה?')}</legend>
            <div className="flex flex-wrap gap-2">
              {GRADE_NAMES.slice(1).map((g, i) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grade === i + 1}
                  onClick={() => setGrade(i + 1)}
                  className={`min-h-12 min-w-12 rounded-[14px] px-3 font-display text-lg ${grade === i + 1 ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                >
                  {gradeName(i + 1)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[15px] text-muted">{T('לפי הכיתה נבחר אילו נושאים להציג קודם. תמיד אפשר לעבור לכיתות אחרות.')}</p>
          </fieldset>
          {grade >= 10 && (
            <fieldset>
              <legend className="mb-2 font-display text-xl font-semibold">{T('כמה יחידות לימוד?')}</legend>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={units === u}
                    onClick={() => setUnits(u)}
                    className={`min-h-12 rounded-[14px] px-5 font-display text-lg ${units === u ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                  >
                    {T`${u} יח"ל`}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[15px] text-muted">{T('לפי תוכנית הלימודים, בכל רמה לומדים נושאים קצת אחרים. גם את זה אפשר לשנות בתפריט הכיתות.')}</p>
            </fieldset>
          )}
          <fieldset>
            <legend className="mb-2 font-display text-xl font-semibold">{T('שפה')}</legend>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  dir={l.dir}
                  aria-pressed={lang === l.code}
                  onClick={() => setLang(l.code)}
                  className={`min-h-12 rounded-[14px] px-4 text-lg ${lang === l.code ? 'bg-ink font-semibold text-white' : 'bg-sand font-medium'}`}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[15px] text-muted">{T('השיעורים, התרגילים והפתרונות יוצגו בשפה הזו. אפשר להחליף שפה בכל רגע מהכותרת.')}</p>
          </fieldset>
          <div>
            <button type="submit" disabled={!name.trim()} className="rounded-full bg-ink px-10 py-4 font-display text-xl font-semibold text-white disabled:bg-[#9a978e]">
              {edit ? T('שמירה') : T('יוצאים לדרך ←')}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
