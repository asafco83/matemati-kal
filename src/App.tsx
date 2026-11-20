import { useEffect, useState } from 'react';
import { setLocale } from './i18n';
import { Header } from './components/Header';
import { Home, TrackPage } from './components/Home';
import { EditProfile, NewProfile, ProfileList, Welcome } from './components/Profiles';
import { Calculator } from './components/Calculator';
import { Sheet } from './components/Sheet';
import { TopicPage } from './components/TopicPage';
import { installTutorApi } from './lib/sheet';
import { syncProfile, useRoute } from './lib/nav';
import { activeProfile, currentLang, useStore } from './lib/store';

/**
 * טוען את השפה לפני שמציגים את המסכים, וכשהיא מתחלפת בונה את כל המסכים מחדש
 * (key), כך שכל טקסט מוצג בשפה החדשה.
 */
installTutorApi();

export default function App() {
  const lang = currentLang(useStore());
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setLocale(lang).then(() => alive && setReady(lang));
    return () => {
      alive = false;
    };
  }, [lang]);
  if (!ready) return null;
  return <Screens key={ready} />;
}

function Screens() {
  const state = useStore();
  const route = useRoute();
  const profile = activeProfile(state);

  useEffect(() => {
    syncProfile(profile?.id ?? null, profile?.grade ?? null, profile?.units);
  }, [profile?.id, profile?.grade]);

  if (!profile) {
    if (route.name === 'new-profile') return <NewProfile />;
    if (route.name === 'edit-profile') return <EditProfile id={route.id} />;
    return state.profiles.length ? <ProfileList /> : <Welcome />;
  }
  if (route.name === 'new-profile') return <NewProfile />;
  if (route.name === 'edit-profile') return <EditProfile id={route.id} />;

  return (
    <div className="min-h-dvh pb-24">
      <Header route={route} />
      <main className="mx-auto max-w-[960px] px-3 pt-6 sm:px-6 sm:pt-7">
        {route.name === 'topic' ? <TopicPage key={route.topic.id} topic={route.topic} /> : route.name === 'track' ? <TrackPage id={route.id} /> : <Home />}
      </main>
      <Sheet />
      <Calculator />
    </div>
  );
}
