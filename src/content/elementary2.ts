import type { Step, Topic } from '../lib/types';
import { L, fracTex, gcd, par, pick, rawFrac, ri, round } from '../lib/util';

/* ---------- עזרים ---------- */

const PLACES = ['האחדות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים'];
const digitsOf = (n: number) => String(n).split('').map(Number);
const yesNo = ['כן', 'לא'];

/** תרגיל במאונך: שורות מיושרות לימין, קו, ותוצאה */
function vertical(top: string, op: string, bottom: string, result: string, partials: string[] = []): string {
  const mid = partials.length ? L` \\ \hline ${partials.join(' \\\\ ')}` : '';
  return L`\begin{array}{r} ${top} \\ ${op}\; ${bottom}${mid} \\ \hline ${result} \end{array}`;
}

/* ---------- המבנה העשרוני ---------- */

const placeValue: Topic = {
  id: 'place-value',
  track: 'numbers',
  title: 'המבנה העשרוני',
  grades: [1, 3],
  icon: '🧱',
  summary: 'אחדות, עשרות ומאות: כל ספרה שווה לפי המקום שלה.',
  levels: ['עשרות ואחדות', 'מאות', 'אלפים ופירוק'],
  lesson: {
    intro: 'כל מספר בנוי מספרות, ולכל ספרה יש מקום. אותה ספרה שווה הרבה יותר כשהיא עומדת יותר שמאלה.',
    sections: [
      {
        title: 'אחדות ועשרות',
        body: 'עשר אחדות הן עשרת אחת. במספר 47 יש 4 עשרות ו-7 אחדות: $47 = 40 + 7$.',
      },
      {
        title: 'מאות ואלפים',
        body: 'עשר עשרות הן מאה, ועשר מאות הן אלף. במספר 362 הספרה 3 שווה 300, הספרה 6 שווה 60 והספרה 2 שווה 2: $362 = 300 + 60 + 2$.',
      },
      {
        title: 'האפס שומר מקום',
        body: 'במספר 305 אין עשרות, ולכן כותבים 0 במקום העשרות. בלי האפס היינו כותבים 35, וזה מספר אחר לגמרי.',
      },
    ],
    method: [
      'מתחילים מימין: הספרה הימנית היא האחדות.',
      'הספרה שמשמאלה היא העשרות, ואחריה המאות והאלפים.',
      'ערך הספרה = הספרה כפול ערך המקום (1, 10, 100, 1000).',
      'כשמרכיבים מספר, כותבים 0 בכל מקום שאין בו כלום.',
    ],
    examples: [
      {
        problem: 'מה ערך הספרה 6 במספר 362?',
        steps: ['הספרה 6 עומדת במקום העשרות.', '6 עשרות הן $6 \\times 10 = 60$', 'לכן ערך הספרה 6 הוא 60.'],
      },
      {
        problem: 'כתבו כמספר: 4 מאות, 0 עשרות ו-8 אחדות',
        steps: ['במקום המאות כותבים 4, בעשרות 0 ובאחדות 8.', 'בודקים: $400 + 0 + 8 = 408$', 'המספר הוא 408.'],
      },
    ],
    tips: [
      'הספרה שווה יותר ככל שהיא שמאלה יותר: ב-55, ה-5 השמאלי שווה 50 והימני שווה 5.',
      'לא שוכחים את האפס: 3 מאות ו-5 אחדות הן 305, לא 35.',
    ],
  },
  generate(level) {
    if (level === 1) {
      const t = ri(1, 9);
      const u = ri(0, 9);
      const n = t * 10 + u;
      const kind = pick(['tens', 'units', 'compose'] as const);
      if (kind === 'compose')
        return {
          text: `כתבו כמספר: ${t} עשרות ו-${u} אחדות`,
          answer: { type: 'number', value: n },
          hint: 'העשרות נכתבות משמאל, והאחדות מימין.',
          solution: [`${t} עשרות הן $${t} \\times 10 = ${t * 10}$`, `מוסיפים ${u} אחדות: $${t * 10} + ${u} = ${n}$`],
        };
      return {
        text: `כמה ${kind === 'tens' ? 'עשרות' : 'אחדות'} יש במספר ${n}?`,
        answer: { type: 'number', value: kind === 'tens' ? t : u },
        hint: 'הספרה הימנית היא האחדות, והספרה שמשמאלה היא העשרות.',
        solution: [`מפרקים: $${n} = ${t * 10} + ${u}$`, `יש ${t} עשרות ו-${u} אחדות.`],
      };
    }
    if (level === 2) {
      const h = ri(1, 9);
      const t = ri(0, 9);
      const u = ri(0, 9);
      const n = h * 100 + t * 10 + u;
      if (Math.random() < 0.5) {
        return {
          text: `כתבו כמספר: ${h} מאות, ${t} עשרות ו-${u} אחדות`,
          answer: { type: 'number', value: n },
          hint: 'מאות משמאל, אחריהן עשרות ואז אחדות. אם אין עשרות, כותבים 0.',
          solution: [`$${h * 100} + ${t * 10} + ${u} = ${n}$`, `המספר הוא ${n}.`],
        };
      }
      const ds = [h, t, u];
      let i = ri(0, 2);
      if (ds[i] === 0) i = 0;
      const val = ds[i] * 10 ** (2 - i);
      return {
        text: `מה ערך הספרה ${ds[i]} במספר ${n}?`,
        answer: { type: 'number', value: val },
        hint: 'בדקו באיזה מקום עומדת הספרה: אחדות, עשרות או מאות.',
        solution: [
          `הספרה ${ds[i]} עומדת במקום ${PLACES[2 - i]}.`,
          `ערכה: $${ds[i]} \\times ${10 ** (2 - i)} = ${val}$`,
          `מפרקים את המספר: $${n} = ${h * 100} + ${t * 10} + ${u}$`,
        ],
      };
    }
    const th = ri(1, 9);
    const h = ri(0, 9);
    const t = ri(0, 9);
    const u = ri(1, 9);
    const n = th * 1000 + h * 100 + t * 10 + u;
    const parts = [th * 1000, h * 100, t * 10, u].filter((x) => x > 0);
    return {
      text: 'כתבו כמספר:',
      latex: parts.join(' + '),
      answer: { type: 'number', value: n },
      hint: 'כל מחובר שייך למקום אחר: אלפים, מאות, עשרות ואחדות. מקום שאין בו כלום מקבל 0.',
      solution: [
        `אלפים: ${th}, מאות: ${h}, עשרות: ${t}, אחדות: ${u}`,
        `כותבים את הספרות לפי הסדר: ${n}`,
        `בודקים: $${parts.join(' + ')} = ${n}$`,
      ],
    };
  },
};

