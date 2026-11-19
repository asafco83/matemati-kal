import type { Topic } from '../lib/types';
import { L, par, pick, polyTex, ri, round, sgn } from '../lib/util';

/* ---------- עזרים ---------- */

const rad = (d: number) => (d * Math.PI) / 180;
/** גורם (x - r), או x כש-r = 0 */
const fac = (r: number) => (r === 0 ? 'x' : `(x ${sgn(-r)})`);
const deg = (r: number) => (r * 180) / Math.PI;
const n1 = (x: number) => String(round(x, 1));
const n2 = (x: number) => String(round(x, 2));
const sample = (f: (x: number) => number, R: number): [number, number][] =>
  Array.from({ length: 121 }, (_, i) => {
    const x = -R + (i * 2 * R) / 120;
    return [x, f(x)];
  });

/* ---------- משפט הסינוסים והקוסינוסים ---------- */

const sineCosineLaw: Topic = {
  id: 'sine-cosine-law',
  track: 'trig',
  title: 'משפט הסינוסים ומשפט הקוסינוסים',
  grades: [10, 11],
  icon: '📏',
  units: [4, 5],
  summary: 'פתרון משולש שאינו ישר זווית: מתי סינוסים ומתי קוסינוסים.',
  levels: ['משפט הסינוסים', 'משפט הקוסינוסים: צלע', 'משפט הקוסינוסים: זווית'],
  lesson: {
    intro: 'במשולש ישר זווית יש סינוס, קוסינוס ופיתגורס. במשולש כללי יש שני משפטים שעושים את אותה עבודה. מסמנים: הצלע $a$ מול הזווית $A$, ‏$b$ מול $B$, ‏$c$ מול $C$.',
    sections: [
      {
        title: 'משפט הסינוסים',
        body: '$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}$. משתמשים בו כשיודעים זוג של צלע והזווית שמולה.',
        figure: { type: 'triS', a: 'a', b: 'b', c: 'c' },
      },
      {
        title: 'משפט הקוסינוסים',
        body: '$c^2 = a^2 + b^2 - 2ab \\cos C$. משתמשים בו כשיודעים שתי צלעות והזווית שביניהן, או שלוש צלעות. כש-$C = 90°$, ‏$\\cos C = 0$ ומקבלים את פיתגורס.',
      },
      {
        title: 'איך בוחרים?',
        body: 'יש זוג צלע וזווית מולה? סינוסים. אין זוג כזה? קוסינוסים.',
      },
    ],
    method: ['מסמנים במשולש מה ידוע ומה מחפשים.', 'בוחרים משפט לפי הנתונים.', 'מציבים ופותרים בעזרת מחשבון.', 'בודקים: מול הזווית הגדולה נמצאת הצלע הגדולה.'],
    examples: [
      {
        problem: 'במשולש $a = 7$, ‏$b = 5$, ‏$C = 60°$. מצאו את $c$.',
        steps: [{ tex: 'c^2 = 7^2 + 5^2 - 2 \\cdot 7 \\cdot 5 \\cdot \\cos 60°', why: 'משפט הקוסינוסים' }, { tex: 'c^2 = 49 + 25 - 35 = 39' }, { tex: 'c = \\sqrt{39} \\approx 6.24' }],
      },
    ],
    tips: ['המחשבון חייב להיות במעלות (DEG).', 'במשפט הסינוסים, תמיד צלע חלקי הסינוס של הזווית שמולה.'],
  },
  generate(level) {
    if (level === 1) {
      const A = ri(30, 80);
      const B = ri(30, 150 - A);
      const a = ri(5, 15);
      const b = (a * Math.sin(rad(B))) / Math.sin(rad(A));
      return {
        text: `במשולש $ABC$: ‏$a = ${a}$, ‏$\\angle A = ${A}°$, ‏$\\angle B = ${B}°$. מצאו את $b$ (בדיוק של ספרה אחת אחרי הנקודה).`,
        figure: { type: 'triS', a: String(a), b: '?', A: `${A}°`, B: `${B}°` },
        answer: { type: 'number', value: round(b, 1), tol: 0.06 },
        hint: 'יש זוג של צלע וזווית מולה (a ו-A): משפט הסינוסים.',
        solution: [
          { tex: L`\frac{b}{\sin ${B}°} = \frac{${a}}{\sin ${A}°}`, why: 'משפט הסינוסים' },
          { tex: L`b = \frac{${a} \cdot \sin ${B}°}{\sin ${A}°} = \frac{${a} \cdot ${n2(Math.sin(rad(B)))}}{${n2(Math.sin(rad(A)))}}`, why: 'כופלים ב-$\\sin B$' },
          { tex: L`b \approx ${n1(b)}` },
        ],
      };
    }
    const a = ri(4, 12);
    const b = ri(4, 12);
    if (level === 2) {
      const C = pick([40, 50, 60, 70, 80, 100, 110, 120]);
      const c2 = a * a + b * b - 2 * a * b * Math.cos(rad(C));
      return {
        text: `במשולש $ABC$: ‏$a = ${a}$, ‏$b = ${b}$, ‏$\\angle C = ${C}°$. מצאו את $c$ (בדיוק של ספרה אחת אחרי הנקודה).`,
        figure: { type: 'triS', a: String(a), b: String(b), c: '?', C: `${C}°` },
        answer: { type: 'number', value: round(Math.sqrt(c2), 1), tol: 0.06 },
        hint: 'שתי צלעות והזווית שביניהן: משפט הקוסינוסים.',
        solution: [
          { tex: L`c^2 = ${a}^2 + ${b}^2 - 2 \cdot ${a} \cdot ${b} \cdot \cos ${C}°`, why: 'משפט הקוסינוסים' },
          { tex: L`c^2 = ${a * a} + ${b * b} - ${2 * a * b} \cdot ${par(round(Math.cos(rad(C)), 3))} \approx ${n2(c2)}` },
          { tex: L`c = \sqrt{${n2(c2)}} \approx ${n1(Math.sqrt(c2))}` },
        ],
      };
    }
    let c = ri(Math.abs(a - b) + 2, a + b - 2);
    if (c < 3) c = 3;
    const cosC = (a * a + b * b - c * c) / (2 * a * b);
    const C = deg(Math.acos(cosC));
    return {
      text: `במשולש $ABC$: ‏$a = ${a}$, ‏$b = ${b}$, ‏$c = ${c}$. מצאו את $\\angle C$ (בדיוק של ספרה אחת אחרי הנקודה).`,
      figure: { type: 'triS', a: String(a), b: String(b), c: String(c), C: '?' },
      answer: { type: 'number', value: round(C, 1), tol: 0.06, unit: 'מעלות' },
      hint: 'שלוש צלעות: משפט הקוסינוסים, ומבודדים את $\\cos C$.',
      solution: [
        { tex: L`${c}^2 = ${a}^2 + ${b}^2 - 2 \cdot ${a} \cdot ${b} \cdot \cos C`, why: 'משפט הקוסינוסים' },
        { tex: L`\cos C = \frac{${a * a} + ${b * b} - ${c * c}}{${2 * a * b}} = \frac{${a * a + b * b - c * c}}{${2 * a * b}} \approx ${round(cosC, 4)}` },
        { tex: L`C \approx ${n1(C)}°`, why: 'בעזרת $\\cos^{-1}$ במחשבון' },
      ],
    };
  },
};

