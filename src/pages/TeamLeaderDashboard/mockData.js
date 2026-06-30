/* ════════════════════════════════════════════════════════
   MOCK TEAM-LEADER DASHBOARD (dev preview)
   Off by default. Enable via ?mock=1 in the URL, or set
   MOCK_TL = true. Turn OFF before shipping — real users
   must see real data.

   Returns the RAW backend shape ({ dashboard: {...} }) so it
   flows through the real mapDashboardData() mapper exactly
   like a production response.
════════════════════════════════════════════════════════ */
export const MOCK_TL = false;

export function isTlMockOn() {
  if (MOCK_TL) return true;
  try { return new URLSearchParams(window.location.search).get('mock') === '1'; }
  catch { return false; }
}

export function buildMockTlRaw() {
  const now = Date.now();
  // 14-day assigned/resolved trend
  const trendData = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(now - (13 - i) * 86400000).toISOString().slice(0, 10),
    assigned: 8 + Math.round(5 * Math.sin(i / 1.6)),
    resolved: 6 + Math.round(4 * Math.cos(i / 2)),
  }));
  // hourly call buckets (drives the call-card sparklines + heatmap)
  const callsPerHour = [4, 6, 5, 9, 7, 11, 9, 13, 8, 12, 7, 10, 6, 9].map((total, i) => {
    const missed = Math.max(0, Math.round(total * (0.08 + 0.13 * Math.sin(i))));
    return {
      hour: new Date(now - (13 - i) * 3600000).toISOString().slice(0, 13) + ':00',
      total, answered: total - missed, missed,
    };
  });

  return {
    dashboard: {
      teamStats: { totalAgents: 8, onlineAgents: 6, idleAgents: 2, overloadedAgents: 1 },
      kpis: {
        activeTickets: 23, unassignedTickets: 5, resolvedToday: 41,
        avgFirstResponseTime: 9, avgResolutionTime: 84, csatScore: 88,
      },
      goals: { tickets: { total: 500, current: 372, percentageCompleted: 74 } },
      callPerformance: { totalCalls: 112, answered: 96, missed: 16, avgDuration: 192, answerRate: 86 },
      channelDistribution: [
        { name: 'Telegram', count: 58, percentage: 46 },
        { name: 'WhatsApp', count: 41, percentage: 33 },
        { name: 'Web', count: 18, percentage: 14 },
        { name: 'Email', count: 9, percentage: 7 },
      ],
      agentsPerformance: [
        { agentId: 'a1', name: 'Omar Hassan', status: 'online', activeTickets: 4, resolvedTickets: 38, avgResponseTime: 6, avgResolutionTime: 62, csat: 94, workload: 'medium', performance: 'excellent' },
        { agentId: 'a2', name: 'Sara Ali', status: 'online', activeTickets: 7, resolvedTickets: 31, avgResponseTime: 11, avgResolutionTime: 95, csat: 81, workload: 'high', performance: 'good' },
        { agentId: 'a3', name: 'Khaled M.', status: 'idle', activeTickets: 1, resolvedTickets: 22, avgResponseTime: 18, avgResolutionTime: 140, csat: 67, workload: 'low', performance: 'average' },
        { agentId: 'a4', name: 'Fatima Z.', status: 'online', activeTickets: 9, resolvedTickets: 29, avgResponseTime: 22, avgResolutionTime: 175, csat: 58, workload: 'high', performance: 'bad' },
      ],
      topAgents: [
        { agentId: 'a1', name: 'Omar Hassan', score: 94, resolvedTickets: 38, csat: 94 },
        { agentId: 'a2', name: 'Sara Ali', score: 86, resolvedTickets: 31, csat: 81 },
        { agentId: 'a5', name: 'Layla N.', score: 83, resolvedTickets: 27, csat: 88 },
      ],
      lowPerformers: [
        { agentId: 'a4', name: 'Fatima Z.', score: 58, resolvedTickets: 29, csat: 58, issues: ['Slow response', 'Low CSAT'] },
        { agentId: 'a3', name: 'Khaled M.', score: 64, resolvedTickets: 22, csat: 67, issues: ['High resolution time'] },
      ],
      workload: { totalCapacity: 80, used: 52, percentage: 65, level: 'medium' },
      sla: { overdueTickets: 3, breachedTickets: 1, withinSla: 96, slaCompliancePercentage: 91 },
      insights: [
        { type: 'positive', metric: 'csat', message: 'Team CSAT up 6% this week, led by Omar and Layla.', severity: 'low' },
        { type: 'warning', metric: 'response_time', message: 'Avg response time rose for the WhatsApp channel.', severity: 'medium' },
        { type: 'critical', metric: 'sla', message: '3 tickets are overdue and at risk of SLA breach.', severity: 'high' },
      ],
      suggestions: [
        { type: 'workload', action: 'rebalance', message: 'Reassign 2 tickets from Fatima to Khaled to balance load.', priority: 'high' },
        { type: 'coaching', action: 'coach', message: 'Schedule a coaching session with Fatima on response speed.', priority: 'medium' },
      ],
      trendData,
      heatmap: Array.from({ length: 24 }, (_, h) => ({ hour: h, load: Math.max(0, Math.round(8 * Math.sin((h - 6) / 3.5)) ) })),
      teamScore: {
        overall: 82, grade: 'B',
        breakdown: {
          csatScore: { value: 88, weight: 40, contribution: 35.2 },
          responseTime: { value: 78, weight: 30, contribution: 23.4 },
          resolutionTime: { value: 80, weight: 30, contribution: 24 },
        },
      },
      feedbackStats: {
        totalRatings: 64, avgRating: 4.4, csat: 88,
        ratingBreakdown: { 1: 2, 2: 3, 3: 7, 4: 19, 5: 33 },
      },
      timeSeries: { callsPerHour },
    },
  };
}
