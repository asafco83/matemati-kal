import type { SoonTopic, Topic, Track } from '../lib/types';
import { elementaryTopics } from './elementary';
import { highTopics } from './high';
import { middleTopics } from './middle';

export const tracks: Track[] = [
  { id: 'numbers', title: 'מספרים וחשבון', icon: '🔢', color: '#4f46e5' },
  { id: 'fractions', title: 'שברים, עשרוניים ואחוזים', icon: '🍕', color: '#db2777' },
  { id: 'geometry', title: 'גאומטריה', icon: '📐', color: '#059669' },
  { id: 'algebra', title: 'אלגברה', icon: '⚖️', color: '#d97706' },
  { id: 'functions', title: 'פונקציות וגרפים', icon: '📈', color: '#0284c7' },
  { id: 'trig', title: 'טריגונומטריה', icon: '🧭', color: '#7c3aed' },
  { id: 'calculus', title: 'חשבון דיפרנציאלי ואינטגרלי', icon: '📉', color: '#dc2626' },
  { id: 'data', title: 'הסתברות וסטטיסטיקה', icon: '🎲', color: '#0d9488' },
];

export const topics: Topic[] = [...elementaryTopics, ...middleTopics, ...highTopics];

const soon = (track: string, list: [string, string, number, number][]): SoonTopic[] =>
  list.map(([id, title, a, b]) => ({ id, track, title, grades: [a, b], soon: true }));

/** נושאים שמתוכננים ועדיין לא נכתבו. מוצגים באפור עם התווית "בקרוב" */
export const soonTopics: SoonTopic[] = [
  ...soon('numbers', [
    ['place-value', 'המבנה העשרוני', 1, 3],
    ['long-mult', 'כפל במאונך', 3, 5],
    ['long-division', 'חילוק ארוך', 4, 6],
    ['divisibility', 'סימני התחלקות, ראשוניים ופריקים', 5, 6],
    ['negatives', 'מספרים שליליים', 6, 7],
    ['powers-roots', 'חזקות ושורשים', 7, 9],
  ]),
  ...soon('fractions', [
    ['fractions-intro', 'מהו שבר? צמצום והרחבה', 3, 5],
    ['fractions-mult', 'כפל וחילוק שברים', 5, 6],
    ['decimals', 'מספרים עשרוניים', 4, 6],
    ['ratio', 'יחס ופרופורציה', 6, 8],
  ]),
  ...soon('geometry', [
    ['shapes', 'מצולעים ותכונותיהם', 2, 5],
    ['triangle-area', 'שטח משולש ומרובעים', 5, 7],
    ['circle', 'היקף ושטח מעגל', 6, 8],
    ['volume', 'נפח ושטח פנים', 6, 9],
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
    ['averages', 'ממוצע, חציון ושכיח', 5, 8],
    ['charts', 'קריאת דיאגרמות וגרפים', 3, 6],
    ['tree-diagram', 'דיאגרמת עץ והסתברות מותנית', 10, 11],
    ['normal', 'התפלגות נורמלית', 11, 12],
  ]),
];

export const topicById = (id: string) => topics.find((t) => t.id === id);