/* ---------- כפל במאונך ---------- */

/** צעדי כפל של מספר בספרה אחת, מימין לשמאל, עם העברה */
function multByDigitSteps(a: number, m: number): string[] {
  const ds = digitsOf(a).reverse();
  const steps: string[] = [];
  let carry = 0;
  ds.forEach((d, i) => {
    const v = d * m + carry;
    const last = i === ds.length - 1;
    const expr = carry ? `${m} \\times ${d} + ${carry} = ${v}` : `${m} \\times ${d} = ${v}`;
    const write = last ? `כותבים ${v}.` : v >= 10 ? `כותבים ${v % 10} ומעבירים ${Math.floor(v / 10)} ל${PLACES[i + 1]}.` : `כותבים ${v}.`;
    steps.push(`כופלים את ${PLACES[i]}: $${expr}$. ${write}`);
    carry = last ? 0 : Math.floor(v / 10);
  });
  return steps;
}

const longMult: Topic = {
  id: 'long-mult',
  track: 'numbers',
  title: 'כפל במאונך',
  grades: [3, 5],
  icon: '✖️',
  summary: 'כופלים ספרה אחר ספרה מימין לשמאל, ומעבירים את מה שעובר 10.',
  levels: ['דו-ספרתי כפול חד-ספרתי', 'תלת-ספרתי כפול חד-ספרתי', 'דו-ספרתי כפול דו-ספרתי'],
  lesson: {
    intro: 'כשהמספרים גדולים, כופלים במאונך: כותבים אותם זה מתחת לזה, וכופלים כל ספרה בנפרד, מימין לשמאל.',
    sections: [
      {
        title: 'למה זה עובד?',
        body: 'מפרקים את המספר לעשרות ואחדות וכופלים כל חלק: $23 \\times 4 = 20 \\times 4 + 3 \\times 4 = 80 + 12 = 92$. הכפל במאונך עושה בדיוק את זה, רק בסדר מסודר.',
      },
      {
        title: 'העברה',
        body: 'כשמכפלה של ספרה יוצאת 10 או יותר, כותבים רק את האחדות שלה ומעבירים את העשרות למקום הבא. ב-$23 \\times 4$: $4 \\times 3 = 12$, כותבים 2 ומעבירים 1. אחר כך $4 \\times 2 + 1 = 9$.',
      },
      {
        title: 'כפל בדו-ספרתי',
        body: 'ב-$23 \\times 45$ כופלים קודם ב-5, אחר כך ב-40, ומחברים: $23 \\times 5 = 115$, $23 \\times 40 = 920$, ו-$115 + 920 = 1035$.',
      },
    ],
    method: [
      'כותבים את המספר הגדול למעלה ואת הקטן מתחתיו, מיושרים לימין.',
      'כופלים את ספרת האחדות של המספר התחתון בכל ספרה של העליון, מימין לשמאל.',
      'אם יצא 10 או יותר, כותבים את האחדות ומעבירים את העשרות הלאה.',
      'אם התחתון דו-ספרתי, כופלים גם בעשרות שלו (שורה שנייה, עם 0 בסוף) ומחברים את השורות.',
      'בודקים בהערכה: האם התוצאה קרובה ל-$20 \\times 4$ או לעיגול דומה?',
    ],
    examples: [
      {
        problem: 'חשבו במאונך: $23 \\times 4$',
        steps: [
          'כופלים את האחדות: $4 \\times 3 = 12$. כותבים 2 ומעבירים 1 לעשרות.',
          'כופלים את העשרות: $4 \\times 2 + 1 = 9$. כותבים 9.',
          { tex: vertical('23', '\\times', '4', '92') },
        ],
      },
      {
        problem: 'חשבו במאונך: $23 \\times 45$',
        steps: [
          'כופלים ב-5: $23 \\times 5 = 115$',
          'כופלים ב-40: $23 \\times 40 = 920$',
          'מחברים את השורות: $115 + 920 = 1035$',
          { tex: vertical('23', '\\times', '45', '1035', ['115', '920']) },
        ],
      },
    ],
    tips: [
      'לא שוכחים להוסיף את מה שהעברנו, ורק אחרי הכפל.',
      'בשורה של העשרות כותבים 0 בסוף, כי כופלים ב-40 ולא ב-4.',
      'הערכה מהירה תופסת טעויות: $48 \\times 6$ צריך לצאת קרוב ל-$50 \\times 6 = 300$.',
    ],
  },
  generate(level) {
    if (level < 3) {
      const a = level === 1 ? ri(12, 98) : ri(102, 987);
      const m = ri(2, 9);
      const res = a * m;
      return {
        text: 'חשבו במאונך:',
        latex: L`${a} \times ${m}`,
        answer: { type: 'number', value: res },
        hint: 'מתחילים מהאחדות. אם יוצא 10 או יותר, מעבירים את העשרות הלאה.',
        solution: [...multByDigitSteps(a, m), { tex: vertical(`${a}`, '\\times', `${m}`, `${res}`) }],
        short: [{ tex: vertical(`${a}`, '\\times', `${m}`, `${res}`) }],
      };
    }
    const a = ri(12, 98);
    const b = ri(12, 98);
    const u = b % 10;
    const t = b - u;
    const p1 = a * u;
    const p2 = a * t;
    const res = a * b;
    const solution: Step[] = [
      `כופלים באחדות: $${a} \\times ${u} = ${p1}$`,
      `כופלים בעשרות: $${a} \\times ${t} = ${p2}$`,
      `מחברים את השורות: $${p1} + ${p2} = ${res}$`,
      { tex: vertical(`${a}`, '\\times', `${b}`, `${res}`, u ? [`${p1}`, `${p2}`] : []) },
    ];
    return {
      text: 'חשבו במאונך:',
      latex: L`${a} \times ${b}`,
      answer: { type: 'number', value: res },
      hint: `כופלים קודם ב-${u}, אחר כך ב-${t}, ומחברים.`,
      solution,
      short: [solution[3]],
    };
  },
};

