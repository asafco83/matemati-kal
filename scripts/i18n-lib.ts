import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const KEYS_FILE = 'src/i18n/keys.json';
export const localeFile = (code: string) => `src/i18n/locales/${code}.json`;

export function allKeys(): string[] {
  const k = JSON.parse(readFileSync(KEYS_FILE, 'utf8')) as { ui: string[]; content: string[] };
  return [...k.ui, ...k.content];
}
export function readLocale(code: string): Record<string, string> {
  return existsSync(localeFile(code)) ? JSON.parse(readFileSync(localeFile(code), 'utf8')) : {};
}
export function writeLocale(code: string, dict: Record<string, string>) {
  // סדר קבוע (לפי רשימת המפתחות), כדי שה-diff יהיה קריא
  const order = allKeys();
  const out: Record<string, string> = {};
  for (const k of order) if (dict[k] !== undefined) out[k] = dict[k];
  writeFileSync(localeFile(code), JSON.stringify(out, null, 1) + '\n');
}
const marks = (s: string) => (s.match(/⟨\d+⟩/g) ?? []).sort().join(',');
/** בעיה בתרגום, או null אם תקין */
export function problem(key: string, val: unknown): string | null {
  if (typeof val !== 'string' || !val.trim()) return 'תרגום ריק';
  if (marks(key) !== marks(val)) return `הסימנים לא תואמים: במקור ${marks(key) || 'אין'}, בתרגום ${marks(val) || 'אין'}`;
  if ((val.match(/\$/g) ?? []).length % 2) return 'מספר אי-זוגי של $';
  return null;
}
