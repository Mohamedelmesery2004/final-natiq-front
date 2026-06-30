import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

/* Workload — capacity meter with a segmented utilization bar + free-space
   breakdown (used / free / per-slot ticks) instead of a hollow donut. */
export default function WorkloadSection({ workload, loading }) {
  const { totalCapacity, used, percentage, level } = workload;
  const cap = totalCapacity || 0;
  const free = Math.max(0, cap - (used || 0));
  const pct = percentage || 0;

  const levelColor = level === 'low' ? COLORS.primary : level === 'medium' ? COLORS.accent : COLORS.danger;
  const levelGrad = level === 'low'
    ? `linear-gradient(90deg, ${COLORS.primaryDark}, ${COLORS.primaryLight})`
    : level === 'medium'
      ? `linear-gradient(90deg, ${COLORS.accent}, #FBBF24)`
      : `linear-gradient(90deg, ${COLORS.danger}, #F87171)`;

  // 10-segment capacity meter
  const SLOTS = 10;
  const filled = Math.round((pct / 100) * SLOTS);

  return (
    <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>Workload</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: levelColor, background: `${levelColor}14`, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize' }}>{level}</span>
      </div>

      {/* Big utilization % */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, margin: '8px 0 14px' }}>
        <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: levelColor, letterSpacing: '-0.02em' }}>
          {loading ? '—' : pct}<span style={{ fontSize: 22 }}>%</span>
        </span>
        <span style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 6 }}>utilization</span>
      </div>

      {/* Segmented capacity meter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {Array.from({ length: SLOTS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 26, borderRadius: 5,
            background: i < filled ? levelGrad : THEME.grid,
            boxShadow: i < filled ? `0 2px 6px ${levelColor}33` : 'none',
            transition: `background 0.4s ${i * 0.04}s, box-shadow 0.4s`,
          }} />
        ))}
      </div>

      {/* Used / Free / Capacity — pinned to bottom to align with Ticket Goal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 'auto' }}>
        <Stat value={used} label="Used" color={levelColor} tint />
        <Stat value={free} label="Free" color={COLORS.primary} tint />
        <Stat value={cap} label="Capacity" color={THEME.text} />
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
