import type { Topic } from '../lib/types';
import { L, fracTex, gcd, par, pick, polyTex, rawFrac, ri, round, sgn } from '../lib/util';

/* ---------- עזרים ---------- */

const nz = (lo: number, hi: number) => {
  let v = ri(lo, hi);
  while (v === 0) v = ri(lo, hi);
  return v;
};
const num = (x: number) => String(round(x, 4));
/** דגימה של פונקציה לשרטוט */
const sample = (f: (x: number) => number, R: number): [number, number][] =>
  Array.from({ length: 121 }, (_, i) => {
    const x = -R + (i * 2 * R) / 120;
    return [x, f(x)];
  });

/* ---------- דמיון משולשים ---------- */

const similarity: Topic = {
  id: 'similarity',
  track: 'geometry',
  title: 'דמיון משולשים',
  grades: [9, 10],
  icon: '🔍',
  summary: 'משולשים באותה צורה ובגודל אחר: יחס הדמיון, צלעות ושטחים.',
  levels: ['יחס הדמיון', 'צלע חסרה', 'יחס השטחים'],
  lesson: {
    intro: 'שני משולשים דומים אם יש להם אותן זוויות. אז אחד הוא הגדלה (או הקטנה) של השני, וכל הצלעות גדלות באותו יחס.',
    sections: [
      {
        title: 'יחס הדמיון',
        body: 'אם $\\triangle ABC \\sim \\triangle DEF$, אז $\\frac{DE}{AB} = \\frac{EF}{BC} = \\frac{DF}{AC} = k$. המספר $k$ נקרא יחס הדמיון.',
      },
      {
        title: 'מתי משולשים דומים?',
        body: 'מספיק ששתי זוויות שוות (ז.ז), כי אז גם השלישית שווה. אפשר גם: שלוש צלעות באותו יחס (צ.צ.צ), או שתי צלעות באותו יחס והזווית שביניהן שווה (צ.ז.צ).',
      },
      {
        title: 'שטחים',
        body: 'כשהצלעות גדלות פי $k$, השטח גדל פי $k^2$. משולש שצלעותיו גדולות פי 3, שטחו גדול פי 9.',
      },
    ],
    method: ['מתאימים צלעות לפי סדר האותיות.', 'מחשבים את יחס הדמיון מזוג צלעות ידוע.', 'כופלים או מחלקים בו כדי למצוא צלע חסרה.', 'לשטח: מעלים את היחס בריבוע.'],
    examples: [
      {
        problem: '$\\triangle ABC \\sim \\triangle DEF$, ‏$AB = 4$, ‏$DE = 10$, ‏$BC = 6$. מה $EF$?',
        steps: [{ tex: 'k = \\frac{10}{4} = 2.5', why: 'יחס הדמיון' }, { tex: 'EF = 6 \\times 2.5 = 15' }],
      },
    ],
    tips: ['יחס השטחים הוא ריבוע יחס הדמיון, לא היחס עצמו.', 'מקפידים על סדר: צלע של המשולש השני חלקי הצלע המתאימה בראשון.'],
  },
  generate(level) {
    const k = pick([1.5, 2, 2.5, 3, 4]);
    const ab = pick([2, 4, 6, 8]);
    const bc = pick([4, 6, 8, 10]);
    const de = ab * k;
    if (level === 1)
      return {
        text: `$\\triangle ABC \\sim \\triangle DEF$, ‏$AB = ${ab}$, ‏$DE = ${num(de)}$. מהו יחס הדמיון $\\frac{DE}{AB}$?`,
        answer: { type: 'number', value: k },
        hint: 'מחלקים צלע במשולש השני בצלע המתאימה בראשון.',
        solution: [{ tex: L`k = \frac{DE}{AB} = \frac{${num(de)}}{${ab}} = ${num(k)}` }],
      };
    if (level === 2)
      return {
        text: `$\\triangle ABC \\sim \\triangle DEF$, ‏$AB = ${ab}$, ‏$DE = ${num(de)}$, ‏$BC = ${bc}$. מה אורך $EF$?`,
        answer: { type: 'number', value: bc * k },
        hint: 'מצאו את יחס הדמיון, וכפלו בו את BC.',
        solution: [
          { tex: L`k = \frac{${num(de)}}{${ab}} = ${num(k)}`, why: 'יחס הדמיון' },
          { tex: L`EF = ${bc} \times ${num(k)} = ${num(bc * k)}`, why: '$EF$ מתאימה ל-$BC$' },
        ],
      };
    const area = ri(3, 20);
    return {
      text: `$\\triangle ABC \\sim \\triangle DEF$ ביחס דמיון $${num(k)}$ (המשולש השני גדול יותר). שטח $\\triangle ABC$ הוא ${area}. מה שטח $\\triangle DEF$?`,
      answer: { type: 'number', value: round(area * k * k, 4) },
      hint: 'השטח גדל פי ריבוע יחס הדמיון.',
      solution: [
        { tex: L`k^2 = ${num(k)}^2 = ${num(k * k)}`, why: 'יחס השטחים הוא ריבוע יחס הדמיון' },
        { tex: L`${area} \times ${num(k * k)} = ${num(area * k * k)}` },
      ],
    };
  },
};