/* ---------- חילוק ארוך ---------- */

const times = (k: number) => (k === 0 ? 'אפס פעמים' : k === 1 ? 'פעם אחת' : k === 2 ? 'פעמיים' : `${k} פעמים`);

function longDivSteps(n: number, d: number): { steps: Step[]; q: number; r: number } {
  const ds = digitsOf(n);
  const steps: Step[] = [];
  let cur = 0;
  let q = '';
  ds.forEach((dig, i) => {
    cur = cur * 10 + dig;
    const k = Math.floor(cur / d);
    if (q === '' && k === 0 && i < ds.length - 1) {
      steps.push(`${cur} קטן מ-${d}, אז לוקחים גם את הספרה הבאה.`);
      return;
    }
    const left = cur - k * d;
    const lead = q === '' ? '' : `מורידים את ${dig} ומקבלים ${cur}. `;
    steps.push({
      tex: `${cur} - ${k} \\times ${d} = ${left}`,
      why: `${lead}${d} נכנס ב-${cur} ${times(k)}, ונשאר ${left}.`,
    });
    q += String(k);
    cur = left;
  });
  return { steps, q: Number(q), r: cur };
}

const longDivision: Topic = {
  id: 'long-division',
  track: 'numbers',
  title: 'חילוק ארוך',
  grades: [4, 6],
  icon: '➗',
  summary: 'מחלקים ספרה אחר ספרה משמאל לימין: כמה פעמים נכנס, כמה נשאר, ומורידים את הבאה.',
  levels: ['דו-ספרתי בלי שארית', 'תלת-ספרתי בלי שארית', 'עם שארית'],
  lesson: {
    intro: 'בחילוק ארוך מחלקים מספר גדול לחלקים, ספרה אחר ספרה. שואלים כל פעם: כמה פעמים המחלק נכנס? כמה נשאר?',
    sections: [
      {
        title: 'מתחילים משמאל',
        body: 'בחילוק, בניגוד לחיבור ולכפל, מתחילים מהספרה השמאלית. ב-$84 \\div 4$: 4 נכנס ב-8 פעמיים, ואחר כך 4 נכנס ב-4 פעם אחת. התשובה 21.',
      },
      {
        title: 'מה שנשאר עובר הלאה',
        body: 'ב-$72 \\div 3$: 3 נכנס ב-7 פעמיים ($2 \\times 3 = 6$), ונשאר 1. את ה-1 מצמידים לספרה הבאה ומקבלים 12. 3 נכנס ב-12 ארבע פעמים. התשובה 24.',
      },
      {
        title: 'שארית',
        body: 'לפעמים בסוף נשאר מספר קטן מהמחלק. זו השארית. $17 \\div 5 = 3$ ושארית 2, כי $3 \\times 5 + 2 = 17$.',
      },
    ],
    method: [
      'לוקחים את הספרה השמאלית (או שתיים, אם היא קטנה מהמחלק).',
      'בודקים כמה פעמים המחלק נכנס בה, וכותבים את זה בתשובה.',
      'כופלים ומחסרים כדי לדעת כמה נשאר.',
      'מורידים את הספרה הבאה ומצמידים לנשאר. חוזרים על השלבים.',
      'בודקים: מנה כפול מחלק, ועוד השארית, צריך לתת את המספר המקורי.',
    ],
    examples: [
      {
        problem: 'חשבו: $72 \\div 3$',
        steps: [
          'כמה פעמים 3 נכנס ב-7? פעמיים. $2 \\times 3 = 6$, ונשאר 1.',
          'מורידים את 2 ומקבלים 12. 3 נכנס ב-12 ארבע פעמים, ונשאר 0.',
          'בודקים: $24 \\times 3 = 72$',
        ],
      },
      {
        problem: 'חשבו: $137 \\div 4$',
        steps: [
          '1 קטן מ-4, אז לוקחים 13. 4 נכנס ב-13 שלוש פעמים: $3 \\times 4 = 12$, נשאר 1.',
          'מורידים את 7 ומקבלים 17. 4 נכנס ב-17 ארבע פעמים: $4 \\times 4 = 16$, נשאר 1.',
          'התשובה: 34 ושארית 1.',
          'בודקים: $34 \\times 4 + 1 = 137$',
        ],
      },
    ],
    tips: [
      'השארית תמיד קטנה מהמחלק. אם נשאר יותר, המחלק נכנס עוד פעם.',
      'אם המחלק לא נכנס בכלל בספרה מסוימת, כותבים 0 בתשובה וממשיכים.',
    ],
  },
  generate(level) {
    const d = level === 1 ? ri(2, 5) : ri(3, 9);
    if (level < 3) {
      const q = level === 1 ? ri(11, Math.floor(99 / d)) : ri(Math.ceil(100 / d), Math.floor(999 / d));
      const n = q * d;
      const { steps } = longDivSteps(n, d);
      return {
        text: 'חשבו:',
        latex: L`${n} \div ${d}`,
        answer: { type: 'number', value: q },
        hint: 'מתחילים מהספרה השמאלית: כמה פעמים המחלק נכנס בה?',
        solution: [...steps, `בודקים: $${q} \\times ${d} = ${n}$`],
        short: [`$${n} \\div ${d} = ${q}$`, `בודקים: $${q} \\times ${d} = ${n}$`],
      };
    }
    let n = ri(50, 999);
    if (n % d === 0) n += 1;
    const { steps, q, r } = longDivSteps(n, d);
    return {
      text: 'חשבו את המנה ואת השארית:',
      latex: L`${n} \div ${d}`,
      answer: { type: 'multi', labels: ['מנה', 'שארית'], values: [q, r], ordered: true },
      hint: 'מחלקים כרגיל. מה שנשאר בסוף, והוא קטן מהמחלק, הוא השארית.',
      solution: [...steps, `התשובה: ${q} ושארית ${r}.`, `בודקים: $${q} \\times ${d} + ${r} = ${n}$`],
      short: [`$${n} \\div ${d} = ${q}$ ושארית ${r}`, `בודקים: $${q} \\times ${d} + ${r} = ${n}$`],
    };
  },
};