/* ---------- מעגל היחידה ---------- */

const SPECIAL: Record<number, [string, string]> = {
  30: ['\\frac{1}{2}', '\\frac{\\sqrt{3}}{2}'],
  45: ['\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{2}}{2}'],
  60: ['\\frac{\\sqrt{3}}{2}', '\\frac{1}{2}'],
  90: ['1', '0'],
  0: ['0', '1'],
};
const VALUES = ['0', '\\frac{1}{2}', '\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{3}}{2}', '1'];

const unitCircle: Topic = {
  id: 'unit-circle',
  track: 'trig',
  title: 'מעגל היחידה וזהויות',
  grades: [11, 12],
  icon: '🔄',
  units: [5],
  summary: 'סינוס וקוסינוס של כל זווית, ערכים מיוחדים והזהות $\\sin^2 + \\cos^2 = 1$.',
  levels: ['ערכים מיוחדים', 'זוויות מעבר ל-90°', 'הזהות היסודית'],
  lesson: {
    intro: 'במעגל ברדיוס 1, נקודה בזווית $\\alpha$ מהציר החיובי נמצאת ב-$(\\cos \\alpha, \\sin \\alpha)$. כך מגדירים סינוס וקוסינוס לכל זווית, גם גדולה מ-$90°$.',
    sections: [
      {
        title: 'ערכים מיוחדים',
        body: '$\\sin 30° = \\frac{1}{2}$, ‏$\\sin 45° = \\frac{\\sqrt{2}}{2}$, ‏$\\sin 60° = \\frac{\\sqrt{3}}{2}$. בקוסינוס אותם ערכים בסדר הפוך: $\\cos 30° = \\frac{\\sqrt{3}}{2}$, ‏$\\cos 60° = \\frac{1}{2}$.',
      },
      {
        title: 'זוויות קהות',
        body: '$\\sin(180° - \\alpha) = \\sin \\alpha$ ו-$\\cos(180° - \\alpha) = -\\cos \\alpha$. לכן $\\sin 150° = \\frac{1}{2}$ ו-$\\cos 150° = -\\frac{\\sqrt{3}}{2}$.',
      },
      {
        title: 'הזהות היסודית',
        body: 'לפי פיתגורס במעגל היחידה: $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$. אם $\\sin \\alpha = \\frac{3}{5}$ והזווית חדה, אז $\\cos \\alpha = \\sqrt{1 - \\frac{9}{25}} = \\frac{4}{5}$.',
      },
    ],
    method: ['מזהים את הזווית הבסיסית (בין 0 ל-90).', 'שולפים את הערך מהטבלה.', 'קובעים סימן לפי הרביע: ברביע השני סינוס חיובי וקוסינוס שלילי.'],
    examples: [
      {
        problem: 'חשבו: $\\cos 120°$',
        steps: [{ tex: '\\cos 120° = \\cos(180° - 60°) = -\\cos 60°' }, { tex: '= -\\frac{1}{2}' }],
      },
    ],
    tips: ['הזהות $\\sin^2 + \\cos^2 = 1$ נכונה לכל זווית.', 'ברביע השני רק הסינוס חיובי.'],
  },
  generate(level) {
    if (level === 1) {
      const a = pick([0, 30, 45, 60, 90]);
      const fn = pick(['sin', 'cos'] as const);
      const val = SPECIAL[a][fn === 'sin' ? 0 : 1];
      const opts = VALUES.map((v) => `$${v}$`);
      return {
        text: `מה הערך של $\\${fn} ${a}°$?`,
        answer: { type: 'choice', options: opts, correct: VALUES.indexOf(val) },
        hint: 'סינוס: $0, \\frac{1}{2}, \\frac{\\sqrt{2}}{2}, \\frac{\\sqrt{3}}{2}, 1$ עבור 0°, 30°, 45°, 60°, 90°. קוסינוס בסדר הפוך.',
        solution: [`$\\${fn} ${a}° = ${val}$`],
      };
    }
    if (level === 2) {
      const base = pick([30, 45, 60]);
      const angle = 180 - base;
      const fn = pick(['sin', 'cos'] as const);
      const v = SPECIAL[base][fn === 'sin' ? 0 : 1];
      const val = fn === 'sin' ? v : `-${v}`;
      const F = `\\${fn}`;
      const opts = [v, `-${v}`, SPECIAL[base][fn === 'sin' ? 1 : 0], `-${SPECIAL[base][fn === 'sin' ? 1 : 0]}`];
      const uniq = [...new Set(opts)];
      return {
        text: `מה הערך של $\\${fn} ${angle}°$?`,
        answer: { type: 'choice', options: uniq.map((o) => `$${o}$`), correct: uniq.indexOf(val) },
        hint: `${angle}° = 180° − ${base}°. ברביע השני הסינוס חיובי והקוסינוס שלילי.`,
        solution: [
          { tex: L`${F} ${angle}° = ${F}(180° - ${base}°)` },
          { tex: L`= ${fn === 'sin' ? '' : '-'}${F} ${base}° = ${val}`, why: fn === 'sin' ? 'ברביע השני הסינוס חיובי' : 'ברביע השני הקוסינוס שלילי' },
        ],
      };
    }
    const [p, q, h] = pick([
      [3, 4, 5],
      [5, 12, 13],
      [8, 15, 17],
      [4, 3, 5],
      [12, 5, 13],
    ]);
    return {
      text: `נתון $\\sin \\alpha = \\frac{${p}}{${h}}$ והזווית $\\alpha$ חדה. מה $\\cos \\alpha$?`,
      answer: { type: 'number', value: q / h, placeholder: '?/?' },
      hint: 'השתמשו ב-$\\sin^2 \\alpha + \\cos^2 \\alpha = 1$.',
      solution: [
        { tex: L`\cos^2 \alpha = 1 - \left(\frac{${p}}{${h}}\right)^2 = 1 - \frac{${p * p}}{${h * h}} = \frac{${q * q}}{${h * h}}`, why: 'מהזהות היסודית' },
        { tex: L`\cos \alpha = \frac{${q}}{${h}}`, why: 'הזווית חדה, אז הקוסינוס חיובי' },
      ],
    };
  },
};

