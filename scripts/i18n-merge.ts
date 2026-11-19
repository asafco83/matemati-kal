/**
 * שומר תרגומים בקובץ השפה, אחרי בדיקה.
 * npx tsx scripts/i18n-merge.ts <code> <קובץ JSON עם { "מפתח": "תרגום" }>
 * תרגום עם בעיה (ריק, סימנים ⟨i⟩ שלא תואמים) לא נשמר, ומודפס כדי לתקן.
 */
import { readFileSync } from 'node:fs';
import { allKeys, problem, readLocale, writeLocale } from './i18n-lib';

const [code, file] = process.argv.slice(2);
if (!code || !file) throw new Error('שימוש: i18n-merge.ts <code> <file>');
const incoming = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
const keys = new Set(allKeys());
const dict = readLocale(code);
let ok = 0;
const bad: string[] = [];
for (const [k, v] of Object.entries(incoming)) {
  if (!keys.has(k)) {
    bad.push(`מפתח לא מוכר: ${k}`);
    continue;
  }
  const p = problem(k, v);
  if (p) bad.push(`${p}\n  מקור: ${k}\n  תרגום: ${v}`);
  else {
    dict[k] = v;
    ok++;
  }
}
writeLocale(code, dict);
const left = allKeys().filter((k) => dict[k] === undefined).length;
console.log(`נשמרו ${ok}. נדחו ${bad.length}. נשארו ${left} מפתחות.`);
if (bad.length) console.log(bad.join('\n'));
