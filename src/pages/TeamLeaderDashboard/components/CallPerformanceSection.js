import { PhoneArrowDownLeftIcon, PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline';
import PremiumKPICard from '../../../components/charts/PremiumKPICard';
import { COLORS } from '../../../components/charts/ChartTheme';

function fmtDur(m) {
  if (!m || m <= 0) return '0m';
  if (m < 60) return `${Math.round(m)}m`;
  return `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
}

export default function CallPerformanceSection({ callPerformance, callsPerHour = [], loading }) {
  const { totalCalls, answered, missed, avgDuration, answerRate } = callPerformance;
  // real per-hour spark series for each metric
  const spark = (key) => (callsPerHour || []).map((b) => ({ v: b[key] || 0 }));
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 700, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>Call Performance</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <PremiumKPICard label="Answered" value={answered}
          icon={<PhoneArrowDownLeftIcon style={{ width: 18 }} />} accent={COLORS.success}
          hint={totalCalls > 0 ? `${answerRate}% answer rate` : 'No calls yet'}
          sparkData={spark('answered')} loading={loading} />
        <PremiumKPICard label="Total Calls" value={totalCalls}
          icon={<PhoneIcon style={{ width: 18 }} />} accent={COLORS.secondary}
          hint={`Avg duration: ${fmtDur(avgDuration)}`}
          sparkData={spark('total')} loading={loading} />
        <PremiumKPICard label="Missed" value={missed}
          icon={<PhoneXMarkIcon style={{ width: 18 }} />} accent={COLORS.danger}
          hint={totalCalls > 0 ? `${Math.round(missed / (totalCalls || 1) * 100)}% missed` : 'No missed'}
          sparkData={spark('missed')} loading={loading} />
      </div>
    </div>
  );
}
