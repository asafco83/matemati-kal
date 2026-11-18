import { useCallback, useEffect, useRef, useState } from "react";
import {
  levelStat,
  MASTERY_GOAL,
  recordAnswer,
  restartLevel,
  totals,
  useStore,
} from "../lib/store";
import type { Level, Question, Topic } from "../lib/types";
import { checkAnswer, isFilled } from "../lib/util";
import { FigureView } from "./FigureView";
import { Rich, Tex } from "./Tex";
import { PrimaryButton, Tick, Segmented, StarIcon } from "./ui";

type Phase = "asking" | "wrong" | "correct" | "revealed";

const LEVEL_NAMES = ["קל", "בינוני", "מאתגר"];
const ERR = "#b3261e";

export function Practice({ topic, color }: { topic: Topic; color: string }) {
  const state = useStore();
  const [level, setLevel] = useState<Level>(1);
  const [q, setQ] = useState<Question>(() => topic.generate(1));
  const [count, setCount] = useState(1);
  const [fields, setFields] = useState<string[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("asking");
  const [tries, setTries] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  const stat = levelStat(state, topic.id, level);

  const newQuestion = useCallback(
    (lv: Level) => {
      setQ(topic.generate(lv));
      setCount((c) => c + 1);
      setFields([]);
      setChoice(null);
      setPhase("asking");
      setTries(0);
      setShowHint(false);
    },
    [topic],
  );

  useEffect(() => {
    if (phase === "asking") firstInput.current?.focus({ preventScroll: true });
    if (phase === "correct" || phase === "revealed")
      nextBtn.current?.focus({ preventScroll: true });
  }, [phase, q]);

  const changeLevel = (lv: Level) => {
    if (lv === level) return;
    setLevel(lv);
    setCelebrate(false);
    newQuestion(lv);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase !== "asking" && phase !== "wrong") return;
    if (!isFilled(q.answer, fields, choice)) return;
    const ok = checkAnswer(q.answer, fields, choice);
    // רק הניסיון הראשון נספר, כדי שניחושים חוזרים לא יקדמו
    if (tries === 0) recordAnswer(topic.id, level, ok);
    setTries(tries + 1);
    if (ok) {
      setPhase("correct");
      if (tries === 0 && stat.score + 1 >= MASTERY_GOAL) setCelebrate(true);
    } else {
      setPhase("wrong");
    }
  };

  const levelBar = (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <Segmented
        label="רמת קושי"
        value={String(level)}
        onChange={(v) => changeLevel(Number(v) as Level)}
        items={([1, 2, 3] as Level[]).map((lv) => ({
          id: String(lv),
          label: (
            <span className="flex items-center gap-1.5">
              {LEVEL_NAMES[lv - 1]}
              {lv === level && (
                <span className="hidden font-semibold sm:inline">
                  · {topic.levels[lv - 1]}
                </span>
              )}
              {levelStat(state, topic.id, lv).mastered && (
                <span className="text-[#b7791f]">
                  <StarIcon />
                </span>
              )}
            </span>
          ),
        }))}
      />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <span className="text-base text-muted">
          בדרך לכוכב · {stat.score} מתוך {MASTERY_GOAL}
        </span>
        <div
          role="img"
          aria-label={`${stat.score} מתוך ${MASTERY_GOAL}`}
          className="flex gap-1.5"
        >
          {Array.from({ length: MASTERY_GOAL }, (_, i) => (
            <span
              key={i}
              className="grid h-[24px] w-[24px] place-items-center rounded-full border-2"
              style={
                i < stat.score
                  ? {
                      borderColor: color,
                      background: "color-mix(in srgb, var(--tc) 13%, white)",
                      color,
                    }
                  : { borderColor: "#9a978e" }
              }
            >
              {/* הנקודה שהרגע הורווחה נכתבת בעט, השאר כבר מסומנות */}
              {i < stat.score && (
                <Tick
                  size={17}
                  draw={
                    phase === "correct" && tries === 1 && i === stat.score - 1
                  }
                />
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (celebrate) {
    return (
      <>
        {levelBar}
        <section className="pop card flex flex-col items-center gap-3 px-8 py-12 text-center">
          <svg viewBox="0 0 24 24" width="120" height="120" aria-hidden="true">
            <path
              d="M12 2l3 6.5 7 .9-5.2 4.8 1.4 7-6.2-3.6-6.2 3.6 1.4-7L2 9.4l7-.9z"
              fill="#ffd43b"
              stroke="#1d2433"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
          <h2 className="font-display text-[52px] font-semibold">כל הכבוד!</h2>
          <p className="max-w-[520px] text-xl leading-relaxed">
            השלמתם את הרמה "{LEVEL_NAMES[level - 1]}" בנושא {topic.title},
            וזכיתם בכוכב. עכשיו יש לכם {totals(state).stars} כוכבים.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {level < 3 && (
              <PrimaryButton
                color={color}
                onClick={() => changeLevel((level + 1) as Level)}
              >
                לרמה הבאה: {LEVEL_NAMES[level]} ←
              </PrimaryButton>
            )}
            <button
              type="button"
              onClick={() => {
                restartLevel(topic.id, level);
                setCelebrate(false);
                newQuestion(level);
              }}
              className="rounded-full bg-sand px-7 py-3.5 font-display text-lg font-semibold"
            >
              עוד תרגול ברמה הזו
            </button>
            <a
              href="#/"
              className="rounded-full bg-sand px-7 py-3.5 font-display text-lg font-semibold text-ink no-underline"
            >
              לכל הנושאים
            </a>
          </div>
        </section>
      </>
    );
  }

  const locked = phase === "correct" || phase === "revealed";
  const ans = q.answer;
  const setField = (i: number, v: string) => {
    const f = [...fields];
    f[i] = v;
    setFields(f);
    if (phase === "wrong") setPhase("asking");
  };
  const inputBorder =
    phase === "wrong"
      ? ERR
      : phase === "revealed"
        ? "#9a978e"
        : locked
          ? color
          : "#1d2433";

  return (
    <>
      {levelBar}
      <form
        onSubmit={submit}
        className="card flex flex-wrap items-center gap-x-14 gap-y-6 sm:p-8"
      >
        <div className="min-w-0 flex-[1_1_300px]">
          <p className="text-base text-muted">תרגיל {count}</p>
          <h2 className="mt-1 font-display text-[26px] font-semibold leading-relaxed sm:text-[30px]">
            <Rich text={q.text} />
          </h2>
          {q.latex && (
            <div className="q-latex my-4 overflow-x-auto">
              <Tex tex={q.latex} display />
            </div>
          )}

          {ans.type === "choice" ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {ans.options.map((o, i) => (
                <button
                  type="button"
                  key={i}
                  disabled={locked}
                  onClick={() => setChoice(i)}
                  aria-pressed={choice === i}
                  className={`relative rounded-xl border-2 px-4 py-3 text-lg font-bold ${choice === i ? "border-ink bg-sand" : "border-line hover:border-ink"}`}
                  style={
                    locked && i === ans.correct
                      ? {
                          borderColor: color,
                          background:
                            "color-mix(in srgb, var(--tc) 13%, white)",
                        }
                      : undefined
                  }
                >
                  <Rich text={o} />
                  {phase === "correct" && i === ans.correct && (
                    <TeacherTick color={color} />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div dir="ltr" className="flex flex-wrap items-center gap-4">
                {(ans.type === "number" ? [""] : ans.labels).map((label, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 font-display text-[30px] font-medium"
                  >
                    {label && <span>{label} =</span>}
                    <span className="relative">
                      <input
                        ref={i === 0 ? firstInput : undefined}
                        dir="ltr"
                        autoComplete="off"
                        value={fields[i] ?? ""}
                        onChange={(e) => setField(i, e.target.value)}
                        disabled={locked}
                        placeholder={
                          ans.type === "number" ? (ans.placeholder ?? "") : ""
                        }
                        aria-label={label || "התשובה שלך"}
                        className="h-16 w-28 rounded-[14px] border-[2.5px] bg-white text-center font-display text-[30px] placeholder:text-lg placeholder:text-[#9a978e] disabled:bg-white"
                        style={{ borderColor: inputBorder }}
                      />
                      {phase === "correct" && i === 0 && (
                        <TeacherTick color={color} />
                      )}
                    </span>
                    {ans.type === "number" && ans.unit && (
                      <span dir="rtl" className="font-sans text-lg text-muted">
                        {ans.unit}
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {!locked && (
                <button
                  type="submit"
                  disabled={!isFilled(ans, fields, choice)}
                  className="min-h-14 rounded-full px-9 font-display text-[19px] font-semibold text-white disabled:opacity-40"
                  style={{ background: color }}
                >
                  בדיקה
                </button>
              )}
            </div>
          )}

          <div aria-live="polite">
            {phase === "correct" && (
              <p
                className="pop tint mt-5 inline-flex items-center rounded-full px-5 py-2.5 font-display text-xl font-semibold"
                style={{ color }}
              >
                {tries === 1 ? "נכון מאוד!" : "נכון! הצלחתם לתקן."}
              </p>
            )}
            {phase === "revealed" && (
              <p className="pop mt-5 inline-flex rounded-full bg-sand px-5 py-2.5 font-display text-[19px] font-semibold">
                לא נורא! הפתרון המלא מחכה למטה.
              </p>
            )}
            {phase === "wrong" && (
              <p
                className="pop mt-5 inline-flex rounded-full bg-[#fde8e6] px-5 py-2.5 font-display text-[19px] font-semibold"
                style={{ color: ERR }}
              >
                לא בדיוק. בדקו שוב ונסו עוד פעם.
              </p>
            )}
            {phase === "wrong" && !showHint && (
              <p className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowHint(true)}
                  className="min-h-11 font-bold underline"
                >
                  רמז
                </button>
              </p>
            )}
            {showHint && !locked && (
              <aside className="pop mt-4 flex max-w-[560px] flex-wrap items-baseline gap-x-4 gap-y-1 note rounded-2xl px-5 py-4">
                <strong className="font-display text-[17px] font-semibold">
                  רמז
                </strong>
                <p className="min-w-0 flex-[1_1_260px] text-lg leading-relaxed">
                  <Rich text={q.hint} />
                </p>
              </aside>
            )}
            {phase === "wrong" && tries >= 2 && (
              <p className="mt-2">
                <button
                  type="button"
                  onClick={() => setPhase("revealed")}
                  className="min-h-11 font-bold underline"
                >
                  הצגת הפתרון המלא
                </button>
              </p>
            )}
          </div>
        </div>
        {q.figure && (
          <div className="min-w-[240px] flex-[0_1_320px]">
            <FigureView fig={q.figure} />
          </div>
        )}
      </form>

      {locked && (
        <>
          <Solution q={q} color={color} />
          <div className="flex justify-center">
            <button
              ref={nextBtn}
              type="button"
              onClick={() => newQuestion(level)}
              className="rounded-full px-8 py-3.5 font-display text-[19px] font-semibold text-white shadow-md hover:brightness-110"
              style={{ background: color }}
            >
              לתרגיל הבא ←
            </button>
          </div>
        </>
      )}
    </>
  );
}

function Solution({ q, color }: { q: Question; color: string }) {
  const [mode, setMode] = useState<"full" | "short">("full");
  const steps = mode === "short" && q.short ? q.short : q.solution;
  return (
    <section className="pop card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-2xl font-semibold">דרך הפתרון</h2>
        {q.short && (
          <Segmented
            small
            label="רמת הפירוט"
            value={mode}
            onChange={setMode}
            items={[
              { id: "full", label: "פתרון מלא" },
              { id: "short", label: "מקוצר" },
            ]}
          />
        )}
      </div>
      <ol className="text-[19px] leading-relaxed">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-baseline gap-4 py-3 ${i ? "border-t border-line" : ""}`}
          >
            <span
              className="w-5 shrink-0 font-display text-[22px] font-semibold"
              style={{ color }}
            >
              {i + 1}
            </span>
            <span className={i === steps.length - 1 ? "marker" : ""}>
              <Rich text={s} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** ✔ גדול שנכתב על פינת התשובה, כמו סימון של מורה במחברת */
function TeacherTick({ color }: { color: string }) {
  return (
    <span className="pointer-events-none absolute -right-4 -top-5 drop-shadow-[0_1px_0_white]">
      <Tick size={54} color={color} draw />
    </span>
  );
}