/* ---------- גאומטריה אנליטית ---------- */

const analytic: Topic = {
  id: 'analytic',
  track: 'geometry',
  title: 'גאומטריה אנליטית',
  grades: [10, 12],
  icon: '📍',
  summary: 'נקודות במערכת צירים: מרחק, אמצע קטע, שיפוע ומשוואת ישר.',
  levels: ['אמצע קטע', 'מרחק בין נקודות', 'ישר דרך שתי נקודות'],
  lesson: {
    intro: 'בגאומטריה אנליטית כל נקודה היא זוג מספרים $(x, y)$, וכך אפשר לחשב אורכים ושיפועים בעזרת אלגברה.',
    sections: [
      {
        title: 'אמצע קטע',
        body: 'האמצע של הקטע בין $(x_1, y_1)$ ל-$(x_2, y_2)$ הוא הממוצע של הקואורדינטות: $\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$.',
      },
      {
        title: 'מרחק',
        body: 'המרחק בין שתי נקודות נובע ממשפט פיתגורס: $d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.',
        figure: { type: 'graph', lines: [], points: [[-3, -1], [3, 7]], range: 8 },
      },
      {
        title: 'שיפוע ומשוואת ישר',
        body: 'השיפוע הוא $m = \\frac{y_2 - y_1}{x_2 - x_1}$. אחר כך מציבים נקודה ב-$y = mx + b$ כדי למצוא את $b$.',
      },
    ],
    method: ['רושמים את שתי הנקודות עם שמות: $(x_1, y_1)$ ו-$(x_2, y_2)$.', 'מציבים בנוסחה המתאימה, עם סוגריים סביב מספרים שליליים.', 'מחשבים ובודקים שהתשובה הגיונית לפי השרטוט.'],
    examples: [
      {
        problem: 'מה המרחק בין $(1, 2)$ ל-$(4, 6)$?',
        steps: [{ tex: 'd = \\sqrt{(4 - 1)^2 + (6 - 2)^2}' }, { tex: '= \\sqrt{9 + 16} = \\sqrt{25} = 5' }],
      },
    ],
    tips: ['במרחק, הסדר לא משנה: ריבוע של מספר שלילי חיובי.', 'בשיפוע, אותו סדר במונה ובמכנה.'],
  },
  generate(level) {
    if (level === 1) {
      const mx = nz(-6, 6);
      const my = ri(-6, 6);
      const dx = ri(1, 5);
      const dy = ri(-5, 5);
      const [x1, y1, x2, y2] = [mx - dx, my - dy, mx + dx, my + dy];
      return {
        text: `מצאו את אמצע הקטע שבין $(${x1}, ${y1})$ ל-$(${x2}, ${y2})$.`,
        answer: { type: 'multi', labels: ['x', 'y'], values: [mx, my], ordered: true },
        hint: 'ממוצע של שני ה-x וממוצע של שני ה-y.',
        solution: [{ tex: L`x = \frac{${x1} + ${par(x2)}}{2} = ${mx}` }, { tex: L`y = \frac{${y1} + ${par(y2)}}{2} = ${my}` }],
      };
    }
    if (level === 2) {
      const [dx, dy, d] = pick([
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
        [8, 6, 10],
        [4, 3, 5],
        [12, 5, 13],
      ]);
      const x1 = ri(-5, 3);
      const y1 = ri(-5, 3);
      const x2 = x1 + dx * pick([1, -1]);
      const y2 = y1 + dy * pick([1, -1]);
      return {
        text: `מה המרחק בין $(${x1}, ${y1})$ ל-$(${x2}, ${y2})$?`,
        figure: { type: 'graph', lines: [], points: [[x1, y1], [x2, y2]], range: 16 },
        answer: { type: 'number', value: d },
        hint: 'הפרש ה-x בריבוע, ועוד הפרש ה-y בריבוע, ואז שורש.',
        solution: [
          { tex: L`d = \sqrt{(${x2} - ${par(x1)})^2 + (${y2} - ${par(y1)})^2}` },
          { tex: L`= \sqrt{${par(x2 - x1)}^2 + ${par(y2 - y1)}^2} = \sqrt{${dx * dx} + ${dy * dy}}` },
          { tex: L`= \sqrt{${d * d}} = ${d}` },
        ],
      };
    }
    const m = nz(-3, 3);
    const b = ri(-6, 6);
    const x1 = ri(-4, 0);
    const x2 = x1 + ri(1, 4);
    const y1 = m * x1 + b;
    const y2 = m * x2 + b;
    return {
      text: `מצאו את משוואת הישר שעובר דרך $(${x1}, ${y1})$ ו-$(${x2}, ${y2})$, בצורה $y = mx + b$.`,
      answer: { type: 'multi', labels: ['m', 'b'], values: [m, b], ordered: true },
      hint: 'קודם השיפוע, אחר כך מציבים נקודה כדי למצוא את b.',
      solution: [
        { tex: L`m = \frac{${y2} - ${par(y1)}}{${x2} - ${par(x1)}} = \frac{${y2 - y1}}{${x2 - x1}} = ${m}`, why: 'שיפוע' },
        { tex: L`${y1} = ${m} \times ${par(x1)} + b`, why: `מציבים את הנקודה $(${x1}, ${y1})$` },
        { tex: `${y1} = ${m * x1} + b`, op: m * x1 >= 0 ? `- ${m * x1}` : `+ ${-m * x1}` },
        { tex: `b = ${b}` },
        { tex: `y = ${polyTex([m, b])}` },
      ],
    };
  },
};

