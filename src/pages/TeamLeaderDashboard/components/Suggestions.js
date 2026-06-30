import { LightBulbIcon, AcademicCapIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

const PRIORITY_CONFIG = {
  high: { icon: LightBulbIcon, bg: 'rgba(239,68,68,0.06)', border: '#ef4444', color: '#dc2626' },
  medium: { icon: AcademicCapIcon, bg: 'rgba(245,158,11,0.06)', border: '#f59e0b', color: '#b45309' },
  low: { icon: ArrowsRightLeftIcon, bg: 'rgba(37,211,102,0.06)', border: '#16a34a', color: '#15803d' },
};

const ACTION_LABELS = {
  coach: 'Coaching',
  train: 'Training',
  redistribute: 'Redistribute',
  review: 'Review',
  optimize: 'Optimize',
};

export default function Suggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div style={{ ...CARD_STYLE, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: THEME.textMuted }}>No suggestions available</p>
      </div>
    );
  }

  return (
    <div style={{ ...CARD_STYLE, padding: '16px 20px' }}>
      <p style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 700, color: THEME.text }}>Suggestions</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {suggestions.map((item, i) => {
          const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.low;
          const Icon = cfg.icon;
          return (
            <div key={i} style={{
              display: 'flex', gap: '12px', padding: '12px 14px',
              borderRadius: '12px', background: cfg.bg, borderLeft: `3px solid ${cfg.border}`,
            }}>
              <div style={{ flexShrink: 0, marginTop: '2px' }}>
                <Icon style={{ width: '18px', height: '18px', color: cfg.color }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {ACTION_LABELS[item.action] || item.action}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: THEME.textMuted, textTransform: 'capitalize' }}>
                    · {item.type}
                  </span>
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
