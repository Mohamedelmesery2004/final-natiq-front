import { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, CARD_STYLE } from './ChartTheme';
import { EmptyState } from './PremiumLineChart';

export default function PremiumDonutChart({
  data, title, subtitle, loading, height = 280,
  innerRadius = 65, outerRadius = 95,
  centerValue, centerLabel, centerSub,
}) {
  const ref = useRef(null);
  const hasData = !loading && data?.length > 0 && data.some((d) => (d.value || 0) > 0);

  useEffect(() => {
    if (!hasData) return;
    gsap.from(ref.current.querySelectorAll('.donut-seg'), { scale: 0.5, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'back.out(1.7)' });
  }, [hasData]);

  if (loading) return <Skeleton height={height} title={title} />;
  if (!hasData) return <EmptyState title={title} subtitle={subtitle} height={height} />;

  const total = data.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px', position: 'relative' }}>
      <div style={{ marginBottom: '8px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>{title}</p>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted }}>{subtitle}</p>}
      </div>

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height={height - 100}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={innerRadius} outerRadius={outerRadius}
              paddingAngle={3} dataKey="value" stroke="none">
              {data.map((e, i) => (
                <Cell key={i} className="donut-seg" fill={e.color || COLORS.primary}
                  style={{ filter: `drop-shadow(0 2px 8px ${e.color || COLORS.primary}33)` }} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>

        {(centerValue || centerLabel) && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            {centerValue && <p style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: THEME.text, lineHeight: 1.2, fontFamily: THEME.fontFamily }}>{centerValue}</p>}
            {centerLabel && <p style={{ margin: '2px 0 0', fontSize: '12px', fontWeight: 600, color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{centerLabel}</p>}
            {centerSub && <p style={{ margin: 0, fontSize: '10px', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{centerSub}</p>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color || COLORS.primary, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>{d.name}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>
              {total > 0 ? Math.round((d.value / total) * 100) : 0}% <span style={{ color: THEME.textMuted, fontWeight: 400 }}>({d.value.toLocaleString()})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
      borderRadius: '12px', padding: '10px 14px', boxShadow: THEME.shadowLg,
      backdropFilter: THEME.glassBlur, fontFamily: THEME.fontFamily,
    }}>
      <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: THEME.text }}>{payload[0].name}</p>
      <p style={{ margin: '4px 0 0', fontSize: '12px', color: THEME.textMuted }}>Value: {payload[0].value.toLocaleString()}</p>
      {total > 0 && <p style={{ margin: '2px 0 0', fontSize: '12px', color: THEME.textMuted }}>Share: {Math.round((payload[0].value / total) * 100)}%</p>}
    </div>
  );
}

function Skeleton({ height, title }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '24px', height: height || 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {title && <div style={{ width: '40%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 24 }} />}
      <div style={{ width: 120, height: 120, borderRadius: '50%', background: THEME.grid }} />
    </div>
  );
}
