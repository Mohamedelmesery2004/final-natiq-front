export const THEME = {
  bg: '#f5f7fa',
  card: 'rgba(255,255,255,0.72)',
  cardBorder: 'rgba(226,232,240,0.6)',
  cardHover: 'rgba(248,250,252,0.9)',
  text: '#1a1a2e',
  textSecondary: '#4a5568',
  textMuted: '#94a3b8',
  grid: '#eef1f5',
  tooltipBg: 'rgba(255,255,255,0.95)',
  tooltipBorder: '#e2e8f0',
  shadow: '0 4px 20px rgba(0,0,0,0.05)',
  shadowLg: '0 8px 40px rgba(0,0,0,0.08)',
  glassBlur: 'blur(16px)',
  radius: 16,
  fontFamily: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const COLORS = {
  primary: '#00C896',
  primaryDark: '#00A87A',
  primaryLight: '#33D4AD',
  secondary: '#3B82F6',
  secondaryDark: '#2563EB',
  accent: '#F59E0B',
  danger: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
  purple: '#8B5CF6',
  pink: '#EC4899',
  cyan: '#06B6D4',
  indigo: '#6366F1',
};

export const GRADIENTS = {
  primary: '#00C896',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  success: '#22C55E',
  danger: '#EF4444',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
};

export function gradientDefs(ids) {
  return ids.map(({ id, from, to = from, fromOp = 0.5, toOp = 0 }) => (
    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={from} stopOpacity={fromOp} />
      <stop offset="100%" stopColor={to} stopOpacity={toOp} />
    </linearGradient>
  ));
}

export const CHANNEL_COLORS = {
  telegram: COLORS.primary,
  whatsapp: '#25D366',
  web: COLORS.secondary,
  webchat: COLORS.secondary,
  instagram: COLORS.pink,
  facebook: COLORS.secondary,
  email: COLORS.accent,
  sms: COLORS.warning,
};

export const STATUS_COLORS = {
  online: COLORS.success,
  offline: COLORS.danger,
  idle: COLORS.accent,
  busy: COLORS.secondary,
};

export const CARD_STYLE = {
  background: THEME.card,
  border: `1px solid ${THEME.cardBorder}`,
  borderRadius: `${THEME.radius}px`,
  boxShadow: THEME.shadow,
  backdropFilter: THEME.glassBlur,
  WebkitBackdropFilter: THEME.glassBlur,
  fontFamily: THEME.fontFamily,
};

export const CHART_MARGIN = { top: 16, right: 20, left: 0, bottom: 8 };

export const EMPTY_ICON = (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="36" height="28" rx="4" stroke={THEME.textMuted} strokeWidth="1.5" fill="none" />
    <path d="M6 20h36" stroke={THEME.textMuted} strokeWidth="1.5" />
    <circle cx="16" cy="16" r="2" fill={THEME.textMuted} />
    <circle cx="24" cy="16" r="2" fill={THEME.textMuted} />
    <circle cx="32" cy="16" r="2" fill={THEME.textMuted} />
    <path d="M14 28l6-6 4 4 6-8 6 6" stroke={THEME.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
