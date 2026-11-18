import { signIn, signOutUser, useAuth } from '../lib/cloud';
import { activeProfile, selectProfile, totals, useStore } from '../lib/store';

export function Header() {
  const state = useStore();
  const auth = useAuth();
  const profile = activeProfile(state);
  const t = totals(state);

  return (
    <header className="sticky top-0 z-20 bg-indigo-700 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <a href="#/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-lg text-indigo-900">±</span>
          מתמטי-קל
        </a>
        <div className="flex-1" />
        {profile && (
          <>
            <span className="hidden items-center gap-1 rounded-full bg-indigo-800 px-3 py-1 text-sm font-medium sm:flex" title="כוכבים שנצברו">
              ⭐ {t.stars}
            </span>
            <button onClick={() => selectProfile(null)} className="flex items-center gap-2 rounded-full bg-indigo-800 py-1 pe-3 ps-1 text-sm font-medium hover:bg-indigo-900" title="החלפת פרופיל">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-base">{profile.avatar}</span>
              {profile.name}
            </button>
          </>
        )}
        {auth.configured &&
          auth.ready &&
          (auth.user ? (
            <button onClick={signOutUser} className="rounded-full border border-indigo-400 px-3 py-1 text-sm hover:bg-indigo-800" title={`מחובר: ${auth.user.name}`}>
              התנתקות
            </button>
          ) : (
            <button onClick={signIn} className="rounded-full bg-white px-3 py-1 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
              התחברות
            </button>
          ))}
      </div>
      {auth.error && <div className="bg-red-600 px-4 py-1 text-center text-sm">{auth.error}</div>}
    </header>
  );
}