/* ---------- טריגונומטריה במרחב ---------- */

const trig3d: Topic = {
  id: 'trig-3d',
  track: 'trig',
  title: 'טריגונומטריה במרחב',
  grades: [11, 12],
  icon: '🧊',
  units: [5],
  summary: 'אלכסונים וזוויות בתיבה: מוצאים משולש ישר זווית בתוך הגוף.',
  levels: ['אלכסון הבסיס', 'אלכסון התיבה', 'זווית בין אלכסון לבסיס'],
  lesson: {
    intro: 'הסוד בטריגונומטריה במרחב: למצוא משולש ישר זווית שנמצא בתוך הגוף, ולעבוד עליו כרגיל.',
    sections: [
      {
        title: 'אלכסון הבסיס',
        body: 'בסיס התיבה הוא מלבן $a \\times b$. האלכסון שלו לפי פיתגורס: $\\sqrt{a^2 + b^2}$.',
        figure: { type: 'box', a: 'a', b: 'b', c: 'c' },
      },
      {
        title: 'אלכסון התיבה',
        body: 'אלכסון הבסיס, המקצוע האנכי $c$ ואלכסון התיבה יוצרים משולש ישר זווית. לכן אלכסון התיבה הוא $\\sqrt{a^2 + b^2 + c^2}$.',
      },
      {
        title: 'זווית בין אלכסון למישור',
        body: 'הזווית בין אלכסון התיבה לבסיס נמצאת באותו משולש: $\\tan \\alpha = \\frac{c}{\\text{אלכסון הבסיס}}$.',
      },
    ],
    method: ['מזהים משולש ישר זווית שמכיל את מה שמחפשים.', 'מוצאים את אורכי צלעותיו (לפעמים בעזרת משולש אחר קודם).', 'משתמשים בפיתגורס או בפונקציה טריגונומטרית.'],
    examples: [
      {
        problem: 'בתיבה $3 \\times 4 \\times 12$, מה אורך האלכסון?',
        steps: [{ tex: '\\sqrt{3^2 + 4^2} = 5', why: 'אלכסון הבסיס' }, { tex: '\\sqrt{5^2 + 12^2} = \\sqrt{169} = 13', why: 'אלכסון התיבה' }],
      },
    ],
    tips: ['הזווית עם הבסיס היא מול המקצוע האנכי.', 'אפשר לחשב את אלכסון התיבה ישירות: $\\sqrt{a^2 + b^2 + c^2}$.'],
  },
  generate(level) {
    const a = ri(2, 10);
    const b = ri(2, 10);
    const c = ri(2, 12);
    const fig = { type: 'box' as const, a: String(a), b: String(b), c: String(c) };
    const d2 = a * a + b * b;
    if (level === 1)
      return {
        text: 'מה אורך אלכסון הבסיס של התיבה? (בדיוק של ספרה אחת אחרי הנקודה)',
        figure: fig,
        answer: { type: 'number', value: round(Math.sqrt(d2), 1), tol: 0.06 },
        hint: 'פיתגורס במלבן הבסיס.',
        solution: [{ tex: L`\sqrt{${a}^2 + ${b}^2} = \sqrt{${d2}} \approx ${n1(Math.sqrt(d2))}`, why: 'פיתגורס בבסיס' }],
      };
    if (level === 2) {
      const D2 = d2 + c * c;
      return {
        text: 'מה אורך האלכסון של התיבה? (בדיוק של ספרה אחת אחרי הנקודה)',
        figure: fig,
        answer: { type: 'number', value: round(Math.sqrt(D2), 1), tol: 0.06 },
        hint: 'קודם אלכסון הבסיס, ואז פיתגורס עם הגובה.',
        solution: [
          { tex: L`${a}^2 + ${b}^2 = ${d2}`, why: 'ריבוע אלכסון הבסיס' },
          { tex: L`\sqrt{${d2} + ${c}^2} = \sqrt{${D2}} \approx ${n1(Math.sqrt(D2))}`, why: 'פיתגורס עם המקצוע האנכי' },
        ],
      };
    }
    const ang = deg(Math.atan(c / Math.sqrt(d2)));
    return {
      text: 'מה הזווית בין אלכסון התיבה לבסיס? (במעלות, בדיוק של ספרה אחת)',
      figure: fig,
      answer: { type: 'number', value: round(ang, 1), tol: 0.06, unit: 'מעלות' },
      hint: 'הגובה מול הזווית, ואלכסון הבסיס לידה: טנגנס.',
      solution: [
        { tex: L`\sqrt{${a}^2 + ${b}^2} = \sqrt{${d2}} \approx ${n2(Math.sqrt(d2))}`, why: 'אלכסון הבסיס' },
        { tex: L`\tan \alpha = \frac{${c}}{${n2(Math.sqrt(d2))}} \approx ${round(c / Math.sqrt(d2), 3)}`, why: 'הגובה מול הזווית' },
        { tex: L`\alpha \approx ${n1(ang)}°` },
      ],
    };
  },
};