/* ---------- סדרות ---------- */

const sequences: Topic = {
  id: 'sequences',
  track: 'algebra',
  title: 'סדרה חשבונית והנדסית',
  grades: [10, 11],
  icon: '🔁',
  summary: 'סדרות שבהן מוסיפים כל פעם אותו מספר, או כופלים כל פעם באותו מספר.',
  levels: ['איבר בסדרה חשבונית', 'סכום סדרה חשבונית', 'סדרה הנדסית'],
  lesson: {
    intro: 'סדרה היא רשימה מסודרת של מספרים: $a_1, a_2, a_3, \\ldots$. בסדרה חשבונית מוסיפים כל פעם הפרש קבוע $d$. בסדרה הנדסית כופלים כל פעם במנה קבועה $q$.',
    sections: [
      {
        title: 'האיבר הכללי בסדרה חשבונית',
        body: 'כדי להגיע לאיבר ה-$n$, מוסיפים את $d$ בדיוק $n - 1$ פעמים: $a_n = a_1 + (n - 1)d$. בסדרה $3, 7, 11, \\ldots$ האיבר העשירי הוא $3 + 9 \\times 4 = 39$.',
      },
      {
        title: 'סכום סדרה חשבונית',
        body: 'מחברים את הראשון והאחרון, כופלים במספר האיברים ומחלקים ב-2: $S_n = \\frac{n(a_1 + a_n)}{2}$. כך חישב גאוס הצעיר את $1 + 2 + \\cdots + 100 = 5050$.',
      },
      {
        title: 'סדרה הנדסית',
        body: '$a_n = a_1 \\cdot q^{n - 1}$. בסדרה $2, 6, 18, \\ldots$ המנה היא 3, והאיבר החמישי הוא $2 \\cdot 3^4 = 162$.',
      },
    ],
    method: ['מזהים את סוג הסדרה: הפרש קבוע או מנה קבועה.', 'מוצאים את $a_1$ ואת $d$ או $q$.', 'מציבים בנוסחה המתאימה.'],
    examples: [
      {
        problem: 'מה סכום 20 האיברים הראשונים בסדרה $5, 8, 11, \\ldots$?',
        steps: [{ tex: 'a_{20} = 5 + 19 \\cdot 3 = 62', why: 'האיבר האחרון' }, { tex: 'S_{20} = \\frac{20(5 + 62)}{2} = 670' }],
      },
    ],
    tips: ['ב-$a_n$ כופלים ב-$n - 1$ ולא ב-$n$: לאיבר הראשון לא הוספנו כלום.', 'ההפרש $d$ יכול להיות שלילי, והמנה $q$ יכולה להיות שבר.'],
  },
  generate(level) {
    const a1 = ri(-5, 12);
    const d = nz(-5, 7);
    const n = ri(6, 25);
    const first = [a1, a1 + d, a1 + 2 * d].join(', ');
    const an = a1 + (n - 1) * d;
    if (level === 1)
      return {
        text: `מהו האיבר ה-${n} בסדרה $${first}, \\ldots$?`,
        answer: { type: 'number', value: an },
        hint: 'מצאו את ההפרש d והציבו ב-$a_n = a_1 + (n - 1)d$.',
        solution: [
          { tex: `d = ${a1 + d} - ${par(a1)} = ${d}`, why: 'ההפרש בין שני איברים סמוכים' },
          { tex: L`a_{${n}} = ${a1} + ${n - 1} \cdot ${par(d)} = ${an}` },
        ],
      };
    if (level === 2) {
      const s = (n * (a1 + an)) / 2;
      return {
        text: `מה סכום ${n} האיברים הראשונים בסדרה $${first}, \\ldots$?`,
        answer: { type: 'number', value: s },
        hint: 'מצאו קודם את האיבר האחרון, ואז $S_n = \\frac{n(a_1 + a_n)}{2}$.',
        solution: [
          { tex: L`a_{${n}} = ${a1} + ${n - 1} \cdot ${par(d)} = ${an}`, why: 'האיבר האחרון' },
          { tex: L`S_{${n}} = \frac{${n}(${a1} + ${par(an)})}{2} = \frac{${n} \cdot ${a1 + an}}{2} = ${s}` },
        ],
      };
    }
    const g1 = pick([1, 2, 3, 5]);
    const q = pick([2, 3, -2]);
    const k = ri(4, q === 3 ? 6 : 8);
    const gk = g1 * q ** (k - 1);
    return {
      text: `מהו האיבר ה-${k} בסדרה ההנדסית $${g1}, ${g1 * q}, ${g1 * q * q}, \\ldots$?`,
      answer: { type: 'number', value: gk },
      hint: 'מצאו את המנה q והציבו ב-$a_n = a_1 \\cdot q^{n - 1}$.',
      solution: [
        { tex: L`q = \frac{${g1 * q}}{${g1}} = ${q}`, why: 'המנה בין שני איברים סמוכים' },
        { tex: L`a_{${k}} = ${g1} \cdot ${par(q)}^{${k - 1}} = ${g1} \cdot ${q ** (k - 1)} = ${gk}` },
      ],
    };
  },
};

