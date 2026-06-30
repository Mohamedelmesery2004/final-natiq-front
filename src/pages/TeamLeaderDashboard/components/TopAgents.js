import PremiumBarChart from '../../../components/charts/PremiumBarChart';
import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

export default function TopAgents({ topAgents, loading }) {
  const chartData = (topAgents || []).map((a) => ({
    name: a.name,
    value: a.score,
    csat: a.csat,
    resolved: a.resolvedTickets,
  }));

  if (!chartData.length && !loading) {
    return (
      <div style={{ ...CARD_STYLE, padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', color: THEME.textMuted }}>No top agent data</p>
      </div>
    );
  }

  return (
    <div style={{ ...CARD_STYLE, padding: '20px' }}>
      <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: THEME.text }}>Top Agents</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {chartData.slice(0, 5).map((agent, i) => {
          const barPct = Math.min(100, agent.value);
          return (
            <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700,
                background: i === 0 ? `linear-gradient(135deg, ${COLORS.accent}, #fbbf24)` : THEME.grid,
                color: i === 0 ? '#000' : THEME.text,
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: THEME.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: COLORS.primary }}>{agent.value}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '100px', background: THEME.grid, overflow: 'hidden' }}>
                  <div style={{
                    width: `${barPct}%`, height: '100%', borderRadius: '100px',
                    background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
                    transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                  }} />
                </div>
                <div style={{ fontSize: '10px', color: THEME.textMuted, marginTop: '2px' }}>
                  {agent.resolved} resolved · {agent.csat > 0 ? `${agent.csat}% CSAT` : 'No CSAT'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