/* ---------- חקירת פונקציה ---------- */

const investigation: Topic = {
  id: 'investigation',
  track: 'calculus',
  title: 'חקירת פונקציה',
  grades: [11, 12],
  icon: '🔬',
  units: [4, 5],
  summary: 'נקודות קיצון, תחומי עלייה וירידה, בעזרת הנגזרת.',
  levels: ['נקודות חשודות', 'מקסימום או מינימום', 'ערך בנקודת הקיצון'],
  lesson: {
    intro: 'הנגזרת מספרת איך הפונקציה משתנה: כשהיא חיובית הפונקציה עולה, וכשהיא שלילית הפונקציה יורדת. בנקודות שבהן היא מתאפסת יכולים להיות שיאים.',
    sections: [
      {
        title: 'נקודות קיצון',
        body: 'פותרים $f\'(x) = 0$. בכל פתרון יש נקודה חשודה כקיצון: מקסימום (הר), מינימום (עמק), או אף אחד מהם.',
        figure: { type: 'graph', lines: [], curves: [sample((x) => (x * x * x) / 4 - 3 * x, 6)], range: 6 },
      },
      {
        title: 'מקסימום או מינימום?',
        body: 'בודקים את הסימן של $f\'$ משני הצדדים. עלייה ואחריה ירידה: מקסימום. ירידה ואחריה עלייה: מינימום. דרך נוספת: הנגזרת השנייה. אם $f\'\'(x) < 0$ זה מקסימום, ואם $f\'\'(x) > 0$ זה מינימום.',
      },
      {
        title: 'הנקודה המלאה',
        body: 'כדי למצוא את ה-$y$ של נקודת הקיצון, מציבים את ה-$x$ בפונקציה המקורית, לא בנגזרת.',
      },
    ],
    method: ['גוזרים.', 'משווים את הנגזרת ל-0 ופותרים.', 'בודקים את סוג כל נקודה (טבלת סימנים או נגזרת שנייה).', 'מציבים בפונקציה כדי לקבל את ה-$y$.'],
    examples: [
      {
        problem: 'מצאו את נקודות הקיצון של $f(x) = x^3 - 3x$',
        steps: [{ tex: "f'(x) = 3x^2 - 3" }, { tex: '3x^2 - 3 = 0 \\Rightarrow x = \\pm 1' }, { tex: "f''(x) = 6x", why: '$f\'\'(1) = 6 > 0$: מינימום. ‏$f\'\'(-1) = -6 < 0$: מקסימום' }, { tex: 'f(1) = -2,\\; f(-1) = 2', why: 'מקסימום ב-$(-1;2)$, מינימום ב-$(1;-2)$' }],
      },
    ],
    tips: ['$f\'(x) = 0$ לא מבטיח קיצון. ב-$x^3$ הנגזרת מתאפסת ב-0, אבל אין שם קיצון.', 'את ה-$y$ מוצאים בפונקציה, לא בנגזרת.'],
  },
  generate(level) {
    // f(x) = x^3 - 3(p+q)/2 x^2 + 3pq x + c, ‏f'(x) = 3(x - p)(x - q)
    let p = ri(-4, 3);
    let q = p + 2 * ri(1, 3);
    if (q > 5) {
      p -= 2;
      q -= 2;
    }
    const B = (-3 * (p + q)) / 2;
    const C = 3 * p * q;
    const D = ri(-5, 5);
    const f = (x: number) => x ** 3 + B * x * x + C * x + D;
    const ft = `f(x) = ${polyTex([1, B, C, D])}`;
    const dt = `f'(x) = ${polyTex([3, 2 * B, C])}`;
    if (level === 1)
      return {
        text: 'מצאו את ה-x של הנקודות החשודות כקיצון:',
        latex: ft,
        answer: { type: 'multi', labels: ['x₁', 'x₂'], values: [p, q], ordered: false },
        hint: 'גוזרים ומשווים ל-0.',
        solution: [
          { tex: dt, why: 'גוזרים' },
          { tex: `${polyTex([3, 2 * B, C])} = 0`, op: L`\div 3` },
          { tex: `${polyTex([1, (2 * B) / 3, C / 3])} = 0` },
          { tex: `${fac(p)}${fac(q)} = 0`, why: 'מפרקים' },
          { tex: `x_1 = ${p},\\; x_2 = ${q}` },
        ],
      };
    if (level === 2) {
      const x0 = pick([p, q]);
      const isMax = x0 === p;
      return {
        text: `ל-$${ft}$ יש נקודת קיצון ב-$x = ${x0}$. האם זו נקודת מקסימום או מינימום?`,
        answer: { type: 'choice', options: ['מקסימום', 'מינימום'], correct: isMax ? 0 : 1 },
        hint: 'בדקו את הנגזרת השנייה בנקודה.',
        solution: [
          { tex: dt, why: 'נגזרת ראשונה' },
          { tex: `f''(x) = ${polyTex([6, 2 * B])}`, why: 'נגזרת שנייה' },
          { tex: L`f''(${x0}) = 6 \cdot ${par(x0)} ${sgn(2 * B)} = ${6 * x0 + 2 * B}`, why: 'מציבים' },
          `$${6 * x0 + 2 * B} ${isMax ? '< 0' : '> 0'}$, ולכן זו נקודת ${isMax ? 'מקסימום' : 'מינימום'}.`,
        ],
      };
    }
    return {
      text: 'מצאו את ערך ה-y בנקודת המקסימום של הפונקציה:',
      latex: ft,
      answer: { type: 'number', value: f(p) },
      hint: 'מצאו את נקודות הקיצון, קבעו מי המקסימום, והציבו בפונקציה.',
      solution: [
        { tex: `${dt} = 3${fac(p)}${fac(q)}`, why: 'גוזרים ומפרקים' },
        { tex: `x_1 = ${p},\\; x_2 = ${q}`, why: 'הנקודות החשודות' },
        `הפונקציה עולה עד $x = ${p}$ ואחר כך יורדת, ולכן ב-$x = ${p}$ יש מקסימום.`,
        { tex: L`f(${p}) = ${f(p)}`, why: 'מציבים בפונקציה המקורית' },
      ],
    };
  },
};

