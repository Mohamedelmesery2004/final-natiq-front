import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightOnRectangleIcon,
    ClipboardDocumentCheckIcon,
    Cog6ToothIcon,
    KeyIcon,
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    UserCircleIcon,
    UserGroupIcon,
    UsersIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import UsersManagement from '../Users';
import RolesManagement from '../Roles';
import CompaniesManagement from '../Companies';
import RolePermissions from '../RolePermissions';
import PermissionsManagement from '../Permissions';
import AuditLogs from '../AuditLogs';
import SettingsPage from '../../components/common/SettingsPage';
import { managementApi } from '../../services/managementApi';
import { agentApi } from '../../services/agentApi';
import logo from '../../assets/logo.png';
import '../NatiqDashboard/NatiqDashboard.css';
import './Dashboard.css';
import PremiumKPICard from '../../components/charts/PremiumKPICard';
import PremiumLineChart from '../../components/charts/PremiumLineChart';
import PremiumBarChart from '../../components/charts/PremiumBarChart';
import PremiumStackedBarChart from '../../components/charts/PremiumStackedBarChart';
import PremiumDonutChart from '../../components/charts/PremiumDonutChart';
import PremiumGaugeChart from '../../components/charts/PremiumGaugeChart';
import PremiumAreaChart from '../../components/charts/PremiumAreaChart';
import PremiumDataTable from '../../components/charts/PremiumDataTable';
import { COLORS, CHANNEL_COLORS, THEME, CARD_STYLE } from '../../components/charts/ChartTheme';

const MANAGER_NAV = [
    { key: 'overview',         label: 'Overview',         icon: Squares2X2Icon },
    { key: 'users',            label: 'Users',            icon: UsersIcon },
    { key: 'roles',            label: 'Roles',            icon: ShieldCheckIcon },
    { key: 'permissions',      label: 'Permissions',      icon: KeyIcon },
    { key: 'role_permissions', label: 'Role Permissions', icon: ClipboardDocumentCheckIcon },
    { key: 'audit_logs',       label: 'Audit Logs',       icon: UserGroupIcon },
    { key: 'profile',          label: 'My Profile',       icon: UserCircleIcon },
];

const ADMIN_EXTRA_NAV = [{ key: 'companies', label: 'Companies', icon: UserGroupIcon }];

const GENERAL_KEYS = [{ key: 'logout', label: 'Logout', icon: ArrowRightOnRectangleIcon }];

function readStoredUser() {
    try { return JSON.parse(localStorage.getItem('agent_user') || '{}'); }
    catch { return {}; }
}

function titleForTab(tab) {
    const map = {
        overview: 'Manager Command Center',
        users: 'Users Management',
        roles: 'Roles Management',
        permissions: 'Permissions Management',
        role_permissions: 'Role-Permissions Matrix',
        audit_logs: 'Audit Logs',
        profile: 'My Profile',
        companies: 'Companies',
    };
    return map[tab] || 'Dashboard';
}