/* ---------- סימני התחלקות ---------- */

const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const digitSum = (n: number) => digitsOf(n).reduce((a, b) => a + b, 0);

function divRule(n: number, d: number): string[] {
  const last = n % 10;
  const yes = n % d === 0;
  switch (d) {
    case 2:
      return [`מספר מתחלק ב-2 אם ספרת האחדות שלו זוגית.`, `ספרת האחדות של ${n} היא ${last}, ${last % 2 === 0 ? 'זוגית' : 'אי-זוגית'}.`];
    case 5:
      return [`מספר מתחלק ב-5 אם הוא נגמר ב-0 או ב-5.`, `${n} נגמר ב-${last}.`];
    case 10:
      return [`מספר מתחלק ב-10 אם הוא נגמר ב-0.`, `${n} נגמר ב-${last}.`];
    default: {
      const s = digitSum(n);
      return [
        `מספר מתחלק ב-${d} אם סכום הספרות שלו מתחלק ב-${d}.`,
        `סכום הספרות: $${digitsOf(n).join(' + ')} = ${s}$`,
        `${s} ${yes ? '' : 'לא '}מתחלק ב-${d}.`,
      ];
    }
  }
}

const divisibility: Topic = {
  id: 'divisibility',
  track: 'numbers',
  title: 'סימני התחלקות, ראשוניים ופריקים',
  grades: [5, 6],
  icon: '🔍',
  summary: 'איך יודעים בלי לחלק אם מספר מתחלק ב-2, 3, 5, 9 או 10, ומהו מספר ראשוני.',
  levels: ['סימני התחלקות', 'ראשוני או פריק', 'פירוק לגורמים ראשוניים'],
  lesson: {
    intro: 'סימני התחלקות הם קיצורי דרך: מסתכלים על הספרות של המספר ויודעים אם הוא מתחלק, בלי לבצע את החילוק.',
    sections: [
      {
        title: 'ב-2, ב-5 וב-10: מסתכלים על הסוף',
        body: 'מתחלק ב-2: ספרת האחדות זוגית (0, 2, 4, 6, 8). מתחלק ב-5: נגמר ב-0 או 5. מתחלק ב-10: נגמר ב-0.',
      },
      {
        title: 'ב-3 וב-9: סכום הספרות',
        body: 'מחברים את כל הספרות. אם הסכום מתחלק ב-3, גם המספר מתחלק ב-3. אותו דבר עם 9. למשל 459: $4 + 5 + 9 = 18$, ו-18 מתחלק ב-9, אז גם 459.',
      },
      {
        title: 'ראשוני ופריק',
        body: 'מספר ראשוני מתחלק רק ב-1 ובעצמו: 2, 3, 5, 7, 11, 13... מספר פריק אפשר לכתוב ככפל של מספרים קטנים יותר: $12 = 3 \\times 4$. כל מספר פריק אפשר לפרק עד הסוף לכפל של ראשוניים: $12 = 2 \\times 2 \\times 3$.',
      },
    ],
    method: [
      'כדי לבדוק התחלקות, בוחרים את הסימן המתאים למחלק.',
      'כדי לבדוק אם מספר ראשוני, מנסים לחלק אותו ב-2, 3, 5, 7... עד שהמחלק בריבוע גדול מהמספר.',
      'כדי לפרק לגורמים, מחלקים שוב ושוב במספר הראשוני הקטן ביותר שאפשר.',
    ],
    examples: [
      {
        problem: 'האם 726 מתחלק ב-3?',
        steps: ['סכום הספרות: $7 + 2 + 6 = 15$', '15 מתחלק ב-3, ולכן גם 726 מתחלק ב-3.', 'בודקים: $726 \\div 3 = 242$'],
      },
      {
        problem: 'פרקו את 60 לגורמים ראשוניים',
        steps: ['$60 = 2 \\times 30$', '$30 = 2 \\times 15$', '$15 = 3 \\times 5$', 'לכן $60 = 2 \\times 2 \\times 3 \\times 5$'],
      },
    ],
    tips: ['1 אינו ראשוני ואינו פריק.', '2 הוא המספר הראשוני הזוגי היחיד.', 'מספר שמתחלק ב-9 תמיד מתחלק גם ב-3, אבל לא להפך.'],
  },
  generate(level) {
    if (level === 1) {
      const d = pick([2, 3, 5, 9, 10]);
      const want = Math.random() < 0.5;
      let n = want ? d * ri(Math.ceil(100 / d), Math.floor(999 / d)) : ri(100, 999);
      if (!want && n % d === 0) n += 1;
      const yes = n % d === 0;
      return {
        text: `האם ${n} מתחלק ב-${d}?`,
        answer: { type: 'choice', options: yesNo, correct: yes ? 0 : 1 },
        hint: d === 3 || d === 9 ? 'חברו את הספרות.' : 'הסתכלו על ספרת האחדות.',
        solution: [...divRule(n, d), `לכן ${n} ${yes ? '' : 'לא '}מתחלק ב-${d}.`],
      };
    }
    if (level === 2) {
      const prime = Math.random() < 0.5;
      let n = ri(11, 99);
      while (isPrime(n) !== prime) n = ri(11, 99);
      const f = [2, 3, 5, 7].find((p) => n % p === 0);
      return {
        text: `האם ${n} ראשוני או פריק?`,
        answer: { type: 'choice', options: ['ראשוני', 'פריק'], correct: prime ? 0 : 1 },
        hint: 'נסו לחלק ב-2, 3, 5 ו-7.',
        solution: prime
          ? [`מנסים לחלק ב-2, 3, 5 ו-7: אף אחד מהם לא מחלק את ${n}.`, `מספיק לבדוק עד 7, כי $11 \\times 11 = 121$ כבר גדול מ-${n}.`, `לכן ${n} ראשוני.`]
          : [`${n} מתחלק ב-${f}: $${n} = ${f} \\times ${n / f!}$`, `לכן ${n} פריק.`],
      };
    }
    const primes = [2, 2, 3, 3, 5, 7, 11, 13];
    let n = 1;
    const fs: number[] = [];
    while (fs.length < 3 || n < 40) {
      const p = pick(primes);
      if (n * p > 600) break;
      n *= p;
      fs.push(p);
    }
    fs.sort((a, b) => a - b);
    const steps: string[] = [];
    let cur = n;
    for (const p of fs) {
      if (cur === p) break;
      steps.push(`$${cur} = ${p} \\times ${cur / p}$`);
      cur /= p;
    }
    return {
      text: `פרקו את ${n} לגורמים ראשוניים. מהו הגורם הראשוני הגדול ביותר?`,
      answer: { type: 'number', value: fs[fs.length - 1] },
      hint: 'חלקו שוב ושוב במספר הראשוני הקטן ביותר שמחלק.',
      solution: [...steps, `לכן $${n} = ${fs.join(' \\times ')}$`, `הגורם הראשוני הגדול ביותר הוא ${fs[fs.length - 1]}.`],
    };
  },
};

