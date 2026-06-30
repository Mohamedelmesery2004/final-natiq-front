export function mapDashboardData(raw) {
  const dp = raw?.dashboard || raw || {};
  const ts = dp.teamStats || {};
  const kpis = dp.kpis || {};
  const goals = dp.goals || {};
  const calls = dp.callPerformance || {};
  const channels = dp.channelDistribution || [];
  // ── fields the CURRENT (old) backend returns that the new shape omits ──
  const uiKpis = dp.uiKpis || {};
  const callsPerHour = dp.timeSeries?.callsPerHour || [];
  const agents = dp.agentsPerformance || [];
  const topAgents = dp.topAgents || [];
  const lowPerformers = dp.lowPerformers || [];
  const workload = dp.workload || {};
  const sla = dp.sla || {};
  const insights = dp.insights || [];
  const suggestions = dp.suggestions || [];
  const trendData = dp.trendData || [];
  const heatmapData = dp.heatmap || [];
  const teamScore = dp.teamScore || {};

  return {
    teamStats: {
      // fall back to old backend's flat totals
      totalAgents: ts.totalAgents || dp.totalAgents || 0,
      onlineAgents: ts.onlineAgents || dp.totalAgents || 0,
      idleAgents: ts.idleAgents || 0,
      overloadedAgents: ts.overloadedAgents || 0,
    },
    kpis: {
      activeTickets: kpis.activeTickets || dp.activeTickets || 0,
      unassignedTickets: kpis.unassignedTickets || dp.unassignedTickets || 0,
      resolvedToday: kpis.resolvedToday || dp.resolvedToday || 0,
      avgFirstResponseTime: kpis.avgFirstResponseTime || (dp.kpis?.avgFirstResponseTime ?? 0),
      avgResolutionTime: kpis.avgResolutionTime || (dp.kpis?.avgResolutionTime ?? 0),
      csatScore: kpis.csatScore || uiKpis.csatScore || 0,
    },
    goals: {
      tickets: {
        total: goals.tickets?.total || uiKpis.goalTickets?.total || 500,
        current: goals.tickets?.current || uiKpis.goalTickets?.current || 0,
        percentageCompleted: goals.tickets?.percentageCompleted || uiKpis.goalTickets?.percentageCompleted || 0,
      },
    },
    callPerformance: {
      // old backend exposes these via uiKpis
      totalCalls: calls.totalCalls || uiKpis.totalCalls || 0,
      answered: calls.answered || uiKpis.answeredCalls || 0,
      missed: calls.missed || uiKpis.missedCalls || 0,
      avgDuration: calls.avgDuration || 0,
      answerRate: calls.answerRate || (uiKpis.totalCalls > 0 ? Math.round((uiKpis.answeredCalls / uiKpis.totalCalls) * 100) : 0),
    },
    channelDistribution: channels.map((c) => ({
      name: c.name || 'Unknown',
      count: c.count || 0,
      percentage: c.percentage || 0,
    })),
    agentsPerformance: agents.map((a) => ({
      id: a.agentId,
      name: a.name || 'Unknown',
      status: a.status || 'offline',
      activeTickets: a.activeTickets || 0,
      resolvedTickets: a.resolvedTickets || 0,
      avgResponseTime: a.avgResponseTime || 0,
      avgResolutionTime: a.avgResolutionTime || 0,
      csat: a.csat || 0,
      workload: a.workload || 'low',
      performance: a.performance || 'bad',
    })),
    topAgents: topAgents.map((a) => ({
      id: a.agentId,
      name: a.name || 'Unknown',
      score: a.score || 0,
      resolvedTickets: a.resolvedTickets || 0,
      csat: a.csat || 0,
    })),
    lowPerformers: lowPerformers.map((a) => ({
      id: a.agentId,
      name: a.name || 'Unknown',
      score: a.score || 0,
      resolvedTickets: a.resolvedTickets || 0,
      csat: a.csat || 0,
      issues: a.issues || [],
    })),
    workload: {
      totalCapacity: workload.totalCapacity || 60,
      used: workload.used || 0,
      percentage: workload.percentage || 0,
      level: workload.level || 'low',
    },
    sla: {
      overdueTickets: sla.overdueTickets || 0,
      breachedTickets: sla.breachedTickets || 0,
      withinSla: sla.withinSla || 0,
      slaCompliancePercentage: sla.slaCompliancePercentage || 100,
    },
    insights: insights.map((i) => ({
      type: i.type || 'info',
      metric: i.metric || '',
      message: i.message || '',
      severity: i.severity || 'low',
    })),
    suggestions: suggestions.map((s) => ({
      type: s.type || 'performance',
      action: s.action || '',
      message: s.message || '',
      priority: s.priority || 'low',
    })),
    trendData: trendData.map((d) => ({
      date: d.date || '',
      assigned: d.assigned || 0,
      resolved: d.resolved || 0,
    })),
    heatmap: heatmapData.map((h) => ({
      hour: h.hour ?? 0,
      load: h.load || 0,
    })),
    teamScore: {
      overall: teamScore.overall || 0,
      grade: teamScore.grade || 'F',
      breakdown: {
        csatScore: {
          value: teamScore.breakdown?.csatScore?.value || 0,
          weight: teamScore.breakdown?.csatScore?.weight || 0,
          contribution: teamScore.breakdown?.csatScore?.contribution || 0,
        },
        responseTime: {
          value: teamScore.breakdown?.responseTime?.value || 0,
          weight: teamScore.breakdown?.responseTime?.weight || 0,
          contribution: teamScore.breakdown?.responseTime?.contribution || 0,
        },
        resolutionTime: {
          value: teamScore.breakdown?.resolutionTime?.value || 0,
          weight: teamScore.breakdown?.resolutionTime?.weight || 0,
          contribution: teamScore.breakdown?.resolutionTime?.contribution || 0,
        },
      },
    },
    // ── passthrough real data from the current backend ──
    callsPerHour: callsPerHour.map((b) => ({
      hour: b.hour,
      total: b.total || 0,
      answered: b.answered || 0,
      missed: b.missed || 0,
    })),
    feedbackStats: dp.feedbackStats || {},
  };
}
