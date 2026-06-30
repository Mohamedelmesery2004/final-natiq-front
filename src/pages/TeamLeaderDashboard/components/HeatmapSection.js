import { useMemo } from 'react';
import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p', '11p'];

/* Build a deterministic per-hour load vector from real activity. */
function buildHourly(callsPerHour, heatmap) {
  const loadByHour = {};
  if (Array.isArray(heatmap) && heatmap.length) {
    heatmap.forEach((h) => { loadByHour[h.hour] = h.load || 0; });
  } else if (Array.isArray(callsPerHour) && callsPerHour.length) {
    callsPerHour.forEach((b) => {
      const hr = Number(String(b.hour).slice(11, 13));
      if (!Number.isNaN(hr)) loadByHour[hr] = (loadByHour[hr] || 0) + (b.total || 0);
    });
  }
  return HOURS.map((h) => loadByHour[h] || 0);
}

function build2DGrid(basePattern) {
  if (basePattern.every((v) => v === 0)) return [];
  return DAYS.map((day) => ({ day, cells: basePattern.map((load) => ({ load })) }));
}

export default function HeatmapSection({ heatmap, callsPerHour, loading }) {
  const basePattern = useMemo(() => buildHourly(callsPerHour, heatmap), [callsPerHour, heatmap]);
  const gridData = useMemo(() => build2DGrid(basePattern), [basePattern]);

  const stats = useMemo(() => {
    const total = basePattern.reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    const peakHour = basePattern.indexOf(Math.max(...basePattern));
    // contiguous active window (first..last non-zero hour)
    const active = basePattern.map((v, i) => (v > 0 ? i : -1)).filter((i) => i >= 0);
    const first = active[0];
    const last = active[active.length - 1];
    const activeHours = active.length;
    const peakVal = basePattern[peakHour];
    // average load across active hours (per day)
    const avg = Math.round(total / Math.max(1, activeHours));
    return { total: total * DAYS.length, peakHour, peakVal, first, last, activeHours, avg };
  }, [basePattern]);

  return (
    <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>Activity Heatmap</p>

      {/* the grid renders its own bare layout (no title — we own the header) */}
      <BareHeatmap data={gridData} loading={loading} />

      {stats && !loading && (
        <>
          {/* summary tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 18 }}>
            <Tile label="Peak hour" value={HOUR_LABELS[stats.peakHour]} sub={`${stats.peakVal}/hr`} accent />
            <Tile label="Active window" value={`${HOUR_LABELS[stats.first]}–${HOUR_LABELS[stats.last]}`} sub={`${stats.activeHours} hrs/day`} />
            <Tile label="Avg / active hr" value={stats.avg} sub="per day" />
            <Tile label="Total activity" value={stats.total} sub="this week" accent />
          </div>

          {/* insight line */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: `${COLORS.primary}0d` }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.primary, flexShrink: 0, boxShadow: `0 0 0 4px ${COLORS.primary}22` }} />
            <p style={{ margin: 0, fontSize: 12.5, color: THEME.textSecondary, lineHeight: 1.4 }}>
              Busiest around <strong style={{ color: COLORS.primaryDark }}>{HOUR_LABELS[stats.peakHour]}</strong>.
              Staff coverage between <strong style={{ color: THEME.text }}>{HOUR_LABELS[stats.first]}</strong> and <strong style={{ color: THEME.text }}>{HOUR_LABELS[stats.last]}</strong> matches demand best.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, accent }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: accent ? `${COLORS.primary}0f` : THEME.grid }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: accent ? COLORS.primaryDark : THEME.text, lineHeight: 1.1 }}>{value}</p>
      <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 600, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 10, color: THEME.textMuted }}>{sub}</p>}
    </div>
  );
}

/* Inline copy of the heatmap grid WITHOUT the card wrapper / title, so it sits
   inside our own card with the stats footer. Mirrors PremiumHeatmapGrid visuals. */
function getCellColor(load, maxLoad) {
  if (maxLoad === 0 || load === 0) return THEME.grid;
  const t = load / maxLoad;
  if (t < 0.1) return '#e6f7ed';
  if (t < 0.25) return '#b3e6cc';
  if (t < 0.45) return '#66d4a8';
  if (t < 0.65) return '#33c48a';
  if (t < 0.85) return '#00b36b';
  return '#008f55';
}

function BareHeatmap({ data, loading }) {
  if (loading) {
    return <div style={{ width: '100%', height: 230, borderRadius: 12, background: THEME.grid, animation: 'pulse 1.5s infinite' }} />;
  }
  if (!data?.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, color: THEME.textMuted }}>No activity data for this period</p>
      </div>
    );
  }
  const maxLoad = Math.max(...data.flatMap((row) => row.cells.map((c) => c.load || 0)), 1);
  return (
    <div>
      {/* hour labels */}
      <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 46 }}>
        {HOUR_LABELS.filter((_, i) => i % 3 === 0).map((l, idx) => (
          <div key={idx} style={{ flex: 1, fontSize: 9, color: THEME.textMuted, fontWeight: 600, textAlign: 'left', fontFamily: THEME.fontFamily }}>{l}</div>
        ))}
      </div>
      {data.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ width: 42, fontSize: 11, fontWeight: 600, color: THEME.textSecondary, textAlign: 'right', paddingRight: 8, flexShrink: 0, fontFamily: THEME.fontFamily }}>{row.day}</div>
          <div style={{ display: 'flex', gap: 2, flex: 1 }}>
            {row.cells.map((cell, ci) => {
              const color = getCellColor(cell.load, maxLoad);
              return (
                <div key={ci} title={`${row.day} ${HOUR_LABELS[ci]}: ${cell.load}`}
                  style={{ flex: 1, aspectRatio: '1', maxWidth: 22, minWidth: 8, borderRadius: 3, background: color, cursor: 'pointer', transition: 'transform 0.12s ease, box-shadow 0.12s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.35)'; e.currentTarget.style.boxShadow = `0 0 0 2px #fff, 0 0 0 4px ${color}`; e.currentTarget.style.zIndex = '2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '0'; }}
                />
              );
            })}
          </div>
        </div>
      ))}
      {/* legend */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, alignItems: 'center', marginTop: 14, fontSize: 10, fontFamily: THEME.fontFamily }}>
        <span style={{ color: THEME.textMuted }}>Low</span>
        {[0, 0.1, 0.25, 0.45, 0.65, 0.85].map((int, i) => (
          <span key={i} style={{ width: 14, height: 14, borderRadius: 3, background: getCellColor(int * maxLoad, maxLoad), display: 'inline-block' }} />
        ))}
        <span style={{ color: THEME.textMuted }}>High</span>
      </div>
    </div>
  );
}
