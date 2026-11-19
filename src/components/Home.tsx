import { topics, tracks } from '../content';
import { inGrade, isSoon, trackTopics, useNav, type GradeFilter } from '../lib/nav';
import { activeProfile, stars, useStore, type State } from '../lib/store';
import { gradeLabel, gradeName, type Topic } from '../lib/types';
import { StarIcon, tc } from './ui';
import { T } from '../i18n';

export const TRACK_GLYPH: Record<string, string> = {
  numbers: '+',
  fractions: '½',
  geometry: '△',
  algebra: 'x',
  functions: 'ƒ',
  trig: '∡',
  calculus: '∫',
  data: '%',
};

const gname = (g: GradeFilter) => (g === 'all' ? T('כל הכיתות') : T`כיתה ${gradeName(g)}`);

/** הנושא הבא שכדאי ללמוד: מתאים לכיתה ועדיין לא הושלם */
function recommend(state: State, grade: number): Topic | null {
  const open = topics.filter((t) => stars(state, t.id) < 3);
  const fits = open.filter((t) => t.grades[0] <= grade && grade <= t.grades[1]);
  const seen = fits.find((t) => state.activeId && state.progress[state.activeId]?.[t.id]?.seen);
  if (seen) return seen;
  if (fits.length) return fits[0];
  const below = open.filter((t) => t.grades[1] < grade).sort((a, b) => b.grades[1] - a.grades[1]);
  return below[0] ?? open[0] ?? null;
}

export function Home() {
  const state = useStore();
  const nav = useNav();
  const profile = activeProfile(state)!;
  const next = recommend(state, profile.grade);
  const nextTrack = next && tracks.find((t) => t.id === next.track)!;
  const seen = next && state.progress[profile.id]?.[next.id]?.seen;
  const nextStars = next ? stars(state, next.id) : 0;

  return (
    <div className="flex flex-col gap-5">
      <section className="card">
        <h1 className="font-display text-[40px] font-semibold">{T`שלום, ${profile.name}`}</h1>
        <p className="mt-1 text-[19px] text-muted">{T('מה לומדים היום?')}</p>
        {next && nextTrack && (
          <a href={`#/topic/${next.id}`} className="tint mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[28px] px-7 py-6 text-ink no-underline" style={tc(nextTrack.color)}>
            <span className="flex min-w-0 flex-[1_1_320px] flex-col gap-0.5">
              <span className="text-[15px] font-bold" style={{ color: nextTrack.color }}>
                {seen ? T('ממשיכים מאיפה שעצרנו') : T('מומלץ בשבילך')} · {T(nextTrack.title)}
              </span>
              <span className="font-display text-[30px] font-semibold">{T(next.title)}</span>
              <span className="text-[17px] text-muted">{nextStars > 0 ? T(`השלמת ${nextStars} מתוך 3 רמות.`) : T(next.summary)}</span>
            </span>
            <span className="rounded-full px-7 py-3.5 font-display text-lg font-semibold text-white" style={{ background: nextTrack.color }}>
              {seen ? T('ממשיכים ←') : T('מתחילים ←')}
            </span>
          </a>
        )}
      </section>

      <section className="card">
        <h2 className="mb-4 font-display text-2xl font-semibold">{T`המסלולים ל${gname(nav.grade)}`}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-3">
          {tracks.map((tr) => {
            const list = trackTopics(tr.id).filter((t) => inGrade(t, nav.grade));
            const ready = list.filter((t) => !isSoon(t));
            const s = ready.reduce((n, t) => n + stars(state, t.id), 0);
            const tile = (on: boolean) => (
              <span aria-hidden="true" className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl font-display text-[26px] font-semibold" style={{ background: on ? tr.color : '#efece4', color: on ? '#fff' : '#5b6475' }}>
                {TRACK_GLYPH[tr.id]}
              </span>
            );
            if (!ready.length)
              return (
                <div key={tr.id} className="flex items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-[#9a978e] p-[18px]">
                  {tile(false)}
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="font-display text-[21px] font-semibold text-muted">{T(tr.title)}</span>
                    <span className="text-[15px] text-muted">{list.length ? T`בקרוב ל${gname(nav.grade)}` : T('מתחיל בכיתות גבוהות יותר')}</span>
                  </span>
                </div>
              );
            return (
              <a key={tr.id} href={`#/track/${tr.id}`} className="flex items-center gap-4 rounded-2xl bg-[#f6f4ee] p-[18px] text-ink no-underline hover:bg-sand">
                {tile(true)}
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="font-display text-[21px] font-semibold">{T(tr.title)}</span>
                  <span className="text-[15px] text-muted">{ready.length === 1 ? T('נושא אחד') : T(`${ready.length} נושאים`)}</span>
                </span>
                {s > 0 && (
                  <span className="flex items-center gap-1 text-[#b7791f]">
                    <StarIcon />
                    <span className="text-muted">{s}</span>
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function TrackPage({ id }: { id: string }) {
  const state = useStore();
  const nav = useNav();
  const tr = tracks.find((t) => t.id === id);
  if (!tr) return <Home />;
  const list = trackTopics(id).filter((t) => inGrade(t, nav.grade));
  return (
    <section className="card border-t-4" style={{ borderColor: tr.color }}>
      <p className="flex items-center gap-2 font-semibold" style={{ color: tr.color }}>
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: tr.color }} />
        {gname(nav.grade)}
      </p>
      <h1 className="mb-5 mt-1 font-display text-[40px] font-semibold">{T(tr.title)}</h1>
      {list.length === 0 && <p className="text-lg text-muted">{T`אין במסלול הזה נושאים ל${gname(nav.grade)}. אפשר לבחור כיתה אחרת בתפריט למעלה.`}</p>}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-3">
        {list.map((t) =>
          isSoon(t) ? (
            <div key={t.id} className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-dashed border-[#9a978e] p-4 text-muted">
              <span className="flex items-start justify-between gap-2 font-display text-lg font-semibold">
                {T(t.title)}
                <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 font-sans text-xs font-bold">{T('בקרוב')}</span>
              </span>
              <span className="text-sm">{gradeLabel(t.grades)}</span>
            </div>
          ) : (
            <a key={t.id} href={`#/topic/${t.id}`} className="flex flex-col gap-1 rounded-2xl bg-[#f6f4ee] p-4 text-ink no-underline hover:bg-sand">
              <span className="flex items-start justify-between gap-2">
                <span className="font-display text-lg font-semibold">{T(t.title)}</span>
                <span className="flex shrink-0 text-[#b7791f]" aria-label={T(`${stars(state, t.id)} מתוך 3 כוכבים`)}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < stars(state, t.id) ? '' : 'opacity-25'}>
                      <StarIcon size={16} />
                    </span>
                  ))}
                </span>
              </span>
              <span className="flex-1 text-[15px] text-muted">{T(t.summary)}</span>
              <span className="mt-2 self-start rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">{gradeLabel(t.grades)}</span>
            </a>
          ),
        )}
      </div>
    </section>
  );
}