/* ---------- מספרים שליליים ---------- */

const negatives: Topic = {
  id: 'negatives',
  track: 'numbers',
  title: 'מספרים שליליים',
  grades: [6, 7],
  icon: '🌡️',
  summary: 'מספרים מתחת לאפס: חיבור, חיסור, כפל וחילוק עם סימנים.',
  levels: ['חיבור', 'חיסור', 'כפל וחילוק'],
  lesson: {
    intro: 'מספרים שליליים הם מספרים שקטנים מאפס, כמו טמפרטורה של 3 מעלות מתחת לאפס: $-3$. על ציר המספרים הם נמצאים משמאל לאפס.',
    sections: [
      {
        title: 'חיבור: הולכים על הציר',
        body: 'מוסיפים מספר חיובי, הולכים ימינה. $-3 + 5$: מתחילים ב-$-3$ והולכים 5 צעדים ימינה, ומגיעים ל-2.',
        figure: { type: 'numline', from: -4, to: 4, start: -3, jumps: [5] },
      },
      {
        title: 'חיסור של שלילי הוא חיבור',
        body: 'להוריד חוב זה כמו לקבל כסף. לכן $5 - (-3) = 5 + 3 = 8$. ובכיוון השני: $5 + (-3) = 5 - 3 = 2$.',
      },
      {
        title: 'כפל וחילוק: כלל הסימנים',
        body: 'סימנים שווים נותנים חיובי, סימנים שונים נותנים שלילי. $(-4) \\times (-3) = 12$, אבל $(-4) \\times 3 = -12$. אותו כלל בחילוק: $(-12) \\div (-3) = 4$.',
      },
    ],
    method: [
      'בחיבור ובחיסור, הופכים קודם כל "מינוס מינוס" לפלוס ו"פלוס מינוס" למינוס.',
      'אם הסימנים שונים, מחסרים את הקטן מהגדול ולוקחים את הסימן של הגדול.',
      'בכפל ובחילוק, מחשבים בלי סימנים ואז קובעים את הסימן לפי הכלל.',
    ],
    examples: [
      {
        problem: 'חשבו: $-7 + 4$',
        steps: ['הסימנים שונים: מחסרים את הקטן מהגדול: $7 - 4 = 3$', 'הגדול (7) שלילי, אז התשובה שלילית: $-7 + 4 = -3$'],
      },
      {
        problem: 'חשבו: $(-6) \\times (-5)$',
        steps: ['בלי סימנים: $6 \\times 5 = 30$', 'שני הסימנים שווים (שניהם מינוס), אז התוצאה חיובית: 30'],
      },
    ],
    tips: ['$-8$ קטן מ-$-2$, למרות ש-8 גדול מ-2. ככל שהולכים שמאלה, המספר קטן.', 'כותבים מספר שלילי בסוגריים כשהוא בא אחרי סימן: $5 - (-3)$.'],
  },
  generate(level) {
    if (level === 1) {
      let a = ri(-15, 15);
      let b = ri(-15, 15);
      if (a >= 0 && b >= 0) a = -a - 1;
      if (b === 0) b = -4;
      if (a + b === 0) b += 1;
      return {
        text: 'חשבו:',
        latex: `${a} + ${par(b)}`,
        answer: { type: 'number', value: a + b },
        hint: b < 0 ? 'פלוס מינוס הוא מינוס.' : 'הסימנים שונים: מחסרים את הקטן מהגדול.',
        solution:
          b < 0
            ? [`פלוס מינוס הוא מינוס: $${a} + (${b}) = ${a} - ${-b}$`, `$${a} - ${-b} = ${a + b}$`]
            : [
                `הסימנים שונים: $${Math.max(Math.abs(a), b)} - ${Math.min(Math.abs(a), b)} = ${Math.abs(a + b)}$`,
                `הסימן של הגדול ${Math.abs(a) > b ? 'שלילי' : 'חיובי'}, אז $${a} + ${b} = ${a + b}$`,
              ],
      };
    }
    if (level === 2) {
      const a = ri(-12, 12);
      const b = -ri(1, 12);
      return {
        text: 'חשבו:',
        latex: `${a} - (${b})`,
        answer: { type: 'number', value: a - b },
        hint: 'מינוס מינוס הוא פלוס.',
        solution: [`מינוס מינוס הוא פלוס: $${a} - (${b}) = ${a} + ${-b}$`, `$${a} + ${-b} = ${a - b}$`],
      };
    }
    const x = ri(2, 9) * pick([1, -1]);
    const y = ri(2, 9) * pick([1, -1]);
    const sign = x * y > 0 ? 'חיובית' : 'שלילית';
    if (Math.random() < 0.5) {
      return {
        text: 'חשבו:',
        latex: L`${par(x)} \times ${par(y)}`,
        answer: { type: 'number', value: x * y },
        hint: 'סימנים שווים: חיובי. סימנים שונים: שלילי.',
        solution: [
          `בלי סימנים: $${Math.abs(x)} \\times ${Math.abs(y)} = ${Math.abs(x * y)}$`,
          { tex: L`${par(x)} \times ${par(y)} = ${x * y}`, why: `הסימנים ${x * y > 0 ? 'שווים' : 'שונים'}, אז התוצאה ${sign}` },
        ],
      };
    }
    const p = x * y;
    return {
      text: 'חשבו:',
      latex: L`${par(p)} \div ${par(x)}`,
      answer: { type: 'number', value: y },
      hint: 'מחשבים בלי סימנים, ואז קובעים את הסימן.',
      solution: [
        `בלי סימנים: $${Math.abs(p)} \\div ${Math.abs(x)} = ${Math.abs(y)}$`,
        { tex: L`${par(p)} \div ${par(x)} = ${y}`, why: `הסימנים ${p * x > 0 ? 'שווים' : 'שונים'}, אז התוצאה ${y > 0 ? 'חיובית' : 'שלילית'}` },
      ],
    };
  },
};

