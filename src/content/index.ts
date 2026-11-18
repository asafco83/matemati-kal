import type { SoonTopic, Topic, Track } from '../lib/types';
import { elementaryTopics } from './elementary';
import { elementaryTopics2 } from './elementary2';
import { geometryDataTopics } from './geometryData';
import { highTopics } from './high';
import { middleTopics } from './middle';

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

export const topics: Topic[] = [...elementaryTopics, ...elementaryTopics2, ...geometryDataTopics, ...middleTopics, ...highTopics];

const soon = (track: string, list: [string, string, number, number][]): SoonTopic[] =>
  list.map(([id, title, a, b]) => ({ id, track, title, grades: [a, b], soon: true }));

/** נושאים שמתוכננים ועדיין לא נכתבו. מוצגים באפור עם התווית "בקרוב" */
export const soonTopics: SoonTopic[] = [
  ...soon('numbers', [
  ]),
  ...soon('fractions', [
  ]),
  ...soon('geometry', [
    ['parallel-lines', 'ישרים מקבילים וזוויות', 7, 8],
    ['congruence', 'חפיפת משולשים', 8, 9],
    ['similarity', 'דמיון משולשים', 9, 10],
    ['analytic', 'גאומטריה אנליטית', 10, 12],
  ]),
  ...soon('algebra', [
    ['like-terms', 'ביטויים אלגבריים וכינוס איברים', 7, 7],
    ['expand', 'פתיחת סוגריים', 7, 8],
    ['inequalities', 'אי-שוויונות', 8, 9],
    ['systems', 'מערכת משוואות בשני נעלמים', 8, 9],
    ['short-mult', 'נוסחאות הכפל המקוצר', 8, 9],
    ['word-problems', 'בעיות מילוליות', 7, 10],
    ['sequences', 'סדרה חשבונית והנדסית', 10, 11],
  ]),
  ...soon('functions', [
    ['parabola', 'הפונקציה הריבועית (פרבולה)', 9, 10],
    ['exponential', 'פונקציה מעריכית וגדילה ודעיכה', 10, 11],
    ['logarithms', 'לוגריתמים', 11, 12],
  ]),
  ...soon('trig', [
    ['sine-cosine-law', 'משפט הסינוסים ומשפט הקוסינוסים', 10, 11],
    ['unit-circle', 'מעגל היחידה וזהויות', 11, 12],
    ['trig-3d', 'טריגונומטריה במרחב', 11, 12],
  ]),
  ...soon('calculus', [
    ['investigation', 'חקירת פונקציה', 11, 12],
    ['optimization', 'בעיות קיצון', 11, 12],
    ['integrals', 'אינטגרלים ושטחים', 12, 12],
  ]),
  ...soon('data', [
    ['tree-diagram', 'דיאגרמת עץ והסתברות מותנית', 10, 11],
    ['normal', 'התפלגות נורמלית', 11, 12],
  ]),
];

export const topicById = (id: string) => topics.find((t) => t.id === id);
