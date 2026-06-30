import PremiumDataTable, { formatters, STATUS_COLORS } from '../../../components/charts/PremiumDataTable';
import { COLORS } from '../../../components/charts/ChartTheme';

const WORKLOAD_COLORS = {
  low: COLORS.success, medium: COLORS.accent, high: COLORS.danger, overloaded: COLORS.danger,
};

const PERFORMANCE_COLORS = {
  good: COLORS.success, average: COLORS.accent, bad: COLORS.danger,
};

const columns = [
  { key: 'name', label: 'Agent', render: (r) => formatters.avatar(r.name), bold: true },
  { key: 'status', label: 'Status', render: (r) => formatters.status(r.status) },
  { key: 'activeTickets', label: 'Active', align: 'center', bold: true },
  { key: 'resolvedTickets', label: 'Resolved', align: 'center', bold: true },
  { key: 'avgResponseTime', label: 'Response', align: 'center', render: (r) => formatters.time(r.avgResponseTime) },
  { key: 'csat', label: 'CSAT', align: 'center', render: (r) => r.csat > 0 ? `${r.csat}%` : '\u2014', bold: true },
  { key: 'workload', label: 'Workload', align: 'center', render: (r) => formatters.badge(r.workload, WORKLOAD_COLORS[r.workload]) },
  { key: 'performance', label: 'Perf', align: 'center', render: (r) => formatters.badge(r.performance, PERFORMANCE_COLORS[r.performance]) },
];

export default function AgentsTable({ agents, onSelectAgent }) {
  return (
    <PremiumDataTable
      columns={columns}
      data={agents}
      title="Agents Performance"
      onRowClick={onSelectAgent}
    />
  );
}
