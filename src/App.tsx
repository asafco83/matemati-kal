import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { Profiles } from './components/Profiles';
import { TopicPage } from './components/TopicPage';
import { topicById } from './content';
import { activeProfile, useStore } from './lib/store';

/** ניתוב פשוט לפי ה-hash: "#/" לדף הבית, "#/topic/<id>" לנושא */
function useRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const m = hash.match(/^#\/topic\/([\w-]+)/);
  return m ? topicById(m[1]) ?? null : null;
}

export default function App() {
  const state = useStore();
  const topic = useRoute();
  const profile = activeProfile(state);

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <main className="mx-auto max-w-5xl px-4 pt-6">
        {!profile ? <Profiles /> : topic ? <TopicPage key={topic.id} topic={topic} /> : <Home />}
      </main>
    </div>
  );
}
