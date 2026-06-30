import PremiumBarChart from '../../../components/charts/PremiumBarChart';
import { CHANNEL_COLORS } from '../../../components/charts/ChartTheme';

export default function ChannelDistribution({ channelDistribution, loading }) {
  const chartData = channelDistribution.map((c) => ({
    name: c.name,
    value: c.count,
    pct: c.percentage,
  }));

  return (
    <PremiumBarChart
      data={chartData}
      title="Channels"
      subtitle="Distribution by channel"
      valueKey="value"
      labelKey="name"
      colorMap={CHANNEL_COLORS}
      layout="horizontal"
      height={180}
      barSize={24}
      loading={loading}
    />
  );
}
