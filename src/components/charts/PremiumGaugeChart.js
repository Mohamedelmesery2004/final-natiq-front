import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { THEME, COLORS, CARD_STYLE } from './ChartTheme';
import { EmptyState } from './PremiumLineChart';

export default function PremiumGaugeChart({
  value = 0, max = 100, title, subtitle, loading,
  size = 180, strokeWidth = 14, color = COLORS.primary,
  grade, gradeColor,
  valueSuffix = '%',
}) {
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const ref = useRef(null);

  const cx = size / 2, cy = size / 2;
  const r = cx - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));

  const gc = gradeColor || (value >= 80 ? COLORS.success : value >= 60 ? COLORS.secondary : value >= 40 ? COLORS.accent : COLORS.danger);

  useEffect(() => {
    if (loading || value === 0) return;
    const ctx = gsap.context(() => {
      const dash = { v: 0 }, counter = { n: 0 };
      const tl = gsap.timeline();
      tl.to(dash, { v: pct, duration: 1.2, ease: 'power3.out',
        onUpdate: () => { if (arcRef.current) arcRef.current.style.strokeDasharray = `${circumference * dash.v} ${circumference}`; }
      }, 0);
      tl.to(counter, { n: value, duration: 1.2, ease: 'power3.out',
        onUpdate: () => { if (numRef.current) numRef.current.textContent = Math.round(counter.n); }
      }, 0);
    }, ref);
    return () => ctx.revert();
  }, [value, pct, circumference, loading]);

  if (loading) {
    return <Skeleton title={title} size={size} />;
  }
  if (!value && value !== 0) {
    return <EmptyState title={title} subtitle={subtitle} height={size + 60} />;
  }

  return (
    <div ref={ref} style={{ ...CARD_STYLE, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {title && <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>}
      {subtitle && <p style={{ margin: '0 0 16px', fontSize: '13px', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{subtitle}</p>}

      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <defs>
          <linearGradient id="gaugeFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gc} stopOpacity={0.5} />
            <stop offset="100%" stopColor={gc} />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={THEME.grid} strokeWidth={strokeWidth} />
        <circle ref={arcRef} cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#gaugeFill)" strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`0 ${circumference}`} style={{ filter: 'url(#gaugeGlow)' }}
          transform={`rotate(-90 ${cx} ${cy})`} />
        {grade && <text x={cx} y={cy - 6} textAnchor="middle" fontSize="30" fontWeight="800" fill={gc}
          fontFamily={THEME.fontFamily}>{grade}</text>}
        <text x={cx} y={grade ? cy + 24 : cy + 6} textAnchor="middle" fontSize="14" fontWeight="700" fill={THEME.textMuted}
          fontFamily={THEME.fontFamily}>
          <tspan ref={numRef}>{loading ? '0' : Math.round(value)}</tspan>{valueSuffix}
        </text>
      </svg>
    </div>
  );
}

function Skeleton({ title, size }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: (size || 180) + 60 }}>
      {title && <div style={{ width: '50%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 20 }} />}
      <div style={{ width: size || 180, height: size || 180, borderRadius: '50%', background: THEME.grid }} />
    </div>
  );
}
