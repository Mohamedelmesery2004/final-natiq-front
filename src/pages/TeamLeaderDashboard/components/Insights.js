import { ExclamationTriangleIcon, InformationCircleIcon, FireIcon } from '@heroicons/react/24/outline';
import { THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

const SEVERITY_CONFIG = {
  high: { icon: FireIcon, bg: '#fee2e2', border: '#ef4444', color: '#991b1b', label: 'Critical' },
  medium: { icon: ExclamationTriangleIcon, bg: '#fef3c7', border: '#f59e0b', color: '#92400e', label: 'Warning' },
  low: { icon: InformationCircleIcon, bg: '#e0f2fe', border: '#3b82f6', color: '#1e40af', label: 'Info' },
};

export default function Insights({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div style={{ ...CARD_STYLE, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: THEME.textMuted }}>No insights available</p>
      </div>
    );
  }

  return (
    <div style={{ ...CARD_STYLE, padding: '16px 20px' }}>
      <p style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 700, color: THEME.text }}>Insights</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {insights.map((item, i) => {
          const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.low;
          const Icon = cfg.icon;
          return (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '12px 14px',
              borderRadius: '12px', background: cfg.bg, borderLeft: `3px solid ${cfg.border}`,
            }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <Icon style={{ width: '18px', height: '18px', color: cfg.border }} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                  {cfg.label}
                  {item.metric ? <span style={{ fontWeight: 400, opacity: 0.7 }}> · {item.metric}</span> : null}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#1d2f37', lineHeight: '1.4' }}>{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