/* ---------- בעיות קיצון ---------- */

const optimization: Topic = {
  id: 'optimization',
  track: 'calculus',
  title: 'בעיות קיצון',
  grades: [11, 12],
  icon: '🏆',
  units: [4, 5],
  summary: 'השטח הכי גדול, המכפלה הכי גדולה: בונים פונקציה ומוצאים לה מקסימום.',
  levels: ['מכפלה מקסימלית', 'מלבן עם היקף נתון', 'גדר ליד קיר'],
  lesson: {
    intro: 'בבעיית קיצון מחפשים את הערך הכי גדול (או הכי קטן) של משהו. השיטה: לבטא אותו כפונקציה של משתנה אחד, ולמצוא לה קיצון בעזרת הנגזרת.',
    sections: [
      {
        title: 'בונים פונקציה',
        body: 'מסמנים משתנה $x$, ומבטאים בעזרתו את כל השאר. אם סכום שני מספרים הוא 20, הם $x$ ו-$20 - x$, והמכפלה היא $f(x) = x(20 - x)$.',
      },
      {
        title: 'מוצאים קיצון',
        body: 'גוזרים, משווים ל-0 ופותרים. $f(x) = 20x - x^2$, ‏$f\'(x) = 20 - 2x = 0$, ולכן $x = 10$. המכפלה המקסימלית: $10 \\cdot 10 = 100$.',
      },
      {
        title: 'בודקים',
        body: 'מוודאים שזה באמת מקסימום (נגזרת שנייה שלילית) ושהתשובה הגיונית בתוך הבעיה.',
      },
    ],
    method: ['מסמנים משתנה.', 'כותבים את מה שרוצים למקסם כפונקציה שלו.', 'גוזרים ומשווים ל-0.', 'בודקים שזה מקסימום ועונים על השאלה.'],
    examples: [
      {
        problem: 'סכום שני מספרים חיוביים הוא 30. מה המכפלה הגדולה ביותר שלהם?',
        steps: [{ tex: 'f(x) = x(30 - x) = 30x - x^2' }, { tex: "f'(x) = 30 - 2x = 0 \\Rightarrow x = 15" }, { tex: '15 \\cdot 15 = 225' }],
      },
    ],
    tips: ['לפעמים צריך להחזיר את מה ששאלו, לא את $x$.', 'בודקים שהפתרון בתחום ההגיוני (למשל אורך חיובי).'],
  },
  generate(level) {
    if (level === 1) {
      const S = 2 * ri(5, 30);
      return {
        text: `סכום שני מספרים הוא ${S}. מה המכפלה הגדולה ביותר שלהם?`,
        answer: { type: 'number', value: (S / 2) ** 2 },
        hint: `מסמנים x ו-${S} − x, והמכפלה היא פונקציה של x.`,
        solution: [
          { tex: `f(x) = x(${S} - x) = ${S}x - x^2`, why: 'המכפלה כפונקציה של x' },
          { tex: `f'(x) = ${S} - 2x = 0`, why: 'גוזרים ומשווים ל-0' },
          { tex: `x = ${S / 2}` },
          { tex: L`${S / 2} \cdot ${S / 2} = ${(S / 2) ** 2}`, why: `המספר השני גם הוא ${S / 2}` },
        ],
      };
    }
    if (level === 2) {
      const P = 4 * ri(5, 30);
      const h = P / 2;
      return {
        text: `למלבן היקף ${P} ס"מ. מה השטח הגדול ביותר שיכול להיות לו?`,
        answer: { type: 'number', value: (P / 4) ** 2, unit: 'סמ"ר' },
        hint: `חצי היקף: אורך ועוד רוחב הם ${h}.`,
        solution: [
          { tex: `x + y = ${h}`, why: 'חצי מההיקף' },
          { tex: `S(x) = x(${h} - x) = ${h}x - x^2`, why: 'השטח כפונקציה של x' },
          { tex: `S'(x) = ${h} - 2x = 0 \\Rightarrow x = ${h / 2}`, why: 'גוזרים ומשווים ל-0' },
          { tex: L`${h / 2} \cdot ${h / 2} = ${(P / 4) ** 2}`, why: 'המלבן הגדול ביותר הוא ריבוע' },
        ],
      };
    }
    const Lf = 4 * ri(5, 25);
    const x = Lf / 4;
    return {
      text: `רוצים לגדר שטח מלבני ליד קיר, כך שהקיר הוא אחת הצלעות. יש ${Lf} מטר גדר. מה השטח הגדול ביותר?`,
      answer: { type: 'number', value: x * (Lf - 2 * x), unit: 'מ"ר' },
      hint: 'שתי צלעות ניצבות לקיר באורך x, והצלע המקבילה לקיר היא מה שנשאר.',
      solution: [
        { tex: `S(x) = x(${Lf} - 2x) = ${Lf}x - 2x^2`, why: `שתי צלעות באורך $x$, והשלישית $${Lf} - 2x$` },
        { tex: `S'(x) = ${Lf} - 4x = 0`, why: 'גוזרים ומשווים ל-0' },
        { tex: `x = ${x}` },
        { tex: L`S = ${x} \cdot ${Lf - 2 * x} = ${x * (Lf - 2 * x)}`, why: `הצלע המקבילה לקיר: $${Lf} - 2 \\cdot ${x} = ${Lf - 2 * x}$` },
      ],
    };
  },
};

