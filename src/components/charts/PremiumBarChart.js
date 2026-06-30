import { useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { gsap } from 'gsap';
import { THEME, COLORS, CARD_STYLE, CHART_MARGIN } from './ChartTheme';
import { EmptyState } from './PremiumLineChart';

const PALETTE = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.pink, COLORS.success, COLORS.cyan, COLORS.indigo];

export default function PremiumBarChart({
  data, title, subtitle, loading, height = 240,
  layout = 'horizontal', colorMap, valueKey = 'value', labelKey = 'name',
  barSize = 32, showValue = true, radius = [0, 8, 8, 0],
}) {
  const ref = useRef(null);

  const hasData = !loading && data?.length > 0 && data.some((d) => (d[valueKey] || 0) > 0);

  useEffect(() => {
    if (!hasData) return;
    gsap.from(ref.current.querySelectorAll('.bar-cell'), { scaleY: 0, transformOrigin: 'bottom', duration: 0.5, stagger: 0.04, ease: 'back.out(1.5)' });
  }, [hasData]);

  if (loading) return <Skeleton height={height} title={title} />;
  if (!hasData) return <EmptyState title={title} subtitle={subtitle} height={height} />;

  const sorted = [...data].sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
  const isH = layout === 'horizontal';

  const getColor = (entry, i) => {
    if (colorMap) return colorMap[entry[labelKey]?.toLowerCase()] || COLORS.primary;
    return PALETTE[i % PALETTE.length];
  };

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>{title}</p>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted }}>{subtitle}</p>}
      </div>
      <ResponsiveContainer width="100%" height={height - 80}>
        <BarChart data={sorted} layout={isH ? 'vertical' : 'horizontal'} margin={CHART_MARGIN} barSize={barSize}>
          {isH ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={false} />
              <YAxis dataKey={labelKey} type="category" axisLine={false} tickLine={false}
                tick={{ fontSize: 13, fill: THEME.text, fontWeight: 500, fontFamily: THEME.fontFamily }} width={90} />
              <Tooltip content={<BarTooltip valueKey={valueKey} labelKey={labelKey} />}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey={valueKey} radius={radius}>
                {sorted.map((e, i) => <Cell key={i} className="bar-cell" fill={getColor(e, i)} />)}
                {showValue && <LabelList dataKey={valueKey} position="right"
                  formatter={(v) => `${v}`}
                  style={{ fontSize: 13, fontWeight: 600, fill: THEME.textMuted }} />}
              </Bar>
            </>
          ) : (
            <>
              <XAxis dataKey={labelKey} axisLine={false} tickLine={false}
                tick={{ fontSize: 12, fill: THEME.text, fontWeight: 500, fontFamily: THEME.fontFamily }} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize: 12, fill: THEME.textMuted, fontFamily: THEME.fontFamily }} />
              <Tooltip content={<BarTooltip valueKey={valueKey} labelKey={labelKey} />}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Bar dataKey={valueKey} radius={radius}>
                {sorted.map((e, i) => <Cell key={i} className="bar-cell" fill={getColor(e, i)} />)}
                {showValue && <LabelList dataKey={valueKey} position="top"
                  style={{ fontSize: 12, fontWeight: 600, fill: THEME.textMuted }} />}
              </Bar>
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BarTooltip({ active, payload, label, valueKey, labelKey }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: THEME.tooltipBg, border: `1px solid ${THEME.tooltipBorder}`,
      borderRadius: '12px', padding: '10px 14px', boxShadow: THEME.shadowLg,
      backdropFilter: THEME.glassBlur, fontFamily: THEME.fontFamily,
    }}>
      <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: THEME.textSecondary }}>{payload[0].payload[labelKey] || label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: THEME.text }}>{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

function Skeleton({ height, title }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '24px', height: height || 240 }}>
      <div style={{ width: '40%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 16 }} />
      <div style={{ width: '100%', height: (height || 240) - 80, borderRadius: 12, background: THEME.grid }} />
    </div>
  );
}
