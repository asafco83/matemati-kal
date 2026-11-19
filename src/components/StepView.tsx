import type { Step } from '../lib/types';
import { FigureView } from './FigureView';
import { Rich, Tex } from './Tex';

/**
 * שורה אחת בפתרון.
 * שורת מחברת מוצגת כמו במחברת: המשוואה, ולצידה הפעולה שעושים בשני האגפים (/ −8).
 * בפתרון המלא מופיע מתחת גם הסבר קצר למה עושים את הצעד.
 */
export function StepView({ step, color, showWhy = true }: { step: Step; color: string; showWhy?: boolean }) {
  if (typeof step === 'object' && 'figure' in step) {
    return (
      <figure className="flex flex-col items-start gap-2">
        <FigureView fig={step.figure} />
        {step.caption && (
          <figcaption className="text-base leading-snug text-muted">
            <Rich text={step.caption} />
          </figcaption>
        )}
      </figure>
    );
  }
  if (typeof step === 'string') {
    // שורה בנוסח "מחברים: $c^2 = 676$" מוצגת כשורת מחברת: המשוואה, ומתחתיה ההסבר
    const m = step.match(/^([^$]+?):\s*\$([^$]+)\$\s*\.?$/);
    if (!m) return <Rich text={step} />;
    return <StepView step={{ tex: m[2], why: m[1] }} color={color} />;
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <span dir="ltr" className="inline-flex flex-wrap items-baseline gap-x-5 self-start">
        <Tex tex={step.tex} />
        {step.op && (
          <span className="step-op" style={{ color }}>
            <Tex tex={`/\\; ${step.op}`} />
          </span>
        )}
      </span>
      {showWhy && step.why && (
        <span className="text-base leading-snug text-muted">
          <Rich text={step.why} />
        </span>
      )}
    </span>
  );
}
