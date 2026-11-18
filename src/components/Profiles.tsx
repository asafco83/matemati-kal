import { useState } from 'react';
import { signIn, useAuth } from '../lib/cloud';
import { addProfile, deleteProfile, selectProfile, useStore } from '../lib/store';
import { GRADE_NAMES } from '../lib/types';

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🦄', '🐙', '🦉', '🐬', '🚀', '⚽', '🎸', '🌈'];

export function Profiles() {
  const state = useStore();
  const auth = useAuth();
  const [adding, setAdding] = useState(state.profiles.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [grade, setGrade] = useState(4);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addProfile(name.trim(), avatar, grade);
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-center text-3xl font-extrabold text-indigo-900">ברוכים הבאים למתמטי-קל</h1>
      <p className="mb-8 text-center text-lg text-slate-600">לומדים ומתרגלים מתמטיקה בקצב שלכם, מכיתה א' ועד י"ב.</p>

      {state.profiles.length > 0 && !adding && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">מי לומד עכשיו?</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {state.profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <button onClick={() => selectProfile(p.id)} className="flex flex-1 items-center gap-3 rounded-xl border-2 border-indigo-100 p-3 text-start hover:border-indigo-400 hover:bg-indigo-50">
                  <span className="text-3xl">{p.avatar}</span>
                  <span>
                    <span className="block font-bold">{p.name}</span>
                    <span className="text-sm text-slate-500">כיתה {GRADE_NAMES[p.grade]}</span>
                  </span>
                </button>
                {confirmDel === p.id ? (
                  <button onClick={() => deleteProfile(p.id)} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white">
                    למחוק?
                  </button>
                ) : (
                  <button onClick={() => setConfirmDel(p.id)} className="rounded-lg px-2 py-1 text-slate-400 hover:text-red-600" aria-label={`מחיקת הפרופיל של ${p.name}`}>
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
          <button onClick={() => setAdding(true)} className="mt-5 font-bold text-indigo-700 hover:underline">
            + פרופיל חדש
          </button>
        </section>
      )}

      {adding && (
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">פרופיל חדש</h2>
          <label className="mb-1 block font-medium" htmlFor="pname">
            איך קוראים לך?
          </label>
          <input id="pname" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoFocus className="mb-5 w-full rounded-xl border-2 border-slate-200 px-4 py-2 text-lg focus:border-indigo-500 focus:outline-none" />

          <span className="mb-1 block font-medium">בחרו דמות</span>
          <div className="mb-5 flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button type="button" key={a} onClick={() => setAvatar(a)} aria-pressed={avatar === a} className={`grid h-11 w-11 place-items-center rounded-xl text-2xl ${avatar === a ? 'bg-amber-300 ring-2 ring-amber-500' : 'bg-slate-100 hover:bg-slate-200'}`}>
                {a}
              </button>
            ))}
          </div>

          <span className="mb-1 block font-medium">באיזו כיתה?</span>
          <div className="mb-6 flex flex-wrap gap-2">
            {GRADE_NAMES.slice(1).map((g, i) => (
              <button type="button" key={g} onClick={() => setGrade(i + 1)} aria-pressed={grade === i + 1} className={`min-w-11 rounded-xl px-3 py-2 font-bold ${grade === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={!name.trim()} className="rounded-xl bg-indigo-600 px-8 py-3 font-bold text-white shadow hover:bg-indigo-700 disabled:bg-slate-300">
              יוצאים לדרך
            </button>
            {state.profiles.length > 0 && (
              <button type="button" onClick={() => setAdding(false)} className="text-slate-500 hover:underline">
                ביטול
              </button>
            )}
          </div>
        </form>
      )}

      {auth.configured && auth.ready && !auth.user && (
        <p className="mt-6 text-center text-slate-600">
          כבר יש לכם חשבון?{' '}
          <button onClick={signIn} className="font-bold text-indigo-700 hover:underline">
            התחברו עם Google
          </button>{' '}
          כדי לשמור את ההתקדמות ולהמשיך מכל מכשיר.
        </p>
      )}
    </div>
  );
}