function Dashboard() {
    const navigate = useNavigate();
    const storedUser = readStoredUser();
    const managerMode = storedUser.role === 'company_manager';
    const navLinks = managerMode ? MANAGER_NAV : [...ADMIN_EXTRA_NAV, ...MANAGER_NAV];
    const [activeNav, setActiveNav] = useState('overview');
    const [overview, setOverview] = useState(null);
    const [overviewLoading, setOverviewLoading] = useState(true);
    const [mgrDash, setMgrDash] = useState(null);
    const [mgrDashLoading, setMgrDashLoading] = useState(true);

    useEffect(() => {
        managementApi.getOverview()
            .then(setOverview)
            .catch((err) => console.error('[Overview]', err))
            .finally(() => setOverviewLoading(false));
    }, []);

    useEffect(() => {
        managementApi.getManagerDashboard()
            .then(setMgrDash)
            .catch((err) => console.error('[Manager Dashboard]', err))
            .finally(() => setMgrDashLoading(false));
    }, []);

    const overviewStats = useMemo(() => {
        const kpis = overview?.kpis ?? {};
        return [
            {
                title: 'Total Users',
                value: overviewLoading ? '—' : String(overview?.totalUsers ?? 0),
                sub: 'Active accounts in your company',
            },
            {
                title: 'Open Tickets',
                value: overviewLoading ? '—' : String(kpis.openTickets ?? 0),
                sub: overviewLoading ? '' : `${kpis.inProgressTickets ?? 0} in progress · ${kpis.resolvedTickets ?? 0} resolved`,
            },
            {
                title: 'Active Sessions',
                value: overviewLoading ? '—' : String(kpis.activeSessions ?? 0),
                sub: overviewLoading ? '' : `${kpis.totalSessions ?? 0} total chat sessions`,
            },
            {
                title: 'Avg Response',
                value: overviewLoading ? '—' : `${kpis.avgFirstResponseTime ?? 0}m`,
                sub: overviewLoading ? '' : `Avg resolution: ${kpis.avgResolutionTime ?? 0}m`,
            },
        ];
    }, [overview, overviewLoading]);

    function logout() {
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_user');
        navigate('/');
    }

    const renderOverview = () => {
        if (mgrDashLoading) return <div className="mgr-loader">Loading dashboard...</div>;

        const dash = mgrDash || {};
        const { kpis = {}, performanceTrend = [], channelDistribution = [], overview: healthOverview, todayStats, slaStats, callPerformance, feedbackStats, csatUI, recentActivity = [], topCategories = [], goalProgress, workload, insights = [], suggestions = [] } = dash;

        const kpiCards = [
            { label: 'Total Workforce', value: kpis.totalWorkforce || 0, icon: <UsersIcon width={18} />, accent: COLORS.secondary, hint: `${kpis.totalAgents || 0} agents · ${kpis.totalTeamLeaders || 0} TLs · ${kpis.totalManagers || 0} mgrs` },
            { label: 'Tickets', value: kpis.totalTickets || 0, icon: <ClipboardDocumentCheckIcon width={18} />, accent: COLORS.accent, hint: `${kpis.openTickets || 0} open · ${kpis.resolvedTickets || 0} resolved · ${kpis.ticketsToday || 0} today` },
            { label: 'Resolution Rate', value: `${kpis.resolutionRate || 0}%`, icon: <ShieldCheckIcon width={18} />, accent: COLORS.success, hint: `${kpis.ticketsLast7Days || 0} tickets last 7 days` },
            { label: 'Active Chats', value: kpis.activeChats || 0, icon: <UserGroupIcon width={18} />, accent: COLORS.primary, hint: `${kpis.totalChats || 0} total · ${kpis.chatLoadPerAgent || 0}/agent` },
        ];

        const trendLines = [
            { dataKey: 'assigned', name: 'Assigned', color: COLORS.primary },
            { dataKey: 'resolved', name: 'Resolved', color: COLORS.success },
        ];

        const trendData = performanceTrend.map((d) => ({
            name: d.date?.slice(5) || d.date,
            ...d,
        }));

        const channelData = channelDistribution.map((c) => ({
            name: c.name || c.channel || 'Unknown',
            value: c.value || c.count || 0,
        }));

        const ticketStatusData = [
            { name: 'Open', value: kpis.openTickets || 0, color: COLORS.accent },
            { name: 'Resolved', value: kpis.resolvedTickets || 0, color: COLORS.success },
        ];

        const activityColumns = [
            {
                key: 'label', label: 'Activity',
                render: (row) => <span style={{ fontWeight: 500, fontSize: 13 }}>{row.label || row.message || 'N/A'}</span>,
            },
            {
                key: 'type', label: 'Type',
                render: (row) => {
                    const c = row.type === 'ticket_created' ? COLORS.primary : row.type === 'ticket_resolved' ? COLORS.success : COLORS.secondary;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: `${c}15`, color: c }}>{row.type}</span>;
                }
            },
            { key: 'timeAgo', label: 'When', render: (row) => <span style={{ color: THEME.textMuted, fontSize: 12 }}>{row.timeAgo || '-'}</span> },
        ];

        return (
            <div className="mgr-overview">
                <section className="mgr-hero">
                    <div>
                        <h2>Welcome back, {storedUser.name || 'Manager'}</h2>
                        <p>Everything you need to manage access control, users, and operations in one place.</p>
                    </div>
                    {healthOverview && (
                        <div className="mgr-hero-badge">
                            <span>Health: {healthOverview.healthScore || 0}%</span>
                            <span className={`mgr-status-dot ${healthOverview.status}`} />
                            <span>{healthOverview.status} · {healthOverview.workloadLevel} load · {healthOverview.riskLevel} risk</span>
                        </div>
                    )}
                </section>

                <section className="mgr-kpi-grid">
                    {kpiCards.map((card) => (
                        <PremiumKPICard key={card.label} label={card.label} value={card.value}
                            icon={card.icon} accent={card.accent} hint={card.hint} loading={mgrDashLoading} />
                    ))}
                </section>

                {/* ── Today Stats + SLA + Calls ── */}
                <section className="mgr-panels-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    {todayStats && (
                        <div style={{ ...CARD_STYLE, padding: 18 }}>
                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: THEME.text }}>Today</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <StatBox label="Tickets" value={todayStats.ticketsToday ?? 0} small />
                                <StatBox label="Resolved" value={todayStats.resolvedToday ?? 0} small />
                                <StatBox label="Avg Response" value={todayStats.avgResponseToday ? `${Math.round(todayStats.avgResponseToday / 60)}m` : '0m'} small />
                                <StatBox label="Avg Resolution" value={todayStats.avgResolutionToday ? `${Math.round(todayStats.avgResolutionToday / 3600)}h` : '0h'} small />
                            </div>
                        </div>
                    )}
                    {slaStats && (
                        <div style={{ ...CARD_STYLE, padding: 18 }}>
                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: THEME.text }}>SLA Status</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <SLARow label="Overdue" value={slaStats.overdueTickets ?? 0} danger />
                                <SLARow label="Due Soon" value={slaStats.dueSoon ?? 0} />
                                <SLARow label="Breached" value={slaStats.breachedTickets ?? 0} danger />
                            </div>
                        </div>
                    )}
                    {callPerformance && (
                        <div style={{ ...CARD_STYLE, padding: 18 }}>
                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: THEME.text }}>Call Performance</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <StatBox label="Total" value={callPerformance.totalCalls ?? 0} small />
                                <StatBox label="Answered" value={callPerformance.answered ?? 0} small />
                                <StatBox label="Missed" value={callPerformance.missed ?? 0} small />
                                <StatBox label="Answer Rate" value={callPerformance.answerRate ? `${callPerformance.answerRate}%` : '0%'} small />
                            </div>
                        </div>
                    )}
                </section>

                {/* ── Charts ── */}
                <section className="mgr-charts-grid">
                    <PremiumLineChart data={trendData}
                        lines={trendLines}
                        title="30-Day Trend"
                        subtitle="Daily assigned vs resolved tickets"
                        loading={mgrDashLoading} height={340} />
                    <PremiumBarChart data={channelData}
                        title="Channel Distribution"
                        subtitle="Chat volume by channel"
                        loading={mgrDashLoading} height={340}
                        layout="horizontal" valueKey="value" labelKey="name"
                        colorMap={CHANNEL_COLORS} barSize={36} />
                </section>

                <section className="mgr-charts-grid">
                    <PremiumStackedBarChart data={trendData.slice(-14)}
                        bars={[
                            { dataKey: 'assigned', name: 'Assigned', color: COLORS.secondary, stackId: 'a' },
                            { dataKey: 'resolved', name: 'Resolved', color: COLORS.success, stackId: 'a' },
                        ]}
                        title="Ticket Stack (14 days)"
                        subtitle="Assigned vs Resolved"
                        loading={mgrDashLoading} height={280} />
                    <div className="mgr-charts-compact">
                        <PremiumDonutChart data={ticketStatusData}
                            title="Ticket Status"
                            subtitle="Open vs Resolved"
                            loading={mgrDashLoading} height={260}
                            innerRadius={50} outerRadius={80}
                            centerValue={kpis.totalTickets || 0}
                            centerLabel="Total" />
                        <PremiumGaugeChart value={kpis.resolutionRate || 0} max={100}
                            title="Resolution Rate"
                            subtitle="Overall performance"
                            loading={mgrDashLoading} size={160} strokeWidth={12}
                            grade={kpis.resolutionRate >= 80 ? 'A' : kpis.resolutionRate >= 60 ? 'B' : kpis.resolutionRate >= 40 ? 'C' : 'D'} />
                    </div>
                </section>

                <section className="mgr-charts-grid">
                    <PremiumAreaChart data={trendData}
                        lines={[
                            { dataKey: 'assigned', name: 'Assigned', color: COLORS.primary },
                        ]}
                        title="Activity Area"
                        subtitle="Ticket volume trend"
                        loading={mgrDashLoading} height={260} />
                    <PremiumDataTable columns={activityColumns} data={recentActivity}
                        title="Recent Activity"
                        subtitle={`${recentActivity?.length || 0} events`}
                        loading={mgrDashLoading} height={260} />
                </section>

                {/* ── Insights & Suggestions ── */}
                {insights.length > 0 && (
                    <section className="mgr-panels-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ ...CARD_STYLE, padding: 18 }}>
                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: THEME.text }}>Insights</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {insights.map((ins, i) => (
                                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: ins.severity === 'high' ? 'rgba(239,68,68,0.06)' : ins.severity === 'medium' ? 'rgba(245,158,11,0.06)' : 'rgba(59,130,246,0.06)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                        <ExclamationTriangleIcon style={{ width: 16, color: ins.severity === 'high' ? COLORS.danger : ins.severity === 'medium' ? COLORS.accent : COLORS.secondary, flexShrink: 0 }} />
                                        <span style={{ color: THEME.text }}>{ins.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {suggestions.length > 0 && (
                            <div style={{ ...CARD_STYLE, padding: 18 }}>
                                <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: THEME.text }}>Suggestions</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {suggestions.map((sug, i) => (
                                        <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: THEME.grid, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: sug.priority === 'high' ? `${COLORS.danger}20` : `${COLORS.accent}20`, color: sug.priority === 'high' ? COLORS.danger : COLORS.accent }}>{sug.priority}</span>
                                                <span style={{ fontWeight: 600, color: THEME.textSecondary, textTransform: 'capitalize' }}>{sug.action}</span>
                                            </div>
                                            <span style={{ color: THEME.text }}>{sug.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
            </div>
        );
    };

    // Inline stat helpers used in mgr overview (these won't conflict with file-level helpers)
    function StatBox({ label, value, small }) {
        return (
            <div style={{ background: THEME.grid, borderRadius: 10, padding: small ? '8px 12px' : '14px 18px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: small ? 18 : 28, fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily, lineHeight: 1.2 }}>{value}</p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{label}</p>
            </div>
        );
    }
    function SLARow({ label, value, danger }) {
        const isBad = value > 0;
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: isBad ? 'rgba(239,68,68,0.06)' : THEME.grid }}>
                <span style={{ fontSize: 13, fontFamily: THEME.fontFamily, color: THEME.textSecondary }}>{label}</span>
                <strong style={{ fontSize: 14, color: isBad ? (danger ? COLORS.danger : COLORS.warning) : COLORS.success, fontFamily: THEME.fontFamily }}>{value}</strong>
            </div>
        );
    }

    const renderProfile = () => {
        const initials = (storedUser.name || 'MU').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
        return (
            <div className="mgr-profile-card">
                <div className="mgr-profile-avatar">{initials}</div>
                <h2>{storedUser.name || 'Manager User'}</h2>
                <p>{storedUser.email || 'No email available'}</p>
                <div className="mgr-profile-grid">
                    <div><span>Role</span><strong>{storedUser.role || 'N/A'}</strong></div>
                    <div><span>Company</span><strong>{storedUser.companyId || 'Assigned'}</strong></div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (activeNav === 'overview')         return renderOverview();
        if (activeNav === 'users')            return <UsersManagement />;
        if (activeNav === 'roles')            return <RolesManagement />;
        if (activeNav === 'permissions')      return <PermissionsManagement />;
        if (activeNav === 'role_permissions') return <RolePermissions />;
        if (activeNav === 'audit_logs')       return <AuditLogs />;
        if (activeNav === 'profile')          return renderProfile();
        if (activeNav === 'companies')        return <CompaniesManagement />;
        return null;
    };

    const userInitials = (storedUser.name || 'MU').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="cd-layout">
            <aside className="cd-sidebar">
                <div className="cd-sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => setActiveNav('overview')}>
                    <img src={logo} alt="NATIQ" />
                </div>
                <nav className="cd-sidebar-nav">
                    <p className="cd-nav-label">Menu</p>
                    <ul className="cd-nav-list">
                        {navLinks.map(({ key, label, icon: Icon }) => (
                            <li
                                key={key}
                                className={`cd-nav-item${activeNav === key ? ' cd-nav-active' : ''}`}
                                onClick={() => setActiveNav(key)}
                            >
                                <Icon className="cd-nav-icon" />
                                <span className="cd-nav-text">{label}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="cd-nav-label">General</p>
                    <ul className="cd-nav-list">
                        {GENERAL_KEYS.map(({ key, label, icon: Icon }) => (
                            <li
                                key={key}
                                className="cd-nav-item"
                                onClick={key === 'logout' ? logout : () => setActiveNav(key)}
                            >
                                <Icon className="cd-nav-icon" />
                                <span className="cd-nav-text">{label}</span>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            <div className="cd-right-panel">
                <header className="cd-topbar">
                    <div className="cd-topbar-left">
                        <div className="cd-search-wrap">
                            <MagnifyingGlassIcon className="cd-search-icon" />
                            <input className="cd-search" type="text" placeholder="Search" />
                        </div>
                    </div>
                    <div className="cd-topbar-actions">
                        <div className="cd-user-info">
                            <div className="cd-avatar">{userInitials}</div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{storedUser.name || 'Manager'}</span>
                                <span className="cd-user-email">{managerMode ? 'Company Manager' : 'Platform Admin'}</span>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="cd-main mgr-content">{renderContent()}</main>
            </div>
        </div>
    );
}

export default Dashboard;
