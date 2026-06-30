import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

export default function LowPerformers({ lowPerformers, loading }) {
  if (loading) {
    return (
      <div style={{ ...CARD_STYLE, padding: '20px', minHeight: '200px' }}>
        <div style={{ width: '50%', height: 18, borderRadius: 6, background: THEME.grid }} />
      </div>
    );
  }

  if (!lowPerformers || lowPerformers.length === 0) {
    return (
      <div style={{ ...CARD_STYLE, padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '13px', color: THEME.textMuted }}>No low performer data</p>
      </div>
    );
  }

  return (
    <div style={{ ...CARD_STYLE, padding: '20px' }}>
      <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: THEME.text }}>Needs Improvement</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {lowPerformers.slice(0, 5).map((agent, i) => (
          <div key={agent.id || i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '10px 12px', borderRadius: '10px',
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.12)',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700,
              background: 'rgba(239,68,68,0.12)', color: COLORS.danger,
              flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: THEME.text }}>{agent.name}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: COLORS.danger }}>
                  {agent.csat > 0 ? `${agent.csat}%` : '\u2014'}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: THEME.textMuted, marginTop: '2px' }}>
                Score: {agent.score} · {agent.resolvedTickets} resolved
              </div>
              {agent.issues && agent.issues.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {agent.issues.map((issue, j) => (
                    <span key={j} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '2px 8px', borderRadius: '100px',
                      fontSize: '10px', fontWeight: 600,
                      background: 'rgba(239,68,68,0.1)', color: COLORS.danger,
                    }}>
                      <ExclamationTriangleIcon style={{ width: '10px', height: '10px' }} />
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
