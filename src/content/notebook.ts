import type { Step } from '../lib/types';

/* צעדים של תרגילים במאונך, כמו שכותבים במחברת: בכל צעד רואים את התרגיל עד אותו שלב. */

const INT_PLACES = ['האחדות', 'העשרות', 'המאות', 'האלפים', 'עשרות האלפים'];
const FRAC_PLACES = ['העשיריות', 'המאיות', 'האלפיות'];

/** מיישר שני מספרים (גם עשרוניים) לעמודות, כמו בשרטוט colarith */
function align(top: string, bottom: string) {
  const dec = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0);
  const D = Math.max(dec(top), dec(bottom));
  const digits = (s: string) => {
    const [i, f = ''] = s.split('.');
    return (i + f.padEnd(D, '0')).split('').map(Number).reverse();
  };
  return { A: digits(top), B: digits(bottom), D, padded: dec(top) !== dec(bottom) };
}

const placeName = (i: number, D: number) => (i < D ? FRAC_PLACES[D - 1 - i] : INT_PLACES[i - D]);

/** חיבור או חיסור במאונך, עמודה אחר עמודה מימין לשמאל, עם העברה או פריטה */
export function columnSteps(top: string, bottom: string, op: '+' | '-'): Step[] {
  const { A, B, D, padded } = align(top, bottom);
  const n = Math.max(A.length, B.length);
  const steps: Step[] = [
    {
      figure: { type: 'colarith', top, bottom, op, upto: 0 },
      caption: `כותבים את ${top}, ומתחתיו את ${bottom}, ${D ? 'נקודה מתחת לנקודה' : 'אחדות מתחת לאחדות'}${padded ? '. במקום שחסרה ספרה אחרי הנקודה חושבים עליה כעל 0 (באפור)' : ''}. משמאל כותבים ${op === '+' ? '+' : '−'}, ומתחת מותחים קו.`,
    },
  ];
  const work = [...A];
  let carry = 0;
  for (let i = 0; i < n; i++) {
    const x = work[i] ?? 0;
    const y = B[i] ?? 0;
    const place = placeName(i, D);
    let caption: string;
    if (op === '+') {
      const v = x + y + carry;
      const plus = carry ? `, ועוד ${carry} שהעברנו` : '';
      const last = i === n - 1;
      caption = `מחברים את ${place}: ${x} ועוד ${y}${plus} הם ${v}. ${!last && v >= 10 ? `כותבים ${v % 10}, ואת ה-${Math.floor(v / 10)} מעבירים: כותבים אותו קטן מעל העמודה הבאה.` : `כותבים ${v}.`}`;
      carry = last ? 0 : Math.floor(v / 10);
    } else {
      let cur = x;
      let borrow = '';
      if (cur < y) {
        let k = i + 1;
        while (work[k] === 0) k++;
        const from = work[k];
        for (let j = k; j > i; j--) work[j] = j === k ? work[j] - 1 : 9;
        borrow =
          k === i + 1
            ? `ב${place} ${x} קטן מ-${y}, אז פורטים: לוקחים 1 מהעמודה שמשמאל. מוחקים שם את ${from} וכותבים מעליו ${from - 1}, וליד ה-${x} כותבים 1 קטן: עכשיו יש ${x + 10}. `
            : `ב${place} ${x} קטן מ-${y}, ובעמודה שמשמאל יש 0, אז פורטים מהעמודה הראשונה שאינה 0: ה-${from} הופך ל-${from - 1}, כל 0 בדרך הופך ל-9, וליד ה-${x} כותבים 1 קטן: עכשיו יש ${x + 10}. `;
        cur += 10;
      }
      const v = cur - y;
      caption = `${borrow}מחסרים ב${place}: ${cur} פחות ${y} הם ${v}. כותבים ${v}.`;
    }
    steps.push({ figure: { type: 'colarith', top, bottom, op, upto: i + 1, from: i + 1 }, caption });
  }
  return steps;
}
