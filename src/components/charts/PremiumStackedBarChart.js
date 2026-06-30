import { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, CARD_STYLE, CHART_MARGIN } from './ChartTheme';
import { EmptyState } from './PremiumLineChart';

export default function PremiumStackedBarChart({
  data, bars, title, subtitle, loading, height = 280,
  labelKey = 'name', barSize = 36,
}) {
  const ref = useRef(null);

  const hasData = !loading && data?.length > 0 && data.some((d) => bars.some((b) => (d[b.dataKey] || 0) > 0));

  useEffect(() => {
    if (!hasData) return;
    gsap.from(ref.current.querySelectorAll('.stack-bar'), { y: 20, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
  }, [hasData]);

  if (loading) return <Skeleton height={height} title={title} />;
  if (!hasData) return <EmptyState title={title} subtitle={subtitle} height={height} />;

  const lastKey = bars.length > 0 ? bars[bars.length - 1].dataKey : null;

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height - 80}>
        <BarChart data={data} margin={CHART_MARGIN} barSize={barSize}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={THEME.grid} />
          <XAxis dataKey={labelKey} axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.text, fontWeight: 500, fontFamily: THEME.fontFamily }} dy={6} />
          <YAxis axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} dx={-4} />
          <Tooltip content={<StackedTooltip bars={bars} />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          <Legend verticalAlign="bottom" height={32} iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: '12px', color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>{v}</span>} />
          {bars.map((b) => (
            <Bar key={b.dataKey} className="stack-bar" dataKey={b.dataKey} name={b.name} stackId="a"
              fill={b.color} radius={b.dataKey === lastKey ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StackedTooltip({ active, payload, label, bars }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
      borderRadius: '12px', padding: '12px 16px', boxShadow: THEME.shadowLg,
      backdropFilter: THEME.glassBlur, fontFamily: THEME.fontFamily, minWidth: 140,
    }}>
      <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: THEME.textSecondary }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: THEME.textMuted }}>{p.name}</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: THEME.text }}>{p.value.toLocaleString()}</span>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${THEME.grid}`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: THEME.textSecondary }}>Total</span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: THEME.text }}>{total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function Skeleton({ height, title }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '24px', height: height || 280 }}>
      <div style={{ width: '40%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 16 }} />
      <div style={{ width: '100%', height: (height || 280) - 80, borderRadius: 12, background: THEME.grid }} />
    </div>
  );
}
