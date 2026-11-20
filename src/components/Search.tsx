import { useEffect, useMemo, useRef, useState } from 'react';
import { topics, tracks } from '../content';
import { activeProfile, getState } from '../lib/store';
import { gradeLabel, type Topic } from '../lib/types';
import { Rich } from './Tex';
import { T } from '../i18n';

/** מילים להשוואה: בלי סימני מתמטיקה, ניקוד וגרשיים, ובאותיות קטנות */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[֑-ׇ"'׳״?.,:;!()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

interface Hit {
  topic: Topic;
  score: number;
  /** הסעיף או הרמה שבהם נמצאה המילה, אם לא בכותרת */
  where?: string;
}

function search(query: string): Hit[] {
  const words = norm(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  const hits: Hit[] = [];
  // נושאים של הכיתה של התלמיד מופיעים קודם
  const grade = activeProfile(getState())?.grade;
  const far = (t: Topic) => (grade == null ? 0 : Math.max(t.grades[0] - grade, grade - t.grades[1], 0));
  for (const topic of topics) {
    // מחפשים גם בעברית (שפת המקור) וגם בשפת התצוגה
    const both = (s: string) => [s, T(s)];
    const title = both(topic.title).map(norm);
    const parts = [...topic.levels, ...topic.lesson.sections.map((s) => s.title)];
    const partsN = parts.map((p) => both(p).map(norm).join(' '));
    const summary = both(topic.summary).map(norm).join(' ');
    const track = both(tracks.find((t) => t.id === topic.track)?.title ?? '').map(norm).join(' ');
    let score = 0;
    let where: string | undefined;
    const ok = words.every((w) => {
      if (title.some((t) => t.startsWith(w))) return (score += 12);
      if (title.some((t) => t.includes(w))) return (score += 8);
      const i = partsN.findIndex((p) => p.includes(w));
      if (i >= 0) {
        where ??= parts[i];
        return (score += 4);
      }
      if (summary.includes(w)) return (score += 2);
      return track.includes(w) ? (score += 1) : 0;
    });
    if (ok) hits.push({ topic, score, where });
  }
  return hits.sort((a, b) => b.score - Math.min(far(b.topic), 6) - (a.score - Math.min(far(a.topic), 6)) || a.topic.grades[0] - b.topic.grades[0]).slice(0, 12);
}

export function SearchButton({ className = '', compact = false }: { className?: string; /** רק הסמל, בלי המילה */ compact?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '');
      if ((e.key === '/' && !typing) || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={T('חיפוש')} title={T('חיפוש')} className={`flex h-10 min-w-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white/15 px-3 text-[15px] font-semibold text-white hover:bg-white/25 ${className}`}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="M20 20l-4.6-4.6" />
        </svg>
        {!compact && <span className="hidden sm:inline">{T('חיפוש')}</span>}
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => search(q), [q]);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setSel(0), [q]);
  const go = (h: Hit | undefined) => {
    if (!h) return;
    window.location.hash = `#/topic/${h.topic.id}`;
    onClose();
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') setSel((s) => Math.min(s + 1, hits.length - 1));
    else if (e.key === 'ArrowUp') setSel((s) => Math.max(s - 1, 0));
    else if (e.key === 'Enter') go(hits[sel]);
    else return;
    e.preventDefault();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 p-3 pt-[8vh] text-ink" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={T('חיפוש נושא')} className="card flex max-h-[80vh] w-full max-w-[620px] flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={key}
            type="search"
            placeholder={T('מה מחפשים? למשל: שברים, אחוזים, משוואות')}
            aria-label={T('חיפוש נושא')}
            className="h-13 min-w-0 flex-1 rounded-xl border-2 border-ink bg-white px-4 py-3 text-xl"
          />
          <button type="button" onClick={onClose} aria-label={T('סגירה')} className="h-12 w-12 shrink-0 rounded-full bg-sand text-lg font-bold">
            ✕
          </button>
        </div>
        {q.trim() && !hits.length && <p className="px-1 text-lg text-muted">{T('לא נמצאו נושאים. נסו מילה אחרת.')}</p>}
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {hits.map((h, i) => {
            const track = tracks.find((t) => t.id === h.topic.track);
            return (
              <li key={h.topic.id}>
                <button type="button" onClick={() => go(h)} onMouseEnter={() => setSel(i)} className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-start ${i === sel ? 'bg-sand' : ''}`}>
                  <span className="flex flex-wrap items-center gap-2 font-display text-xl font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: track?.color }} />
                    {T(h.topic.title)}
                    <span className="rounded-full bg-white px-2 py-0.5 text-[13px] font-medium text-muted ring-1 ring-line">{gradeLabel(h.topic.grades)}</span>
                  </span>
                  <span className="text-base text-muted"><Rich text={h.where ?? h.topic.summary} /></span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
