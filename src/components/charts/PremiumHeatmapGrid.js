import { useEffect, useRef, memo } from 'react';
import { gsap } from 'gsap';
import { THEME, COLORS, CARD_STYLE, EMPTY_ICON } from './ChartTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];

function getCellColor(load, maxLoad) {
  if (maxLoad === 0 || load === 0) return THEME.grid;
  const intensity = load / maxLoad;
  if (intensity < 0.1) return '#e6f7ed';
  if (intensity < 0.25) return '#b3e6cc';
  if (intensity < 0.45) return '#66d4a8';
  if (intensity < 0.65) return '#33c48a';
  if (intensity < 0.85) return '#00b36b';
  return '#008f55';
}

function PremiumHeatmapGrid({ data, title, loading }) {
  const containerRef = useRef(null);

  const hasData = !loading && data?.length > 0;
  const maxLoad = hasData ? Math.max(...data.flatMap((row) => row.cells.map((c) => c.load || 0)), 1) : 1;

  useEffect(() => {
    if (!hasData) return;
    const ctx = gsap.context(() => {
      gsap.from(containerRef.current.querySelectorAll('.hm-cell'),
        { scale: 0, opacity: 0, duration: 0.35, stagger: { each: 0.006, grid: 'auto', from: 'start' }, ease: 'back.out(1.5)' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [hasData, data]);

  if (loading) {
    return <Skeleton title={title} />;
  }

  if (!hasData) {
    return (
      <div style={{ ...CARD_STYLE, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ opacity: 0.4, marginBottom: 12 }}>{EMPTY_ICON}</div>
        {title && <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>}
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>No activity data for this period</p>
      </div>
    );
  }

  const dayLabels = data.map((row) => row.day || row.name);
  const colCount = data[0]?.cells?.length || 0;

  return (
    <div ref={containerRef} style={{ ...CARD_STYLE, padding: '20px' }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>}

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: colCount * 28 + 50 }}>
          {/* Header row: Hour labels */}
          <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 50 }}>
            {HOUR_LABELS.filter((_, i) => i % 3 === 0).map((l, idx) => (
              <div key={idx} style={{
                width: 28 * 3, fontSize: '9px', color: THEME.textMuted, fontWeight: 600,
                textAlign: 'left', fontFamily: THEME.fontFamily,
              }}>{l}</div>
            ))}
          </div>

          {/* Data rows: one per day */}
          {data.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              <div style={{
                width: 46, fontSize: '11px', fontWeight: 600, color: THEME.textSecondary,
                textAlign: 'right', paddingRight: 8, flexShrink: 0, fontFamily: THEME.fontFamily,
              }}>
                {row.day || row.name}
              </div>
              <div style={{ display: 'flex', gap: 2, flex: 1 }}>
                {(row.cells || []).map((cell, ci) => {
                  const color = getCellColor(cell.load, maxLoad);
                  const tooltipText = `${row.day || row.name} ${HOUR_LABELS[ci] || ci}: ${cell.load} activities`;
                  return (
                    <div
                      key={ci}
                      className="hm-cell"
                      title={tooltipText}
                      style={{
                        width: '100%', aspectRatio: '1', borderRadius: '3px', background: color,
                        cursor: 'pointer', transition: 'transform 0.12s ease, box-shadow 0.12s ease',
                        maxWidth: 24, minWidth: 10,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.4)'; e.currentTarget.style.boxShadow = `0 0 0 2px ${THEME.card}, 0 0 0 4px ${color}`; e.currentTarget.style.zIndex = '2'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '0'; }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, alignItems: 'center', marginTop: 14, fontSize: '10px', fontFamily: THEME.fontFamily }}>
        <span style={{ color: THEME.textMuted }}>Low</span>
        {[0, 0.1, 0.25, 0.45, 0.65, 0.85].map((int, i) => (
          <span key={i} style={{ width: 14, height: 14, borderRadius: 3, background: getCellColor(int * maxLoad, maxLoad), display: 'inline-block' }} />
        ))}
        <span style={{ color: THEME.textMuted }}>High</span>
      </div>
    </div>
  );
}

function Skeleton({ title }) {
  return (
    <div style={{ ...CARD_STYLE, padding: '20px', minHeight: 160 }}>
      {title && <div style={{ width: '30%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 16 }} />}
      <div style={{ width: '100%', height: 100, borderRadius: 12, background: THEME.grid }} />
    </div>
  );
}

export default memo(PremiumHeatmapGrid);
