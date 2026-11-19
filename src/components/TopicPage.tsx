import { useEffect, useState } from 'react';
import { tracks } from '../content';
import { markSeen } from '../lib/store';
import { gradeLabel, type Example, type LessonStep, type Topic } from '../lib/types';
import { FigureView } from './FigureView';
import { Practice } from './Practice';
import { StepView } from './StepView';
import { NotationContext, notationForGrade, Rich } from './Tex';
import { PrimaryButton, Segmented, StepNum, tc } from './ui';

type Tab = 'learn' | 'examples' | 'practice';

export function TopicPage({ topic }: { topic: Topic }) {
  const [tab, setTab] = useState<Tab>('learn');
  const track = tracks.find((t) => t.id === topic.track)!;
  const color = track.color;

  useEffect(() => {
    markSeen(topic.id);
  }, [topic.id]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <NotationContext.Provider value={notationForGrade(topic.grades[0])}>
      <div className="flex flex-col gap-5" style={tc(color)}>
        <section className="card flex flex-wrap items-end gap-x-8 gap-y-4 border-t-4" style={{ borderColor: color }}>
          <div className="min-w-0 flex-[1_1_280px]">
            <p className="flex flex-wrap items-center gap-2 font-semibold" style={{ color }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {track.title}
              <span className="rounded-full bg-sand px-2.5 py-0.5 text-[13px] text-muted">{gradeLabel(topic.grades)}</span>
            </p>
            <h1 className="mt-1 font-display text-[34px] font-semibold leading-tight sm:text-[40px]">{topic.title}</h1>
          </div>
          <Segmented
            label="מצב לימוד"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'learn', label: 'למידה' },
              { id: 'examples', label: 'דוגמאות פתורות' },
              { id: 'practice', label: 'תרגול' },
            ]}
          />
        </section>
        {tab === 'learn' && <Learn topic={topic} color={color} onNext={() => setTab('examples')} />}
        {tab === 'examples' && <Examples topic={topic} color={color} onNext={() => setTab('practice')} />}
        {tab === 'practice' && <Practice key={topic.id} topic={topic} color={color} />}
      </div>
    </NotationContext.Provider>
  );
}

type LearnMode = 'full' | 'short';
const LEARN_KEY = 'matemati-kal:learn-mode';
const readLearnMode = (): LearnMode => {
  try {
    return localStorage.getItem(LEARN_KEY) === 'short' ? 'short' : 'full';
  } catch {
    return 'full';
  }
};

/** צעד אחד בהסבר המלא */
function DetailStep({ step, color }: { step: LessonStep; color: string }) {
  if (typeof step === 'object' && 'figure' in step) {
    return (
      <figure className="flex flex-col items-center gap-2">
        <div className="w-full max-w-[300px]">
          <FigureView fig={step.figure} />
        </div>
        {step.caption && (
          <figcaption className="text-center text-[17px] text-muted">
            <Rich text={step.caption} />
          </figcaption>
        )}
      </figure>
    );
  }
  // בהסבר, משפט נשאר משפט: קודם המילים ואחר כך התרגיל, כמו שקוראים
  if (typeof step === 'string') return <Rich text={step} />;
  return <StepView step={step} color={color} />;
}