/* ---------- אינטגרלים ---------- */

const integrals: Topic = {
  id: 'integrals',
  track: 'calculus',
  title: 'אינטגרלים ושטחים',
  grades: [12, 12],
  icon: '∫',
  units: [4, 5],
  summary: 'הפעולה ההפוכה לגזירה, והדרך לחשב שטח מתחת לגרף.',
  levels: ['פונקציה קדומה', 'אינטגרל מסוים', 'שטח בין גרף לציר'],
  lesson: {
    intro: 'פונקציה קדומה היא פונקציה שהנגזרת שלה היא הפונקציה הנתונה. אם $F\'(x) = f(x)$, אז $F$ קדומה ל-$f$.',
    sections: [
      {
        title: 'הכלל',
        body: 'הקדומה של $x^n$ היא $\\frac{x^{n + 1}}{n + 1}$. מוסיפים 1 למעריך ומחלקים במעריך החדש. למשל הקדומה של $x^2$ היא $\\frac{x^3}{3}$, ושל 5 היא $5x$.',
      },
      {
        title: 'אינטגרל מסוים',
        body: '$\\int_a^b f(x)\\,dx = F(b) - F(a)$. מציבים את הגבול העליון בקדומה, ומחסרים את ההצבה של הגבול התחתון.',
      },
      {
        title: 'שטח',
        body: 'כשהגרף מעל ציר $x$, האינטגרל המסוים הוא השטח בין הגרף לציר. כשהגרף מתחת לציר, האינטגרל שלילי ולוקחים את ערכו המוחלט.',
        figure: { type: 'graph', lines: [], curves: [sample((x) => 4 - x * x, 4)], range: 4 },
      },
    ],
    method: ['מוצאים פונקציה קדומה לכל איבר.', 'מציבים את הגבול העליון ואת התחתון.', 'מחסרים: עליון פחות תחתון.', 'לשטח: מוצאים קודם איפה הגרף חותך את הציר.'],
    examples: [
      {
        problem: 'חשבו: $\\int_0^3 x^2\\,dx$',
        steps: [{ tex: 'F(x) = \\frac{x^3}{3}' }, { tex: 'F(3) - F(0) = \\frac{27}{3} - 0 = 9' }],
      },
    ],
    tips: ['בבדיקה: גוזרים את הקדומה וצריך לקבל את הפונקציה המקורית.', 'באינטגרל מסוים לא צריך להוסיף קבוע $C$.'],
  },
  generate(level) {
    if (level === 1) {
      const n = ri(1, 4);
      const k = (n + 1) * ri(1, 4);
      const x0 = ri(1, 3);
      const F = (x: number) => (k / (n + 1)) * x ** (n + 1);
      return {
        text: `$F(x)$ היא הפונקציה הקדומה של $f(x) = ${k}x^{${n}}$ שמקיימת $F(0) = 0$. חשבו את $F(${x0})$.`,
        answer: { type: 'number', value: F(x0) },
        hint: 'מוסיפים 1 למעריך ומחלקים במעריך החדש.',
        solution: [
          { tex: L`F(x) = \frac{${k}x^{${n + 1}}}{${n + 1}} = ${k / (n + 1) === 1 ? '' : k / (n + 1)}x^{${n + 1}}`, why: 'הקדומה של $x^n$ היא $\\frac{x^{n+1}}{n+1}$' },
          { tex: L`F(${x0}) = ${k / (n + 1)} \cdot ${x0}^{${n + 1}} = ${F(x0)}` },
        ],
      };
    }
    if (level === 2) {
      const m = ri(1, 4);
      const c = ri(-3, 5);
      const a = ri(0, 2);
      const b = a + ri(1, 3);
      const F = (x: number) => m * x * x + c * x;
      const fTex = polyTex([2 * m, c]);
      return {
        text: 'חשבו:',
        latex: L`\int_{${a}}^{${b}} (${fTex})\,dx`,
        answer: { type: 'number', value: F(b) - F(a) },
        hint: 'מוצאים קדומה, מציבים את הגבול העליון ומחסרים את התחתון.',
        solution: [
          { tex: `F(x) = ${polyTex([m, c, 0])}`, why: 'פונקציה קדומה' },
          { tex: L`F(${b}) - F(${a}) = ${F(b)} - ${par(F(a))} = ${F(b) - F(a)}` },
        ],
      };
    }
    const r = ri(1, 3);
    const area = (4 * r ** 3) / 3;
    return {
      text: `מה השטח הכלוא בין הגרף של $y = ${r * r} - x^2$ לבין ציר x? (בדיוק של שתי ספרות אחרי הנקודה)`,
      figure: { type: 'graph', lines: [], curves: [sample((x) => r * r - x * x, r * r + 1)], range: r * r + 1 },
      answer: { type: 'number', value: round(area, 2), tol: 0.011 },
      hint: 'מצאו איפה הגרף חותך את ציר x, ואלה גבולות האינטגרל.',
      solution: [
        { tex: `${r * r} - x^2 = 0 \\Rightarrow x = \\pm ${r}`, why: 'נקודות החיתוך עם ציר x' },
        { tex: L`F(x) = ${r === 1 ? '' : r * r}x - \frac{x^3}{3}`, why: 'פונקציה קדומה' },
        { tex: L`F(${r}) - F(-${r}) = ${n2(r ** 3 - r ** 3 / 3)} - (${n2(-(r ** 3) + r ** 3 / 3)}) \approx ${n2(area)}` },
      ],
    };
  },
};

