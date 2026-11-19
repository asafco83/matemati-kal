/**
 * מציג שאלות, פתרונות ושיעורים בכל שפה, ובודק שכל המתמטיקה עדיין נבנית ב-KaTeX,
 * ושלא נשאר טקסט בעברית במקום שיש לו תרגום.
 * npx tsx scripts/i18n-render.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import katex from 'katex';
import { topics } from '../src/content/index';
import { localizeMath, setLocaleForTest, tr, trTex } from '../src/i18n';
import { HEBREW } from '../src/i18n/mask';

const MATH = new Set(['tex', 'latex', 'op']);
let errors = 0;
for (const f of readdirSync('src/i18n/locales')) {
  const code = f.replace('.json', '');
  setLocaleForTest(code, JSON.parse(readFileSync(`src/i18n/locales/${f}`, 'utf8')));
  let leftHebrew = 0;
  const seen = new Set<string>();
  const check = (tex: string, where: string) => {
    try {
      katex.renderToString(localizeMath(tex), { throwOnError: true, strict: false });
    } catch (e) {
      if (errors++ < 15) console.log(`✗ ${code} ${where}: ${(e as Error).message.slice(0, 120)}\n   ${tex.slice(0, 160)}`);
    }
  };
  const walk = (v: unknown, field: string, where: string) => {
    if (typeof v === 'string') {
      if (MATH.has(field)) return check(trTex(v), where);
      const out = tr(v);
      if (code !== 'yi' && HEBREW.test(out.replace(/\$[^$]*\$/g, '')) && !seen.has(out)) {
        seen.add(out);
        leftHebrew++;
      }
      for (const m of out.matchAll(/\$([^$]*)\$/g)) check(m[1], where);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, field, where));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (typeof x !== 'function') walk(x, k, where);
  };
  for (const t of topics) {
    walk(t.lesson, '', `${t.id}/שיעור`);
    for (const lv of [1, 2, 3] as const) for (let i = 0; i < 300; i++) walk(t.generate(lv), '', `${t.id}/${lv}`);
  }
  console.log(`${code}: ${leftHebrew ? `${leftHebrew} משפטים נשארו בעברית` : 'הכול מתורגם'}`);
}
console.log(errors ? `נמצאו ${errors} שגיאות KaTeX.` : 'KaTeX תקין בכל השפות ✓');
if (errors) process.exit(1);
