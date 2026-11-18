import type { Figure } from '../lib/types';

const INK = '#1d2433';
/** גוון בהיר של צבע המסלול (המשתנה --tc מוגדר בדף הנושא) */
const FILL = 'color-mix(in srgb, var(--tc, #4f46e5) 13%, white)';
const ACCENT = '#f5b400';

function Label({ x, y, children, anchor = 'middle', bold }: { x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }) {
  const q = children === '?';
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={q ? 20 : 16} fontWeight={q || bold ? 700 : 500} fontFamily="Fredoka, Arial, sans-serif" fill={q ? 'var(--tc, #b3261e)' : INK} style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>
      {children}
    </text>
  );
}

export function FigureView({ fig }: { fig: Figure }) {
  switch (fig.type) {
    case 'rect':
      return (
        <svg viewBox="0 0 260 150" className="mx-auto w-full max-w-[260px]" role="img" aria-label="מלבן">
          <rect x="50" y="20" width="160" height="90" style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" rx="2" />
          <Label x={130} y={128}>{fig.w}</Label>
          <Label x={44} y={65} anchor="end">{fig.h}</Label>
        </svg>
      );
    case 'rtri': {
      // זווית ישרה למטה משמאל, הזווית α למטה מימין
      const A = [40, 130];
      const B = [220, 130];
      const C = [40, 25];
      return (
        <svg viewBox="0 0 270 160" className="mx-auto w-full max-w-[270px]" role="img" aria-label="משולש ישר זווית">
          <polygon points={`${A} ${B} ${C}`} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M40 116 h14 v14" fill="none" stroke={INK} strokeWidth="1.5" />
          {fig.angle && (
            <>
              <path d="M190 130 A30 30 0 0 1 194 115" fill="none" stroke={ACCENT} strokeWidth="2.5" />
              <Label x={170} y={119}>{fig.angle}</Label>
            </>
          )}
          {fig.bottom && <Label x={125} y={146}>{fig.bottom}</Label>}
          {fig.left && <Label x={32} y={78} anchor="end">{fig.left}</Label>}
          {fig.hyp && <Label x={144} y={64} anchor="start">{fig.hyp}</Label>}
        </svg>
      );
    }
    case 'tri': {
      const [a, b, c] = fig.angles;
      return (
        <svg viewBox="0 0 300 165" className="mx-auto w-full max-w-[300px]" role="img" aria-label="משולש">
          {fig.ext !== undefined && <line x1="215" y1="135" x2="285" y2="135" stroke={INK} strokeWidth="2" strokeDasharray="5 4" />}
          <polygon points="30,135 215,135 135,20" style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {a && <Label x={66} y={122}>{a}</Label>}
          {b && <Label x={186} y={122}>{b}</Label>}
          {c && <Label x={134} y={52}>{c}</Label>}
          {fig.ext !== undefined && (
            <>
              <path d="M240 135 A25 25 0 0 0 201 114" fill="none" stroke={ACCENT} strokeWidth="2.5" />
              <Label x={248} y={110}>{fig.ext}</Label>
            </>
          )}
        </svg>
      );
    }
    case 'fracbar': {
      const w = 240 / fig.parts;
      return (
        <svg viewBox="0 0 260 60" className="mx-auto w-full max-w-[320px]" role="img" aria-label={`${fig.filled} חלקים מתוך ${fig.parts}`}>
          {Array.from({ length: fig.parts }, (_, i) => (
            <rect key={i} x={10 + i * w} y="10" width={w} height="40" fill={i < fig.filled ? ACCENT : '#fff'} stroke={INK} strokeWidth="2" />
          ))}
        </svg>
      );
    }
    case 'array': {
      const s = 26;
      return (
        <svg viewBox={`0 0 ${fig.cols * s + 10} ${fig.rows * s + 10}`} className="mx-auto w-full" style={{ maxWidth: fig.cols * s + 10 }} role="img" aria-label={`${fig.rows} שורות של ${fig.cols}`}>
          {Array.from({ length: fig.rows * fig.cols }, (_, i) => (
            <circle key={i} cx={5 + s / 2 + (i % fig.cols) * s} cy={5 + s / 2 + Math.floor(i / fig.cols) * s} r="9" fill={Math.floor(i / fig.cols) % 2 ? '#818cf8' : ACCENT} />
          ))}
        </svg>
      );
    }
    case 'numline': {
      const n = fig.to - fig.from;
      const step = 280 / n;
      const X = (v: number) => 20 + (v - fig.from) * step;
      let cur = fig.start ?? fig.from;
      const arcs = (fig.jumps ?? []).map((j, i) => {
        const x1 = X(cur);
        const x2 = X(cur + j);
        cur += j;
        return (
          <g key={i}>
            <path d={`M${x1} 50 Q${(x1 + x2) / 2} ${50 - Math.min(40, Math.abs(x2 - x1) / 1.6)} ${x2} 50`} fill="none" stroke={ACCENT} strokeWidth="2.5" />
            <text x={(x1 + x2) / 2} y={18} textAnchor="middle" fontSize="13" fontWeight="700" fill="#b45309">{j > 0 ? `+${j}` : j}</text>
          </g>
        );
      });
      return (
        <svg viewBox="0 0 320 85" className="mx-auto w-full max-w-[420px]" role="img" aria-label="ציר מספרים" style={{ direction: "ltr" }}>
          <line x1="10" y1="55" x2="310" y2="55" stroke={INK} strokeWidth="2" />
          {Array.from({ length: n + 1 }, (_, i) => (
            <g key={i}>
              <line x1={X(fig.from + i)} y1="49" x2={X(fig.from + i)} y2="61" stroke={INK} strokeWidth="2" />
              <text x={X(fig.from + i)} y="77" textAnchor="middle" fontSize="13" fill={INK}>{fig.from + i}</text>
            </g>
          ))}
          {arcs}
        </svg>
      );
    }
    case 'graph': {
      const R = 8; // טווח הצירים: מ-8- עד 8
      const S = 15;
      const P = (x: number, y: number) => [140 + x * S, 140 - y * S];
      const colors = ['#4f46e5', '#db2777'];
      return (
        <svg viewBox="0 0 280 280" className="mx-auto w-full max-w-[280px]" role="img" aria-label="גרף" style={{ direction: "ltr" }}>
          <defs>
            <clipPath id="plot"><rect x="20" y="20" width="240" height="240" /></clipPath>
          </defs>
          {Array.from({ length: 2 * R + 1 }, (_, i) => i - R).map((v) => (
            <g key={v}>
              <line x1={P(v, 0)[0]} y1="20" x2={P(v, 0)[0]} y2="260" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="20" y1={P(0, v)[1]} x2="260" y2={P(0, v)[1]} stroke="#e5e7eb" strokeWidth="1" />
              {v !== 0 && v % 2 === 0 && (
                <>
                  <text x={P(v, 0)[0]} y="153" textAnchor="middle" fontSize="9" fill="#6b7280">{v}</text>
                  <text x="134" y={P(0, v)[1] + 3} textAnchor="end" fontSize="9" fill="#6b7280">{v}</text>
                </>
              )}
            </g>
          ))}
          <line x1="20" y1="140" x2="260" y2="140" stroke="#374151" strokeWidth="1.5" />
          <line x1="140" y1="20" x2="140" y2="260" stroke="#374151" strokeWidth="1.5" />
          <text x="264" y="144" fontSize="11" fill="#374151">x</text>
          <text x="137" y="14" fontSize="11" fill="#374151">y</text>
          <g clipPath="url(#plot)">
            {fig.lines.map((ln, i) => {
              const [x1, y1] = P(-R, ln.m * -R + ln.b);
              const [x2, y2] = P(R, ln.m * R + ln.b);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors[i % 2]} strokeWidth="2.5" />;
            })}
            {(fig.points ?? []).map(([x, y], i) => (
              <circle key={i} cx={P(x, y)[0]} cy={P(x, y)[1]} r="4.5" fill={ACCENT} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        </svg>
      );
    }
  }
}
