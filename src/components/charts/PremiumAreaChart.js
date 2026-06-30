import { useEffect, useRef, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, CHART_MARGIN, CARD_STYLE } from './ChartTheme';
import { EmptyState } from './PremiumLineChart';

export default function PremiumAreaChart({ data, lines, title, subtitle, loading, height = 340 }) {
  const ref = useRef(null);

  const hasData = !loading && data?.length > 0;

  useEffect(() => {
    if (!hasData) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current.querySelectorAll('.chart-line'), { opacity: 0, y: 20, duration: 0.7, stagger: 0.12, ease: 'power3.out' });
    }, ref);
    return () => ctx.revert();
  }, [hasData]);

  if (loading) return <Skeleton height={height} title={title} />;
  if (!hasData) return <EmptyState title={title} subtitle={subtitle} height={height} />;

  const ids = lines.map((_, i) => `area-${i}`);

  const allValues = data.flatMap((d) => lines.map((l) => Number(d[l.dataKey]) || 0));
  const maxVal = Math.max(...allValues, 1);
  const padding = maxVal * 0.15 || 1;
  const yMax = maxVal + padding || 10;

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>{title}</p>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted }}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height - 80}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            {ids.flatMap((id, i) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lines[i].color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={lines[i].color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={THEME.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} dy={8}
            interval="preserveStartEnd" minTickGap={40} />
          <YAxis domain={[0, yMax]} axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} dx={-4}
            tickFormatter={(v) => Number.isInteger(v) ? v : v.toFixed(1)} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: THEME.textMuted, strokeDasharray: '4 4' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: '12px', color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>{v}</span>} />
          {lines.map((l, i) => (
            <Area key={l.dataKey} className="chart-line" type="monotone" dataKey={l.dataKey} name={l.name}
              stroke={l.color} strokeWidth={2.5} fill={`url(#${ids[i]})`} fillOpacity={1}
              dot={false} activeDot={{ r: 6, fill: l.color, stroke: '#fff', strokeWidth: 2 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
      borderRadius: '12px', padding: '12px 16px', boxShadow: THEME.shadowLg,
      backdropFilter: THEME.glassBlur, WebkitBackdropFilter: THEME.glassBlur,
      fontFamily: THEME.fontFamily,
    }}>
      <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: THEME.textSecondary }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: THEME.textMuted }}>{p.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: THEME.text }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Skeleton({ height, title }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '24px', height: height || 340 }}>
      <div style={{ width: '40%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 20 }} />
      <div style={{ width: '100%', height: (height || 340) - 80, borderRadius: 12, background: THEME.grid }} />
    </div>
  );
}
