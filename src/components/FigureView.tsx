import type { ReactNode } from 'react';
import { Tex } from './Tex';
import type { Figure } from '../lib/types';
import { getLocale, localizeNumber, T } from '../i18n';

const INK = '#1d2433';
/** גוון בהיר של צבע המסלול (המשתנה --tc מוגדר בדף הנושא) */
const FILL = 'color-mix(in srgb, var(--tc, #4f46e5) 13%, white)';
const ACCENT = '#f5b400';

function Label({ x, y, children, anchor = 'middle', bold }: { x: number; y: number; children: string; anchor?: 'start' | 'middle' | 'end'; bold?: boolean }) {
  const q = children === '?';
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={q ? 20 : 16} fontWeight={q || bold ? 700 : 500} fontFamily="Fredoka, Arial, sans-serif" fill={q ? 'var(--tc, #b3261e)' : INK} style={{ direction: 'ltr', unicodeBidi: 'plaintext' }}>
      {localizeNumber(T(children))}
    </text>
  );
}

export function FigureView({ fig }: { fig: Figure }) {
  switch (fig.type) {
    case 'rect':
      return (
        <svg viewBox="0 0 260 150" className="mx-auto w-full max-w-[260px]" role="img" aria-label={T('מלבן')}>
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
        <svg viewBox="0 0 270 160" className="mx-auto w-full max-w-[270px]" role="img" aria-label={T('משולש ישר זווית')}>
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
        <svg viewBox="0 0 300 165" className="mx-auto w-full max-w-[300px]" role="img" aria-label={T('משולש')}>
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
        <svg viewBox="0 0 260 60" className="mx-auto w-full max-w-[320px]" role="img" aria-label={T(`${fig.filled} חלקים מתוך ${fig.parts}`)}>
          {Array.from({ length: fig.parts }, (_, i) => (
            <rect key={i} x={10 + i * w} y="10" width={w} height="40" fill={i < fig.filled ? ACCENT : '#fff'} stroke={INK} strokeWidth="2" />
          ))}
        </svg>
      );
    }
    case 'array': {
      const s = 26;
      return (
        <svg viewBox={`0 0 ${fig.cols * s + 10} ${fig.rows * s + 10}`} className="mx-auto w-full" style={{ maxWidth: fig.cols * s + 10 }} role="img" aria-label={T(`${fig.rows} שורות של ${fig.cols}`)}>
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
        <svg viewBox="0 0 320 85" className="mx-auto w-full max-w-[420px]" role="img" aria-label={T('ציר מספרים')} style={{ direction: "ltr" }}>
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
        <svg viewBox="0 0 280 165" className="mx-auto w-full max-w-[280px]" role="img" aria-label={T('משולש עם גובה')}>
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
        <svg viewBox="0 0 280 165" className="mx-auto w-full max-w-[280px]" role="img" aria-label={fig.kind === 'parallelogram' ? T('מקבילית') : T('טרפז')}>
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
        <svg viewBox="0 0 220 180" className="mx-auto w-full max-w-[220px]" role="img" aria-label={T('מעגל')}>
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
        <svg viewBox="0 0 270 175" className="mx-auto w-full max-w-[270px]" role="img" aria-label={T('תיבה')}>
          <polygon points={`${x},${y} ${x + dx},${y + dy} ${x + w + dx},${y + dy} ${x + w},${y}`} fill="color-mix(in srgb, var(--tc, #4f46e5) 22%, white)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <polygon points={`${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + dy + h} ${x + w},${y + h}`} fill="color-mix(in srgb, var(--tc, #4f46e5) 30%, white)" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <rect x={x} y={y} width={w} height={h} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
          <Label x={x + w / 2} y={y + h + 16}>{fig.a}</Label>
          <Label x={x + w + dx / 2 + 12} y={y + h + dy / 2 + 14} anchor="start">{fig.b}</Label>
          <Label x={x - 8} y={y + h / 2} anchor="end">{fig.c}</Label>
        </svg>
      );
    }
    case 'solid':
      return <Solid fig={fig} />;
    case 'circpts':
      return <CirclePoints fig={fig} />;
    case 'matches':
      return <Matches fig={fig} />;
    case 'clock': {
      const ma = (fig.m / 60) * 2 * Math.PI;
      const ha = (((fig.h % 12) + fig.m / 60) / 12) * 2 * Math.PI;
      const hand = (a: number, len: number, w: number, color: string) => <line x1="100" y1="100" x2={100 + len * Math.sin(a)} y2={100 - len * Math.cos(a)} stroke={color} strokeWidth={w} strokeLinecap="round" />;
      return (
        <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-[200px]" role="img" aria-label={T('שעון')}>
          <circle cx="100" cy="100" r="92" style={{ fill: FILL }} stroke={INK} strokeWidth="3" />
          {Array.from({ length: 60 }, (_, i) => {
            const a = (i / 60) * 2 * Math.PI, big = i % 5 === 0;
            return <line key={i} x1={100 + (big ? 80 : 85) * Math.sin(a)} y1={100 - (big ? 80 : 85) * Math.cos(a)} x2={100 + 90 * Math.sin(a)} y2={100 - 90 * Math.cos(a)} stroke={INK} strokeWidth={big ? 2.2 : 0.8} />;
          })}
          {Array.from({ length: 12 }, (_, i) => {
            const a = ((i + 1) / 12) * 2 * Math.PI;
            return <Label key={i} x={100 + 68 * Math.sin(a)} y={100 - 68 * Math.cos(a)} bold>{String(i + 1)}</Label>;
          })}
          {hand(ha, 42, 6, INK)}
          {hand(ma, 56, 3.5, 'var(--tc, #b3261e)')}
          <circle cx="100" cy="100" r="5" fill={INK} />
        </svg>
      );
    }
    case 'angle': {
      const r = (fig.deg * Math.PI) / 180;
      const vx = 130, vy = 130, len = 105;
      const ex = vx + len * Math.cos(r), ey = vy - len * Math.sin(r);
      const arc = (from: number, to: number, rad: number) => {
        const a = (from * Math.PI) / 180, b = (to * Math.PI) / 180;
        return `M ${vx + rad * Math.cos(a)} ${vy - rad * Math.sin(a)} A ${rad} ${rad} 0 ${to - from > 180 ? 1 : 0} 0 ${vx + rad * Math.cos(b)} ${vy - rad * Math.sin(b)}`;
      };
      const mid = (from: number, to: number, rad: number) => [vx + rad * Math.cos((((from + to) / 2) * Math.PI) / 180), vy - rad * Math.sin((((from + to) / 2) * Math.PI) / 180)];
      const [lx, ly] = mid(0, fig.deg, fig.deg < 40 ? 80 : 46);
      const [rx, ry] = mid(fig.deg, 180, 180 - fig.deg < 40 ? 80 : 46);
      return (
        <svg viewBox="0 0 260 150" className="mx-auto w-full max-w-[280px]" role="img" aria-label={T('זווית')}>
          <line x1={fig.rest ? vx - len : vx} y1={vy} x2={vx + len} y2={vy} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          <line x1={vx} y1={vy} x2={ex} y2={ey} stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
          {fig.deg === 90 ? <path d={`M ${vx + 16} ${vy} v -16 h -16`} fill="none" stroke={ACCENT} strokeWidth="2.5" /> : <path d={arc(0, fig.deg, 26)} fill="none" stroke={ACCENT} strokeWidth="2.5" />}
          {fig.rest && <path d={arc(fig.deg, 180, 20)} fill="none" stroke="var(--tc, #4f46e5)" strokeWidth="2.5" />}
          <Label x={lx} y={ly}>{fig.label}</Label>
          {fig.rest && <Label x={rx} y={ry}>{fig.rest}</Label>}
          <circle cx={vx} cy={vy} r="3.5" fill={INK} />
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
        <svg viewBox="0 0 220 185" className="mx-auto w-full max-w-[220px]" role="img" aria-label={T(`מצולע עם ${fig.n} צלעות`)}>
          <polygon points={pts.map((p) => p.join(',')).join(' ')} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {fig.side && <Label x={(p0[0] + p1[0]) / 2} y={(p0[1] + p1[1]) / 2 + 14}>{fig.side}</Label>}
          {fig.diags && pts.slice(2, -1).map((p, i) => <line key={i} x1={pts[0][0]} y1={pts[0][1]} x2={p[0]} y2={p[1]} stroke={INK} strokeWidth="1.8" strokeDasharray="6 4" />)}
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
        <svg viewBox="0 0 280 210" className="mx-auto w-full max-w-[360px]" role="img" aria-label={T('דיאגרמת עמודות')} style={{ direction: 'ltr' }}>
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
        <svg viewBox="0 0 300 190" className="mx-auto w-full max-w-[300px]" role="img" aria-label={T('ישרים מקבילים וחותך')} style={{ direction: 'ltr' }}>
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
    case 'quad4': {
      // קודקודים A, B, C, D נגד כיוון השעון, ונקודת חיתוך האלכסונים
      const P: Record<string, [number, number][]> = {
        parallelogram: [[40, 140], [200, 140], [250, 40], [90, 40]],
        rectangle: [[45, 140], [245, 140], [245, 40], [45, 40]],
        rhombus: [[145, 160], [245, 90], [145, 20], [45, 90]],
        square: [[85, 150], [205, 150], [205, 30], [85, 30]],
        kite: [[145, 165], [215, 65], [145, 20], [75, 65]],
      };
      const v = P[fig.kind];
      // חיתוך האלכסונים AC ו-BD
      const [A, B, C, D] = v;
      const den = (A[0] - C[0]) * (B[1] - D[1]) - (A[1] - C[1]) * (B[0] - D[0]);
      const t = ((A[0] - B[0]) * (B[1] - D[1]) - (A[1] - B[1]) * (B[0] - D[0])) / den;
      const O: [number, number] = [A[0] + t * (C[0] - A[0]), A[1] + t * (C[1] - A[1])];
      const showD = fig.diags ?? true;
      const perp = fig.kind === 'rhombus' || fig.kind === 'square' || fig.kind === 'kite';
      const mid = (p: [number, number], q: [number, number]): [number, number] => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      // תווית של צלע: מעט מחוץ למרובע
      const out = (p: [number, number], q: [number, number]): [number, number] => {
        const m = mid(p, q);
        const dx = m[0] - O[0], dy = m[1] - O[1], L0 = Math.hypot(dx, dy) || 1;
        return [m[0] + (dx / L0) * 16, m[1] + (dy / L0) * 16];
      };
      const s1 = out(A, B), s2 = out(B, C);
      return (
        <svg viewBox="0 0 290 185" className="mx-auto w-full max-w-[290px]" role="img" aria-label={fig.kind}>
          <polygon points={v.map((q) => q.join(',')).join(' ')} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
          {showD && (
            <g stroke={INK} strokeWidth="1.8" strokeDasharray="6 4">
              <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} />
              <line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} />
            </g>
          )}
          {showD && perp && (() => {
            // סימן זווית ישרה בנקודת החיתוך
            const u = [(C[0] - O[0]), (C[1] - O[1])], w = [(B[0] - O[0]), (B[1] - O[1])];
            const nu = Math.hypot(u[0], u[1]), nw = Math.hypot(w[0], w[1]);
            const a = [O[0] + (u[0] / nu) * 11, O[1] + (u[1] / nu) * 11], b = [O[0] + (w[0] / nw) * 11, O[1] + (w[1] / nw) * 11];
            return <path d={`M${a[0]} ${a[1]} L${a[0] + b[0] - O[0]} ${a[1] + b[1] - O[1]} L${b[0]} ${b[1]}`} fill="none" stroke={INK} strokeWidth="1.5" />;
          })()}
          {(fig.kind === 'rectangle' || fig.kind === 'square') && <path d={`M${A[0] + 13} ${A[1]} v-13 h-13`} fill="none" stroke={INK} strokeWidth="1.5" />}
          {(['A', 'B', 'C', 'D'] as const).map((n, i) => {
            const q = v[i], dx = q[0] - O[0], dy = q[1] - O[1], L0 = Math.hypot(dx, dy) || 1;
            return <Label key={n} x={q[0] + (dx / L0) * 14} y={q[1] + (dy / L0) * 14} bold>{n}</Label>;
          })}
          {fig.side && <Label x={s1[0]} y={s1[1]}>{fig.side}</Label>}
          {fig.side2 && <Label x={s2[0]} y={s2[1]}>{fig.side2}</Label>}
          {fig.d1 && <Label x={(A[0] + O[0]) / 2 + 12} y={(A[1] + O[1]) / 2} anchor="start">{fig.d1}</Label>}
          {fig.d2 && <Label x={(B[0] + O[0]) / 2} y={(B[1] + O[1]) / 2 - 11}>{fig.d2}</Label>}
          {fig.angle && <Label x={A[0] + 30} y={A[1] - 12} anchor="start">{fig.angle}</Label>}
        </svg>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto py-1">
          <table className="mx-auto border-collapse bg-white text-[18px]">
            <tbody>
              {fig.rows.map((r, i) => (
                <tr key={i}>
                  {fig.rows.some((row) => row.label) && <th className="whitespace-nowrap border border-[#c9c4b6] bg-[#f6f4ee] px-3 py-1.5 font-display text-[16px] font-semibold">{r.label ? T(r.label) : ''}</th>}
                  {r.cells.map((c, j) => (
                    <td key={j} className={`min-w-[2.6em] whitespace-nowrap border border-[#c9c4b6] px-3 py-1.5 text-center ${!fig.rows.some((row) => row.label) && i === 0 ? 'bg-[#f6f4ee]' : ''}`}>
                      <Tex tex={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'signtable': {
      const fn = fig.fn ?? 'f';
      const arrow = (d: '+' | '-') => (
        <svg viewBox="0 0 28 28" width="26" height="26" aria-label={d === '+' ? T('עולה') : T('יורדת')} className="mx-auto">
          <path d={d === '+' ? 'M5 23 L23 5 M11 5 H23 V17' : 'M5 5 L23 23 M23 11 V23 H11'} fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
      const cell = 'whitespace-nowrap border border-[#c9c4b6] px-2.5 py-1.5 text-center';
      return (
        <div dir="ltr" className="overflow-x-auto py-1">
          <table className="mx-auto border-collapse bg-white text-[17px]">
            <tbody>
              <tr>
                <th className={`${cell} bg-[#f6f4ee]`}><Tex tex="x" /></th>
                {fig.cols.map((c, i) => (
                  <td key={i} className={`${cell} ${c.d === '0' ? 'bg-[#fff8db]' : ''}`}><Tex tex={c.x} /></td>
                ))}
              </tr>
              <tr>
                <th className={`${cell} bg-[#f6f4ee]`}><Tex tex={`${fn}'(x)`} /></th>
                {fig.cols.map((c, i) => (
                  <td key={i} className={`${cell} font-semibold ${c.d === '0' ? 'bg-[#fff8db]' : ''}`}><Tex tex={c.d === '-' ? '-' : c.d} /></td>
                ))}
              </tr>
              <tr>
                <th className={`${cell} bg-[#f6f4ee]`}><Tex tex={`${fn}(x)`} /></th>
                {fig.cols.map((c, i) => (
                  <td key={i} className={`${cell} ${c.d === '0' ? 'bg-[#fff8db] text-sm font-bold' : ''}`}>
                    {c.d === '0' ? (c.f ?? '') : arrow(c.d)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
    case 'eqsides':
      return (
        <div dir="ltr" className="flex items-start justify-center gap-3 py-2 text-[26px]">
          {[fig.left, null, fig.right].map((part, i) =>
            part === null ? (
              <span key={i} className="pt-1">
                <Tex tex="=" />
              </span>
            ) : (
              <div key={i} className="flex flex-col items-center">
                <span className="rounded-lg px-2 pt-1" style={{ background: i === 0 ? 'color-mix(in srgb, var(--tc, #4f46e5) 14%, white)' : '#fff3bf' }}>
                  <Tex tex={part} />
                </span>
                <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="h-3.5 w-full" aria-hidden="true">
                  <path d="M3 2 Q3 9 12 9 H42 Q50 9 50 13 Q50 9 58 9 H88 Q97 9 97 2" fill="none" stroke={INK} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                </svg>
                <span dir={getLocale().dir} className="font-display text-base font-semibold text-muted">{i === 0 ? T('אגף שמאל') : T('אגף ימין')}</span>
              </div>
            ),
          )}
        </div>
      );
    case 'balance': {
      const t = (fig.tilt ?? 0) * 10;
      // y של שפת הכף בכל צד
      const rim = (side: -1 | 1) => 104 + side * t;
      return (
        <div className="relative mx-auto w-full max-w-[340px]" style={{ direction: 'ltr' }}>
          <svg viewBox="0 0 340 190" className="w-full" role="img" aria-label={T('מאזניים')}>
            <polygon points="170,52 150,170 190,170" fill="#d6d3c8" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
            <rect x="120" y="170" width="100" height="9" rx="3" fill={INK} />
            <line x1="62" y1={52 - t} x2="278" y2={52 + t} stroke={INK} strokeWidth="4" strokeLinecap="round" />
            <circle cx="170" cy="52" r="6" fill={INK} />
            {([-1, 1] as const).map((side) => {
              const cx = side < 0 ? 62 : 278;
              const top = 52 + side * t;
              const y = rim(side);
              return (
                <g key={side}>
                  <line x1={cx} y1={top} x2={cx - 54} y2={y} stroke={INK} strokeWidth="1.5" />
                  <line x1={cx} y1={top} x2={cx + 54} y2={y} stroke={INK} strokeWidth="1.5" />
                  <path d={`M${cx - 58} ${y} H${cx + 58} Q${cx + 50} ${y + 40} ${cx} ${y + 40} Q${cx - 50} ${y + 40} ${cx - 58} ${y} Z`} style={{ fill: side < 0 ? 'color-mix(in srgb, var(--tc, #4f46e5) 18%, white)' : '#fff3bf' }} stroke={INK} strokeWidth="2" />
                </g>
              );
            })}
          </svg>
          {[fig.left, fig.right].map((txt, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[19px]"
              style={{ left: `${((i ? 278 : 62) / 340) * 100}%`, top: `${((rim(i ? 1 : -1) + 19) / 190) * 100}%` }}
            >
              <Tex tex={txt} />
            </span>
          ))}
        </div>
      );
    }
    case 'colarith':
      return <ColumnArith top={fig.top} bottom={fig.bottom} op={fig.op} upto={fig.upto} from={fig.from} />;
    case 'longmul':
      return <LongMult a={fig.a} b={fig.b} upto={fig.upto} from={fig.from} />;
    case 'longdiv':
      return <LongDivision n={fig.n} d={fig.d} upto={fig.upto} from={fig.from} />;
    case 'triS': {
      const A = [35, 140];
      const B = [255, 140];
      const C = [170, 25];
      return (
        <svg viewBox="0 0 290 170" className="mx-auto w-full max-w-[290px]" role="img" aria-label={T('משולש')} style={{ direction: 'ltr' }}>
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
      const R = fig.range ?? 8; // טווח הצירים: מ-R- עד R, או מ-0 עד R ברביע הראשון
      const q1 = !!fig.q1;
      const S = q1 ? 240 / R : 120 / R;
      const O = q1 ? [20, 260] : [140, 140]; // ראשית הצירים
      const P = (x: number, y: number) => [O[0] + x * S, O[1] - y * S];
      const lo = q1 ? 0 : -R;
      const colors = ['#4f46e5', '#db2777', '#059669', '#d97706'];
      const step = Math.max(1, Math.round(R / (q1 ? 5 : 4)));
      return (
        <svg viewBox="0 0 280 280" className="mx-auto w-full max-w-[280px]" role="img" aria-label={T('גרף')} style={{ direction: 'ltr' }}>
          <defs>
            <clipPath id="plot"><rect x="20" y="20" width="240" height="240" /></clipPath>
          </defs>
          {Array.from({ length: R - lo + 1 }, (_, i) => i + lo).map((v) => (
            <g key={v}>
              <line x1={P(v, 0)[0]} y1="20" x2={P(v, 0)[0]} y2="260" stroke="#e5e7eb" strokeWidth="1" />
              <line x1="20" y1={P(0, v)[1]} x2="260" y2={P(0, v)[1]} stroke="#e5e7eb" strokeWidth="1" />
              {v !== 0 && v % step === 0 && (
                <>
                  <text x={P(v, 0)[0]} y={O[1] + 13} textAnchor="middle" fontSize="9" fill="#6b7280">{v}</text>
                  <text x={O[0] - 6} y={P(0, v)[1] + 3} textAnchor="end" fontSize="9" fill="#6b7280">{v}</text>
                </>
              )}
            </g>
          ))}
          <line x1="20" y1={O[1]} x2="260" y2={O[1]} stroke="#374151" strokeWidth="1.5" />
          <line x1={O[0]} y1="20" x2={O[0]} y2="260" stroke="#374151" strokeWidth="1.5" />
          <text x="264" y={O[1] + 4} fontSize="11" fill="#374151">{fig.axes?.[0] ?? 'x'}</text>
          <text x={O[0] - 3} y="14" fontSize="11" fill="#374151">{fig.axes?.[1] ?? 'y'}</text>
          <g clipPath="url(#plot)">
            {fig.region && <polygon points={fig.region.map(([x, y]) => P(x, y).join(',')).join(' ')} fill={ACCENT} fillOpacity="0.18" stroke="none" />}
            {fig.lines.map((ln, i) => {
              const [x1, y1] = P(lo - 1, ln.m * (lo - 1) + ln.b);
              const [x2, y2] = P(R + 1, ln.m * (R + 1) + ln.b);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={fig.dashedLines ? '#6b7280' : colors[i % colors.length]} strokeWidth={fig.dashedLines ? 1.8 : 2.5} strokeDasharray={fig.dashedLines ? '6 5' : undefined} />;
            })}
            {(fig.vlines ?? []).map((c, i) => (
              <line key={`v${i}`} x1={P(c, 0)[0]} y1="20" x2={P(c, 0)[0]} y2="260" stroke={colors[(fig.lines.length + i) % colors.length]} strokeWidth="2.5" />
            ))}
            {(fig.curves ?? []).map((c, i) => (
              <polyline key={`c${i}`} points={c.map(([x, y]) => P(x, Math.max(-3 * R, Math.min(3 * R, y))).join(',')).join(' ')} fill="none" stroke={colors[fig.dashedLines ? 0 : (fig.lines.length + i) % 2]} strokeWidth="2.5" strokeLinejoin="round" />
            ))}
            {(fig.points ?? []).map(([x, y], i) => (
              <circle key={i} cx={P(x, y)[0]} cy={P(x, y)[1]} r="4.5" fill={ACCENT} stroke="#fff" strokeWidth="1.5" />
            ))}
          </g>
          {(fig.pointLabels ?? []).map((l, i) => {
            const pt = fig.points?.[i];
            if (!pt) return null;
            const [x, y] = P(pt[0], pt[1]);
            return <Label key={`l${i}`} x={x + 9} y={y - 10} anchor="start" bold>{l}</Label>;
          })}
        </svg>
      );
    }
  }
}

/**
 * חילוק ארוך כמו שכותבים במחברת: המחולק, קו, והמחלק מימין לו.
 * המנה (והשארית בסוגריים) מעל המחולק, ומתחת לכל צעד: מינוס, מכפלה, קו, והשארית עם הספרה שירדה.
 *
 * שלבי הכתיבה (upto): 0 = המחולק והמחלק; לכל ספרה i:
 * 1+3i ספרת המנה, 2+3i המכפלה שמחסרים, 3+3i מה שנשאר (עם הספרה שירדה).
 * מה שנכתב בשלבים from..upto מסומן ברקע צהוב, כדי לראות מה נוסף עכשיו.
 */

function LongDivision({ n, d, upto, from }: { n: number; d: number; upto?: number; from?: number }) {
  const ds = String(n).split('').map(Number);
  const N = ds.length;
  const last = 3 * N;
  const U = upto ?? last;
  const F = from ?? (upto === undefined ? last + 1 : U);
  type Row = { text: string; end: number; stage: number; minus?: boolean; line?: boolean; accent?: boolean; arrowFrom?: number };
  const rows: Row[] = [];
  const q: number[] = [];
  let cur = 0;
  ds.forEach((dig, i) => {
    cur = cur * 10 + dig;
    const k = Math.floor(cur / d);
    q.push(k);
    rows.push({ text: String(k * d), end: i, stage: 2 + 3 * i, minus: true, line: true });
    cur -= k * d;
    if (i < N - 1) rows.push({ text: String(cur * 10 + ds[i + 1]), end: i + 1, stage: 3 + 3 * i, arrowFrom: i + 1 });
    else rows.push({ text: String(cur), end: i, stage: 3 + 3 * i, accent: true });
  });
  const r = cur;
  const visible = rows.filter((row) => row.stage <= U);
  const COL = 17;
  const ROW = 34;
  const left = 22;
  const top = 8;
  const W = left + N * COL + 18 + String(d).length * 16 + 50;
  const H = top + ROW * (visible.length + 2) + 6;
  const x = (col: number) => left + col * COL + COL / 2;
  const ACC = '#e8590c';
  const hl = (stage: number) => stage >= F && stage <= U;
  const mark = (x1: number, x2: number, yBase: number, key: string) => <rect key={key} x={x1} y={yBase - 21} width={x2 - x1} height={28} rx={6} fill="#ffe45c" opacity={0.75} />;
  const digitsAt = (text: string, end: number, y: number, color: string, key: string) =>
    text.split('').map((c, j) => (
      <text key={`${key}${j}`} x={x(end - (text.length - 1 - j))} y={y} textAnchor="middle" fontSize="22" fontWeight="600" fill={color} fontFamily="Fredoka, sans-serif">
        {c}
      </text>
    ));
  const yRow = (i: number) => top + ROW * (i + 2) + 24;
  const yDividend = top + ROW + 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W * 1.1, direction: 'ltr' }} role="img" aria-label={T(`חילוק ארוך: ${n} חלקי ${d}, מנה ${Number(q.join(''))} ושארית ${r}`)}>
      {/* המנה: כל ספרה מופיעה בשלב שלה */}
      {q.map((k, i) =>
        1 + 3 * i <= U ? (
          <g key={`q${i}`}>
            {hl(1 + 3 * i) && mark(x(i) - COL / 2, x(i) + COL / 2, top + 24, `qm${i}`)}
            {digitsAt(String(k), i, top + 24, ACC, `q${i}`)}
          </g>
        ) : null,
      )}
      {U >= last && (
        <text x={x(N - 1) + COL / 2 + 8} y={top + 24} fontSize="20" fontWeight="600" fill={ACC} fontFamily="Fredoka, sans-serif">
          ({r})
        </text>
      )}
      {/* המחולק, הקו מעליו והמחלק */}
      <line x1={left + 2} y1={top + 32} x2={left + N * COL + 4} y2={top + 32} stroke={INK} strokeWidth="2" />
      {hl(0) && mark(left, left + N * COL + 18 + String(d).length * 14, yDividend, 'dm')}
      {digitsAt(String(n), N - 1, yDividend, INK, 'n')}
      <line x1={left + N * COL + 4} y1={top + 32} x2={left + N * COL + 4} y2={top + ROW + 32} stroke={INK} strokeWidth="2" />
      <text x={left + N * COL + 12} y={yDividend} fontSize="22" fontWeight="600" fill={INK} fontFamily="Fredoka, sans-serif">
        {d}
      </text>
      {visible.map((row, i) => {
        const y = yRow(i);
        const startCol = row.end - row.text.length + 1;
        return (
          <g key={i}>
            {hl(row.stage) && mark(x(startCol) - COL / 2 - (row.minus ? 14 : 2), x(row.end) + COL / 2, y, `m${i}`)}
            {row.arrowFrom !== undefined && (
              <g stroke="#9a978e" strokeWidth="1.4" fill="none">
                <line x1={x(row.arrowFrom) + 6} y1={yDividend + 6} x2={x(row.arrowFrom) + 6} y2={y - 20} />
                <path d={`M${x(row.arrowFrom) + 3} ${y - 25} l3 5 l3 -5`} />
              </g>
            )}
            {row.minus && <line x1={x(startCol) - COL / 2 - 12} y1={y - 22} x2={x(startCol) - COL / 2 - 3} y2={y - 22} stroke={INK} strokeWidth="2" />}
            {digitsAt(row.text, row.end, y, row.accent ? ACC : INK, `r${i}`)}
            {row.line && <line x1={x(startCol) - COL / 2 - 2} y1={y + 7} x2={x(row.end) + COL / 2 - 2} y2={y + 7} stroke={INK} strokeWidth="1.8" />}
          </g>
        );
      })}
    </svg>
  );
}

/** מספר השלבים בכפל במאונך (בלי שלב ההכנה 0) */
function longMultStages(a: number, b: number) {
  const L = String(a).length;
  return b < 10 ? L : 2 * L + 2;
}

/**
 * כפל במאונך כמו במחברת: המספרים מיושרים לימין, × משמאל למספר התחתון, קו,
 * והתוצאה נכתבת ספרה אחר ספרה מימין לשמאל. ספרת ההעברה נכתבת קטנה מעל העמודה הבאה.
 * במכפיל דו-ספרתי: שורה לאחדות, שורה לעשרות (עם 0 בסוף), קו, וסכום.
 * שלבים: 0 = התרגיל; כל ספרה של התוצאה היא שלב. מה שנוסף בשלבים from..upto מסומן בצהוב.
 */
function LongMult({ a, b, upto, from }: { a: number; b: number; upto?: number; from?: number }) {
  const da = String(a).split('').map(Number).reverse();
  const L = da.length;
  const last = longMultStages(a, b);
  const U = upto ?? last;
  const F = from ?? (upto === undefined ? last + 1 : U);
  const two = b >= 10;
  const u = b % 10;
  const t = Math.floor(b / 10);
  type Cell = { col: number; ch: string; stage: number; row: string; small?: boolean };
  const cells: Cell[] = [];
  /** שורת מכפלה בספרה אחת, עם העברות */
  const partial = (m: number, row: string, shift: number, stage0: number) => {
    let carry = 0;
    da.forEach((d, i) => {
      const v = d * m + carry;
      const st = stage0 + i;
      if (i < L - 1) {
        cells.push({ col: i + shift, ch: String(v % 10), stage: st, row });
        carry = Math.floor(v / 10);
        // ההעברה נכתבת מעל הספרה הבאה של המספר העליון
        if (carry) cells.push({ col: i + 1, ch: String(carry), stage: st, row: `carry-${row}`, small: true });
      } else {
        String(v)
          .split('')
          .reverse()
          .forEach((c, j) => cells.push({ col: i + j + shift, ch: c, stage: st, row }));
      }
    });
  };
  partial(u, 'p1', 0, 1);
  if (two) {
    cells.push({ col: 0, ch: '0', stage: L + 1, row: 'p2' });
    partial(t, 'p2', 1, L + 2);
    String(a * b)
      .split('')
      .reverse()
      .forEach((c, j) => cells.push({ col: j, ch: c, stage: 2 * L + 2, row: 'sum' }));
  }
  const cols = Math.max(String(a * b).length, String(b).length + 1, L + 1) + 1;
  const COL = 17;
  const W = cols * COL + 24;
  const x = (col: number) => W - 12 - col * COL - COL / 2;
  const rowsOrder = two ? ['carry', 'a', 'b', 'line1', 'p1', 'p2', 'line2', 'sum'] : ['carry', 'a', 'b', 'line1', 'p1'];
  const visibleRows = rowsOrder.filter((r) => {
    if (r === 'p2' || r === 'line2') return U >= L + 1;
    if (r === 'sum') return U >= 2 * L + 2;
    return true;
  });
  const yOf: Record<string, number> = {};
  let y = 18;
  visibleRows.forEach((r) => {
    if (r === 'carry') {
      yOf[r] = y;
      y += 18;
    } else if (r.startsWith('line')) {
      yOf[r] = y - 9;
      y += 4;
    } else {
      yOf[r] = y + 14;
      y += 34;
    }
  });
  const H = y + 4;
  const ACC = '#e8590c';
  const hl = (st: number) => st >= F && st <= U;
  const digits = (n: number, rowY: number, key: string, color = INK) =>
    String(n)
      .split('')
      .reverse()
      .map((c, j) => (
        <text key={`${key}${j}`} x={x(j)} y={rowY} textAnchor="middle" fontSize="22" fontWeight="600" fill={color} fontFamily="Fredoka, sans-serif">
          {c}
        </text>
      ));
  // ספרות ההעברה של השורה שעובדים עליה עכשיו בלבד
  const carryRow = two && U >= L + 1 ? 'carry-p2' : 'carry-p1';
  const resultColor = (row: string) => (row === 'sum' || (!two && row === 'p1') ? ACC : INK);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W * 1.15, direction: 'ltr' }} role="img" aria-label={T(`כפל במאונך: ${a} כפול ${b} שווה ${a * b}`)}>
      {digits(a, yOf.a, 'a')}
      {digits(b, yOf.b, 'b')}
      <text x={x(String(b).length) - 2} y={yOf.b - 2} textAnchor="middle" fontSize="20" fill={INK}>
        ×
      </text>
      <line x1={x(cols - 1) - COL / 2 + 4} y1={yOf.line1} x2={W - 8} y2={yOf.line1} stroke={INK} strokeWidth="2" />
      {two && U >= 2 * L + 2 && (
        <>
          <line x1={x(cols - 1) - COL / 2 + 4} y1={yOf.line2} x2={W - 8} y2={yOf.line2} stroke={INK} strokeWidth="2" />
          <text x={x(cols - 1)} y={yOf.p2} textAnchor="middle" fontSize="20" fill={INK}>
            +
          </text>
        </>
      )}
      {cells
        .filter((c) => c.stage <= U && (!c.small || c.row === carryRow))
        .map((c, i) => {
          const isCarry = !!c.small;
          const cy = isCarry ? yOf.carry : yOf[c.row];
          return (
            <g key={i}>
              {hl(c.stage) && <rect x={x(c.col) - (isCarry ? 7 : 10)} y={cy - (isCarry ? 13 : 21)} width={isCarry ? 14 : 20} height={isCarry ? 17 : 28} rx={5} fill="#ffe45c" opacity={0.75} />}
              <text x={x(c.col)} y={cy} textAnchor="middle" fontSize={isCarry ? 14 : 22} fontWeight="600" fill={isCarry ? '#5b6475' : resultColor(c.row)} fontFamily="Fredoka, sans-serif">
                {c.ch}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

/** מיישר שני מספרים (גם עשרוניים) לעמודות: ספרות מימין לשמאל, והנקודה במקום קבוע */
function alignColumns(top: string, bottom: string) {
  const dec = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0);
  const D = Math.max(dec(top), dec(bottom));
  const pad = (s: string) => {
    const [i, f = ''] = s.split('.');
    return { int: i, frac: f.padEnd(D, '0') };
  };
  return { a: pad(top), b: pad(bottom), D };
}

/**
 * חיבור או חיסור במאונך כמו במחברת. מחשבים עמודה אחר עמודה מימין לשמאל.
 * בחיבור: ספרת העברה קטנה מעל העמודה הבאה. בחיסור: כשהספרה למעלה קטנה מדי,
 * פורטים: מוחקים את הספרה שמשמאל, כותבים מעליה אחת פחות, וכותבים 1 קטן לפני הספרה הנוכחית.
 * שלבים: 0 = התרגיל, ואחר כך עמודה אחת בכל שלב (מימין). מה שנוסף בשלבים from..upto מסומן.
 */
function ColumnArith({ top, bottom, op, upto, from }: { top: string; bottom: string; op: '+' | '-'; upto?: number; from?: number }) {
  const { a, b, D } = alignColumns(top, bottom);
  // ספרות שהושלמו כ-0 אחרי הנקודה (לא נכתבו בתרגיל המקורי) מוצגות באפור
  const decOf = (s: string) => (s.includes('.') ? s.split('.')[1].length : 0);
  const padA = D - decOf(top);
  const padB = D - decOf(bottom);
  // ספרות מימין לשמאל, בלי הנקודה
  const A = (a.int + a.frac).split('').map(Number).reverse();
  const B = (b.int + b.frac).split('').map(Number).reverse();
  const n = Math.max(A.length, B.length);
  type Mark = { col: number; ch: string; stage: number; kind: 'res' | 'carry' | 'borrowNew' | 'borrowOne' | 'cross' };
  const marks: Mark[] = [];
  const work = [...A];
  let carry = 0;
  let stages = 0;
  for (let i = 0; i < n; i++) {
    const st = i + 1;
    const x = work[i] ?? 0;
    const y = B[i] ?? 0;
    if (op === '+') {
      const v = x + y + carry;
      const lastCol = i === n - 1;
      if (lastCol) String(v).split('').reverse().forEach((c, j) => marks.push({ col: i + j, ch: c, stage: st, kind: 'res' }));
      else {
        marks.push({ col: i, ch: String(v % 10), stage: st, kind: 'res' });
        carry = Math.floor(v / 10);
        if (carry) marks.push({ col: i + 1, ch: String(carry), stage: st, kind: 'carry' });
      }
    } else {
      let cur = x;
      if (cur < y) {
        // פורטים מהעמודה הבאה (ואם היא 0, ממשיכים הלאה)
        let k = i + 1;
        while (work[k] === 0) k++;
        for (let j = k; j > i; j--) {
          marks.push({ col: j, ch: '', stage: st, kind: 'cross' });
          work[j] = j === k ? work[j] - 1 : 9;
          marks.push({ col: j, ch: String(work[j]), stage: st, kind: 'borrowNew' });
        }
        marks.push({ col: i, ch: '1', stage: st, kind: 'borrowOne' });
        cur += 10;
      }
      const v = cur - y;
      // לא כותבים אפסים מובילים בתוצאה (חוץ מעמודת האחדות ומה שמימין לנקודה)
      const leading = i > D && i >= n - 1 && v === 0;
      if (!leading) marks.push({ col: i, ch: String(v), stage: st, kind: 'res' });
    }
    stages = st;
  }
  const U = upto ?? stages;
  const F = from ?? (upto === undefined ? stages + 1 : U);
  const COL = 30;
  const cols = n + 2;
  const W = cols * COL + 20;
  const x = (col: number) => W - 10 - col * COL - COL / 2 - (D && col >= D ? 7 : 0);
  const yCarry = 18;
  const yTop = 50;
  const yBot = 84;
  const yLine = 93;
  const yRes = 122;
  const H = 134;
  const ACC = '#e8590c';
  const shown = marks.filter((m) => m.stage <= U);
  const crossed = new Set(shown.filter((m) => m.kind === 'cross').map((m) => m.col));
  const hl = (st: number) => st >= F && st <= U;
  const digitRow = (digits: number[], y: number, key: string, pad: number, crossCols?: Set<number>) =>
    digits.map((d, i) => (
      <g key={`${key}${i}`}>
        <text x={x(i)} y={y} textAnchor="middle" fontSize="22" fontWeight="600" fill={i < pad ? '#b5b1a6' : INK} fontFamily="Fredoka, sans-serif">
          {d}
        </text>
        {crossCols?.has(i) && <line x1={x(i) - 6} y1={y + 2} x2={x(i) + 6} y2={y - 16} stroke={ACC} strokeWidth="2" />}
      </g>
    ));
  // הנקודה העשרונית, או פסיק בשפות שבהן כותבים כך
  const point = (y: number) =>
    D > 0 &&
    (getLocale().decimalComma ? (
      <path d={`M${x(D) + COL / 2 + 4} ${y - 3} q 1.5 4 -2.5 8`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    ) : (
      <circle cx={x(D) + COL / 2 + 3} cy={y - 2} r="2.4" fill={INK} />
    ));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W * 1.15, direction: 'ltr' }} role="img" aria-label={T(`${top} ${op === '+' ? T('ועוד') : T('פחות')} ${bottom}, במאונך`)}>
      {digitRow(A, yTop, 't', padA, crossed)}
      {point(yTop)}
      {digitRow(B, yBot, 'b', padB)}
      {point(yBot)}
      <text x={x(Math.max(A.length, B.length))} y={yBot - 2} textAnchor="middle" fontSize="22" fill={INK}>
        {op === '+' ? '+' : '−'}
      </text>
      <line x1={x(Math.max(A.length, B.length)) - 10} y1={yLine} x2={W - 6} y2={yLine} stroke={INK} strokeWidth="2" />
      {U >= stages && point(yRes)}
      {shown.map((m, i) => {
        if (m.kind === 'cross') return null;
        const small = m.kind !== 'res';
        const y = m.kind === 'res' ? yRes : m.kind === 'borrowOne' ? yTop - 10 : yCarry + 8;
        const cx = m.kind === 'borrowOne' ? x(m.col) - 14 : x(m.col);
        return (
          <g key={i}>
            {hl(m.stage) && <rect x={cx - (small ? 7 : 10)} y={y - (small ? 13 : 21)} width={small ? 14 : 20} height={small ? 17 : 28} rx={5} fill="#ffe45c" opacity={0.75} />}
            <text x={cx} y={y} textAnchor="middle" fontSize={small ? 14 : 22} fontWeight="600" fill={m.kind === 'res' ? ACC : '#5b6475'} fontFamily="Fredoka, sans-serif">
              {m.ch}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** גופים במרחב: גליל, חרוט, כדור ופירמידה עם בסיס ריבועי. קווים נסתרים מקווקוים, כמו במחברת */
function Solid({ fig }: { fig: Extract<Figure, { type: 'solid' }> }) {
  const dash = '6 5';
  const side = 'color-mix(in srgb, var(--tc, #4f46e5) 22%, white)';
  const svg = (label: string, children: ReactNode) => (
    <svg viewBox="0 0 240 215" className="mx-auto w-full max-w-[240px]" role="img" aria-label={label}>
      {children}
    </svg>
  );
  if (fig.kind === 'cylinder') {
    const [cx, top, bot, rx, ry] = [120, 40, 175, 70, 17];
    return svg(
      T('גליל'),
      <>
        <path d={`M${cx - rx},${top} L${cx - rx},${bot} A${rx},${ry} 0 0 0 ${cx + rx},${bot} L${cx + rx},${top} Z`} style={{ fill: side }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M${cx - rx},${bot} A${rx},${ry} 0 0 1 ${cx + rx},${bot}`} fill="none" stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
        <ellipse cx={cx} cy={top} rx={rx} ry={ry} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
        {fig.r && (
          <>
            <circle cx={cx} cy={top} r="3" fill={INK} />
            <line x1={cx} y1={top} x2={cx + rx} y2={top} stroke={INK} strokeWidth="2" />
            <Label x={cx + rx / 2} y={top - 9}>{fig.r}</Label>
          </>
        )}
        {fig.h && <Label x={cx + rx + 8} y={(top + bot) / 2} anchor="start">{fig.h}</Label>}
      </>,
    );
  }
  if (fig.kind === 'cone') {
    const [cx, ax, ay, by, rx, ry] = [120, 120, 25, 175, 75, 17];
    return svg(
      T('חרוט'),
      <>
        <path d={`M${ax},${ay} L${cx - rx},${by} A${rx},${ry} 0 0 0 ${cx + rx},${by} Z`} style={{ fill: side }} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        <path d={`M${cx - rx},${by} A${rx},${ry} 0 0 1 ${cx + rx},${by}`} fill="none" stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
        {fig.h && (
          <>
            <line x1={ax} y1={ay} x2={cx} y2={by} stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
            <polyline points={`${cx},${by - 11} ${cx + 11},${by - 11} ${cx + 11},${by}`} fill="none" stroke={INK} strokeWidth="1.5" />
            <Label x={cx - 8} y={(ay + by) / 2 + 10} anchor="end">{fig.h}</Label>
          </>
        )}
        {fig.r && (
          <>
            <circle cx={cx} cy={by} r="3" fill={INK} />
            <line x1={cx} y1={by} x2={cx + rx} y2={by} stroke={INK} strokeWidth="2" />
            <Label x={cx + rx / 2 + 4} y={by - 10}>{fig.r}</Label>
          </>
        )}
        {fig.l && <Label x={(ax + cx + rx) / 2 + 10} y={(ay + by) / 2 - 6} anchor="start">{fig.l}</Label>}
      </>,
    );
  }
  if (fig.kind === 'sphere') {
    const [cx, cy, R] = [120, 108, 85];
    return svg(
      T('כדור'),
      <>
        <circle cx={cx} cy={cy} r={R} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
        <path d={`M${cx - R},${cy} A${R},${R / 4} 0 0 0 ${cx + R},${cy}`} fill="none" stroke={INK} strokeWidth="1.8" />
        <path d={`M${cx - R},${cy} A${R},${R / 4} 0 0 1 ${cx + R},${cy}`} fill="none" stroke={INK} strokeWidth="1.5" strokeDasharray={dash} />
        <circle cx={cx} cy={cy} r="3" fill={INK} />
        {fig.r && (
          <>
            <line x1={cx} y1={cy} x2={cx + R * 0.7} y2={cy - R * 0.71} stroke={INK} strokeWidth="2" />
            <Label x={cx + R * 0.35 + 12} y={cy - R * 0.36 + 4} anchor="start">{fig.r}</Label>
          </>
        )}
      </>,
    );
  }
  // פירמידה ישרה עם בסיס ריבועי
  const A: [number, number] = [35, 180], B: [number, number] = [160, 180], C: [number, number] = [205, 145], D: [number, number] = [80, 145];
  const S: [number, number] = [120, 22];
  const O: [number, number] = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2];
  const p = (q: [number, number]) => `${q[0]},${q[1]}`;
  return svg(
    T('פירמידה'),
    <>
      <polygon points={`${p(S)} ${p(A)} ${p(B)} ${p(C)}`} style={{ fill: side }} stroke="none" />
      <polygon points={`${p(S)} ${p(A)} ${p(B)}`} style={{ fill: FILL }} stroke="none" />
      <polyline points={`${p(A)} ${p(D)} ${p(C)}`} fill="none" stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
      <line x1={S[0]} y1={S[1]} x2={D[0]} y2={D[1]} stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
      <polyline points={`${p(A)} ${p(B)} ${p(C)}`} fill="none" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {[A, B, C].map((q, i) => (
        <line key={i} x1={S[0]} y1={S[1]} x2={q[0]} y2={q[1]} stroke={INK} strokeWidth="2.5" />
      ))}
      {fig.h && (
        <>
          <line x1={S[0]} y1={S[1]} x2={O[0]} y2={O[1]} stroke={INK} strokeWidth="1.8" strokeDasharray={dash} />
          <circle cx={O[0]} cy={O[1]} r="3" fill={INK} />
          <Label x={S[0] + 8} y={(S[1] + O[1]) / 2 + 8} anchor="start">{fig.h}</Label>
        </>
      )}
      {fig.r && <Label x={(A[0] + B[0]) / 2} y={A[1] + 16}>{fig.r}</Label>}
    </>,
  );
}

/** מעגל עם נקודות, קטעים, זוויות ומשיק */
function CirclePoints({ fig }: { fig: Extract<Figure, { type: 'circpts' }> }) {
  const [cx, cy, R] = [150, 125, 82];
  const pos: Record<string, [number, number]> = {};
  if (fig.center) pos.O = [cx, cy];
  for (const p of fig.pts) {
    if (p.deg !== undefined) pos[p.n] = [cx + R * Math.cos((p.deg * Math.PI) / 180), cy - R * Math.sin((p.deg * Math.PI) / 180)];
    else pos[p.n] = [cx + R * (p.x ?? 0), cy - R * (p.y ?? 0)];
  }
  const unit = (a: [number, number], b: [number, number]): [number, number] => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
  };
  const tan = fig.tangent && pos[fig.tangent];
  let tanLine: [number, number, number, number] | null = null;
  if (tan) {
    const [ux, uy] = unit([cx, cy], tan);
    tanLine = [tan[0] - uy * 150, tan[1] + ux * 150, tan[0] + uy * 150, tan[1] - ux * 150];
  }
  return (
    <svg viewBox="0 0 300 250" className="mx-auto w-full max-w-[300px]" role="img" aria-label={T('מעגל')} style={{ direction: 'ltr' }}>
      <defs>
        <clipPath id="cpclip"><rect x="0" y="0" width="300" height="250" /></clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={R} style={{ fill: FILL }} stroke={INK} strokeWidth="2.5" />
      {tanLine && <line x1={tanLine[0]} y1={tanLine[1]} x2={tanLine[2]} y2={tanLine[3]} stroke={INK} strokeWidth="2" clipPath="url(#cpclip)" />}
      {(fig.segs ?? []).map(([a, b], i) => pos[a] && pos[b] && <line key={i} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke={INK} strokeWidth="2" />)}
      {(fig.angles ?? []).map((g, i) => {
        const V = pos[g.at], A = pos[g.a], B = pos[g.b];
        if (!V || !A || !B) return null;
        const u = unit(V, A), w = unit(V, B);
        const r = 17;
        const cross = u[0] * w[1] - u[1] * w[0];
        const right = g.label === '90°';
        const bis = unit([0, 0], [u[0] + w[0], u[1] + w[1]]);
        return (
          <g key={i}>
            {right ? (
              <polyline points={`${V[0] + u[0] * 11},${V[1] + u[1] * 11} ${V[0] + (u[0] + w[0]) * 11},${V[1] + (u[1] + w[1]) * 11} ${V[0] + w[0] * 11},${V[1] + w[1] * 11}`} fill="none" stroke={ACCENT} strokeWidth="2" />
            ) : (
              <path d={`M${V[0] + u[0] * r},${V[1] + u[1] * r} A${r},${r} 0 0 ${cross > 0 ? 1 : 0} ${V[0] + w[0] * r},${V[1] + w[1] * r}`} fill="none" stroke={ACCENT} strokeWidth="2.5" />
            )}
            {!right && <Label x={V[0] + bis[0] * 36} y={V[1] + bis[1] * 36}>{g.label}</Label>}
          </g>
        );
      })}
      {(fig.lens ?? []).map((l, i) => {
        const A = pos[l.a], B = pos[l.b];
        if (!A || !B) return null;
        const [ux, uy] = unit(A, B);
        const m: [number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        const side = (m[0] - cx) * -uy + (m[1] - cy) * ux >= 0 ? 1 : -1;
        return <Label key={i} x={m[0] - uy * 13 * side} y={m[1] + ux * 13 * side}>{l.label}</Label>;
      })}
      {Object.entries(pos).map(([n, [x, y]]) => {
        let out: [number, number] = unit([cx, cy], [x, y]);
        if (n === 'O') {
          // המרכז: התווית בצד שאין בו קטעים
          const dirs = (fig.segs ?? []).filter((sg) => sg.includes('O')).map((sg) => pos[sg[0] === 'O' ? sg[1] : sg[0]]).filter(Boolean).map((q) => unit([cx, cy], q));
          const sx = dirs.reduce((a, d) => a + d[0], 0), sy = dirs.reduce((a, d) => a + d[1], 0);
          out = dirs.length && Math.hypot(sx, sy) > 0.1 ? unit([0, 0], [-sx, -sy]) : [0, 1];
        }
        return (
          <g key={n}>
            <circle cx={x} cy={y} r="3.5" fill={INK} />
            <Label x={x + out[0] * 15} y={y + out[1] * 15} bold>{n}</Label>
          </g>
        );
      })}
    </svg>
  );
}

/** שורת גפרורים, כמו בספרי התבניות */
function Matches({ fig }: { fig: Extract<Figure, { type: 'matches' }> }) {
  const s = 40;
  const sticks: [number, number, number, number][] = [];
  if (fig.shape === 'squares') {
    for (let i = 0; i < fig.n; i++) {
      const x = 10 + i * s;
      sticks.push([x, 10, x + s, 10], [x, 10 + s, x + s, 10 + s]);
      if (i === 0) sticks.push([x, 10, x, 10 + s]);
      sticks.push([x + s, 10, x + s, 10 + s]);
    }
  } else {
    const h = s * 0.87;
    for (let i = 0; i < fig.n; i++) {
      const up = i % 2 === 0;
      const x = 10 + (i * s) / 2;
      const [x1, y1, x2, y2, x3, y3] = up ? [x, 10 + h, x + s, 10 + h, x + s / 2, 10] : [x, 10, x + s, 10, x + s / 2, 10 + h];
      if (i === 0) sticks.push([x1, y1, x3, y3]);
      sticks.push([x3, y3, x2, y2]);
      sticks.push([x1, y1, x2, y2]);
    }
    // הצלע המשותפת נספרת פעם אחת: מסננים כפולים
  }
  const uniq = sticks.filter((a, i) => sticks.findIndex((b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]) < 1) === i);
  const W = 20 + (fig.shape === 'squares' ? fig.n * s : ((fig.n + 1) * s) / 2);
  return (
    <svg viewBox={`0 0 ${W} 60`} className="mx-auto w-full" style={{ maxWidth: Math.min(420, W * 1.4) }} role="img" aria-label={T('גפרורים')}>
      {uniq.map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <line x1={x1 + (x2 - x1) * 0.06} y1={y1 + (y2 - y1) * 0.06} x2={x2 - (x2 - x1) * 0.06} y2={y2 - (y2 - y1) * 0.06} stroke="#c8a165" strokeWidth="4" strokeLinecap="round" />
          <circle cx={x2 - (x2 - x1) * 0.08} cy={y2 - (y2 - y1) * 0.08} r="3.2" fill="#b3261e" />
        </g>
      ))}
    </svg>
  );
}
