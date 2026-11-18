/**
 * בדיקה עצמית של התוכן: מריצים כל מחולל שאלות פעמים רבות ומוודאים
 * שהתשובה תקינה, שהיא עוברת את הבדיקה של עצמה, ושכל המתמטיקה מתרנדרת.
 */
import katex from 'katex';
import { soonTopics, topics, tracks } from '../src/content';
import type { Level, Question } from '../src/lib/types';
import { checkAnswer } from '../src/lib/util';

let errors = 0;
const seen = new Set<string>();
const fail = (where: string, msg: string) => {
  errors++;
  const key = `${where}: ${msg.replace(/-?\d+(\.\d+)?/g, '#')}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (seen.size <= 40) console.error(`✗ ${where}: ${msg}`);
};

function checkTex(where: string, text: string, isLatex = false) {
  const parts = isLatex ? ['', text] : text.split('$');
  if (!isLatex && parts.length % 2 === 0) fail(where, `מספר אי-זוגי של סימני $ ב: ${text}`);
  parts.forEach((p, i) => {
    if (i % 2 === 0) return;
    if (/undefined|NaN|Infinity/.test(p)) fail(where, `ערך לא תקין: ${p}`);
    if (/\+ -|- -|\+ \+/.test(p)) fail(where, `סימנים כפולים: ${p}`);
    try {
      katex.renderToString(p.replace(/°/g, '^\\circ'), { throwOnError: true, strict: false });
    } catch (e) {
      fail(where, `KaTeX: ${p} → ${(e as Error).message}`);
    }
  });
  if (!isLatex && /undefined|NaN/.test(text)) fail(where, `ערך לא תקין בטקסט: ${text}`);
}

function checkQuestion(where: string, q: Question) {
  checkTex(where, q.text);
  if (q.latex) checkTex(where, q.latex, true);
  checkTex(where, q.hint);
  if (!q.solution.length) fail(where, 'אין פתרון');
  q.solution.forEach((s) => checkTex(where, s));
  q.short?.forEach((s) => checkTex(where, s));
  if (q.short && q.short.length > q.solution.length) fail(where, 'הפתרון המקוצר ארוך מהמלא');
  const a = q.answer;
  if (a.type === 'number') {
    if (!Number.isFinite(a.value)) fail(where, `תשובה לא סופית: ${a.value}`);
    if (!checkAnswer(a, [String(a.value)], null)) fail(where, `התשובה ${a.value} לא עוברת בדיקה`);
    if (checkAnswer(a, [String(a.value + 1)], null)) fail(where, 'תשובה שגויה התקבלה');
  } else if (a.type === 'multi') {
    if (a.values.some((v) => !Number.isFinite(v))) fail(where, `תשובה לא סופית: ${a.values}`);
    if (a.labels.length !== a.values.length) fail(where, 'מספר התוויות שונה ממספר הערכים');
    if (!checkAnswer(a, a.values.map(String), null)) fail(where, `התשובה ${a.values} לא עוברת בדיקה`);
    if (!a.ordered && !checkAnswer(a, [...a.values].reverse().map(String), null)) fail(where, 'סדר הפוך לא התקבל');
  } else if (a.correct < 0 || a.correct >= a.options.length) fail(where, 'אינדקס תשובה שגוי');
}

const ids = new Set<string>();
for (const t of [...topics, ...soonTopics]) {
  if (ids.has(t.id)) fail(t.id, 'מזהה כפול');
  ids.add(t.id);
  if (!tracks.some((tr) => tr.id === t.track)) fail(t.id, `מסלול לא קיים: ${t.track}`);
  if (t.grades[0] > t.grades[1] || t.grades[0] < 1 || t.grades[1] > 12) fail(t.id, 'טווח כיתות שגוי');
}

let count = 0;
for (const t of topics) {
  const L = t.lesson;
  [L.intro, ...L.method, ...L.tips, ...L.sections.flatMap((s) => [s.title, s.body])].forEach((s) => checkTex(`${t.id}/שיעור`, s));
  L.examples.forEach((ex) => [ex.problem, ...ex.steps].forEach((s) => checkTex(`${t.id}/דוגמה`, s)));
  for (const level of [1, 2, 3] as Level[]) {
    for (let i = 0; i < 2000; i++) {
      checkQuestion(`${t.id}/רמה ${level}`, t.generate(level));
      count++;
    }
  }
}

console.log(`נבדקו ${topics.length} נושאים, ${count} שאלות, ${soonTopics.length} נושאים עתידיים.`);
if (errors) {
  console.error(`נמצאו ${errors} שגיאות.`);
  process.exit(1);
}
console.log('הכול תקין ✓');
