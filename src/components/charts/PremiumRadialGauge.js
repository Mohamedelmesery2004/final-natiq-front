import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { COLORS, DARK, CHART_CONFIG } from './ChartTheme';

export default function PremiumRadialGauge({
  value = 0,
  max = 100,
  label,
  subtitle,
  loading,
  size = 140,
  strokeWidth = 12,
  color = COLORS.primary,
  dark = true,
  grade,
  gradeColor,
}) {
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const rootRef = useRef(null);
  const t = dark ? DARK : {};

  const pct = Math.max(0, Math.min(1, value / max));
  const cx = size / 2;
  const cy = size / 2;
  const r = cx - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * r * 0.75;
  const dashLen = circumference * pct;

  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      const dash = { v: 0 };
      const counter = { n: 0 };
      const tl = gsap.timeline();
      tl.to(dash, {
        v: pct, duration: 1.2, ease: 'power3.out',
        onUpdate: () => {
          if (arcRef.current) arcRef.current.style.strokeDasharray = `${circumference * dash.v} ${circumference}`;
        },
      }, 0);
      tl.to(counter, {
        n: value, duration: 1.2, ease: 'power3.out',
        onUpdate: () => {
          if (numRef.current) numRef.current.textContent = Math.round(counter.n);
        },
      }, 0);
    }, rootRef);
    return () => ctx.revert();
  }, [value, pct, circumference, loading]);

  if (loading) {
    return <Skeleton size={size} />;
  }

  const gradeColors = gradeColor || (
    value >= 80 ? COLORS.success : value >= 60 ? COLORS.secondary : value >= 40 ? COLORS.accent : COLORS.danger
  );

  const startAngle = -225;
  const endAngle = 45;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  return (
    <div ref={rootRef} className="premium-chart-card" style={{
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      borderRadius: `${CHART_CONFIG.radius + 4}px`,
      padding: '20px',
      boxShadow: CHART_CONFIG.shadow,
      backdropFilter: CHART_CONFIG.glassBlur,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    }}>
      {label && <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: t.text }}>{label}</p>}
      {subtitle && <p style={{ margin: '-4px 0 0', fontSize: '12px', color: t.textSecondary }}>{subtitle}</p>}

      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradeColors} stopOpacity={0.4} />
            <stop offset="100%" stopColor={gradeColors} />
          </linearGradient>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          ref={arcRef}
          d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`0 ${circumference}`}
          style={{ filter: 'url(#gaugeGlow)' }}
        />

        {grade && (
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize="28" fontWeight="800" fill={gradeColors}
            fontFamily={CHART_CONFIG.fontFamily}>
            {grade}
          </text>
        )}
        <text x={cx} y={grade ? cy + 22 : cy + 6} textAnchor="middle" fontSize="13" fontWeight="700" fill={t.textMuted}
          fontFamily={CHART_CONFIG.fontFamily}>
          <tspan ref={numRef}>{loading ? '0' : Math.round(value)}</tspan>%
        </text>
      </svg>
    </div>
  );
}

function Skeleton({ size }) {
  return (
    <div style={{
      background: DARK.card, border: `1px solid ${DARK.cardBorder}`, borderRadius: `${CHART_CONFIG.radius + 4}px`,
      padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: size + 40,
    }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}
