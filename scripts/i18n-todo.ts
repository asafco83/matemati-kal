/**
 * המפתחות שעוד לא תורגמו לשפה, במנה.
 * npx tsx scripts/i18n-todo.ts <code> [כמה=150] > /tmp/batch.json
 * הפלט: אובייקט JSON { "מפתח בעברית": "" }. ממלאים את הערכים ושומרים עם i18n-merge.ts.
 */
import { readFileSync } from 'node:fs';
import { allKeys, readLocale } from './i18n-lib';

const [code, n = '150'] = process.argv.slice(2);
if (!code) throw new Error('צריך קוד שפה');
const have = readLocale(code);
const todo = allKeys().filter((k) => have[k] === undefined);
const batch = Object.fromEntries(todo.slice(0, Number(n)).map((k) => [k, '']));
// דוגמאות עם הערכים האמיתיים במקום ⟨i⟩, אם הוכנו (i18n-extract.ts כותב אותן)
let samples: Record<string, string> = {};
try {
  samples = JSON.parse(readFileSync('/tmp/i18n-samples.json', 'utf8'));
} catch {
  /* אין דוגמאות */
}
const ctx = Object.fromEntries(Object.keys(batch).filter((k) => samples[k]).map((k) => [k, samples[k]]));
console.log(JSON.stringify(batch, null, 1));
if (Object.keys(ctx).length) console.error('דוגמאות (לא לתרגם, רק להקשר):\n' + JSON.stringify(ctx, null, 1));
console.error(`נשארו ${todo.length} מפתחות. במנה הזו ${Object.keys(batch).length}.`);