/* ---------- פרבולה ---------- */

const parabola: Topic = {
  id: 'parabola',
  track: 'functions',
  title: 'הפונקציה הריבועית (פרבולה)',
  grades: [9, 10],
  icon: '⌒',
  summary: 'קודקוד, חיתוך עם הצירים, ומתי הפרבולה פונה למעלה או למטה.',
  levels: ['קודקוד', 'חיתוך עם ציר x', 'ערך מינימלי או מקסימלי'],
  lesson: {
    intro: 'הגרף של $y = ax^2 + bx + c$ הוא פרבולה. אם $a > 0$ היא פונה למעלה (כמו חיוך), ואם $a < 0$ היא פונה למטה.',
    sections: [
      {
        title: 'הקודקוד',
        body: 'הקודקוד הוא הנקודה הנמוכה (או הגבוהה) ביותר. ה-$x$ שלו: $x = \\frac{-b}{2a}$. את ה-$y$ מוצאים בהצבה.',
        figure: { type: 'graph', lines: [], curves: [sample((x) => 0.5 * (x - 2) ** 2 - 3, 8)], points: [[2, -3]] },
      },
      {
        title: 'חיתוך עם הצירים',
        body: 'עם ציר $y$: מציבים $x = 0$ ומקבלים $y = c$. עם ציר $x$: פותרים $ax^2 + bx + c = 0$, ויכולות להיות 0, 1 או 2 נקודות.',
      },
      {
        title: 'צורת קודקוד',
        body: '$y = a(x - p)^2 + k$: הקודקוד הוא $(p, k)$. אם $a > 0$, הערך הקטן ביותר של הפונקציה הוא $k$.',
      },
    ],
    method: ['מזהים את $a$, ‏$b$ ו-$c$.', 'מוצאים את ה-$x$ של הקודקוד: $\\frac{-b}{2a}$.', 'מציבים כדי למצוא את ה-$y$.', 'לפי הסימן של $a$ קובעים אם זה מינימום או מקסימום.'],
    examples: [
      {
        problem: 'מצאו את הקודקוד של $y = x^2 - 6x + 5$',
        steps: [{ tex: 'x = \\frac{-(-6)}{2 \\cdot 1} = 3' }, { tex: 'y = 3^2 - 6 \\cdot 3 + 5 = -4', why: 'מציבים' }, 'הקודקוד: $(3, -4)$'],
      },
    ],
    tips: ['הפרבולה סימטרית סביב הקו האנכי שעובר בקודקוד.', 'ב-$\\frac{-b}{2a}$ שימו לב לסימן של $b$.'],
  },
  generate(level) {
    const a = pick([1, 1, -1, 2]);
    const p = ri(-4, 4);
    const k = ri(-6, 6);
    const b = -2 * a * p;
    const c = a * p * p + k;
    const f = (x: number) => a * x * x + b * x + c;
    const fig = { type: 'graph' as const, lines: [], curves: [sample(f, 8)] };
    if (level === 1)
      return {
        text: 'מצאו את הקודקוד של הפרבולה:',
        latex: `y = ${polyTex([a, b, c])}`,
        answer: { type: 'multi', labels: ['x', 'y'], values: [p, k], ordered: true },
        hint: 'x של הקודקוד הוא $\\frac{-b}{2a}$.',
        solution: [
          { tex: L`x = \frac{-${par(b)}}{2 \cdot ${par(a)}} = ${p}` },
          { tex: L`y = ${polyTex([a, b, c]).replace(/x/g, `(${p})`)} = ${k}`, why: 'מציבים את ה-x בפונקציה' },
          `הקודקוד: $(${p}, ${k})$`,
        ],
      };
    if (level === 2) {
      const r1 = ri(-6, 5);
      const r2 = r1 + ri(1, 6);
      const B = -(r1 + r2);
      const C = r1 * r2;
      return {
        text: 'מצאו את נקודות החיתוך של הפרבולה עם ציר x:',
        latex: `y = ${polyTex([1, B, C])}`,
        figure: { type: 'graph', lines: [], curves: [sample((x) => x * x + B * x + C, 8)] },
        answer: { type: 'multi', labels: ['x₁', 'x₂'], values: [r1, r2], ordered: false },
        hint: 'מציבים y = 0 ופותרים משוואה ריבועית.',
        solution: [
          { tex: `${polyTex([1, B, C])} = 0`, why: 'על ציר x מתקיים $y = 0$' },
          { tex: `(x ${sgn(-r1)})(x ${sgn(-r2)}) = 0`, why: `מפרקים: שני מספרים שמכפלתם ${C} וסכומם ${B}` },
          { tex: `x_1 = ${r1},\\; x_2 = ${r2}` },
        ],
      };
    }
    const sign = a > 0 ? 'הקטן' : 'הגדול';
    return {
      text: `מהו הערך ${sign} ביותר של הפונקציה?`,
      latex: `y = ${a === 1 ? '' : a === -1 ? '-' : a}(x ${sgn(-p)})^2 ${sgn(k)}`.replace('(x + 0)', 'x').replace('(x - 0)', 'x'),
      figure: fig,
      answer: { type: 'number', value: k },
      hint: 'בצורת קודקוד $a(x - p)^2 + k$ הקודקוד הוא (p, k).',
      solution: [
        `הפונקציה בצורת קודקוד, והקודקוד הוא $(${p}, ${k})$.`,
        `$a ${a > 0 ? '> 0' : '< 0'}$, אז הפרבולה פונה ${a > 0 ? 'למעלה' : 'למטה'} והקודקוד הוא ${a > 0 ? 'מינימום' : 'מקסימום'}.`,
        `הערך ${sign} ביותר: $${k}$`,
      ],
    };
  },
};

