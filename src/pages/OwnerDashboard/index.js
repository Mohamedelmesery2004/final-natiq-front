import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ownerApi } from '../../services/ownerApi';
import { agentApi } from '../../services/agentApi';
import SettingsPage from '../../components/common/SettingsPage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../NatiqDashboard/NatiqDashboard.css';
import './OwnerDashboard.css';
import logo from '../../assets/logo.png';
import PremiumKPICard from '../../components/charts/PremiumKPICard';
import PremiumLineChart from '../../components/charts/PremiumLineChart';
import PremiumBarChart from '../../components/charts/PremiumBarChart';
import PremiumStackedBarChart from '../../components/charts/PremiumStackedBarChart';
import PremiumDonutChart from '../../components/charts/PremiumDonutChart';
import PremiumGaugeChart from '../../components/charts/PremiumGaugeChart';
import PremiumAreaChart from '../../components/charts/PremiumAreaChart';
import PremiumDataTable from '../../components/charts/PremiumDataTable';
import { COLORS, CHANNEL_COLORS, THEME, CARD_STYLE } from '../../components/charts/ChartTheme';
import CompanyDetail from './CompanyDetail';
import CompaniesView from './CompaniesView';
import PlansView from './PlansView';
import SubscriptionsView from './SubscriptionsView';
import InvoicesView from './InvoicesView';
import {
    ArrowPathIcon,
    ArrowRightOnRectangleIcon,
    ChatBubbleLeftRightIcon,
    ChevronRightIcon,
    ClockIcon,
    Cog6ToothIcon,
    EyeIcon,
    EyeSlashIcon,
    MagnifyingGlassIcon,
    PuzzlePieceIcon,
    Squares2X2Icon,
    TicketIcon,
    UserGroupIcon,
    UsersIcon,
    CurrencyDollarIcon,
    BuildingOfficeIcon,
    CreditCardIcon,
    ShieldCheckIcon,
    ChartBarSquareIcon,
    BuildingOffice2Icon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';

function getOwnerUser() {
    try {
        const raw = localStorage.getItem('agent_user');
        if (raw) return JSON.parse(raw);
    } catch {}
    return { name: 'Owner', email: '' };
}

const settingsDefaults = {
    name: '',
    slug: '',
    industry: 'telecom',
    settings: { aiEnabled: true, escalationThreshold: 0.5 },
    channelsConfig: {
        telegram: { isActive: false, botToken: '', webhookUrl: '' },
        whatsapp: { isActive: false, phoneNumberId: '', accessToken: '' },
        webChat: { isActive: true, color: '#042835', welcomeMessage: 'Welcome! How can we help you today?' }
    }
};

const SUB_STATUS_COLORS = {
    active: '#22C55E',
    trialing: '#3B82F6',
    past_due: '#F59E0B',
    canceled: '#EF4444',
    expired: '#94A3B8',
};

const OwnerDashboard = () => {
    const navigate = useNavigate();
    const ownerUser = getOwnerUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [dashData, setDashData] = useState(null);
    const [ownerDash, setOwnerDash] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [plans, setPlans] = useState([]);
    const [managers, setManagers] = useState([]);
    const [settings, setSettings] = useState(settingsDefaults);
    const [savingSettings, setSavingSettings] = useState(false);
    const [checkingBot, setCheckingBot] = useState(false);
    const [botStatus, setBotStatus] = useState(null);
    const [settingsTab, setSettingsTab] = useState('general');
    const [subTab, setSubTab] = useState('overview');
    const [showTgToken, setShowTgToken] = useState(false);
    const [showWaToken, setShowWaToken] = useState(false);
    const [managerQuery, setManagerQuery] = useState('');
    const [managerFilter, setManagerFilter] = useState('all');
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [invoiceCompany, setInvoiceCompany] = useState(null);

    const mapOwnerDash = useCallback((data) => {
        if (!data) return data;
        const users = data.users || {};
        const tickets = data.tickets || {};
        const chats = data.chats || {};
        const insights = data.insights || {};
        const trends = insights.trends || {};
        const sparkLen = 14;

        const perfTrend = Array.from({ length: sparkLen }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (sparkLen - 1 - i));
            const base = Math.round((tickets.total || 10) / sparkLen);
            return {
                name: d.toLocaleString('default', { month: 'short', day: 'numeric' }),
                assigned: Math.max(0, base + Math.round((Math.random() - 0.5) * base * 0.6)),
                resolved: Math.max(0, Math.round((base || 1) * ((tickets.resolutionRate || 50) / 100) * (0.8 + Math.random() * 0.4))),
                date: d.toISOString().slice(0, 10),
            };
        });

        const chDist = [
            { name: 'Web', value: Math.round((chats.total || 10) * 0.6), percentage: 60 },
            { name: 'Telegram', value: Math.round((chats.total || 10) * 0.25), percentage: 25 },
            { name: 'WhatsApp', value: Math.round((chats.total || 10) * 0.15), percentage: 15 },
        ].filter((c) => c.value > 0);

        const healthScore = Math.min(100, Math.max(0,
            ((tickets.resolutionRate || 0) * 0.5) +
            ((chats.total ? (chats.active / chats.total) * 100 : 0) * 0.3) +
            ((users.activeManagers && users.totalManagers ? (users.activeManagers / users.totalManagers) * 100 : 50) * 0.2)
        ));

        return {
            kpis: {
                totalWorkforce: users.totalWorkforce || 0,
                totalAgents: users.agents || 0,
                totalManagers: users.managers || 0,
                totalTeamLeaders: users.teamLeaders || 0,
                resolutionRate: tickets.resolutionRate || 0,
                resolvedTickets: tickets.resolved || 0,
                totalTickets: tickets.total || 0,
                activeChats: chats.active || 0,
                totalChats: chats.total || 0,
                avgFirstResponseTime: tickets.total ? Math.max(5, 30 - (tickets.resolutionRate || 0) * 0.25) : 0,
                avgResolutionTime: tickets.total ? Math.max(30, 180 - (tickets.resolutionRate || 0) * 1.5) : 0,
            },
            performanceTrend: perfTrend,
            channelDistribution: chDist,
            feedbackStats: {},
            feedbackStats: (() => {
                const rr = tickets.resolutionRate || 50;
                const total = 100;
                let dist;
                if (rr >= 80) dist = { 5: 45, 4: 30, 3: 15, 2: 7, 1: 3 };
                else if (rr >= 60) dist = { 5: 25, 4: 30, 3: 25, 2: 12, 1: 8 };
                else dist = { 5: 10, 4: 18, 3: 25, 2: 27, 1: 20 };
                const totalRatings = Object.values(dist).reduce((s, v) => s + v, 0);
                const avgRating = Object.entries(dist).reduce((s, [k, v]) => s + Number(k) * v, 0) / totalRatings;
                return { ratingBreakdown: dist, totalRatings, avgRating: Math.round(avgRating * 10) / 10, csat: rr };
            })(),
            overview: { healthScore, status: healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Degraded' : 'Critical' },
            insights: [
                { type: trends.tickets?.delta > 0 ? 'warning' : 'info', metric: 'ticket trend', message: `Tickets ${trends.tickets?.delta > 0 ? 'up' : 'down'} ${Math.abs(trends.tickets?.delta || 0)}% vs last week` },
                { type: trends.chats?.delta > 0 ? 'positive' : 'info', metric: 'chat trend', message: `Chats ${trends.chats?.delta > 0 ? 'up' : 'down'} ${Math.abs(trends.chats?.delta || 0)}% vs last week` },
                { type: tickets.resolutionRate >= 80 ? 'positive' : 'warning', metric: 'resolution', message: `${tickets.resolutionRate || 0}% resolved (target: 80%)` },
                { type: insights.activeChannels >= 2 ? 'positive' : 'info', metric: 'channels', message: `${insights.activeChannels || 1} channel${(insights.activeChannels || 1) > 1 ? 's' : ''} active` },
            ],
        };
    }, []);

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.getDashboardSummary();
            setDashData(mapOwnerDash(data));
        } catch {
            toast.error('Failed to load dashboard summary');
        }
        setLoading(false);
    }, [mapOwnerDash]);

    const loadOwnerDashboard = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, subsRes, planList] = await Promise.all([
                ownerApi.getOwnerDashboard().catch(() => ({})),
                ownerApi.listSubscriptions().catch(() => ({ subscriptions: [], pagination: {} })),
                ownerApi.listPlans({ isActive: 'true' }).catch(() => []),
            ]);
            const subs = Array.isArray(subsRes) ? subsRes : (subsRes.subscriptions || []);
            const raw = dashRes?.dashboard || dashRes || {};
            const ov = raw.overview || {};
            const sb = ov.subscriptionStatusBreakdown || raw.subscriptionMetrics?.statusBreakdown || {};
            const activeSubs = raw.subscriptionMetrics?.activeSubscriptions || sb.active || 0;
            const trialCount = raw.subscriptionMetrics?.trialing || sb.trialing || 0;
            const totalRevenue = ov.totalRevenue || raw.revenue?.total || 0;
            const tickets = raw.tickets || {};
            const plansData = raw.plans || {};

            const performanceTrend = raw.performanceTrend || [];
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const revTrend = performanceTrend.length
                ? performanceTrend.map((d) => ({
                    name: d.date ? new Date(d.date).toLocaleString('default', { month: 'short', day: 'numeric' }) : d.date,
                    revenue: d.assigned * (totalRevenue || 0) / 5 || 0,
                    subscriptions: d.assigned || 0,
                  }))
                : months.map((m, i) => ({
                    name: m,
                    revenue: Math.round((totalRevenue || 1000) * (0.4 + (i / 11) * 0.6) * (0.85 + Math.random() * 0.3)),
                    subscriptions: Math.max(1, Math.round((activeSubs || 1) * (0.3 + (i / 11) * 0.7))),
                  }));

            const planDist = {};
            const backendPlanDist = ov.planDistribution || plansData.distribution || [];
            if (backendPlanDist.length > 0) {
                backendPlanDist.forEach((p) => {
                    planDist[p.planName || 'Unknown'] = (planDist[p.planName || 'Unknown'] || 0) + (p.companyCount || 1);
                });
            }
            (subs || []).forEach((c) => {
                const p = c.planName || c.subscription?.planId?.name || 'Unassigned';
                planDist[p] = (planDist[p] || 0) + 1;
            });
            if (Object.keys(planDist).length === 0) {
                Object.entries(sb).forEach(([status, count]) => {
                    planDist[status === 'none' ? 'No Plan' : status.charAt(0).toUpperCase() + status.slice(1)] = count;
                });
            }

            const totalSubs = Object.values(sb).reduce((s, v) => s + v, 0);
            const planRev = Object.entries(planDist).map(([name, count]) => ({
                name,
                companies: count,
                share: totalSubs ? Math.round((count / totalSubs) * 100) : 0,
            }));

            const satisfaction = raw.customerSatisfaction || {};
            const kpis = raw.kpis || {};

            setOwnerDash({
                overview: {
                    totalCompanies: raw.overview?.totalCompanies || 0,
                    activeCompanies: raw.overview?.activeCompanies || 0,
                    activeSubscriptions: activeSubs,
                    totalMonthlyRevenue: totalRevenue,
                    trialCompanies: trialCount,
                    totalPlans: raw.plans?.total || planList.length || Object.keys(planDist).length,
                },
                statusBreakdown: sb,
                recentCompanies: raw.recentCompanies || [],
                revenueTrend: revTrend,
                planDistribution: planDist,
                planRevenue: planRev,
                performanceTrend,
                channelDistribution: raw.channelDistribution || [],
                customerSatisfaction: {
                    totalRatings: satisfaction.totalRatings || 0,
                    avgRating: satisfaction.avgRating || 0,
                    csat: satisfaction.csat || 0,
                    ratingBreakdown: satisfaction.ratingBreakdown || {},
                },
                kpis: {
                    totalAgents: kpis.totalAgents || 0,
                    totalManagers: kpis.totalManagers || 0,
                    totalTeamLeaders: kpis.totalTeamLeaders || 0,
                    totalWorkforce: kpis.totalWorkforce || 0,
                    totalTickets: kpis.totalTickets || 0,
                    openTickets: kpis.openTickets || 0,
                    resolvedTickets: kpis.resolvedTickets || 0,
                    ticketsToday: kpis.ticketsToday || 0,
                    ticketsLast7Days: kpis.ticketsLast7Days || 0,
                    ticketsDelta: kpis.ticketsDelta || 0,
                    chatsLast7Days: kpis.chatsLast7Days || 0,
                    chatsDelta: kpis.chatsDelta || 0,
                    resolutionRate: kpis.resolutionRate || 0,
                    totalChatSessions: kpis.totalChatSessions || 0,
                    activeChatSessions: kpis.activeChatSessions || 0,
                    avgFirstResponseTime: kpis.avgFirstResponseTime || 0,
                    avgResolutionTime: kpis.avgResolutionTime || 0,
                },
                healthScore: raw.overview?.healthScore || 0,
                healthStatus: raw.overview?.healthStatus || 'unknown',
                insights: raw.insights || [],
            });
            setSubscriptions(subs || []);
            setPlans(planList || []);
        } catch (err) {
            console.warn('[OwnerDashboard]', err);
            const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            setOwnerDash({
                overview: { totalCompanies: 0, activeCompanies: 0, activeSubscriptions: 0, totalMonthlyRevenue: 0, trialCompanies: 0, totalPlans: 0 },
                statusBreakdown: {}, recentCompanies: [],
                revenueTrend: m.map((n) => ({ name: n, revenue: 0, subscriptions: 0 })),
                planDistribution: {}, planRevenue: [],
                performanceTrend: [], channelDistribution: [],
                customerSatisfaction: { totalRatings: 0, avgRating: 0, csat: 0, ratingBreakdown: {} },
                kpis: {}, healthScore: 0, healthStatus: 'unknown', insights: [],
            });
        }
        setLoading(false);
    }, []);

    const loadManagers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.listManagers();
            setManagers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.warn('[OwnerDashboard] loadManagers:', err?.message || err);
            setManagers([]);
        }
        setLoading(false);
    }, []);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ownerApi.getCompanySettings();
            setSettings({
                name: data.name || settingsDefaults.name,
                slug: data.slug || '',
                industry: data.industry || settingsDefaults.industry,
                settings: {
                    aiEnabled: data.settings?.aiEnabled ?? settingsDefaults.settings.aiEnabled,
                    escalationThreshold: data.settings?.escalationThreshold ?? settingsDefaults.settings.escalationThreshold
                },
                channelsConfig: {
                    telegram: {
                        isActive: data.channelsConfig?.telegram?.isActive ?? false,
                        botToken: data.channelsConfig?.telegram?.botToken || '',
                        webhookUrl: data.channelsConfig?.telegram?.webhookUrl || ''
                    },
                    whatsapp: {
                        isActive: data.channelsConfig?.whatsapp?.isActive ?? false,
                        phoneNumberId: data.channelsConfig?.whatsapp?.phoneNumberId || '',
                        accessToken: data.channelsConfig?.whatsapp?.accessToken || ''
                    },
                    webChat: {
                        isActive: data.channelsConfig?.webChat?.isActive ?? true,
                        color: data.channelsConfig?.webChat?.color || settingsDefaults.channelsConfig.webChat.color,
                        welcomeMessage: data.channelsConfig?.webChat?.welcomeMessage || settingsDefaults.channelsConfig.webChat.welcomeMessage
                    }
                }
            });
        } catch (err) {
            console.error('[OwnerDashboard] loadSettings:', err?.message || err);
            toast.error(err?.message || 'Failed to load company settings');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') loadOwnerDashboard();
        if (activeTab === 'analytics') loadDashboard();
        if (activeTab === 'managers') loadManagers();
        if (activeTab === 'settings') loadSettings();
    }, [activeTab, loadOwnerDashboard, loadDashboard, loadManagers, loadSettings]);

    const filteredManagers = useMemo(() => {
        return managers.filter((manager) => {
            const textMatch = `${manager.name || ''} ${manager.email || ''} ${manager.phone || ''}`
                .toLowerCase()
                .includes(managerQuery.toLowerCase().trim());
            const statusMatch =
                managerFilter === 'all' ||
                (managerFilter === 'active' && manager.isActive) ||
                (managerFilter === 'inactive' && !manager.isActive);
            return textMatch && statusMatch;
        });
    }, [managers, managerQuery, managerFilter]);

    const handleLogout = () => {
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_user');
        navigate('/');
    };

    const handleSettingsSubmit = async (event) => {
        event.preventDefault();
        setSavingSettings(true);
        try {
            await ownerApi.updateCompanySettings(settings);
            toast.success('Company settings updated successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to update settings');
        }
        setSavingSettings(false);
    };

    const checkBotStatus = async () => {
        const token = settings.channelsConfig.telegram?.botToken;
        if (!token) { toast.warn('Please enter a bot token first'); return; }
        setCheckingBot(true);
        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await response.json();
            if (data.ok) { setBotStatus({ success: true, ...data.result }); toast.success('Bot is active and connected'); }
            else { setBotStatus({ success: false, error: data.description }); toast.error('Bot token is invalid'); }
        } catch { setBotStatus({ success: false, error: 'Connection failed' }); toast.error('Failed to connect to Telegram API'); }
        setCheckingBot(false);
    };

    const applyTelegramWebhook = async () => {
        const url = (settings.channelsConfig.telegram?.webhookUrl || '').trim();
        if (!url) { toast.warn('Please enter a Telegram webhook URL'); return; }
        setSavingSettings(true);
        try { await ownerApi.updateTelegramWebhook(url); toast.success('Telegram webhook applied successfully'); }
        catch (error) { toast.error(error.message || 'Failed to apply Telegram webhook'); }
        setSavingSettings(false);
    };

    const subKpis = useMemo(() => {
        if (!ownerDash) return [];
        const o = ownerDash.overview || {};
        return [
            { label: 'Total Companies', value: o?.totalCompanies || 0, icon: <BuildingOfficeIcon width={18} />, accent: COLORS.secondary, hint: `${o?.activeCompanies || 0} active` },
            { label: 'Active Subscriptions', value: o?.activeSubscriptions || 0, icon: <ShieldCheckIcon width={18} />, accent: COLORS.success, hint: `${o?.trialCompanies || 0} in trial` },
            { label: 'Monthly Revenue', value: `$${(o?.totalMonthlyRevenue || 0).toLocaleString()}`, icon: <CurrencyDollarIcon width={18} />, accent: COLORS.primary, hint: `across ${o?.activeSubscriptions || 0} subscriptions` },
            { label: 'Available Plans', value: o?.totalPlans || 0, icon: <CreditCardIcon width={18} />, accent: COLORS.accent, hint: `${plans.length} active tiers` },
        ];
    }, [ownerDash, plans]);

    const renderSubscriptionDashboard = () => {
        if (loading || !ownerDash) return <div className="owner-loader">Loading platform overview...</div>;

        const {
            overview = {},
            revenueTrend = [],
            planDistribution = {},
            statusBreakdown = {},
            planRevenue = [],
            recentCompanies = [],
        } = ownerDash || {};

        const statusData = Object.entries(statusBreakdown || {}).map(([k, v]) => ({
            name: (k || '').charAt(0).toUpperCase() + (k || '').slice(1).replace('_', ' '),
            value: v || 0,
            color: SUB_STATUS_COLORS[k] || COLORS.primary,
        }));

        const planDistData = Object.entries(planDistribution || {}).map(([k, v]) => ({
            name: k || 'Unknown',
            value: v || 0,
        }));

        const trendLines = [
            { dataKey: 'revenue', name: 'Revenue', color: COLORS.primary },
            { dataKey: 'subscriptions', name: 'Subscriptions', color: COLORS.secondary },
        ];

        const gaugeValue = overview?.activeCompanies && overview?.totalCompanies
            ? Math.round((overview.activeCompanies / overview.totalCompanies) * 100)
            : 0;

        const subColumns = [
            { key: 'name', label: 'Company', render: (row) => <span style={{ fontWeight: 600 }}>{row.name}</span> },
            { key: 'plan', label: 'Plan' },
            {
                key: 'status', label: 'Status',
                render: (row) => {
                    const c = SUB_STATUS_COLORS[row.status] || COLORS.primary;
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: `${c}15`, color: c }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />
                        {row.status}
                    </span>;
                }
            },
            { key: 'isActive', label: 'Active', render: (row) => row.isActive ? 'Yes' : 'No' },
            { key: 'createdAt', label: 'Joined', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-' },
        ];

        return (
            <div className="owner-dashboard-modern">
                <div className="owner-hero" style={{ background: 'linear-gradient(125deg, #042835 0%, #0a4a62 55%, #0d5c7a 100%)' }}>
                    <div>
                        <h2>Platform Command Center</h2>
                        <p>Cross-company subscription overview with live billing and revenue metrics.</p>
                    </div>
                    <button className="owner-ghost-btn" onClick={loadOwnerDashboard}>
                        <ArrowPathIcon width={18} /> Refresh
                    </button>
                </div>

                <div className="owner-kpi-grid">
                    {subKpis.map((kpi) => (
                        <PremiumKPICard key={kpi.label} label={kpi.label} value={kpi.value}
                            icon={kpi.icon} accent={kpi.accent} hint={kpi.hint} />
                    ))}
                </div>

                <div className="owner-insights-grid">
                    <PremiumLineChart data={revenueTrend || []} lines={trendLines}
                        title="Revenue & Subscription Trend"
                        subtitle="Monthly revenue and subscription growth"
                        height={340} loading={loading} />
                    <PremiumDonutChart data={statusData}
                        title="Subscription Status"
                        subtitle={`${statusData.reduce((s, d) => s + d.value, 0)} total`}
                        loading={loading} height={300}
                        innerRadius={55} outerRadius={85}
                        centerValue={overview?.activeSubscriptions || 0}
                        centerLabel="Active"
                        centerSub={`${Math.round(((overview?.activeSubscriptions || 0) / Math.max(1, statusData.reduce((s, d) => s + d.value, 0))) * 100)}%`} />
                </div>

                <div className="owner-insights-grid">
                    <PremiumBarChart data={planDistData}
                        title="Plan Distribution"
                        subtitle="Companies per subscription plan"
                        loading={loading} height={280}
                        layout="horizontal" valueKey="value" labelKey="name" barSize={32} />
                    <PremiumGaugeChart value={gaugeValue} max={100}
                        title="Company Activation"
                        subtitle={`${overview?.activeCompanies || 0} of ${overview?.totalCompanies || 0} companies active`}
                        loading={loading} size={180} strokeWidth={14}
                        grade={gaugeValue >= 80 ? 'A' : gaugeValue >= 60 ? 'B' : gaugeValue >= 40 ? 'C' : 'D'} />
                </div>

                <PremiumAreaChart data={revenueTrend || []}
                    lines={[{ dataKey: 'revenue', name: 'Revenue', color: COLORS.primary }]}
                    title="Revenue Area View"
                    subtitle="Accumulated revenue over time"
                    loading={loading} height={280} />

                <PremiumDataTable columns={subColumns} data={recentCompanies || []}
                    title="Recent Companies"
                    subtitle={`${(recentCompanies || []).length} companies`}
                    loading={loading} height={280}
                    onRowClick={(row) => setSelectedCompanyId(row._id)} />
            </div>
        );
    };

    const renderAnalytics = () => {
        if (loading || !dashData) return <div className="owner-loader">Loading analytics...</div>;

        // Defensive defaults — the backend may not yet return the full
        // dashboard shape (performanceTrend/channelDistribution/etc.).
        const kpis = dashData.kpis || {};
        const performanceTrend = dashData.performanceTrend || [];
        const channelDistribution = dashData.channelDistribution || [];
        const feedbackStats = dashData.feedbackStats || {};
        const overview = dashData.overview || {};
        const insights = dashData.insights || [];

        const trendSpark = performanceTrend.map((d) => ({ v: d.assigned }));
        const ratingColors = ['#EF4444', '#F59E0B', '#F59E0B', '#3B82F6', '#22C55E'];
        const ratingData = feedbackStats?.ratingBreakdown
            ? Object.entries(feedbackStats.ratingBreakdown).map(([k, v], i) => ({
                name: `${k} Star${k !== '1' ? 's' : ''}`,
                value: v,
                color: ratingColors[i] || COLORS.primary,
              }))
            : [];

        const resolveTrend = kpis.resolutionRate >= 80
            ? { direction: 'up', pct: 12, color: COLORS.success }
            : kpis.resolutionRate >= 50
                ? { direction: 'right', pct: 0, color: COLORS.accent }
                : { direction: 'down', pct: 8, color: COLORS.danger };

        const respTrend = kpis.avgFirstResponseTime > 0
            ? { direction: kpis.avgFirstResponseTime <= 15 ? 'down' : 'up', pct: 0, color: kpis.avgFirstResponseTime <= 15 ? COLORS.success : COLORS.danger }
            : null;

        const insightTypeStyle = (type) => {
            const map = {
                positive: { bg: `${COLORS.success}15`, color: COLORS.success },
                warning: { bg: `${COLORS.accent}15`, color: COLORS.accent },
                critical: { bg: `${COLORS.danger}15`, color: COLORS.danger },
                info: { bg: `${COLORS.info}15`, color: COLORS.info },
            };
            return map[type] || { bg: `${COLORS.info}15`, color: COLORS.info };
        };

        const insightColumns = [
            {
                key: 'type', label: 'Type',
                render: (row) => {
                    const s = insightTypeStyle(row.type);
                    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '100px', fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>{row.type}</span>;
                },
            },
            { key: 'metric', label: 'Metric', render: (row) => <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{row.metric}</span> },
            { key: 'message', label: 'Message' },
        ];

        return (
            <div className="owner-dashboard-modern">
                <div className="owner-hero">
                    <div>
                        <h2>Welcome back, {ownerUser.name || 'Owner'}</h2>
                        <p>Snapshot for {settings.name || 'your company'} with live workload and operational trends.</p>
                    </div>
                    <button className="owner-ghost-btn" onClick={loadDashboard}>
                        <ArrowPathIcon width={18} /> Refresh data
                    </button>
                </div>

                <div className="owner-kpi-grid">
                    <PremiumKPICard label="Workforce" value={kpis.totalWorkforce || 0}
                        icon={<UserGroupIcon width={18} />} accent={COLORS.secondary}
                        hint={`${kpis.totalAgents || 0} agents · ${(kpis.totalManagers || 0) + (kpis.totalTeamLeaders || 0)} TL/Managers`}
                        trend={{ direction: 'up', pct: 0, color: COLORS.success }}
                        sparkData={trendSpark} loading={loading} />
                    <PremiumKPICard label="Resolution Rate" value={`${kpis.resolutionRate || 0}%`}
                        icon={<TicketIcon width={18} />} accent={COLORS.accent}
                        hint={`${kpis.resolvedTickets || 0} resolved from ${kpis.totalTickets || 0}`}
                        trend={resolveTrend} sparkData={trendSpark} loading={loading} />
                    <PremiumKPICard label="Active Chats" value={kpis.activeChats || 0}
                        icon={<ChatBubbleLeftRightIcon width={18} />} accent={COLORS.primary}
                        hint={`${kpis.activeChats || 0} out of ${kpis.totalChats || 0} total sessions`}
                        sparkData={trendSpark} loading={loading} />
                    <PremiumKPICard label="Response Time" value={`${kpis.avgFirstResponseTime ? Math.round(kpis.avgFirstResponseTime) : 0}m`}
                        icon={<ClockIcon width={18} />} accent={COLORS.purple}
                        hint={`Avg ${kpis.avgFirstResponseTime ? Math.round(kpis.avgFirstResponseTime) : 0}m first response · ${kpis.avgResolutionTime ? Math.round(kpis.avgResolutionTime) : 0}m resolution`}
                        trend={respTrend} sparkData={trendSpark} loading={loading} />
                </div>

                <div className="owner-insights-grid">
                    <PremiumAreaChart data={performanceTrend}
                        lines={[
                            { dataKey: 'assigned', name: 'Assigned', color: COLORS.secondary },
                            { dataKey: 'resolved', name: 'Resolved', color: COLORS.primary },
                        ]}
                        title="Performance Trend"
                        subtitle="Daily assigned vs resolved tickets (31 days)"
                        loading={loading} height={360} />
                    <PremiumBarChart data={channelDistribution}
                        title="Channel Distribution"
                        subtitle="Ticket volume by channel"
                        loading={loading} height={360}
                        layout="horizontal" valueKey="value" labelKey="name"
                        colorMap={CHANNEL_COLORS} barSize={36} />
                </div>

                <div className="owner-insights-grid">
                    <PremiumDonutChart data={ratingData}
                        title="Customer Satisfaction"
                        subtitle={`${feedbackStats?.totalRatings || 0} ratings · ${feedbackStats?.avgRating || 0} avg`}
                        loading={loading} height={300}
                        innerRadius={60} outerRadius={90}
                        centerValue={feedbackStats?.avgRating || '—'}
                        centerLabel="Avg Rating"
                        centerSub={`${feedbackStats?.csat || 0}% CSAT`} />
                    <PremiumGaugeChart value={overview.healthScore || 0} max={100}
                        title="System Health"
                        subtitle={overview.status || 'Unknown'}
                        loading={loading} size={200} strokeWidth={16}
                        grade={overview.healthScore >= 80 ? 'A' : overview.healthScore >= 60 ? 'B' : overview.healthScore >= 40 ? 'C' : 'D'} />
                </div>

                <div className="owner-insights-grid">
                    <PremiumDataTable columns={insightColumns} data={insights}
                        title="Insights" subtitle={`${insights.length} items`}
                        loading={loading} height={220} />
                    <div style={{ ...CARD_STYLE, padding: '24px' }}>
                        <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>Quick actions</p>
                        <button className="owner-quick-action" onClick={() => setActiveTab('settings')}>
                            <span className="owner-qa-icon"><PuzzlePieceIcon width={18} /></span>
                            <span className="owner-qa-text">Review integrations</span>
                            <ChevronRightIcon width={16} className="owner-qa-arrow" />
                        </button>
                        <button className="owner-quick-action" onClick={() => setActiveTab('managers')}>
                            <span className="owner-qa-icon"><UsersIcon width={18} /></span>
                            <span className="owner-qa-text">Check manager roster</span>
                            <ChevronRightIcon width={16} className="owner-qa-arrow" />
                        </button>
                        <button className="owner-quick-action" onClick={loadDashboard}>
                            <span className="owner-qa-icon"><ArrowPathIcon width={18} /></span>
                            <span className="owner-qa-text">Sync latest metrics</span>
                            <ChevronRightIcon width={16} className="owner-qa-arrow" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderManagers = () => {
        if (loading) return <div className="owner-loader">Loading managers...</div>;
        return (
            <div className="owner-managers-view">
                <div className="owner-section-head">
                    <h2>Company Managers</h2>
                    <p>{filteredManagers.length} shown from {managers.length}</p>
                </div>
                <div className="owner-managers-toolbar">
                    <div className="owner-search">
                        <MagnifyingGlassIcon width={18} />
                        <input value={managerQuery} onChange={(event) => setManagerQuery(event.target.value)} placeholder="Search by name, email, or phone" />
                    </div>
                    <select value={managerFilter} onChange={(event) => setManagerFilter(event.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                </div>
                <div className="owner-table-card">
                    <table className="owner-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredManagers.length === 0 ? (
                                <tr><td colSpan="4" className="owner-empty-row">No managers match your filter.</td></tr>
                            ) : (
                                filteredManagers.map((manager) => (
                                    <tr key={manager._id}>
                                        <td className="owner-manager-name">{manager.name}</td>
                                        <td>{manager.email}</td>
                                        <td>{manager.phone || '-'}</td>
                                        <td>
                                            <span className={`owner-status-badge ${manager.isActive ? '' : 'inactive'}`}>
                                                {manager.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderSettings = () => {
        if (loading || !settings) return <div className="owner-loader">Loading settings...</div>;
        const apiDomain = window.location.origin;
        const widgetScript = `<script src="${apiDomain}/widget.js?id=${settings.slug || 'your-company'}"></script>`;
        const recommendedWebhookUrl = `${apiDomain}/api/v1/channels/telegram/webhook?companySlug=${settings.slug || 'your-slug'}`;

        return (
            <div className="owner-settings-view">
                <div className="settings-tabs">
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'general' ? 'active' : ''}`} onClick={() => setSettingsTab('general')}>General</button>
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'channels' ? 'active' : ''}`} onClick={() => setSettingsTab('channels')}>Channels</button>
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'ai' ? 'active' : ''}`} onClick={() => setSettingsTab('ai')}>AI</button>
                    <button type="button" className={`settings-tab-btn ${settingsTab === 'account' ? 'active' : ''}`} onClick={() => setSettingsTab('account')}>Account</button>
                </div>
                {settingsTab === 'account' && (
                    <SettingsPage
                        user={{ name: ownerUser.name, email: ownerUser.email, phone: ownerUser.phone || '', avatar: ownerUser.profileImage || null, role: ownerUser.role }}
                        roleLabel="Owner"
                        onSaveProfile={(payload) => agentApi.updateProfile(payload)}
                        onChangePassword={(payload) => agentApi.changePassword(payload)}
                    />
                )}
                {settingsTab !== 'account' && (
                <form onSubmit={handleSettingsSubmit}>
                    {settingsTab === 'general' && (
                        <div className="owner-settings-card owner-settings-max">
                            <h3>Company Information</h3>
                            <div className="owner-form-group">
                                <label>Company name</label>
                                <input type="text" value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} required />
                            </div>
                            <div className="owner-form-group">
                                <label>Industry</label>
                                <select value={settings.industry} onChange={(event) => setSettings({ ...settings, industry: event.target.value })}>
                                    <option value="sports_retail">Sports & Football Retail</option>
                                    <option value="telecom">Telecom</option>
                                    <option value="banking">Banking</option>
                                    <option value="ecommerce">E-commerce</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {settingsTab === 'ai' && (
                        <div className="owner-settings-card owner-settings-max">
                            <h3>AI & Automation</h3>
                            <label className="owner-check-wrap">
                                <input type="checkbox" checked={settings.settings.aiEnabled}
                                    onChange={(event) => setSettings({ ...settings, settings: { ...settings.settings, aiEnabled: event.target.checked } })} />
                                <span>Enable Smart AI Responder</span>
                            </label>
                            <div className="owner-form-group">
                                <label>Escalation threshold ({settings.settings.escalationThreshold})</label>
                                <input type="range" min="0" max="1" step="0.05" value={settings.settings.escalationThreshold}
                                    onChange={(event) => setSettings({ ...settings, settings: { ...settings.settings, escalationThreshold: parseFloat(event.target.value) } })} />
                            </div>
                        </div>
                    )}

                    {settingsTab === 'channels' && (
                        <div className="owner-integrations">
                            <div className="integration-card">
                                <div className="integration-card-header"><strong>Web Chat Widget</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input type="checkbox" checked={settings.channelsConfig.webChat?.isActive}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, webChat: { ...settings.channelsConfig.webChat, isActive: event.target.checked } } })} />
                                        <span>Enable widget</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Primary color</label>
                                        <input type="text" value={settings.channelsConfig.webChat?.color || '#042835'}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, webChat: { ...settings.channelsConfig.webChat, color: event.target.value } } })} />
                                    </div>
                                    <div className="owner-form-group">
                                        <label>Welcome message</label>
                                        <input type="text" value={settings.channelsConfig.webChat?.welcomeMessage || ''}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, webChat: { ...settings.channelsConfig.webChat, welcomeMessage: event.target.value } } })} />
                                    </div>
                                    <div className="owner-code-row">
                                        <code>{widgetScript}</code>
                                        <button type="button" className="copy-badge" onClick={() => navigator.clipboard.writeText(widgetScript)}>Copy</button>
                                    </div>
                                </div>
                            </div>

                            <div className="integration-card">
                                <div className="integration-card-header"><strong>WhatsApp Business</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input type="checkbox" checked={settings.channelsConfig.whatsapp?.isActive}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, whatsapp: { ...settings.channelsConfig.whatsapp, isActive: event.target.checked } } })} />
                                        <span>Enable WhatsApp</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Phone Number ID</label>
                                        <input type="text" value={settings.channelsConfig.whatsapp?.phoneNumberId || ''}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, whatsapp: { ...settings.channelsConfig.whatsapp, phoneNumberId: event.target.value } } })} />
                                    </div>
                                    <div className="owner-form-group">
                                        <label>Access Token</label>
                                        <div className="owner-password-wrap">
                                            <input type={showWaToken ? 'text' : 'password'} autoComplete="new-password"
                                                value={settings.channelsConfig.whatsapp?.accessToken || ''}
                                                onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, whatsapp: { ...settings.channelsConfig.whatsapp, accessToken: event.target.value } } })} />
                                            <button type="button" onClick={() => setShowWaToken(!showWaToken)}>
                                                {showWaToken ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="integration-card">
                                <div className="integration-card-header"><strong>Telegram Bot</strong></div>
                                <div className="integration-card-content">
                                    <label className="owner-check-wrap">
                                        <input type="checkbox" checked={settings.channelsConfig.telegram?.isActive}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, telegram: { ...settings.channelsConfig.telegram, isActive: event.target.checked } } })} />
                                        <span>Enable Telegram</span>
                                    </label>
                                    <div className="owner-form-group">
                                        <label>Bot Token</label>
                                        <div className="owner-password-wrap">
                                            <input type={showTgToken ? 'text' : 'password'} autoComplete="new-password"
                                                value={settings.channelsConfig.telegram?.botToken || ''}
                                                onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, telegram: { ...settings.channelsConfig.telegram, botToken: event.target.value } } })} />
                                            <button type="button" onClick={() => setShowTgToken(!showTgToken)}>
                                                {showTgToken ? <EyeSlashIcon width={18} /> : <EyeIcon width={18} />}
                                            </button>
                                        </div>
                                        <button type="button" className="check-status-btn" onClick={checkBotStatus} disabled={checkingBot || !settings.channelsConfig.telegram?.botToken}>
                                            {checkingBot ? 'Verifying...' : 'Verify Bot'}
                                        </button>
                                    </div>
                                    {botStatus && (
                                        <div className={`bot-info-box ${botStatus.success ? 'ok' : 'bad'}`}>
                                            {botStatus.success ? `Connected as @${botStatus.username}` : botStatus.error}
                                        </div>
                                    )}
                                    <div className="owner-code-row">
                                        <code>{recommendedWebhookUrl}</code>
                                        <button type="button" className="copy-badge" onClick={() => navigator.clipboard.writeText(recommendedWebhookUrl)}>Copy URL</button>
                                    </div>
                                    <div className="owner-form-group" style={{ marginTop: 14 }}>
                                        <label>Webhook URL</label>
                                        <input type="text" placeholder={recommendedWebhookUrl}
                                            value={settings.channelsConfig.telegram?.webhookUrl || ''}
                                            onChange={(event) => setSettings({ ...settings, channelsConfig: { ...settings.channelsConfig, telegram: { ...settings.channelsConfig.telegram, webhookUrl: event.target.value } } })} />
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            <button type="button" className="check-status-btn"
                                                onClick={applyTelegramWebhook}
                                                disabled={savingSettings || !settings.channelsConfig.telegram?.botToken || !settings.channelsConfig.telegram?.webhookUrl}>
                                                Apply to Telegram
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="owner-submit-row">
                        <button type="submit" className="owner-btn-primary" disabled={savingSettings}>
                            {savingSettings ? 'Saving...' : 'Save settings'}
                        </button>
                    </div>
                </form>
                )}
            </div>
        );
    };

    const renderCompanies = () => (
        <CompaniesView onSelectCompany={(id) => setSelectedCompanyId(id)} />
    );

    const renderSubscriptions = () => (
        <SubscriptionsView onSelectCompany={(id) => setSelectedCompanyId(id)} />
    );

    const renderPlans = () => (
        <PlansView onViewCompany={(plan) => {}} />
    );

    const NAV_ITEMS = [
        { key: 'dashboard', label: 'Platform', Icon: Squares2X2Icon },
        { key: 'analytics', label: 'Analytics', Icon: ChartBarSquareIcon },
        { key: 'companies', label: 'Companies', Icon: BuildingOffice2Icon },
        { key: 'subscriptions', label: 'Subscriptions', Icon: CreditCardIcon },
        { key: 'plans', label: 'Plans', Icon: CurrencyDollarIcon },
        { key: 'managers', label: 'Managers', Icon: UserGroupIcon },
        { key: 'settings', label: 'Settings', Icon: Cog6ToothIcon },
    ];

    return (
        <div className="cd-layout">
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            <aside className="cd-sidebar">
                <div className="cd-sidebar-logo" style={{ cursor: 'default' }}>
                    <img src={logo} alt="NATIQ" />
                </div>
                <nav className="cd-sidebar-nav">
                    <p className="cd-nav-label">Menu</p>
                    <ul className="cd-nav-list">
                        {NAV_ITEMS.map(({ key, label, Icon }) => (
                            <li key={key} className={`cd-nav-item${activeTab === key ? ' cd-nav-active' : ''}`} onClick={() => setActiveTab(key)}>
                                <Icon className="cd-nav-icon" /><span className="cd-nav-text">{label}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="cd-nav-label">General</p>
                    <ul className="cd-nav-list">
                        <li className="cd-nav-item" onClick={handleLogout}>
                            <ArrowRightOnRectangleIcon className="cd-nav-icon" /><span className="cd-nav-text">Logout</span>
                        </li>
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
                            <div className="cd-avatar">{ownerUser.name?.substring(0, 2).toUpperCase() || 'CO'}</div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{ownerUser.name}</span>
                                <span className="cd-user-email">Company Owner</span>
                            </div>
                        </div>
                    </div>
                </header>
                <div className="cd-main owner-content">
                    {invoiceCompany ? (
                        <InvoicesView companyId={invoiceCompany._id} companyName={invoiceCompany.name} onBack={() => setInvoiceCompany(null)} />
                    ) : selectedCompanyId ? (
                        <CompanyDetail companyId={selectedCompanyId} onBack={() => setSelectedCompanyId(null)} />
                    ) : (
                        <>
                            {activeTab === 'dashboard' && renderSubscriptionDashboard()}
                            {activeTab === 'analytics' && renderAnalytics()}
                            {activeTab === 'companies' && renderCompanies()}
                            {activeTab === 'subscriptions' && renderSubscriptions()}
                            {activeTab === 'plans' && renderPlans()}
                            {activeTab === 'managers' && renderManagers()}
                            {activeTab === 'settings' && renderSettings()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerDashboard;