function Learn({ topic, color, onNext }: { topic: Topic; color: string; onNext: () => void }) {
  const { lesson } = topic;
  const hasDetail = lesson.sections.some((s) => s.detail?.length) || !!lesson.before?.length;
  const [mode, setModeState] = useState<LearnMode>(readLearnMode);
  const setMode = (m: LearnMode) => {
    setModeState(m);
    try {
      localStorage.setItem(LEARN_KEY, m);
    } catch {
      /* אין אחסון: נשאר רק לביקור הזה */
    }
  };
  const full = hasDetail && mode === 'full';
  return (
    <>
      {hasDetail && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[17px] text-muted">{full ? 'צעד אחר צעד, מההתחלה.' : 'רק העיקר, בקצרה.'}</p>
          <Segmented<LearnMode>
            small
            label="רמת ההסבר"
            value={mode}
            onChange={setMode}
            items={[
              { id: 'full', label: 'הסבר מלא' },
              { id: 'short', label: 'מקוצר' },
            ]}
          />
        </div>
      )}
      <p className="tint rounded-2xl px-6 py-5 text-xl leading-relaxed">
        <Rich text={lesson.intro} />
      </p>
      {full && lesson.before && (
        <aside className="card">
          <h2 className="mb-2 font-display text-2xl font-semibold">לפני שמתחילים</h2>
          <ul className="flex list-disc flex-col gap-2 ps-6 text-[19px] leading-relaxed">
            {lesson.before.map((b, i) => (
              <li key={i}>
                <Rich text={b} />
              </li>
            ))}
          </ul>
        </aside>
      )}
      {lesson.sections.map((s, i) => (
        <section key={i} className="card flex flex-col gap-3.5">
          <h2 className="flex items-center gap-3 font-display text-2xl font-semibold">
            <StepNum n={i + 1} color={color} />
            <span>
              <Rich text={s.title} />
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
            <p className="min-w-0 flex-[1_1_320px] text-[19px] leading-loose">
              <Rich text={s.body} />
            </p>
            {s.figure && !(full && s.detail?.some((d) => typeof d === 'object' && 'figure' in d)) && (
              <div className="flex-[0_1_300px]">
                <FigureView fig={s.figure} />
              </div>
            )}
          </div>
          {full && s.detail && (
            <ol className="mt-1 flex flex-col rounded-2xl bg-paper px-4 py-2 sm:px-6">
              {s.detail.map((d, j) => (
                <li key={j} className={`flex items-baseline gap-4 py-3.5 text-[19px] leading-loose ${j ? 'border-t border-line' : ''}`}>
                  <span className="w-6 shrink-0 text-center font-display text-lg font-semibold" style={{ color }}>
                    {i + 1}.{j + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <DetailStep step={d} color={color} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
      <section className="card">
        <h2 className="mb-1 font-display text-2xl font-semibold">שיטת העבודה</h2>
        <ol className="text-[19px] leading-relaxed">
          {lesson.method.map((m, i) => (
            <li key={i} className={`flex items-baseline gap-4 py-3 ${i ? 'border-t border-line' : ''}`}>
              <span className="w-5 shrink-0 font-display text-[22px] font-semibold" style={{ color }}>
                {i + 1}
              </span>
              <span>
                <Rich text={m} />
              </span>
            </li>
          ))}
        </ol>
      </section>
      <aside className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 note rounded-2xl px-6 py-4 shadow-[0_1px_3px_rgba(29,36,51,0.12)]">
        <strong className="font-display text-[19px] font-semibold">שימו לב</strong>
        <ul className="flex min-w-0 flex-[1_1_320px] list-disc flex-col gap-1 ps-5 text-lg leading-relaxed">
          {lesson.tips.map((t, i) => (
            <li key={i}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </aside>
      <div className="flex justify-center">
        <PrimaryButton color={color} onClick={onNext}>
          לדוגמאות פתורות ←
        </PrimaryButton>
      </div>
    </>
  );
}

function ExampleCard({ ex, n, color }: { ex: Example; n: number; color: string }) {
  const [shown, setShown] = useState(0);
  const done = shown >= ex.steps.length;
  return (
    <section className="card">
      <p className="font-display text-base font-semibold" style={{ color }}>
        דוגמה {n}
      </p>
      <h2 className="mt-1 font-display text-[26px] font-semibold leading-relaxed">
        <Rich text={ex.problem} />
      </h2>
      {ex.figure && (
        <div className="mt-3">
          <FigureView fig={ex.figure} />
        </div>
      )}
      <ol className="mt-3 text-[19px] leading-relaxed" aria-live="polite">
        {ex.steps.slice(0, shown).map((s, i) => (
          <li key={i} className="pop flex items-baseline gap-4 border-t border-line py-3">
            <span className="w-5 shrink-0 font-display text-[22px] font-semibold" style={{ color }}>
              {i + 1}
            </span>
            <span className={i === ex.steps.length - 1 ? 'marker' : ''}>
              <StepView step={s} color={color} />
            </span>
          </li>
        ))}
        {!done && (
          <li className="flex items-baseline gap-4 border-t border-dashed border-[#9a978e] py-3 text-muted">
            <span className="w-5 shrink-0 font-display text-[22px] font-semibold">{shown + 1}</span>
            <span>מה הצעד הבא?</span>
          </li>
        )}
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {!done ? (
          <>
            <button type="button" onClick={() => setShown(shown + 1)} className="min-h-12 rounded-full px-7 font-display text-lg font-semibold text-white" style={{ background: color }}>
              {shown === 0 ? 'הצעד הראשון' : 'הצעד הבא'}
            </button>
            <button type="button" onClick={() => setShown(ex.steps.length)} className="min-h-11 font-semibold text-muted underline">
              הצגת כל הפתרון
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setShown(0)} className="min-h-11 font-semibold text-muted">
            ↺ מההתחלה
          </button>
        )}
      </div>
    </section>
  );
}

function Examples({ topic, color, onNext }: { topic: Topic; color: string; onNext: () => void }) {
  return (
    <>
      <p className="card py-3.5 text-lg text-muted">נסו לחשוב מה הצעד הבא לפני שאתם חושפים אותו.</p>
      {topic.lesson.examples.map((ex, i) => (
        <ExampleCard key={i} ex={ex} n={i + 1} color={color} />
      ))}
      <div className="flex justify-center">
        <PrimaryButton color={color} onClick={onNext}>
          הבנתי, לתרגול ←
        </PrimaryButton>
      </div>
    </>
  );
}
