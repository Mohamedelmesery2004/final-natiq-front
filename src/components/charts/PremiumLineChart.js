import { useEffect, useRef, Fragment } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, CHART_MARGIN, CARD_STYLE, EMPTY_ICON } from './ChartTheme';
import { ChartTooltip } from './PremiumAreaChart';

export default function PremiumLineChart({ data, lines, title, subtitle, loading, height = 340 }) {
  const ref = useRef(null);

  const hasData = !loading && data?.length > 0;

  useEffect(() => {
    if (!hasData) return;
    const paths = ref.current.querySelectorAll('.line-path');
    paths.forEach((p) => {
      const len = p.getTotalLength ? p.getTotalLength() : 1000;
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
    const ctx = gsap.context(() => {
      gsap.to(paths, { strokeDashoffset: 0, duration: 1.6, stagger: 0.25, ease: 'power3.inOut' });
    }, ref);
    return () => ctx.revert();
  }, [hasData, lines]);

  if (loading) return <Skeleton height={height} title={title} />;
  if (!hasData) return <EmptyState title={title} subtitle={subtitle} height={height} />;

  const ids = lines.map((_, i) => `line-${i}`);

  const allValues = data.flatMap((d) => lines.map((l) => Number(d[l.dataKey]) || 0));
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const padding = maxVal * 0.15 || 1;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding || 10;

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>{title}</p>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted }}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height - 80}>
        <LineChart data={data} margin={CHART_MARGIN}>
          <defs>
            {lines.map((l, i) => (
              <Fragment key={ids[i]}>
                <linearGradient id={`sg-${ids[i]}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.55} />
                  <stop offset="50%" stopColor={l.color} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={1} />
                </linearGradient>
                <linearGradient id={`ag-${ids[i]}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0.02} />
                </linearGradient>
                <filter id={`gl-${ids[i]}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </Fragment>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke={THEME.grid} />
          <XAxis dataKey="name" axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} dy={8}
            interval="preserveStartEnd" minTickGap={40} />
          <YAxis domain={[yMin, yMax]} axisLine={false} tickLine={false}
            tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} dx={-4}
            tickFormatter={(v) => Number.isInteger(v) ? v : v.toFixed(1)} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: THEME.textMuted, strokeDasharray: '4 4' }} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ fontSize: '12px', color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>{v}</span>} />
          {lines.map((l, i) => (
            <Fragment key={l.dataKey}>
              <Line className="line-path" type="monotone" dataKey={l.dataKey} name={l.name}
                stroke={l.color} strokeWidth={6} strokeOpacity={0.12}
                dot={false} activeDot={false}
                style={{ filter: `url(#gl-${ids[i]})` }} />
              <Line className="line-path" type="monotone" dataKey={l.dataKey} name={l.name}
                stroke={`url(#sg-${ids[i]})`} strokeWidth={3}
                dot={false}
                activeDot={{ r: 7, fill: l.color, stroke: '#fff', strokeWidth: 2.5 }} />
            </Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmptyState({ title, subtitle, height, message }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '40px 24px', textAlign: 'center', minHeight: height || 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ opacity: 0.4, marginBottom: 16 }}>{EMPTY_ICON}</div>
      <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>{title}</p>
      <p style={{ margin: '6px 0 0', fontSize: '13px', color: THEME.textMuted }}>{message || 'No data available for this period'}</p>
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
