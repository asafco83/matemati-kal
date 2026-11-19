/**
 * אוסף את כל המשפטים בעברית שהאפליקציה מציגה, ושומר אותם כמפתחות תרגום.
 *
 * מקורות: קבצי הממשק (src/components, src/lib), שיעורים, ואלפי שאלות שנוצרות מכל נושא.
 * כל משפט עובר mask(): מספרים, תרגילים ושמות מוחלפים בסימנים ⟨i⟩, כך שמשפט שחוזר
 * עם מספרים שונים הוא מפתח אחד.
 *
 * הפלט: src/i18n/keys.json, רשימה ממוינת של מפתחות לפי קבוצות (ui / content).
 * הרצה: npx tsx scripts/i18n-extract.ts
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { topics, tracks } from '../src/content/index';
import { HEBREW, mask, NAME_TOKENS, TEX_TEXT_RE } from '../src/i18n/mask';

const content = new Map<string, number>();
/** דוגמה אחת לכל מפתח, עם המספרים והתרגילים האמיתיים: עוזרת למתרגם להבין את ההקשר */
const samples = new Map<string, string>();
const ui = new Set<string>();

const MATH_FIELDS = new Set(['tex', 'latex', 'op', 'cells']);

function addText(s: string) {
  if (!HEBREW.test(s)) return;
  const { key } = mask(s);
  if (HEBREW.test(key)) {
    content.set(key, (content.get(key) ?? 0) + 1);
    if (!samples.has(key) && key !== s) samples.set(key, s);
  }
  // עברית בתוך מתמטיקה שבמשפט
  for (const m of s.matchAll(/\$([^$]*)\$/g)) addTex(m[1]);
}
function addTex(s: string) {
  for (const m of s.matchAll(TEX_TEXT_RE)) addText(m[1]);
}
function walk(v: unknown, field = '') {
  if (typeof v === 'string') return MATH_FIELDS.has(field) ? addTex(v) : addText(v);
  if (Array.isArray(v)) return v.forEach((x) => walk(x, field));
  if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x !== 'function') walk(x, k);
}

for (const t of topics) {
  walk({ title: t.title, summary: t.summary, levels: t.levels, lesson: t.lesson });
  for (const level of [1, 2, 3] as const) for (let i = 0; i < Number(process.env.SAMPLES ?? 1500); i++) walk(t.generate(level));
}
walk(tracks);
NAME_TOKENS.forEach((n) => content.set(n, 1));

/* ---------- ממשק: מחרוזות שעטופות ב-T בקוד ---------- */
// T('...'), T("..."), T(`...`) או T`...`. בתבנית, כל ${...} הופך ל-⟨i⟩, כמו מספר
const T_CALL = /\b[TN](?:\(\s*|(?=`))('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;
function scanUi(file: string) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(T_CALL)) {
    let s = m[1].slice(1, -1).replace(/\\(['"`\\])/g, '$1');
    if (m[1][0] === '`') {
      let i = 0;
      s = s.replace(/\$\{[^}]*\}/g, () => `⟨${i++}⟩`);
      ui.add(s.replace(/\s+/g, ' ').trim());
    } else ui.add(mask(s).key);
  }
}
for (const dir of ['src/components', 'src/lib', 'src']) {
  for (const f of readdirSync(dir)) if (/\.tsx?$/.test(f)) scanUi(`${dir}/${f}`);
}

const contentKeys = [...content.keys()].filter((k) => !ui.has(k)).sort();
const uiKeys = [...ui].sort();
writeFileSync('src/i18n/keys.json', JSON.stringify({ ui: uiKeys, content: contentKeys }, null, 1) + '\n');
writeFileSync('/tmp/i18n-samples.json', JSON.stringify(Object.fromEntries(samples), null, 1));
const words = (ks: string[]) => ks.reduce((a, k) => a + k.split(/\s+/).length, 0);
console.log(`ממשק: ${uiKeys.length} מפתחות (${words(uiKeys)} מילים). תוכן: ${contentKeys.length} מפתחות (${words(contentKeys)} מילים).`);
