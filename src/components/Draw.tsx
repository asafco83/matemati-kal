import type { ReactNode } from 'react';
import type { Pt, Shape } from '../lib/types';
import { Rich } from './Tex';
import { T } from '../i18n';

const INK = '#1d2433';
const COLORS: Record<string, string> = { ink: INK, red: '#c92a2a', blue: '#1c7ed6', green: '#2f9e44', orange: '#e8590c', purple: '#7c3aed' };
const col = (c: string | undefined, fallback = INK) => (c && COLORS[c]) || fallback;
const fillOf = (c: string | undefined) => (c && COLORS[c] ? `color-mix(in srgb, ${COLORS[c]} 18%, white)` : 'none');

/* ---------- שרטוט חופשי של המורה ---------- */

const U = 36; // פיקסלים למשבצת
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const pt = (p: unknown): Pt => (Array.isArray(p) ? [num(p[0]), num(p[1])] : [0, 0]);

export function DrawBlock({ b }: { b: { width?: number; height?: number; origin?: Pt; axes?: boolean; grid?: boolean; shapes: Shape[]; caption?: string } }) {
  const w = Math.min(Math.max(num(b.width, 12), 2), 24), h = Math.min(Math.max(num(b.height, 8), 2), 24);
  const [ox, oy] = b.origin ? pt(b.origin) : [0, 0];
  const X = (x: number) => (x + ox) * U, Y = (y: number) => (h - y - oy) * U;
  const shape = (s: Shape, i: number): ReactNode => {
    const stroke = col(s.color);
    const dash = 'dashed' in s && s.dashed ? '6 5' : undefined;
    switch (s.kind) {
      case 'line':
      case 'arrow': {
        const [x1, y1] = pt(s.from), [x2, y2] = pt(s.to);
        return (
          <g key={i}>
            <line x1={X(x1)} y1={Y(y1)} x2={X(x2)} y2={Y(y2)} stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dash} markerEnd={s.kind === 'arrow' ? `url(#arr-${s.color && COLORS[s.color] ? s.color : 'ink'})` : undefined} />
            {s.label && (
              <text x={X((x1 + x2) / 2)} y={Y((y1 + y2) / 2) - 9} textAnchor="middle" fontSize="15" fontWeight="600" fill={stroke}>
                {String(s.label)}
              </text>
            )}
          </g>
        );
      }
      case 'circle':
        return <circle key={i} cx={X(pt(s.center)[0])} cy={Y(pt(s.center)[1])} r={Math.abs(num(s.r, 1)) * U} stroke={stroke} strokeWidth="2.5" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} />;
      case 'rect': {
        const [x, y] = pt(s.at), [rw, rh] = pt(s.size);
        return <rect key={i} x={X(x)} y={Y(y + rh)} width={Math.abs(rw) * U} height={Math.abs(rh) * U} stroke={stroke} strokeWidth="2.5" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} />;
      }
      case 'polygon':
      case 'path': {
        const d = (Array.isArray(s.points) ? s.points : []).map(pt).map(([x, y]) => `${X(x)},${Y(y)}`).join(' ');
        return s.kind === 'polygon' ? <polygon key={i} points={d} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeDasharray={dash} style={{ fill: fillOf(s.fill) }} /> : <polyline key={i} points={d} stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} fill="none" />;
      }
      case 'point': {
        const [x, y] = pt(s.at);
        return (
          <g key={i}>
            <circle cx={X(x)} cy={Y(y)} r="4.5" fill={stroke} />
            {s.label && (
              <text x={X(x) + 9} y={Y(y) - 9} fontSize="15" fontWeight="600" fill={stroke}>
                {String(s.label)}
              </text>
            )}
          </g>
        );
      }
      case 'text': {
        const [x, y] = pt(s.at);
        return (
          <text key={i} x={X(x)} y={Y(y)} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(Math.max(num(s.size, 16), 10), 40)} fontWeight="600" fill={stroke} style={{ unicodeBidi: 'plaintext' }}>
            {String(s.text ?? '')}
          </text>
        );
      }
      default:
        return null;
    }
  };
  return (
    <figure className="flex flex-col items-start gap-2">
      <svg viewBox={`0 0 ${w * U} ${h * U}`} className="w-full rounded-lg border border-line bg-white" style={{ maxWidth: w * U }} role="img" aria-label={b.caption ?? T('שרטוט')} fontFamily="Fredoka, Arial, sans-serif">
        <defs>
          {Object.entries(COLORS).map(([name, c]) => (
            <marker key={name} id={`arr-${name}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {b.grid !== false && (
          <g stroke="#dfe6f1" strokeWidth="1">
            {Array.from({ length: w + 1 }, (_, i) => <line key={`v${i}`} x1={i * U} y1="0" x2={i * U} y2={h * U} />)}
            {Array.from({ length: h + 1 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * U} x2={w * U} y2={i * U} />)}
          </g>
        )}
        {b.axes && (
          <g stroke={INK} strokeWidth="1.8">
            <line x1="0" y1={Y(0)} x2={w * U} y2={Y(0)} markerEnd="url(#arr-ink)" />
            <line x1={X(0)} y1={h * U} x2={X(0)} y2="0" markerEnd="url(#arr-ink)" />
          </g>
        )}
        {(Array.isArray(b.shapes) ? b.shapes : []).slice(0, 200).map(shape)}
      </svg>
      {b.caption && (
        <figcaption className="text-base text-muted">
          <Rich text={String(b.caption)} />
        </figcaption>
      )}
    </figure>
  );
}

