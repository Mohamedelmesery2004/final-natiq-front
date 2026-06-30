import { useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, EMPTY_ICON } from './ChartTheme';

const CARD_GLASS = {
  background: THEME.card,
  border: `1px solid ${THEME.cardBorder}`,
  borderRadius: `${THEME.radius}px`,
  boxShadow: THEME.shadow,
  backdropFilter: THEME.glassBlur,
  WebkitBackdropFilter: THEME.glassBlur,
};

export default function PremiumKPICard({ label, value, icon, accent = COLORS.primary, hint, trend, loading, sparkData }) {
  const ref = useRef(null);

  useEffect(() => {
    if (loading) return;
    gsap.from(ref.current, { y: 24, opacity: 0, duration: 0.5, ease: 'power3.out' });
  }, [loading]);

  if (loading) {
    return (
      <div style={{ ...CARD_GLASS, padding: '20px', minHeight: 140 }}>
        <div style={{ width: '60%', height: 14, borderRadius: 6, background: THEME.grid, marginBottom: 16 }} />
        <div style={{ width: '40%', height: 28, borderRadius: 6, background: THEME.grid, marginBottom: 12 }} />
        <div style={{ width: '100%', height: 36, borderRadius: 6, background: THEME.grid }} />
      </div>
    );
  }

  const v = typeof value === 'number' ? value.toLocaleString() : value || '\u2014';
  // only show a trend pill when a REAL trend is passed (no fabricated \u219112%)
  const trendInfo = trend || null;
  // only render the sparkline from REAL data with \u22652 varied points
  const realSpark = Array.isArray(sparkData)
    ? sparkData.filter((d) => d && typeof d.v === 'number')
    : [];
  const showSpark = realSpark.length >= 2 && !realSpark.every((d) => d.v === realSpark[0].v);

  return (
    <div ref={ref} style={{
      ...CARD_GLASS, padding: '20px', position: 'relative', overflow: 'hidden', cursor: 'default',
      transition: THEME.transition, fontFamily: THEME.fontFamily,
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = THEME.shadow; }}
    >
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${accent}18, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
            {typeof icon === 'string' ? <span style={{ fontSize: 18 }}>{icon}</span> : icon}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        </div>
        {trendInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '100px', background: `${trendInfo.color}12` }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: trendInfo.color }}>
              {trendInfo.direction === 'up' ? '\u2191' : trendInfo.direction === 'down' ? '\u2193' : '\u2192'}
            </span>
            {trendInfo.pct > 0 && <span style={{ fontSize: '12px', fontWeight: 600, color: trendInfo.color }}>{trendInfo.pct}%</span>}
          </div>
        )}
      </div>

      <p style={{ margin: 0, fontSize: '30px', fontWeight: 800, color: THEME.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
        {v}
      </p>

      {hint && <p style={{ margin: '6px 0 0', fontSize: '12px', color: THEME.textMuted }}>{hint}</p>}

      {showSpark && (
        <div style={{ height: 40, marginTop: 12, opacity: 0.6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={realSpark} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id={`spark-${label?.replace(/\s/g, '') || 'kpi'}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={accent} strokeWidth={1.5} fill={`url(#spark-${label?.replace(/\s/g, '') || 'kpi'})`} fillOpacity={1} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
