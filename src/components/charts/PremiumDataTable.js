import { THEME, COLORS, STATUS_COLORS, CARD_STYLE, EMPTY_ICON } from './ChartTheme';

const BADGE_STYLE = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 600,
  background: bg, color,
});

export default function PremiumDataTable({ columns, data, title, subtitle, loading, height, onRowClick }) {
  if (loading) {
    return (
      <div style={{ ...CARD_STYLE, padding: '24px' }}>
        <div style={{ width: '30%', height: 18, borderRadius: 6, background: THEME.grid, marginBottom: 16 }} />
        <div style={{ width: '100%', height: height || 200, borderRadius: 12, background: THEME.grid }} />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div style={{ ...CARD_STYLE, padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: height || 200 }}>
        <div style={{ opacity: 0.4, marginBottom: 12 }}>{EMPTY_ICON}</div>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: THEME.text }}>{title || 'Data Table'}</p>
        <p style={{ margin: '6px 0 0', fontSize: '13px', color: THEME.textMuted }}>No data available yet</p>
      </div>
    );
  }

  return (
    <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
      {(title || subtitle) && (
        <div style={{ padding: '20px 24px 12px' }}>
          {title && <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>}
          {subtitle && <p style={{ margin: '4px 0 0', fontSize: '13px', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{subtitle}</p>}
        </div>
      )}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: THEME.fontFamily }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${THEME.grid}`, background: THEME.bg }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: '12px 16px', textAlign: col.align || 'left',
                  fontSize: '11px', fontWeight: 700, color: THEME.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id || i} style={{
                borderBottom: i < data.length - 1 ? `1px solid ${THEME.grid}` : 'none',
                transition: 'background 0.15s',
                cursor: onRowClick ? 'pointer' : 'default',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = onRowClick ? THEME.cardHover : 'transparent'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => {
                  const val = col.render ? col.render(row) : row[col.key];
                  return (
                    <td key={col.key} style={{
                      padding: '12px 16px', color: THEME.text, fontWeight: col.bold ? 700 : 500,
                      textAlign: col.align || 'left', whiteSpace: 'nowrap',
                    }}>
                      {val ?? '\u2014'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const formatters = {
  status: (v) => {
    const color = STATUS_COLORS[v] || THEME.textMuted;
    return <span style={BADGE_STYLE(`${color}15`, color)}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {v}
    </span>;
  },
  badge: (v, color = COLORS.primary) => <span style={BADGE_STYLE(`${color}15`, color)}>{v}</span>,
  pct: (v) => v != null ? `${v}%` : '\u2014',
  time: (v) => v > 0 ? `${Math.round(v)}m` : '\u2014',
  avatar: (name) => {
    const initial = (name || '?')[0].toUpperCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: THEME.text, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initial}</div>
        <span style={{ fontWeight: 600, color: THEME.text }}>{name}</span>
      </div>
    );
  },
};

export { formatters };