/* ---------- פונקציה מעריכית ---------- */

const exponential: Topic = {
  id: 'exponential',
  track: 'functions',
  title: 'פונקציה מעריכית וגדילה ודעיכה',
  grades: [10, 11],
  icon: '📈',
  summary: 'כשכמות מוכפלת כל פעם באותו מספר: ריבית, אוכלוסייה ודעיכה.',
  levels: ['ערך הפונקציה', 'גדילה באחוזים', 'משוואה מעריכית'],
  lesson: {
    intro: 'בפונקציה מעריכית $f(x) = a \\cdot b^x$ המשתנה נמצא במעריך. כל פעם ש-$x$ גדל ב-1, הערך מוכפל ב-$b$.',
    sections: [
      {
        title: 'גדילה ודעיכה',
        body: 'אם $b > 1$ הפונקציה גדלה (גדילה), ואם $0 < b < 1$ היא קטנה (דעיכה). ב-$x = 0$ הערך הוא תמיד $a$.',
        figure: { type: 'graph', lines: [], curves: [sample((x) => 2 ** x, 8), sample((x) => 0.5 ** x, 8)] },
      },
      {
        title: 'אחוזים',
        body: 'גדילה של 10% בשנה פירושה כפל ב-1.1 בכל שנה. ירידה של 20% פירושה כפל ב-0.8. אחרי $t$ שנים: $a \\cdot 1.1^t$.',
      },
      {
        title: 'משוואה מעריכית',
        body: 'כשאפשר לכתוב את שני האגפים עם אותו בסיס, משווים מעריכים: $2^x = 32 = 2^5$, ולכן $x = 5$.',
      },
    ],
    method: ['מזהים את הערך ההתחלתי $a$ ואת מקדם הגדילה $b$.', 'באחוזים: $b = 1 + \\frac{p}{100}$ לגדילה, $1 - \\frac{p}{100}$ לדעיכה.', 'במשוואה: כותבים את שני הצדדים כחזקה של אותו בסיס.'],
    examples: [
      {
        problem: 'בבנק 2000 ש"ח בריבית של 5% בשנה. כמה יהיו אחרי 2 שנים?',
        steps: [{ tex: '2000 \\cdot 1.05^2 = 2000 \\cdot 1.1025 = 2205' }],
      },
    ],
    tips: ['גדילה של 10% פעמיים היא 21%, לא 20%.', 'בפונקציה מעריכית $b$ תמיד חיובי.'],
  },
  generate(level) {
    if (level === 1) {
      const a = pick([1, 2, 3, 5]);
      const b = pick([2, 3]);
      const x = ri(1, b === 2 ? 6 : 4);
      return {
        text: `נתון $f(x) = ${a === 1 ? '' : `${a} \\cdot `}${b}^x$. חשבו את $f(${x})$.`,
        answer: { type: 'number', value: a * b ** x },
        hint: `מציבים ${x} במקום x.`,
        solution: [{ tex: L`f(${x}) = ${a === 1 ? '' : `${a} \cdot `}${b}^{${x}} = ${a === 1 ? '' : `${a} \cdot `}${b ** x} = ${a * b ** x}` }],
      };
    }
    if (level === 2) {
      const P = pick([1000, 2000, 5000, 10000]);
      const p = pick([5, 10, 20]);
      const t = ri(2, 3);
      const down = Math.random() < 0.4;
      const f = down ? 1 - p / 100 : 1 + p / 100;
      const res = round(P * f ** t, 2);
      return {
        text: down
          ? `ערך של מכונית ${P} ש"ח יורד ב-${p}% בכל שנה. מה יהיה ערכה אחרי ${t} שנים?`
          : `הפקידו ${P} ש"ח בחיסכון שגדל ב-${p}% בכל שנה. כמה יהיו בו אחרי ${t} שנים?`,
        answer: { type: 'number', value: res, tol: 0.01, unit: 'ש"ח' },
        hint: `בכל שנה כופלים ב-${f}.`,
        solution: [
          { tex: `b = ${down ? `1 - ${p / 100}` : `1 + ${p / 100}`} = ${f}`, why: `${down ? 'ירידה' : 'עלייה'} של ${p}% בכל שנה` },
          { tex: L`${P} \cdot ${f}^{${t}} = ${P} \cdot ${num(f ** t)} = ${num(res)}` },
        ],
      };
    }
    const b = pick([2, 3, 5]);
    const x = ri(2, b === 2 ? 7 : 4);
    const shift = ri(0, 3);
    return {
      text: 'פתרו את המשוואה:',
      latex: shift ? `${b}^{x - ${shift}} = ${b ** x}` : `${b}^x = ${b ** x}`,
      answer: { type: 'multi', labels: ['x'], values: [x + shift], ordered: true },
      hint: `כתבו את ${b ** x} כחזקה של ${b}.`,
      solution: [
        { tex: `${b ** x} = ${b}^{${x}}`, why: `${b ** x} הוא ${b} כפול עצמו ${x} פעמים` },
        { tex: shift ? `x - ${shift} = ${x}` : `x = ${x}`, why: 'אותו בסיס, אז המעריכים שווים', ...(shift ? { op: `+ ${shift}` } : {}) },
        ...(shift ? [{ tex: `x = ${x + shift}` }] : []),
      ],
    };
  },
};

