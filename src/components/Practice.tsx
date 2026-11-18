import { useCallback, useEffect, useRef, useState } from 'react';
import { levelStat, MASTERY_GOAL, recordAnswer, restartLevel, useStore } from '../lib/store';
import type { Level, Question, Topic } from '../lib/types';
import { checkAnswer, isFilled } from '../lib/util';
import { FigureView } from './FigureView';
import { Rich, Tex } from './Tex';

type Phase = 'asking' | 'wrong' | 'correct' | 'revealed';

const LEVEL_NAMES = ['קל', 'בינוני', 'מאתגר'];

export function Practice({ topic }: { topic: Topic }) {
  const state = useStore();
  const [level, setLevel] = useState<Level>(1);
  const [q, setQ] = useState<Question>(() => topic.generate(1));
  const [fields, setFields] = useState<string[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('asking');
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const stat = levelStat(state, topic.id, level);

  const newQuestion = useCallback(
    (lv: Level) => {
      setQ(topic.generate(lv));
      setFields([]);
      setChoice(null);
      setPhase('asking');
      setTries(0);
      setShowHint(false);
    },
    [topic],
  );

  useEffect(() => {
    if (phase === 'asking') firstInput.current?.focus();
    if (phase === 'correct' || phase === 'revealed') nextBtn.current?.focus();
  }, [phase, q]);

  const changeLevel = (lv: Level) => {
    if (lv === level) return;
    setLevel(lv);
    setCelebrate(false);
    newQuestion(lv);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== 'asking' && phase !== 'wrong') return;
    if (!isFilled(q.answer, fields, choice)) return;
    const ok = checkAnswer(q.answer, fields, choice);
    // רק הניסיון הראשון נספר, כדי שניחושים חוזרים לא יקדמו
    if (tries === 0) recordAnswer(topic.id, level, ok);
    setTries(tries + 1);
    if (ok) {
      setPhase('correct');
      if (tries === 0 && stat.score + 1 >= MASTERY_GOAL) setCelebrate(true);
    } else {
      setPhase('wrong');
    }
  };

  const next = () => {
    if (celebrate) return;
    newQuestion(level);
  };

  if (celebrate) {
    return (
      <div className="pop rounded-2xl border-4 border-amber-300 bg-white p-8 text-center shadow-lg">
        <div className="text-7xl">🏆</div>
        <h2 className="mt-3 text-3xl font-extrabold text-indigo-900">כל הכבוד!</h2>
        <p className="mt-2 text-lg text-slate-600">
          השלמתם את הרמה "{LEVEL_NAMES[level - 1]}" בנושא {topic.title} וזכיתם בכוכב ⭐
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {level < 3 && (
            <button
              onClick={() => changeLevel((level + 1) as Level)}
              className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow hover:bg-indigo-700"
            >
              לרמה הבאה: {LEVEL_NAMES[level]} ←
            </button>
          )}
          <button
            onClick={() => {
              restartLevel(topic.id, level);
              setCelebrate(false);
              newQuestion(level);
            }}
            className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 hover:bg-slate-200"
          >
            עוד תרגול ברמה הזו
          </button>
          <a href="#/" className="rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-700 hover:bg-slate-200">
            לכל הנושאים
          </a>
        </div>
      </div>
    );
  }

  const locked = phase === 'correct' || phase === 'revealed';
  const ans = q.answer;
  const setField = (i: number, v: string) => {
    const f = [...fields];
    f[i] = v;
    setFields(f);
    if (phase === 'wrong') setPhase('asking');
  };
  const inputCls =
    'w-32 rounded-xl border-2 border-slate-300 px-3 py-3 text-center text-xl font-bold focus:border-indigo-500 focus:outline-none disabled:bg-slate-100';

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="רמת קושי">
          {([1, 2, 3] as Level[]).map((lv) => {
            const done = levelStat(state, topic.id, lv).mastered;
            return (
              <button key={lv} role="tab" aria-selected={level === lv} onClick={() => changeLevel(lv)} className={`flex-1 rounded-xl px-3 py-2 text-start ${level === lv ? 'bg-indigo-700 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-indigo-50'}`}>
                <span className="block font-bold">
                  {LEVEL_NAMES[lv - 1]} {done && '⭐'}
                </span>
                <span className={`block text-xs ${level === lv ? 'text-indigo-200' : 'text-slate-500'}`}>{topic.levels[lv - 1]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">בדרך לכוכב</span>
          <div className="flex flex-1 gap-1" dir="ltr" role="progressbar" aria-valuemin={0} aria-valuemax={MASTERY_GOAL} aria-valuenow={stat.score}>
            {Array.from({ length: MASTERY_GOAL }, (_, i) => (
              <div key={i} className={`h-3 flex-1 rounded-full transition-colors ${i < stat.score ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <span className="text-sm font-bold text-slate-600">
            {stat.score}/{MASTERY_GOAL}
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl bg-white p-6 text-center shadow-md">
        <p className="text-lg font-medium leading-relaxed text-slate-700">
          <Rich text={q.text} />
        </p>
        {q.latex && (
          <div className="q-latex my-5 overflow-x-auto text-indigo-950">
            <Tex tex={q.latex} display />
          </div>
        )}
        {q.figure && (
          <div className="my-4">
            <FigureView fig={q.figure} />
          </div>
        )}

        {ans.type === 'choice' ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {ans.options.map((o, i) => (
              <button type="button" key={i} disabled={locked} onClick={() => setChoice(i)} aria-pressed={choice === i} className={`rounded-xl border-2 px-4 py-3 text-lg font-bold ${choice === i ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                <Rich text={o} />
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4" dir="ltr">
            {(ans.type === 'number' ? [''] : ans.labels).map((label, i) => (
              <label key={i} className="flex items-center gap-2 text-xl font-bold text-indigo-950">
                {label && <span>{label} =</span>}
                <input
                  ref={i === 0 ? firstInput : undefined}
                  dir="ltr"
                  inputMode="text"
                  autoComplete="off"
                  value={fields[i] ?? ''}
                  onChange={(e) => setField(i, e.target.value)}
                  disabled={locked}
                  placeholder={ans.type === 'number' ? (ans.placeholder ?? '') : ''}
                  aria-label={label || 'התשובה שלך'}
                  className={inputCls}
                />
                {ans.type === 'number' && ans.unit && <span className="text-base font-medium text-slate-600" dir="rtl">{ans.unit}</span>}
              </label>
            ))}
          </div>
        )}

        {!locked && (
          <button type="submit" disabled={!isFilled(ans, fields, choice)} className="mt-5 rounded-xl bg-indigo-600 px-10 py-3 text-lg font-bold text-white shadow hover:bg-indigo-700 disabled:bg-slate-300">
            בדיקה
          </button>
        )}

        <div aria-live="polite">
          {phase === 'correct' && (
            <div className="pop mt-5 rounded-xl bg-emerald-100 p-4 text-lg font-bold text-emerald-800">
              ✅ {tries === 1 ? 'נכון מאוד!' : 'נכון! הצלחתם לתקן.'}
            </div>
          )}
          {phase === 'wrong' && (
            <div className="pop mt-5 rounded-xl bg-rose-100 p-4 text-rose-800">
              <p className="text-lg font-bold">לא בדיוק. בדקו שוב ונסו עוד פעם.</p>
              <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm font-bold">
                {!showHint && (
                  <button type="button" onClick={() => setShowHint(true)} className="text-indigo-700 hover:underline">
                    💡 רמז
                  </button>
                )}
                {tries >= 2 && (
                  <button type="button" onClick={() => setPhase('revealed')} className="text-indigo-700 hover:underline">
                    הצגת הפתרון
                  </button>
                )}
              </div>
            </div>
          )}
          {showHint && !locked && (
            <div className="pop mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
              <strong>רמז:</strong> <Rich text={q.hint} />
            </div>
          )}
        </div>

        {locked && (
          <div className="mt-4 text-start">
            <Solution q={q} open={phase === 'revealed'} />
            <div className="mt-4 text-center">
              <button ref={nextBtn} type="button" onClick={next} className="rounded-xl bg-emerald-600 px-8 py-3 text-lg font-bold text-white shadow hover:bg-emerald-700">
                לתרגיל הבא ←
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function Solution({ q, open }: { q: Question; open: boolean }) {
  const [show, setShow] = useState(open);
  if (!show)
    return (
      <div className="text-center">
        <button type="button" onClick={() => setShow(true)} className="text-sm font-bold text-indigo-700 hover:underline">
          איך פותרים? הצגת דרך הפתרון
        </button>
      </div>
    );
  return (
    <div className="pop rounded-xl bg-indigo-50 p-4">
      <h3 className="mb-2 font-bold text-indigo-900">דרך הפתרון</h3>
      <ol className="space-y-1.5">
        {q.solution.map((s, i) => (
          <li key={i} className="flex items-start gap-2 leading-relaxed">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
            <span>
              <Rich text={s} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
