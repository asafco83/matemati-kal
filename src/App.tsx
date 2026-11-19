import { useEffect } from 'react';
import { Header } from './components/Header';
import { Home, TrackPage } from './components/Home';
import { EditProfile, NewProfile, ProfileList, Welcome } from './components/Profiles';
import { TopicPage } from './components/TopicPage';
import { syncProfile, useRoute } from './lib/nav';
import { activeProfile, useStore } from './lib/store';

export default function App() {
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
    <div className="min-h-screen pb-16">
      <Header route={route} />
      <main className="mx-auto max-w-[960px] px-3 pt-6 sm:px-6 sm:pt-7">
        {route.name === 'topic' ? <TopicPage key={route.topic.id} topic={route.topic} /> : route.name === 'track' ? <TrackPage id={route.id} /> : <Home />}
      </main>
    </div>
  );
}
