import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

/* SLA Compliance — segmented gradient bar (Within / Overdue / Breached)
   instead of a hollow donut, so the free space carries real detail. */
export default function SLASection({ sla, loading }) {
  const { overdueTickets, breachedTickets, withinSla, slaCompliancePercentage } = sla;
  const pct = slaCompliancePercentage || 0;
  const total = (withinSla || 0) + (overdueTickets || 0) + (breachedTickets || 0) || 1;

  const segs = [
    { label: 'Within', value: withinSla, color: COLORS.primary, grad: `linear-gradient(90deg, ${COLORS.primaryDark}, ${COLORS.primaryLight})` },
    { label: 'Overdue', value: overdueTickets, color: COLORS.accent, grad: `linear-gradient(90deg, ${COLORS.accent}, #FBBF24)` },
    { label: 'Breached', value: breachedTickets, color: COLORS.danger, grad: `linear-gradient(90deg, ${COLORS.danger}, #F87171)` },
  ];

  const statusColor = pct >= 90 ? COLORS.primary : pct >= 70 ? COLORS.accent : COLORS.danger;
  const health = pct >= 90 ? 'Healthy' : pct >= 70 ? 'At risk' : 'Critical';

  return (
    <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>SLA Compliance</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: `${statusColor}14`, padding: '3px 9px', borderRadius: 20 }}>{health}</span>
      </div>

      {/* Big % */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, margin: '8px 0 14px' }}>
        <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1, color: statusColor, letterSpacing: '-0.02em' }}>
          {loading ? '—' : pct}<span style={{ fontSize: 22 }}>%</span>
        </span>
        <span style={{ fontSize: 12, color: THEME.textMuted, marginBottom: 6 }}>of {total} tickets on time</span>
      </div>

      {/* Segmented gradient bar */}
      <div style={{ display: 'flex', height: 14, borderRadius: 100, overflow: 'hidden', background: THEME.grid, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}>
        {segs.map((s) => (
          (s.value || 0) > 0 ? (
            <div key={s.label} title={`${s.label}: ${s.value}`}
              style={{ width: `${((s.value || 0) / total) * 100}%`, background: s.grad, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
          ) : null
        ))}
      </div>

      {/* Legend rows with counts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {segs.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, display: 'inline-block' }} />
              <span style={{ fontSize: 13, color: THEME.textSecondary, fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <strong style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value || 0}</strong>
              <span style={{ fontSize: 11, color: THEME.textMuted }}>{Math.round(((s.value || 0) / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
