import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

/* Ticket Goal — green gradient progress ring (inline SVG so we get a real
   gradient + glow) with a pace-to-target detail strip in the free space. */
export default function TicketGoal({ goals, kpis, loading }) {
  const { total, current, percentageCompleted } = goals.tickets;
  const pct = percentageCompleted || 0;
  const remaining = Math.max(0, total - current);
  const today = kpis.resolvedToday || 0;

  // ring geometry
  const size = 150;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, pct / 100);

  return (
    <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>Ticket Goal</p>
        <button style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${THEME.cardBorder}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpRightIcon style={{ width: 14, height: 14, color: THEME.textMuted }} />
        </button>
      </div>

      {/* Gradient progress ring */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 14px' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={COLORS.primaryLight} />
              <stop offset="100%" stopColor={COLORS.primaryDark} />
            </linearGradient>
            <filter id="goalGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={THEME.grid} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#goalGrad)" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={`${loading ? 0 : dash} ${circ}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ filter: 'url(#goalGlow)', transition: 'stroke-dasharray 1.1s cubic-bezier(0.34,1.56,0.64,1)' }} />
          <text x="50%" y="46%" textAnchor="middle" fontSize="30" fontWeight="800" fill={COLORS.primaryDark} fontFamily={THEME.fontFamily}>{loading ? '—' : `${pct}%`}</text>
          <text x="50%" y="60%" textAnchor="middle" fontSize="12" fontWeight="600" fill={THEME.textMuted} fontFamily={THEME.fontFamily}>complete</text>
        </svg>
      </div>

      {/* progress sentence */}
      <p style={{ margin: '0 0 12px', fontSize: 12, color: THEME.textSecondary, textAlign: 'center' }}>
        <strong style={{ color: COLORS.primaryDark }}>{current}</strong> of <strong>{total}</strong> tickets resolved
      </p>

      {/* detail strip — pinned to bottom to align with Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 'auto' }}>
        <Stat value={today} label="Today" color={COLORS.primary} tint />
        <Stat value={remaining} label="Left" color={THEME.text} />
        <Stat value={total} label="Target" color={COLORS.secondary} tint />
      </div>
    </div>
  );
}

function Stat({ value, label, color, tint }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 10, background: tint ? `${color}10` : THEME.grid }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
    </div>
  );
}
