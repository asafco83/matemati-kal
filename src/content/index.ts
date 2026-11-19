import type { SoonTopic, Topic, Track } from '../lib/types';
import { elementaryTopics } from './elementary';
import { algebraTopics2 } from './algebra2';
import { elementaryTopics2 } from './elementary2';
import { geometryDataTopics } from './geometryData';
import { highTopics } from './high';
import { highTopics2 } from './high2';
import { highTopics3 } from './high3';
import { middleTopics } from './middle';
import { extraTopics } from './extra';

export const tracks: Track[] = [
  { id: 'numbers', short: 'חשבון', title: 'מספרים וחשבון', icon: '🔢', color: '#4f46e5' },
  { id: 'fractions', short: 'שברים ואחוזים', title: 'שברים, עשרוניים ואחוזים', icon: '🍕', color: '#db2777' },
  { id: 'geometry', short: 'גאומטריה', title: 'גאומטריה', icon: '📐', color: '#059669' },
  { id: 'algebra', short: 'אלגברה', title: 'אלגברה', icon: '⚖️', color: '#d97706' },
  { id: 'functions', short: 'פונקציות', title: 'פונקציות וגרפים', icon: '📈', color: '#0284c7' },
  { id: 'trig', short: 'טריגונומטריה', title: 'טריגונומטריה', icon: '🧭', color: '#7c3aed' },
  { id: 'calculus', short: 'חדו"א', title: 'חשבון דיפרנציאלי ואינטגרלי', icon: '📉', color: '#dc2626' },
  { id: 'data', short: 'הסתברות', title: 'הסתברות וסטטיסטיקה', icon: '🎲', color: '#0d9488' },
];

export const topics: Topic[] = [...elementaryTopics, ...elementaryTopics2, ...geometryDataTopics, ...middleTopics, ...algebraTopics2, ...highTopics, ...highTopics2, ...highTopics3, ...extraTopics];

/** נושאים שמתוכננים ועדיין לא נכתבו. מוצגים באפור עם התווית "בקרוב" */
/** נושאים שעדיין בהכנה. כרגע כולם מוכנים */
export const soonTopics: SoonTopic[] = [];

export const topicById = (id: string) => topics.find((t) => t.id === id);
