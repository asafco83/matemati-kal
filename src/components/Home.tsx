import { useState } from 'react';
import { soonTopics, topics, tracks } from '../content';
import { activeProfile, stars, useStore, type State } from '../lib/store';
import { gradeLabel, stageOfGrade, STAGES, type Stage, type Topic } from '../lib/types';

function Stars({ n }: { n: number }) {
  return (
    <span aria-label={`${n} מתוך 3 כוכבים`} className="text-base tracking-tight">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? '' : 'opacity-20 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  );
}

/** הנושא הבא שכדאי ללמוד: מתאים לכיתה ועדיין לא הושלם */
function recommend(state: State, grade: number): Topic | null {
  const open = topics.filter((t) => stars(state, t.id) < 3);
  const fits = open.filter((t) => t.grades[0] <= grade && grade <= t.grades[1]);
  if (fits.length) return fits[0];
  const below = open.filter((t) => t.grades[1] < grade).sort((a, b) => b.grades[1] - a.grades[1]);
  return below[0] ?? open[0] ?? null;
}

export function Home() {
  const state = useStore();
  const profile = activeProfile(state)!;
  const [stage, setStage] = useState<Stage>(stageOfGrade(profile.grade));
  const range = STAGES.find((s) => s.id === stage)!.range;
  const inRange = (g: [number, number]) => g[0] <= range[1] && g[1] >= range[0];
  const next = recommend(state, profile.grade);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-indigo-900">
        שלום, {profile.name} {profile.avatar}
      </h1>
      <p className="mt-1 text-lg text-slate-600">מה לומדים היום?</p>

      {next && (
        <a href={`#/topic/${next.id}`} className="mt-5 flex items-center gap-4 rounded-2xl bg-gradient-to-l from-indigo-600 to-indigo-800 p-5 text-white shadow-md hover:from-indigo-500">
          <span className="text-4xl">{next.icon}</span>
          <span className="flex-1">
            <span className="block text-sm font-medium text-indigo-200">מומלץ בשבילך</span>
            <span className="block text-xl font-bold">{next.title}</span>
            <span className="block text-indigo-100">{next.summary}</span>
          </span>
          <span className="rounded-full bg-amber-400 px-4 py-2 font-bold text-indigo-900">מתחילים ←</span>
        </a>
      )}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="סינון לפי שלב לימוד">
        {STAGES.map((s) => (
          <button key={s.id} role="tab" aria-selected={stage === s.id} onClick={() => setStage(s.id)} className={`rounded-full px-4 py-2 text-sm font-bold ${stage === s.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 hover:bg-indigo-50'}`}>
            {s.title}
          </button>
        ))}
      </div>

      {tracks.map((track) => {
        const ready = topics.filter((t) => t.track === track.id && inRange(t.grades));
        const soon = soonTopics.filter((t) => t.track === track.id && inRange(t.grades));
        if (!ready.length && !soon.length) return null;
        return (
          <section key={track.id} className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold" style={{ color: track.color }}>
              <span>{track.icon}</span> {track.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ready.map((t) => (
                <a key={t.id} href={`#/topic/${t.id}`} className="flex flex-col rounded-2xl border-t-4 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: track.color }}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-lg font-bold">
                      {t.icon} {t.title}
                    </span>
                    <Stars n={stars(state, t.id)} />
                  </span>
                  <span className="mt-1 flex-1 text-sm text-slate-600">{t.summary}</span>
                  <span className="mt-3 self-start rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{gradeLabel(t.grades)}</span>
                </a>
              ))}
              {soon.map((t) => (
                <div key={t.id} className="flex flex-col rounded-2xl border border-dashed border-slate-300 p-4 text-slate-400">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-bold">{t.title}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-500">בקרוב</span>
                  </span>
                  <span className="mt-3 self-start text-xs">{gradeLabel(t.grades)}</span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