/* ---------- מהו שבר? צמצום והרחבה ---------- */

const fractionsIntro: Topic = {
  id: 'fractions-intro',
  track: 'fractions',
  title: 'מהו שבר? צמצום והרחבה',
  grades: [3, 5],
  icon: '🍰',
  summary: 'שבר הוא חלק משלם. אפשר לכתוב אותו שבר בהרבה דרכים.',
  levels: ['מה צבוע?', 'הרחבה', 'צמצום'],
  lesson: {
    intro: 'כשמחלקים שלם לחלקים שווים, כל חלק הוא שבר. המכנה (למטה) הוא מספר החלקים, והמונה (למעלה) הוא כמה חלקים לקחנו.',
    sections: [
      {
        title: 'קוראים שבר',
        body: 'בפס הזה יש 4 חלקים שווים, ו-3 מהם צבועים. החלק הצבוע הוא $\\frac{3}{4}$: שלושה רבעים.',
        figure: { type: 'fracbar', parts: 4, filled: 3 },
      },
      {
        title: 'הרחבה: אותו שבר, יותר חלקים',
        body: 'אם חותכים כל רבע לשניים, יש 8 חלקים ו-6 צבועים. הכמות לא השתנתה: $\\frac{3}{4} = \\frac{3 \\times 2}{4 \\times 2} = \\frac{6}{8}$. מרחיבים על ידי כפל של המונה והמכנה באותו מספר.',
        figure: { type: 'fracbar', parts: 8, filled: 6 },
      },
      {
        title: 'צמצום: הדרך הפשוטה ביותר',
        body: 'צמצום הוא הפעולה ההפוכה: מחלקים מונה ומכנה באותו מספר. $\\frac{6}{8} = \\frac{6 \\div 2}{8 \\div 2} = \\frac{3}{4}$. מצמצמים עד שאין מספר שמחלק את שניהם.',
      },
    ],
    method: [
      'כדי לקרוא שבר: סופרים כמה חלקים יש (מכנה) וכמה צבועים (מונה).',
      'כדי להרחיב: בודקים פי כמה גדל המכנה, וכופלים גם את המונה באותו מספר.',
      'כדי לצמצם: מוצאים מספר שמחלק גם את המונה וגם את המכנה, ומחלקים את שניהם בו.',
    ],
    examples: [
      {
        problem: 'השלימו: $\\frac{2}{3} = \\frac{\\square}{12}$',
        steps: ['המכנה גדל מ-3 ל-12, כלומר פי 4: $3 \\times 4 = 12$', 'כופלים גם את המונה ב-4: $2 \\times 4 = 8$', 'לכן $\\frac{2}{3} = \\frac{8}{12}$'],
      },
      {
        problem: 'צמצמו עד הסוף: $\\frac{12}{18}$',
        steps: ['6 מחלק גם את 12 וגם את 18.', '$\\frac{12 \\div 6}{18 \\div 6} = \\frac{2}{3}$', 'אין מספר שמחלק גם את 2 וגם את 3, אז סיימנו.'],
      },
    ],
    tips: ['ככל שהמכנה גדול יותר, כל חלק קטן יותר: $\\frac{1}{8}$ קטן מ-$\\frac{1}{4}$.', 'בהרחבה ובצמצום עושים תמיד אותה פעולה למונה ולמכנה.'],
  },
  generate(level) {
    if (level === 1) {
      const parts = ri(2, 10);
      const filled = ri(1, parts - 1);
      return {
        text: 'איזה חלק מהפס צבוע? כתבו כשבר עם לוכסן.',
        figure: { type: 'fracbar', parts, filled },
        answer: { type: 'number', value: filled / parts, placeholder: '1/2' },
        hint: 'כמה חלקים יש בסך הכול? כמה מהם צבועים?',
        solution: [`הפס מחולק ל-${parts} חלקים שווים: זה המכנה.`, `${filled} חלקים צבועים: זה המונה.`, `החלק הצבוע הוא $\\frac{${filled}}{${parts}}$`],
      };
    }
    let a = ri(1, 8);
    let b = ri(a + 1, 10);
    const g = gcd(a, b);
    a /= g;
    b /= g;
    const k = ri(2, 6);
    if (level === 2) {
      return {
        text: 'השלימו את המספר החסר:',
        latex: L`\frac{${a}}{${b}} = \frac{\square}{${b * k}}`,
        answer: { type: 'number', value: a * k },
        hint: `פי כמה גדל המכנה?`,
        solution: [
          { tex: L`${b} \times ${k} = ${b * k}`, why: `המכנה גדל מ-${b} ל-${b * k}, כלומר פי ${k}` },
          { tex: L`${a} \times ${k} = ${a * k}`, why: `כופלים גם את המונה ב-${k}` },
          { tex: L`\frac{${a}}{${b}} = \frac{${a} \times ${k}}{${b} \times ${k}} = \frac{${a * k}}{${b * k}}` },
        ],
        short: [{ tex: L`\frac{${a}}{${b}} = \frac{${a * k}}{${b * k}}` }],
      };
    }
    return {
      text: 'צמצמו עד הסוף:',
      latex: L`\frac{${a * k}}{${b * k}}`,
      answer: { type: 'multi', labels: ['מונה', 'מכנה'], values: [a, b], ordered: true },
      hint: `חפשו מספר שמחלק גם את ${a * k} וגם את ${b * k}.`,
      solution: [
        `המספר הגדול ביותר שמחלק גם את ${a * k} וגם את ${b * k} הוא ${k}.`,
        {
          tex: L`\frac{${a * k} \div ${k}}{${b * k} \div ${k}} = \frac{${a}}{${b}}`,
          why: `אין מספר (חוץ מ-1) שמחלק גם את ${a} וגם את ${b}, אז סיימנו.`,
        },
      ],
      short: [{ tex: L`\frac{${a * k}}{${b * k}} = \frac{${a}}{${b}}` }],
    };
  },
};

