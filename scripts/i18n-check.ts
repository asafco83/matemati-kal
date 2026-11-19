/**
 * כמה מכל שפה מתורגם, ואילו תרגומים פגומים.
 * npx tsx scripts/i18n-check.ts [code]
 */
import { readdirSync } from 'node:fs';
import { allKeys, problem, readLocale } from './i18n-lib';

const keys = allKeys();
const codes = process.argv[2] ? [process.argv[2]] : readdirSync('src/i18n/locales').map((f) => f.replace('.json', ''));
let failed = false;
for (const code of codes) {
  const d = readLocale(code);
  const missing = keys.filter((k) => d[k] === undefined).length;
  const broken = keys.filter((k) => d[k] !== undefined && problem(k, d[k]));
  const stale = Object.keys(d).filter((k) => !keys.includes(k)).length;
  console.log(`${code}: ${keys.length - missing}/${keys.length} (${Math.floor(((keys.length - missing) / keys.length) * 100)}%)${broken.length ? `, ${broken.length} פגומים` : ''}${stale ? `, ${stale} ישנים` : ''}`);
  if (broken.length) failed = true;
}
if (failed) process.exit(1);