/* ---------- לוגריתמים ---------- */

const logarithms: Topic = {
  id: 'logarithms',
  track: 'functions',
  title: 'לוגריתמים',
  grades: [11, 12],
  icon: '🪵',
  summary: 'השאלה ההפוכה לחזקה: באיזו חזקה צריך להעלות את הבסיס?',
  levels: ['חישוב לוגריתם', 'חוקי לוגריתמים', 'משוואה לוגריתמית'],
  lesson: {
    intro: '$\\log_b a$ הוא המעריך שצריך להעלות בו את $b$ כדי לקבל $a$. למשל $\\log_2 8 = 3$, כי $2^3 = 8$.',
    sections: [
      {
        title: 'ההגדרה',
        body: '$\\log_b a = c$ שקול ל-$b^c = a$. לכן $\\log_{10} 1000 = 3$, ‏$\\log_5 25 = 2$, ו-$\\log_b 1 = 0$ לכל בסיס.',
      },
      {
        title: 'חוקים',
        body: 'לוג של מכפלה הוא סכום הלוגים: $\\log_b(xy) = \\log_b x + \\log_b y$. לוג של מנה הוא הפרש. ולוג של חזקה: $\\log_b(x^n) = n \\log_b x$.',
      },
      {
        title: 'משוואות',
        body: 'כדי לפתור $\\log_3(x - 1) = 2$, עוברים לחזקה: $x - 1 = 3^2 = 9$, ולכן $x = 10$.',
      },
    ],
    method: ['כדי לחשב: שואלים "$b$ בחזקת מה נותן $a$?".', 'בחוקים: מחברים או מחסרים לוגים עם אותו בסיס לפני החישוב.', 'במשוואה: מבודדים את הלוג ועוברים לצורת חזקה.'],
    examples: [
      {
        problem: 'חשבו: $\\log_2 4 + \\log_2 8$',
        steps: [{ tex: '\\log_2 (4 \\cdot 8) = \\log_2 32', why: 'סכום לוגים הוא לוג של מכפלה' }, { tex: '= 5', why: '$2^5 = 32$' }],
      },
    ],
    tips: ['$\\log_b(x + y)$ אינו $\\log_b x + \\log_b y$.', 'אחרי שפותרים משוואה, בודקים שמה שבתוך הלוג חיובי.'],
  },
  generate(level) {
    const b = pick([2, 3, 5, 10]);
    const maxE = b === 2 ? 7 : b === 10 ? 5 : 4;
    if (level === 1) {
      const e = ri(0, maxE);
      return {
        text: 'חשבו:',
        latex: L`\log_{${b}} ${b ** e}`,
        answer: { type: 'number', value: e },
        hint: `${b} בחזקת מה נותן ${b ** e}?`,
        solution: [{ tex: L`${b}^{${e}} = ${b ** e}`, why: `שואלים: ${b} בחזקת מה נותן ${b ** e}?` }, { tex: L`\log_{${b}} ${b ** e} = ${e}` }],
      };
    }
    if (level === 2) {
      const e1 = ri(1, maxE - 1);
      const e2 = ri(1, maxE - e1);
      const minus = Math.random() < 0.4;
      const x = b ** (minus ? e1 + e2 : e1);
      const y = b ** e2;
      const res = minus ? e1 : e1 + e2;
      return {
        text: 'חשבו:',
        latex: L`\log_{${b}} ${x} ${minus ? '-' : '+'} \log_{${b}} ${y}`,
        answer: { type: 'number', value: res },
        hint: minus ? 'הפרש לוגים הוא לוג של מנה.' : 'סכום לוגים הוא לוג של מכפלה.',
        solution: [
          { tex: L`\log_{${b}} ${x} = ${minus ? e1 + e2 : e1},\; \log_{${b}} ${y} = ${e2}`, why: 'מחשבים כל לוג בנפרד' },
          { tex: `${minus ? e1 + e2 : e1} ${minus ? '-' : '+'} ${e2} = ${res}` },
          minus ? `אפשר גם לפי החוק: $\\log_{${b}} \\frac{${x}}{${y}} = \\log_{${b}} ${x / y} = ${res}$` : `אפשר גם לפי החוק: $\\log_{${b}} (${x} \\cdot ${y}) = \\log_{${b}} ${x * y} = ${res}$`,
        ],
      };
    }
    const e = ri(1, Math.min(maxE, 4));
    const s = ri(-5, 5);
    const x = b ** e + s;
    return {
      text: 'פתרו את המשוואה:',
      latex: s === 0 ? L`\log_{${b}} x = ${e}` : L`\log_{${b}}(x ${sgn(-s)}) = ${e}`,
      answer: { type: 'multi', labels: ['x'], values: [x], ordered: true },
      hint: 'עוברים לצורת חזקה: מה שבתוך הלוג שווה לבסיס בחזקת התוצאה.',
      solution: [
        { tex: s === 0 ? L`x = ${b}^{${e}}` : L`x ${sgn(-s)} = ${b}^{${e}}`, why: 'לפי הגדרת הלוגריתם' },
        ...(s === 0 ? [] : [{ tex: `x ${sgn(-s)} = ${b ** e}`, op: s > 0 ? `+ ${s}` : `- ${-s}` }]),
        { tex: `x = ${x}` },
        `בודקים: $${b ** e} > 0$, אז הלוג מוגדר.`,
      ],
    };
  },
};