/* ---------- כפל וחילוק שברים ---------- */

const fractionsMult: Topic = {
  id: 'fractions-mult',
  track: 'fractions',
  title: 'כפל וחילוק שברים',
  grades: [5, 6],
  icon: '🥧',
  summary: 'מונה כפול מונה, מכנה כפול מכנה. בחילוק הופכים את השבר השני וכופלים.',
  levels: ['שבר כפול מספר שלם', 'שבר כפול שבר', 'חילוק שברים'],
  lesson: {
    intro: 'כפל שברים פשוט יותר מחיבור: לא צריך מכנה משותף. כופלים מונה במונה ומכנה במכנה.',
    sections: [
      {
        title: 'שבר כפול מספר שלם',
        body: '$\\frac{2}{3} \\times 6$ פירושו שני שלישים מתוך 6. שליש מ-6 הוא 2, ושני שלישים הם 4: $\\frac{2 \\times 6}{3} = \\frac{12}{3} = 4$.',
      },
      {
        title: 'שבר כפול שבר',
        body: '$\\frac{1}{2} \\times \\frac{3}{4}$ פירושו חצי משלושה רבעים: $\\frac{1 \\times 3}{2 \\times 4} = \\frac{3}{8}$.',
      },
      {
        title: 'חילוק: הופכים וכופלים',
        body: 'לחלק בשבר זה כמו לכפול בשבר ההפוך. $\\frac{3}{4} \\div \\frac{1}{2} = \\frac{3}{4} \\times \\frac{2}{1} = \\frac{6}{4} = 1\\frac{1}{2}$. כמה חצאים נכנסים בשלושה רבעים? אחד וחצי.',
      },
    ],
    method: [
      'מספר שלם כותבים כשבר עם מכנה 1: $6 = \\frac{6}{1}$.',
      'בחילוק: הופכים את השבר השני (המונה והמכנה מתחלפים) ומשנים לכפל.',
      'כופלים מונה במונה ומכנה במכנה.',
      'מצמצמים את התוצאה.',
    ],
    examples: [
      {
        problem: 'חשבו: $\\frac{2}{5} \\times \\frac{3}{4}$',
        steps: ['$\\frac{2 \\times 3}{5 \\times 4} = \\frac{6}{20}$', 'מצמצמים ב-2: $\\frac{6}{20} = \\frac{3}{10}$'],
      },
      {
        problem: 'חשבו: $\\frac{2}{3} \\div \\frac{4}{9}$',
        steps: ['הופכים את השבר השני וכופלים: $\\frac{2}{3} \\times \\frac{9}{4}$', '$\\frac{2 \\times 9}{3 \\times 4} = \\frac{18}{12}$', 'מצמצמים ב-6: $\\frac{18}{12} = \\frac{3}{2}$'],
      },
    ],
    tips: ['הופכים רק את השבר שמחלקים בו (השני), לא את הראשון.', 'כפל בשבר קטן מ-1 מקטין את המספר: $\\frac{1}{2} \\times 8 = 4$.'],
  },
  generate(level) {
    if (level === 1) {
      const b = ri(2, 9);
      const a = ri(1, b - 1);
      const n = b * ri(1, 6);
      return {
        text: 'חשבו:',
        latex: L`\frac{${a}}{${b}} \times ${n}`,
        answer: { type: 'number', value: (a * n) / b },
        hint: `כופלים את המונה ב-${n}, ומחלקים במכנה.`,
        solution: [
          { tex: L`\frac{${a}}{${b}} \times ${n} = \frac{${a} \times ${n}}{${b}}`, why: 'כופלים את המונה במספר השלם' },
          { tex: L`\frac{${a * n}}{${b}} = ${(a * n) / b}`, why: `מחלקים: $${a * n} \\div ${b} = ${(a * n) / b}$` },
        ],
      };
    }
    const b = ri(2, 9);
    const a = ri(1, b - 1);
    const d = ri(2, 9);
    const c = ri(1, d - 1);
    if (level === 2) {
      const n = a * c;
      const m = b * d;
      return {
        text: 'חשבו וכתבו כשבר:',
        latex: L`\frac{${a}}{${b}} \times \frac{${c}}{${d}}`,
        answer: { type: 'number', value: n / m, placeholder: '3/4' },
        hint: 'מונה כפול מונה, מכנה כפול מכנה.',
        solution: [
          { tex: L`\frac{${a} \times ${c}}{${b} \times ${d}} = ${rawFrac(n, m)}`, why: 'מונה כפול מונה, מכנה כפול מכנה' },
          ...(gcd(n, m) > 1 ? [{ tex: L`${rawFrac(n, m)} = ${fracTex(n, m)}`, why: `מצמצמים ב-${gcd(n, m)}` }] : []),
        ],
      };
    }
    const n = a * d;
    const m = b * c;
    return {
      text: 'חשבו וכתבו כשבר:',
      latex: L`\frac{${a}}{${b}} \div \frac{${c}}{${d}}`,
      answer: { type: 'number', value: n / m, placeholder: '3/4' },
      hint: 'הופכים את השבר השני וכופלים.',
      solution: [
        { tex: L`\frac{${a}}{${b}} \times \frac{${d}}{${c}}`, why: 'הופכים את השבר השני ומשנים לכפל' },
        { tex: L`\frac{${a} \times ${d}}{${b} \times ${c}} = ${rawFrac(n, m)}` },
        ...(gcd(n, m) > 1 ? [{ tex: L`${rawFrac(n, m)} = ${fracTex(n, m)}`, why: `מצמצמים ב-${gcd(n, m)}` }] : []),
      ],
    };
  },
};

/* ---------- מספרים עשרוניים ---------- */

const fmt = (x: number, d: number) => x.toFixed(d);

