import PremiumGaugeChart from '../../../components/charts/PremiumGaugeChart';
import { COLORS, THEME, CARD_STYLE } from '../../../components/charts/ChartTheme';

export default function TeamScoreSection({ teamScore, loading }) {
  const { overall, grade, breakdown } = teamScore;

  const gradeColor = (
    grade === 'A' ? COLORS.primary : grade === 'B' ? COLORS.primaryDark : grade === 'C' ? COLORS.accent : grade === 'D' ? COLORS.warning : COLORS.danger
  );
  const verdict = grade === 'A' ? 'Excellent' : grade === 'B' ? 'Strong' : grade === 'C' ? 'Fair' : grade === 'D' ? 'Weak' : 'Poor';

  return (
    <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text }}>Team Score</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: gradeColor, background: `${gradeColor}14`, padding: '3px 9px', borderRadius: 20 }}>{verdict}</span>
      </div>

      <PremiumGaugeChart
        value={overall}
        max={100}
        subtitle="Overall performance"
        grade={grade}
        gradeColor={gradeColor}
        color={gradeColor}
        size={170}
        loading={loading}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ScoreBar label="CSAT" value={breakdown.csatScore.value} contribution={breakdown.csatScore.contribution} color={COLORS.primary} />
        <ScoreBar label="Response" value={breakdown.responseTime.value} contribution={breakdown.responseTime.contribution} color={COLORS.primaryLight} />
        <ScoreBar label="Resolution" value={breakdown.resolutionTime.value} contribution={breakdown.resolutionTime.contribution} color={COLORS.primaryDark} />
      </div>
    </div>
  );
}

function ScoreBar({ label, value, contribution, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
        <span style={{ color: THEME.textSecondary, fontWeight: 500 }}>{label}</span>
        <strong style={{ color, fontWeight: 700 }}>{value}%</strong>
      </div>
      <div style={{ height: '7px', borderRadius: '100px', background: THEME.grid, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, value)}%`, height: '100%', borderRadius: '100px', background: `linear-gradient(90deg, ${color}, ${color}88)`, boxShadow: `0 1px 4px ${color}40`, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', fontSize: '10px', color: THEME.textMuted }}>
        +{Math.round(contribution)} pts
      </div>
    </div>
  );
}
