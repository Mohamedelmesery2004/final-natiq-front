import PremiumAreaChart from '../../../components/charts/PremiumAreaChart';
import { COLORS } from '../../../components/charts/ChartTheme';

function fmtDate(d) {
  if (!d) return '';
  const p = d.split('-');
  return p.length >= 3 ? `${p[1]}/${p[2]}` : d;
}

export default function TrendChart({ trendData, loading }) {
  const chartData = trendData.map((d) => ({
    name: fmtDate(d.date),
    assigned: d.assigned || 0,
    resolved: d.resolved || 0,
  }));

  return (
    <PremiumAreaChart
      data={chartData}
      lines={[
        { dataKey: 'assigned', name: 'Assigned', color: COLORS.secondary },
        { dataKey: 'resolved', name: 'Resolved', color: COLORS.primary },
      ]}
      title="Performance Trend"
      subtitle="Tickets assigned vs resolved over time"
      loading={loading}
      height={400}
    />
  );
}
