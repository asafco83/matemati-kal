import { useEffect, useState } from 'react';
import { tracks } from '../content';
import { markSeen } from '../lib/store';
import { gradeLabel, type Example, type Topic } from '../lib/types';
import { FigureView } from './FigureView';
import { Practice } from './Practice';
import { Rich } from './Tex';

type Tab = 'learn' | 'examples' | 'practice';

const TABS: { id: Tab; label: string }[] = [
  { id: 'learn', label: '📖 לומדים' },
  { id: 'examples', label: '🧩 דוגמאות פתורות' },
  { id: 'practice', label: '✏️ תרגול' },
];

export function TopicPage({ topic }: { topic: Topic }) {
  const [tab, setTab] = useState<Tab>('learn');
  const track = tracks.find((t) => t.id === topic.track)!;

  useEffect(() => markSeen(topic.id), [topic.id]);

  return (
    <div>
      <a href="#/" className="text-sm font-medium text-indigo-700 hover:underline">
        → כל הנושאים
      </a>
      <div className="mt-2 rounded-2xl border-t-4 bg-white p-5 shadow-sm" style={{ borderColor: track.color }}>
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium" style={{ color: track.color }}>
          {track.icon} {track.title}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{gradeLabel(topic.grades)}</span>
        </div>
        <h1 className="mt-1 text-3xl font-extrabold text-indigo-950">{topic.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-4 py-2 font-bold ${tab === t.id ? 'bg-indigo-700 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {tab === 'learn' && <Learn topic={topic} onNext={() => setTab('examples')} />}
        {tab === 'examples' && <Examples topic={topic} onNext={() => setTab('practice')} />}
        {tab === 'practice' && <Practice topic={topic} />}
      </div>
    </div>
  );
}

function NextButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <div className="mt-6 flex justify-center">
      <button onClick={onClick} className="rounded-full bg-indigo-600 px-8 py-3 font-bold text-white shadow-md hover:bg-indigo-700">
        {children} ←
      </button>
    </div>
  );
}

function Learn({ topic, onNext }: { topic: Topic; onNext: () => void }) {
  const { lesson } = topic;
  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-indigo-50 p-5 text-lg leading-relaxed text-indigo-950">
        <Rich text={lesson.intro} />
      </p>

      {lesson.sections.map((s, i) => (
        <section key={i} className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-xl font-bold text-indigo-900">{s.title}</h2>
          <div className={s.figure ? 'grid items-center gap-4 md:grid-cols-[1fr_auto]' : ''}>
            <p className="text-lg leading-loose">
              <Rich text={s.body} />
            </p>
            {s.figure && (
              <div className="md:w-72">
                <FigureView fig={s.figure} />
              </div>
            )}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border-2 border-emerald-200 bg-white p-5">
        <h2 className="mb-3 text-xl font-bold text-emerald-800">שיטת העבודה</h2>
        <ol className="space-y-2">
          {lesson.method.map((m, i) => (
            <li key={i} className="flex items-start gap-3 text-lg leading-relaxed">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white">{i + 1}</span>
              <span>
                <Rich text={m} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-5">
        <h2 className="mb-2 text-xl font-bold text-amber-900">💡 שימו לב</h2>
        <ul className="list-disc space-y-1 ps-6 text-lg leading-relaxed">
          {lesson.tips.map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </section>

      <NextButton onClick={onNext}>לדוגמאות פתורות</NextButton>
    </div>
  );
}

function ExampleCard({ ex, n }: { ex: Example; n: number }) {
  const [shown, setShown] = useState(0);
  const done = shown >= ex.steps.length;
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-indigo-600">דוגמה {n}</h2>
      <p className="mt-1 text-xl font-bold leading-relaxed">
        <Rich text={ex.problem} />
      </p>
      {ex.figure && (
        <div className="mt-3">
          <FigureView fig={ex.figure} />
        </div>
      )}
      <ol className="mt-4 space-y-2" aria-live="polite">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="pop flex items-start gap-3 rounded-xl bg-indigo-50 p-3 text-lg leading-relaxed">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
            <span>
              <Rich text={s} />
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex gap-3">
        {!done ? (
          <>
            <button onClick={() => setShown(shown + 1)} className="rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-700">
              {shown === 0 ? 'הצעד הראשון' : 'הצעד הבא'}
            </button>
            <button onClick={() => setShown(ex.steps.length)} className="rounded-xl px-3 py-2 font-medium text-slate-500 hover:bg-slate-100">
              הצגת כל הפתרון
            </button>
          </>
        ) : (
          <button onClick={() => setShown(0)} className="rounded-xl px-3 py-2 font-medium text-slate-500 hover:bg-slate-100">
            ↺ מההתחלה
          </button>
        )}
      </div>
    </section>
  );
}

function Examples({ topic, onNext }: { topic: Topic; onNext: () => void }) {
  return (
    <div className="space-y-4">
      <p className="text-slate-600">נסו לחשוב מה הצעד הבא לפני שאתם חושפים אותו.</p>
      {topic.lesson.examples.map((ex, i) => (
        <ExampleCard key={i} ex={ex} n={i + 1} />
      ))}
      <NextButton onClick={onNext}>הבנתי, לתרגול</NextButton>
    </div>
  );
}