const decimals: Topic = {
  id: 'decimals',
  track: 'fractions',
  title: 'מספרים עשרוניים',
  grades: [4, 6],
  icon: '🔟',
  summary: 'עשיריות ומאיות אחרי הנקודה: קריאה, חיבור, חיסור וכפל.',
  levels: ['משבר לעשרוני', 'חיבור וחיסור', 'כפל'],
  lesson: {
    intro: 'מספר עשרוני הוא דרך נוספת לכתוב שברים שהמכנה שלהם 10, 100 או 1000. הספרה הראשונה אחרי הנקודה היא העשיריות, והשנייה היא המאיות.',
    sections: [
      {
        title: 'עשיריות ומאיות',
        body: '$0.7 = \\frac{7}{10}$ (שבע עשיריות), ו-$0.23 = \\frac{23}{100}$ (עשרים ושלוש מאיות). במספר 3.45 יש 3 שלמים, 4 עשיריות ו-5 מאיות.',
      },
      {
        title: 'חיבור וחיסור: מיישרים את הנקודות',
        body: 'כותבים את המספרים זה מתחת לזה כך שהנקודות אחת מתחת לשנייה. אם חסרה ספרה, משלימים 0: $3.45 + 1.7 = 3.45 + 1.70 = 5.15$.',
      },
      {
        title: 'כפל: סופרים ספרות אחרי הנקודה',
        body: 'כופלים כאילו אין נקודה, ואז סופרים כמה ספרות יש אחרי הנקודה בשני הגורמים יחד. $0.3 \\times 0.4$: $3 \\times 4 = 12$, ויש שתי ספרות אחרי הנקודה, אז $0.12$.',
      },
    ],
    method: [
      'בחיבור ובחיסור: מיישרים נקודה מתחת לנקודה, משלימים אפסים, ומחשבים כרגיל.',
      'בכפל: כופלים בלי הנקודות.',
      'סופרים את הספרות אחרי הנקודה בשני הגורמים.',
      'מציבים את הנקודה בתוצאה כך שיהיו אחריה אותו מספר ספרות.',
    ],
    examples: [
      {
        problem: 'חשבו: $4.6 - 1.25$',
        steps: ['משלימים 0 כדי ליישר: $4.60 - 1.25$', { tex: vertical('4.60', '-', '1.25', '3.35') }],
      },
      {
        problem: 'חשבו: $1.2 \\times 0.3$',
        steps: ['בלי נקודות: $12 \\times 3 = 36$', 'ספרות אחרי הנקודה: אחת ב-1.2 ואחת ב-0.3, ביחד 2.', 'מציבים את הנקודה: $1.2 \\times 0.3 = 0.36$'],
      },
    ],
    tips: ['0.5 ו-0.50 הם אותו מספר. אפס בסוף, אחרי הנקודה, לא משנה את הערך.', '0.3 גדול מ-0.25, כי 0.30 גדול מ-0.25.'],
  },
  generate(level) {
    if (level === 1) {
      if (Math.random() < 0.5) {
        const n = ri(1, 9);
        return {
          text: 'כתבו כמספר עשרוני:',
          latex: L`\frac{${n}}{10}`,
          answer: { type: 'number', value: n / 10 },
          hint: 'עשיריות נכתבות בספרה הראשונה אחרי הנקודה.',
          solution: [`$\\frac{${n}}{10}$ הן ${n} עשיריות.`, `עשיריות נכתבות במקום הראשון אחרי הנקודה: $${fmt(n / 10, 1)}$`],
        };
      }
      const n = ri(11, 99);
      return {
        text: 'כתבו כמספר עשרוני:',
        latex: L`\frac{${n}}{100}`,
        answer: { type: 'number', value: n / 100 },
        hint: 'מאיות: שתי ספרות אחרי הנקודה.',
        solution: [`$\\frac{${n}}{100}$ הן ${n} מאיות.`, `מאיות תופסות שתי ספרות אחרי הנקודה: $${fmt(n / 100, 2)}$`],
      };
    }
    if (level === 2) {
      const a = ri(100, 999) / 100;
      const b = ri(10, 99) / 10;
      const plus = Math.random() < 0.5;
      const [x, y] = plus || a >= b ? [a, b] : [b, a];
      const res = round(plus ? x + y : x - y, 2);
      const sx = fmt(x, 2);
      const sy = fmt(y, 2);
      return {
        text: 'חשבו:',
        latex: `${x} ${plus ? '+' : '-'} ${y}`,
        answer: { type: 'number', value: res },
        hint: 'מיישרים את הנקודות ומשלימים 0 במקום החסר.',
        solution: [`מיישרים נקודה מתחת לנקודה: $${sx} ${plus ? '+' : '-'} ${sy}$`, { tex: vertical(sx, plus ? '+' : '-', sy, fmt(res, 2)) }],
      };
    }
    const p = ri(1, 9);
    const q = ri(2, 9);
    const [da, db] = pick([
      [1, 1],
      [1, 0],
      [2, 0],
    ] as const);
    const whole = da && Math.random() < 0.5 ? ri(1, 3) : 0;
    const a = (whole * 10 ** da + p) / 10 ** da;
    const b = q / 10 ** db;
    const A = Math.round(a * 10 ** da);
    const B = Math.round(b * 10 ** db);
    const k = da + db;
    const res = round((A * B) / 10 ** k, 4);
    return {
      text: 'חשבו:',
      latex: L`${a} \times ${b}`,
      answer: { type: 'number', value: res },
      hint: 'כופלים בלי הנקודות, ואז סופרים ספרות אחרי הנקודה.',
      solution: [
        `בלי נקודות: $${A} \\times ${B} = ${A * B}$`,
        db === 0
          ? `ב-${a} יש ${da === 1 ? 'ספרה אחת' : 'שתי ספרות'} אחרי הנקודה, וב-${b} אין.`
          : `ב-${a} יש ספרה אחת אחרי הנקודה, וגם ב-${b}. ביחד שתי ספרות.`,
        {
          tex: `${a} \\times ${b} = ${fmt(res, k).replace(/0+$/, '').replace(/\.$/, '')}`,
          why: `מציבים את הנקודה כך שיהיו אחריה ${k === 1 ? 'ספרה אחת' : 'שתי ספרות'}: $${fmt((A * B) / 10 ** k, k)}$`,
        },
      ],
    };
  },
};

export const elementaryTopics2: Topic[] = [placeValue, longMult, longDivision, divisibility, negatives, fractionsIntro, fractionsMult, decimals];