/* ---------- דיאגרמת עץ ---------- */

const tree: Topic = {
  id: 'tree-diagram',
  track: 'data',
  title: 'דיאגרמת עץ והסתברות מותנית',
  grades: [10, 11],
  icon: '🌳',
  summary: 'ניסויים בשלבים: כופלים לאורך ענף, מחברים בין ענפים.',
  levels: ['שני שלבים בלתי תלויים', 'לפחות אחד', 'בלי החזרה'],
  lesson: {
    intro: 'כשניסוי מתרחש בשלבים, מציירים עץ: כל שלב מתפצל לאפשרויות, ועל כל ענף כותבים את ההסתברות שלו.',
    sections: [
      {
        title: 'כופלים לאורך ענף',
        body: 'ההסתברות להגיע לסוף ענף היא מכפלת ההסתברויות לאורכו. ההסתברות לשני ראשים בשתי הטלות מטבע: $\\frac{1}{2} \\cdot \\frac{1}{2} = \\frac{1}{4}$.',
      },
      {
        title: 'מחברים בין ענפים',
        body: 'אם כמה ענפים מתאימים למה ששואלים, מחברים את ההסתברויות שלהם. "לפחות אחד" קל לחשב בדרך ההפוכה: 1 פחות ההסתברות לאף אחד.',
      },
      {
        title: 'בלי החזרה',
        body: 'כשמוציאים כדור ולא מחזירים, בשלב השני יש כדור אחד פחות. בקופסה עם 3 אדומים ו-2 כחולים: ההסתברות לשני אדומים היא $\\frac{3}{5} \\cdot \\frac{2}{4} = \\frac{6}{20} = \\frac{3}{10}$.',
      },
    ],
    method: ['מציירים עץ עם כל השלבים.', 'כותבים הסתברות על כל ענף. בלי החזרה, מעדכנים את המספרים בשלב השני.', 'כופלים לאורך הענפים המתאימים, ומחברים ביניהם.'],
    examples: [
      {
        problem: 'מטילים קובייה פעמיים. מה ההסתברות ששתי ההטלות יהיו 6?',
        steps: [{ tex: '\\frac{1}{6} \\cdot \\frac{1}{6} = \\frac{1}{36}', why: 'כופלים לאורך הענף' }],
      },
    ],
    tips: ['בסוף, סכום ההסתברויות של כל הענפים הוא 1.', 'בלי החזרה גם המכנה קטן ב-1 בשלב השני.'],
  },
  generate(level) {
    if (level === 1) {
      const [n1, d1] = pick([
        [1, 2],
        [1, 6],
        [1, 3],
        [2, 5],
        [3, 4],
      ]);
      const [n2, d2] = pick([
        [1, 2],
        [1, 6],
        [1, 4],
        [3, 5],
      ]);
      return {
        text: `ההסתברות שדנה תפגע במטרה היא $\\frac{${n1}}{${d1}}$, וההסתברות שיואב יפגע היא $\\frac{${n2}}{${d2}}$, באופן בלתי תלוי. מה ההסתברות ששניהם יפגעו?`,
        answer: { type: 'number', value: (n1 * n2) / (d1 * d2), placeholder: '?/?' },
        hint: 'כופלים לאורך הענף.',
        solution: [
          { tex: L`\frac{${n1}}{${d1}} \cdot \frac{${n2}}{${d2}} = ${rawFrac(n1 * n2, d1 * d2)}${gcd(n1 * n2, d1 * d2) > 1 ? ` = ${fracTex(n1 * n2, d1 * d2)}` : ''}`, why: 'מכפלת ההסתברויות לאורך הענף' },
        ],
      };
    }
    if (level === 2) {
      const [n, d] = pick([
        [1, 2],
        [1, 3],
        [1, 4],
        [2, 5],
      ]);
      const k = ri(2, 3);
      const miss = d - n;
      const none = miss ** k;
      const all = d ** k;
      return {
        text: `ההסתברות לפגוע במטרה בכל זריקה היא $\\frac{${n}}{${d}}$. זורקים ${k === 2 ? 'פעמיים' : '3 פעמים'}. מה ההסתברות לפגוע לפחות פעם אחת?`,
        answer: { type: 'number', value: 1 - none / all, placeholder: '?/?' },
        hint: 'חשבו את ההסתברות לא לפגוע אף פעם, והחסירו מ-1.',
        solution: [
          { tex: L`1 - \frac{${n}}{${d}} = \frac{${miss}}{${d}}`, why: 'ההסתברות להחטיא בזריקה אחת' },
          { tex: L`\left(\frac{${miss}}{${d}}\right)^{${k}} = \frac{${none}}{${all}}`, why: 'להחטיא בכל הזריקות' },
          { tex: L`1 - \frac{${none}}{${all}} = ${fracTex(all - none, all)}`, why: '"לפחות פעם אחת" הוא ההפך מ"אף פעם"' },
        ],
      };
    }
    const r = ri(2, 6);
    const bl = ri(2, 6);
    const t = r + bl;
    return {
      text: `בקופסה ${r} כדורים אדומים ו-${bl} כחולים. מוציאים שני כדורים בלי החזרה. מה ההסתברות ששניהם אדומים?`,
      answer: { type: 'number', value: (r * (r - 1)) / (t * (t - 1)), placeholder: '?/?' },
      hint: 'בשלב השני יש כדור אדום אחד פחות, וגם כדור אחד פחות בסך הכול.',
      solution: [
        { tex: L`\frac{${r}}{${t}}`, why: 'הכדור הראשון אדום' },
        { tex: L`\frac{${r - 1}}{${t - 1}}`, why: 'הכדור השני אדום: נשארו אדום אחד פחות וכדור אחד פחות' },
        { tex: L`\frac{${r}}{${t}} \cdot \frac{${r - 1}}{${t - 1}} = ${rawFrac(r * (r - 1), t * (t - 1))} = ${fracTex(r * (r - 1), t * (t - 1))}` },
      ],
    };
  },
};

export const highTopics2: Topic[] = [similarity, analytic, sequences, parabola, exponential, logarithms, tree];
