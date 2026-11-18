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
    case 'triH': {
      return (
        <svg viewBox="0 0 280 165" className="mx-auto w-full max-w-[280px]" role="img" aria-label="משולש עם גובה">
          <polygon points="30,135 240,135 95,25" style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="95" y1="25" x2="95" y2="135" stroke={INK} strokeWidth="1.8" strokeDasharray="6 4" />
          <path d="M95 121 h14 v14" fill="none" stroke={INK} strokeWidth="1.5" />
          <Label x={135} y={152}>{fig.b}</Label>
          <Label x={87} y={84} anchor="end">{fig.h}</Label>
        </svg>
      );
    }
    case 'quad': {
      const pts = fig.kind === 'parallelogram' ? '30,135 200,135 250,30 80,30' : '30,135 250,135 190,30 90,30';
      return (
        <svg viewBox="0 0 280 165" className="mx-auto w-full max-w-[280px]" role="img" aria-label={fig.kind === 'parallelogram' ? 'מקבילית' : 'טרפז'}>
          <polygon points={pts} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="140" y1="30" x2="140" y2="135" stroke={INK} strokeWidth="1.8" strokeDasharray="6 4" />
          <path d="M140 121 h14 v14" fill="none" stroke={INK} strokeWidth="1.5" />
          <Label x={fig.kind === 'parallelogram' ? 115 : 140} y={152}>{fig.b}</Label>
          <Label x={132} y={84} anchor="end">{fig.h}</Label>
          {fig.top && <Label x={fig.kind === 'parallelogram' ? 165 : 140} y={16}>{fig.top}</Label>}
        </svg>
      );
    }
    case 'circle': {
      return (
        <svg viewBox="0 0 220 180" className="mx-auto w-full max-w-[220px]" role="img" aria-label="מעגל">
          <circle cx="110" cy="90" r="75" style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
          <circle cx="110" cy="90" r="3.5" fill={INK} />
          {fig.r && (
            <>
              <line x1="110" y1="90" x2="185" y2="90" stroke={INK} strokeWidth="2" />
              <Label x={148} y={78}>{fig.r}</Label>
            </>
          )}
          {fig.d && (
            <>
              <line x1="35" y1="90" x2="185" y2="90" stroke={INK} strokeWidth="2" />
              <Label x={110} y={106}>{fig.d}</Label>
            </>
          )}
        </svg>
      );
    }
    case 'box': {
      // תיבה בהטלה: חזית, עומק באלכסון
      const [x, y, w, h, dx, dy] = [40, 60, 150, 80, 50, -35];
      return (
        <svg viewBox="0 0 270 175" className="mx-auto w-full max-w-[270px]" role="img" aria-label="תיבה">
          <polygon points={`${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}`} fill="color-mix(in srgb, var(--tc, #4f46e5) 22%, white)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={`${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + dy + h} ${x + w},${y + h}`} fill="color-mix(in srgb, var(--tc, #4f46e5) 30%, white)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x={x} y={y} width={w} height={h} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
          <Label x={x + w / 2} y={y + h + 16}>{fig.a}</Label>
          <Label x={x + w + dx / 2 + 12} y={y + h + dy / 2 + 14} anchor="start">{fig.b}</Label>
          <Label x={x - 8} y={y + h / 2} anchor="end">{fig.c}</Label>
        </svg>
      );
    }
    case 'polygon': {
      const pts = Array.from({ length: fig.n }, (_, i) => {
        const t = -Math.PI / 2 + (i * 2 * Math.PI) / fig.n + (fig.n % 2 ? 0 : Math.PI / fig.n);
        return [110 + 72 * Math.cos(t), 92 + 72 * Math.sin(t)];
      });
      const [p0, p1] = [pts[Math.floor(fig.n / 2)], pts[Math.floor(fig.n / 2) - 1]];
      return (
        <svg viewBox="0 0 220 185" className="mx-auto w-full max-w-[220px]" role="img" aria-label={`מצולע עם ${fig.n} צלעות`}>
          <polygon points={pts.map((p) => p.join(',')).join(' ')} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {fig.side && <Label x={(p0[0] + p1[0]) / 2} y={(p0[1] + p1[1]) / 2 + 14}>{fig.side}</Label>}
        </svg>
      );
    }
    case 'bars': {
      const max = Math.max(...fig.values);
      const top = Math.ceil(max / fig.step) * fig.step;
      const H = 150;
      const Y = (v: number) => 170 - (v / top) * H;
      const n = fig.values.length;
      const bw = 200 / n;
      return (
        <svg viewBox="0 0 280 210" className="mx-auto w-full max-w-[360px]" role="img" aria-label="דיאגרמת עמודות" style={{ direction: 'ltr' }}>
          {Array.from({ length: top / fig.step + 1 }, (_, i) => i * fig.step).map((v) => (
            <g key={v}>
              <line x1="50" y1={Y(v)} x2="265" y2={Y(v)} stroke="#e5e7eb" strokeWidth="1" />
              <text x="42" y={Y(v) + 4} textAnchor="end" fontSize="12" fill="#5b6475">{v}</text>
            </g>
          ))}
          <line x1="50" y1="170" x2="265" y2="170" stroke={INK} strokeWidth="2" />
          <line x1="50" y1="15" x2="50" y2="170" stroke={INK} strokeWidth="2" />
          {fig.values.map((v, i) => (
            <g key={i}>
              <rect x={58 + i * bw + bw * 0.15} y={Y(v)} width={bw * 0.7} height={170 - Y(v)} fill={i % 2 ? '#818cf8' : ACCENT} />
              <text x={58 + i * bw + bw / 2} y="188" textAnchor="middle" fontSize="13" fontWeight="600" fill={INK} style={{ direction: 'rtl', unicodeBidi: 'plaintext' }}>{fig.labels[i]}</text>
            </g>
          ))}
        </svg>
      );
    }
    case 'parallel': {
      // ישרים ב-y=55 וב-y=135, חותך שעולה ימינה
      const X = [180, 120];
      const Y = [55, 135];
      const off = { tl: [-30, -16], tr: [26, -16], bl: [-26, 18], br: [30, 18] } as const;
      return (
        <svg viewBox="0 0 300 190" className="mx-auto w-full max-w-[300px]" role="img" aria-label="ישרים מקבילים וחותך" style={{ direction: 'ltr' }}>
          {Y.map((y) => (
            <g key={y}>
              <line x1="20" y1={y} x2="280" y2={y} stroke={INK} strokeWidth="2.5" />
              <path d={`M${262} ${y - 6} l8 6 l-8 6`} fill="none" stroke={INK} strokeWidth="2" />
            </g>
          ))}
          <line x1="75" y1="195" x2="225" y2="-5" stroke={INK} strokeWidth="2.5" />
          {fig.marks.map((m, i) => (
            <g key={i}>
              <circle cx={X[m.at] + off[m.q][0]} cy={Y[m.at] + off[m.q][1]} r="15" fill={m.label === '?' ? 'color-mix(in srgb, var(--tc, #b3261e) 15%, white)' : '#fff3bf'} />
              <Label x={X[m.at] + off[m.q][0]} y={Y[m.at] + off[m.q][1]}>{m.label}</Label>
            </g>
          ))}
        </svg>
      );
    }
    case 'triS': {
      const A = [35, 140];
      const B = [255, 140];
      const C = [170, 25];
      return (
        <svg viewBox="0 0 290 170" className="mx-auto w-full max-w-[290px]" role="img" aria-label="משולש" style={{ direction: 'ltr' }}>
          <polygon points={`${A} ${B} ${C}`} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          <Label x={22} y={150} bold>A</Label>
          <Label x={268} y={150} bold>B</Label>
          <Label x={170} y={12} bold>C</Label>
          {fig.c && <Label x={145} y={157}>{fig.c}</Label>}
          {fig.a && <Label x={225} y={78} anchor="start">{fig.a}</Label>}
          {fig.b && <Label x={92} y={76} anchor="end">{fig.b}</Label>}
          {fig.A && <Label x={70} y={128}>{fig.A}</Label>}
          {fig.B && <Label x={222} y={128}>{fig.B}</Label>}
          {fig.C && <Label x={170} y={52}>{fig.C}</Label>}
        </svg>
      );
    }
    case 'graph': {
      const R = fig.range ?? 8; // טווח הצירים: מ-R- עד R
      const S = 120 / R;
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
              {v !== 0 && v % Math.max(1, Math.round(R / 4)) === 0 && (
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
            {(fig.curves ?? []).map((c, i) => (
              <polyline key={`c${i}`} points={c.map(([x, y]) => P(x, Math.max(-3 * R, Math.min(3 * R, y))).join(',')).join(' ')} fill="none" stroke={colors[(fig.lines.length + i) % 2]} strokeWidth="2.5" strokeLinejoin="round" />
            ))}
            {(fig.points ?? []).map(([x, y], i) => (
              <circle key={i} cx={P(x, y)[0]} cy={P(x, y)[1]} r="4.5" fill={ACCENT} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
        </svg>
      );
    }
  }
}
