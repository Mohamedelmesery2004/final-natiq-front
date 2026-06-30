import { UserGroupIcon, TicketIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import PremiumKPICard from '../../../components/charts/PremiumKPICard';
import { COLORS } from '../../../components/charts/ChartTheme';

function fmtMin(m) {
  if (!m || m <= 0) return '0m';
  if (m < 60) return `${Math.round(m)}m`;
  const h = Math.floor(m / 60), mm = m % 60;
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
}

export default function StatsCards({ teamStats, kpis, trendData = [], loading }) {
  // real spark from per-day assigned tickets, when the backend provides it
  const ticketSpark = (trendData || []).map((d) => ({ v: d.assigned || 0 }));
  // real trend pills computed from actual values vs. sensible benchmarks
  const respTrend = kpis.avgFirstResponseTime > 0
    ? (kpis.avgFirstResponseTime <= 15
        ? { direction: 'down', pct: 0, color: COLORS.success }   // faster is better
        : { direction: 'up', pct: 0, color: COLORS.danger })
    : null;
  const resoTrend = kpis.avgResolutionTime > 0
    ? (kpis.avgResolutionTime <= 60
        ? { direction: 'down', pct: 0, color: COLORS.success }
        : { direction: 'up', pct: 0, color: COLORS.danger })
    : null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
      <PremiumKPICard label="Active Agents" value={`${teamStats.onlineAgents}/${teamStats.totalAgents}`}
        icon={<UserGroupIcon style={{ width: 18 }} />} accent={COLORS.primary}
        hint={`${teamStats.idleAgents} idle \u00B7 ${teamStats.overloadedAgents} overloaded`} loading={loading} />
      <PremiumKPICard label="Active Tickets" value={kpis.activeTickets}
        icon={<TicketIcon style={{ width: 18 }} />} accent={COLORS.accent}
        hint={`${kpis.unassignedTickets} unassigned \u00B7 ${kpis.resolvedToday} resolved today`}
        sparkData={ticketSpark} loading={loading} />
      <PremiumKPICard label="Avg Response" value={fmtMin(kpis.avgFirstResponseTime)}
        icon={<ClockIcon style={{ width: 18 }} />} accent={COLORS.secondary}
        hint="First response to customer" trend={respTrend} loading={loading} />
      <PremiumKPICard label="Avg Resolution" value={fmtMin(kpis.avgResolutionTime)}
        icon={<CheckCircleIcon style={{ width: 18 }} />} accent={COLORS.success}
        hint="Time to ticket resolution" trend={resoTrend} loading={loading} />
    </div>
  );
}