/* ---------- התפלגות נורמלית ---------- */

const normal: Topic = {
  id: 'normal',
  track: 'data',
  title: 'התפלגות נורמלית',
  grades: [11, 12],
  icon: '🔔',
  units: [3, 4],
  summary: 'עקומת הפעמון: ממוצע, סטיית תקן, והכלל של 68, 95 ו-99.7.',
  levels: ['הכלל 68-95-99.7', 'צד אחד של הפעמון', 'ציון תקן'],
  lesson: {
    intro: 'הרבה תכונות בטבע, כמו גובה של אנשים, מתפלגות נורמלית: רוב הערכים קרובים לממוצע $\\mu$, ומעט רחוקים ממנו. סטיית התקן $\\sigma$ מודדת עד כמה הנתונים מפוזרים.',
    sections: [
      {
        title: 'הכלל 68-95-99.7',
        body: 'בערך 68% מהנתונים נמצאים במרחק של עד סטיית תקן אחת מהממוצע, 95% עד שתיים, ו-99.7% עד שלוש.',
      },
      {
        title: 'סימטריה',
        body: 'העקומה סימטרית סביב הממוצע: 50% מעליו ו-50% מתחתיו. לכן בין $\\mu$ ל-$\\mu + \\sigma$ יש בערך 34%, ומעל $\\mu + \\sigma$ יש בערך 16%.',
      },
      {
        title: 'ציון תקן',
        body: '$z = \\frac{x - \\mu}{\\sigma}$ אומר כמה סטיות תקן הערך רחוק מהממוצע. $z = 2$: שתי סטיות תקן מעל. $z = -1$: אחת מתחת.',
      },
    ],
    method: ['רושמים את $\\mu$ ואת $\\sigma$.', 'מחשבים כמה סטיות תקן הערך רחוק מהממוצע.', 'משתמשים בכלל ובסימטריה כדי למצוא אחוז.'],
    examples: [
      {
        problem: 'גובה מתפלג נורמלית עם $\\mu = 170$ ו-$\\sigma = 10$. כמה אחוזים נמוכים מ-160?',
        steps: [{ tex: 'z = \\frac{160 - 170}{10} = -1' }, 'בין $-1$ ל-$1$ יש 68%, אז מחוץ לטווח 32%, וחצי מזה מתחת: 16%.'],
      },
    ],
    tips: ['50% תמיד מעל הממוצע ו-50% מתחתיו.', 'ציון תקן שלילי פירושו מתחת לממוצע.'],
  },
  generate(level) {
    const mu = pick([50, 60, 70, 100, 170]);
    const sigma = pick([5, 10, 15]);
    if (level === 1) {
      const k = ri(1, 3);
      const pct = [68, 95, 99.7][k - 1];
      return {
        text: `ציונים מתפלגים נורמלית עם ממוצע ${mu} וסטיית תקן ${sigma}. כמה אחוזים מהציונים בין ${mu - k * sigma} ל-${mu + k * sigma}?`,
        answer: { type: 'number', value: pct, unit: '%' },
        hint: 'כמה סטיות תקן מהממוצע נמצאים קצוות הטווח?',
        solution: [`${mu - k * sigma} ו-${mu + k * sigma} נמצאים ${k === 1 ? 'סטיית תקן אחת' : `${k} סטיות תקן`} מתחת ומעל לממוצע.`, `לפי הכלל, בטווח הזה ${pct}% מהנתונים.`],
      };
    }
    if (level === 2) {
      const k = ri(1, 2);
      const above = Math.random() < 0.5;
      const pct = k === 1 ? 16 : 2.5;
      const x = above ? mu + k * sigma : mu - k * sigma;
      return {
        text: `ציונים מתפלגים נורמלית עם ממוצע ${mu} וסטיית תקן ${sigma}. כמה אחוזים מהציונים ${above ? 'גבוהים מ' : 'נמוכים מ'}-${x}?`,
        answer: { type: 'number', value: pct, unit: '%' },
        hint: 'כמה אחוזים מחוץ לטווח הסימטרי? חצי מהם בכל צד.',
        solution: [
          `${x} נמצא ${k === 1 ? 'סטיית תקן אחת' : '2 סטיות תקן'} ${above ? 'מעל' : 'מתחת ל'}ממוצע.`,
          `בטווח הסימטרי יש ${k === 1 ? 68 : 95}%, ומחוץ לו $100 - ${k === 1 ? 68 : 95} = ${k === 1 ? 32 : 5}$ אחוזים.`,
          `חצי מהם בכל צד: $${k === 1 ? 32 : 5} \\div 2 = ${pct}$ אחוזים.`,
        ],
      };
    }
    const z = pick([-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 2.5]);
    const x = mu + z * sigma;
    return {
      text: `ציונים מתפלגים נורמלית עם ממוצע ${mu} וסטיית תקן ${sigma}. מהו ציון התקן של ${x}?`,
      answer: { type: 'number', value: z },
      hint: 'ציון תקן: (הערך פחות הממוצע) חלקי סטיית התקן.',
      solution: [{ tex: L`z = \frac{${x} - ${mu}}{${sigma}} = \frac{${x - mu}}{${sigma}} = ${z}` }],
    };
  },
};

export const highTopics3: Topic[] = [sineCosineLaw, unitCircle, trig3d, investigation, optimization, integrals, normal];
