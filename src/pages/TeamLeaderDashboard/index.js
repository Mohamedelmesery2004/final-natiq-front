import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { teamLeaderApi } from "../../services/teamLeaderApi";
import { agentApi } from "../../services/agentApi";
import SettingsPage from "../../components/common/SettingsPage";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { useDashboardData } from "./useDashboardData";
import StatsCards from "./components/StatsCards";
import CallPerformanceSection from "./components/CallPerformanceSection";
import TrendChart from "./components/TrendChart";
import ChannelDistribution from "./components/ChannelDistribution";
import TicketGoal from "./components/TicketGoal";
import AgentsTable from "./components/AgentsTable";
import Insights from "./components/Insights";
import Suggestions from "./components/Suggestions";
import HeatmapSection from "./components/HeatmapSection";
import TeamScoreSection from "./components/TeamScoreSection";
import SLASection from "./components/SLASection";
import WorkloadSection from "./components/WorkloadSection";
import TopAgents from "./components/TopAgents";
import LowPerformers from "./components/LowPerformers";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
    Squares2X2Icon,
    UserGroupIcon,
    QueueListIcon,
    ArrowUpRightIcon,
    ChevronDownIcon,
    StarIcon,
    TicketIcon,
    PhoneIcon,
    ChatBubbleLeftRightIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
    PlayCircleIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    CheckCircleIcon,
    UserCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    BellAlertIcon,
} from "@heroicons/react/24/outline";
import PremiumKPICard from "../../components/charts/PremiumKPICard";
import PremiumLineChart from "../../components/charts/PremiumLineChart";
import PremiumBarChart from "../../components/charts/PremiumBarChart";
import PremiumHeatmapGrid from "../../components/charts/PremiumHeatmapGrid";
import PremiumGaugeChart from "../../components/charts/PremiumGaugeChart";
import { THEME, COLORS, CARD_STYLE } from "../../components/charts/ChartTheme";
import logo from "../../assets/logo.png";
import "../NatiqDashboard/NatiqDashboard.css";

function getAgentUser() {
    try {
        const raw = localStorage.getItem("agent_user");
        if (raw) {
            const u = JSON.parse(raw);
            const nameParts = (u.name || "Supervisor").split(" ");
            const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
            return {
                name: u.name || "Supervisor",
                email: u.email || "",
                initials,
                avatar: u.profileImage || null,
                id: u._id || u.id || null,
            };
        }
    } catch (e) { /* ignore */ }
    return { name: "Supervisor", email: "", initials: "SV", avatar: null, id: null };
}

const MENU_KEYS = [
    { key: "Dashboard", Icon: Squares2X2Icon },
    { key: "Team", Icon: UserGroupIcon },
    { key: "Queue", Icon: QueueListIcon },
    { key: "Tickets", Icon: TicketIcon },
    { key: "Calls", Icon: PhoneIcon },
];

const GENERAL_KEYS = [
    { key: "Profile", Icon: UserCircleIcon },
    { key: "Logout", Icon: ArrowRightOnRectangleIcon },
];



// ─────────────────────────────────────────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView({ data, loading, error, onSelectAgent }) {
    const tlUser = getAgentUser();

    if (error) {
        return (
            <div className="cd-bento-layout">
                <div className="cd-bento-header">
                    <div>
                        <h1>Dashboard Error</h1>
                        <p>Something went wrong loading your dashboard.</p>
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid #fee2e2', color: '#dc2626', fontSize: '14px', textAlign: 'center' }}>
                    {error}
                </div>
            </div>
        );
    }

    if (loading || !data) {
        return (
            <div className="cd-bento-layout">
                <div className="cd-bento-header">
                    <div>
                        <h1>Welcome back, {tlUser.name.split(" ")[0]}!</h1>
                        <p>Loading your dashboard...</p>
                    </div>
                    <div className="cd-bento-date">
                        {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="cd-stat-card" style={{ height: '140px', animation: 'pulse 1.5s infinite', background: '#f0f2f5' }} />
                    ))}
                </div>
                <div style={{ height: '200px', marginTop: '16px', borderRadius: '22px', background: '#f0f2f5', animation: 'pulse 1.5s infinite' }} />
            </div>
        );
    }

    const { teamStats, kpis, goals, callPerformance, channelDistribution, agentsPerformance, topAgents, lowPerformers, workload, sla, insights, suggestions, trendData, heatmap, teamScore, callsPerHour } = data;

    return (
        <div className="cd-bento-layout" style={{ gap: 24 }}>
            {/* ── Welcome Header ── */}
            <div className="cd-bento-header">
                <div>
                    <h1>Welcome back, {tlUser.name.split(" ")[0]}!</h1>
                    <p>Here is what's happening with your team's tasks today.</p>
                </div>
                <div className="cd-bento-date">
                    {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* ════ 1. PEOPLE — Agents table + Top / Low performers (FIRST) ════ */}
            <div className="cd-tl-people-grid">
                <AgentsTable agents={agentsPerformance} onSelectAgent={onSelectAgent} />
                <div className="cd-dashboard-agents-grid">
                    <TopAgents topAgents={topAgents} loading={loading} />
                    <LowPerformers lowPerformers={lowPerformers} loading={loading} />
                </div>
            </div>

            {/* ════ 2. TRENDS + TEAM SCORE — performance trend beside team score ════ */}
            <div className="cd-tl-trend-score">
                <TrendChart trendData={trendData} loading={loading} />
                <TeamScoreSection teamScore={teamScore} loading={loading} />
            </div>

            {/* ════ 3. CHANNELS + SLA (stacked) beside HEATMAP ════ */}
            <div className="cd-tl-channels-heatmap">
                <div className="cd-tl-channels-col">
                    <ChannelDistribution channelDistribution={channelDistribution} loading={loading} />
                    <SLASection sla={sla} loading={loading} />
                </div>
                <HeatmapSection heatmap={heatmap} callsPerHour={callsPerHour} loading={loading} />
            </div>

            {/* ════ 4. TEAM PULSE — KPIs ════ */}
            <StatsCards teamStats={teamStats} kpis={kpis} trendData={trendData} loading={loading} />

            {/* ════ 5. CALLS — call performance (full width) ════ */}
            <CallPerformanceSection callPerformance={callPerformance} callsPerHour={callsPerHour} loading={loading} />

            {/* ════ 6. WORKLOAD + TICKET GOAL — side by side ════ */}
            <div className="cd-tl-workload-goal">
                <WorkloadSection workload={workload} loading={loading} />
                <TicketGoal goals={goals} kpis={kpis} loading={loading} />
            </div>

            {/* ════ 7. ACTION — Insights · Suggestions (LAST) ════ */}
            <div className="cd-dashboard-insights-grid">
                <Insights insights={insights} />
                <Suggestions suggestions={suggestions} />
            </div>
        </div>
    );
}

function NotificationModal({ agent, onClose, onSent }) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) return;
        
        setLoading(true);
        try {
            await teamLeaderApi.notifyAgent(agent._id, { title, message, type });
            alert("Notification sent to " + agent.name);
            onSent();
        } catch (e) {
            console.error(e);
            alert("Failed to send notification: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(4, 40, 53, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#042835', margin: 0 }}>Notify {agent.name}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#97a3b6' }}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#667085', marginBottom: '8px' }}>Title</label>
                        <input 
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Performance Update"
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#667085', marginBottom: '8px' }}>Message</label>
                        <textarea 
                            required
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', resize: 'none' }}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#667085', marginBottom: '8px' }}>Level</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['info', 'success', 'warning', 'error'].map(t => (
                                <button 
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    style={{ 
                                        padding: '8px 12px', 
                                        borderRadius: '8px', 
                                        border: type === t ? '2px solid #042835' : '1px solid #e2e8f0',
                                        background: type === t ? '#f1f5f9' : '#fff',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            type="button" 
                            onClick={onClose}
                            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', fontWeight: '600', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#042835', color: '#CAF301', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Sending...' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TeamView({ agents, loading, onSelectAgent }) {
    const [notifyingAgent, setNotifyingAgent] = useState(null);

    if (loading) {
        return (
            <div className="cd-bento-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="cd-spinner" />
            </div>
        );
    }
    if (!agents.length) {
        return (
            <div className="cd-bento-layout">
                <div className="cd-bento-header">
                    <div>
                        <h1>Team Members</h1>
                        <p>No agents are assigned to your team yet.</p>
                    </div>
                </div>
                <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid #e6e9ed', color: '#667085', fontSize: 14, lineHeight: 1.6 }}>
                    Ask your company manager to assign agents to you.
                </div>
            </div>
        );
    }
    return (
        <div className="cd-bento-layout">
             <div className="cd-bento-header">
                <div>
                    <h1>Team Members</h1>
                    <p>Monitor your agents' active workloads.</p>
                </div>
            </div>

            {/* Simple grid for agents */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {agents.map(agent => (
                    <div key={agent._id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e6e9ed', padding: '24px', transition: 'box-shadow 0.2s', position: 'relative' }} 
                         onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 24px rgba(4, 40, 53, 0.05)'}
                         onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', cursor: 'pointer' }} onClick={() => onSelectAgent(agent)}>
                            <div className="cd-tkt-avatar cd-tkt-avatar-active" style={{ width: '48px', height: '48px', fontSize: '18px', background: '#042835', color: '#fff' }}>
                                {agent.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '16px', fontWeight: '600', color: '#042835', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.name}</p>
                                <p style={{ fontSize: '13px', color: '#97a3b6', margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.email}</p>
                            </div>
                            <div>
                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: agent.isOnline ? '#25D366' : '#FF4B4B' }} title={agent.isOnline ? 'Online' : 'Offline'}></span>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #f0f2f5', paddingTop: '16px' }}>
                            <div onClick={() => onSelectAgent(agent)} style={{ cursor: 'pointer' }}>
                                <p style={{ fontSize: '12px', color: '#97a3b6', margin: '0 0 4px 0' }}>Active Tickets</p>
                                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#042835', margin: 0 }}>{agent.activeTickets}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setNotifyingAgent(agent)}
                                    style={{ background: '#f1f5f9', padding: '6px 12px', border: 'none', borderRadius: '8px', color: '#042835', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    Notify
                                </button>
                                <button 
                                    onClick={() => onSelectAgent(agent)}
                                    style={{ background: 'transparent', padding: '0', border: 'none', color: '#137c9f', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {notifyingAgent && (
                <NotificationModal 
                    agent={notifyingAgent} 
                    onClose={() => setNotifyingAgent(null)} 
                    onSent={() => setNotifyingAgent(null)} 
                />
            )}
        </div>
    );
}

function QueueManagementView({ agents }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [assigningTo, setAssigningTo] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);

    const fetchUnassigned = useCallback(async () => {
        setLoading(true);
        try {
            const data = await teamLeaderApi.getUnassignedQueue();
            setTickets(data.tickets || []);
        } catch (e) {
            console.error("Error fetching queue", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUnassigned();
    }, [fetchUnassigned]);

    const handleAssign = async () => {
        if (!assigningTo || selectedTickets.length === 0) return;
        setIsAssigning(true);
        try {
            await teamLeaderApi.bulkAssignTickets(selectedTickets, assigningTo);
            alert("Tickets assigned successfully!");
            setSelectedTickets([]);
            setAssigningTo("");
            fetchUnassigned();
        } catch (e) {
            console.error(e);
            alert("Failed to assign tickets");
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleTicket = (id) => {
        setSelectedTickets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    return (
        <div className="cd-bento-layout">
            <div className="cd-bento-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Queue Management</h1>
                    <p>Assign pending tickets to available agents.</p>
                </div>
                {selectedTickets.length > 0 && (
                     <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: '500' }}>{selectedTickets.length} Selected</span>
                         <select 
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                            value={assigningTo} 
                            onChange={(e) => setAssigningTo(e.target.value)}
                         >
                             <option value="">Select Agent...</option>
                             {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.activeTickets} active)</option>)}
                         </select>
                         <button 
                            style={{ padding: '8px 16px', background: '#042835', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer', opacity: (!assigningTo || isAssigning) ? 0.7 : 1 }}
                            disabled={!assigningTo || isAssigning}
                            onClick={handleAssign}
                         >
                             Assign
                         </button>
                     </div>
                )}
            </div>

            {loading ? (
                <div className="cd-spinner" />
            ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e6e9ed', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e6e9ed', fontSize: '13px', color: '#6b7280' }}>
                            <tr>
                                <th style={{ padding: '16px' }} width="50"><input type="checkbox" onChange={(e) => setSelectedTickets(e.target.checked ? tickets.map(t => t._id) : [])} checked={selectedTickets.length === tickets.length && tickets.length > 0}/></th>
                                <th style={{ padding: '16px' }}>Ticket #</th>
                                <th style={{ padding: '16px' }}>Customer</th>
                                <th style={{ padding: '16px' }}>Channel</th>
                                <th style={{ padding: '16px' }}>Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No unassigned tickets found.</td>
                                </tr>
                            ) : tickets.map(t => (
                                <tr key={t._id} style={{ borderBottom: '1px solid #e6e9ed', fontSize: '14px' }}>
                                    <td style={{ padding: '16px' }}><input type="checkbox" checked={selectedTickets.includes(t._id)} onChange={() => toggleTicket(t._id)} /></td>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>#{t.ticketNumber}</td>
                                    <td style={{ padding: '16px' }}>{t.userId?.name || 'Unknown'}</td>
                                    <td style={{ padding: '16px', textTransform: 'capitalize' }}>{t.channel}</td>
                                    <td style={{ padding: '16px' }}><span className={`cd-tkt-priority-dot ${t.priority === 'urgent' ? 'cd-priority-high' : 'cd-priority-normal'}`}></span> {t.priority}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}




// ─────────────────────────────────────────────────────────────────────────────
// TICKETS VIEW — Read messages + QA analysis per ticket
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#25D366', closed: '#97a3b6' };
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const CHANNEL_ICONS = { telegram: '📤', whatsapp: '💬', instagram: '📷', facebook: '👍', web: '🌐' };
const ANALYSIS_STATUS_STYLE = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Analysis pending' },
    completed: { bg: '#dcfce7', color: '#166534', label: 'AI analyzed' },
    failed: { bg: '#fee2e2', color: '#991b1b', label: 'Analysis failed' },
    not_applicable: { bg: '#f3f4f6', color: '#6b7280', label: '—' },
};

function pickFullAnalysis(qaRecord) {
    if (!qaRecord) return null;
    return qaRecord.fullAnalysis || qaRecord.analysis || null;
}

function TicketsView({ agents = [] }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [qaData, setQaData] = useState(null);
    const [loadingQA, setLoadingQA] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [noteDraft, setNoteDraft] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [activePanel, setActivePanel] = useState('messages');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [agentFilter, setAgentFilter] = useState('');

    const fetchTicketList = useCallback(async () => {
        setLoading(true);
        try {
            const q = new URLSearchParams();
            if (statusFilter) q.set('status', statusFilter);
            if (agentFilter) q.set('agentId', agentFilter);
            const qs = q.toString();
            const data = await teamLeaderApi.getCompanyTickets(qs ? `?${qs}` : '');
            setTickets(data.tickets || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [statusFilter, agentFilter]);

    useEffect(() => {
        fetchTicketList();
    }, [fetchTicketList]);

    const openTicket = async (ticket) => {
        setSelectedTicket(ticket);
        setMessages([]);
        setQaData(null);
        setNoteDraft('');
        setActivePanel('messages');
        setLoadingMsgs(true);
        try {
            const data = await teamLeaderApi.getTicketMessages(ticket._id);
            setMessages(data.messages || []);
            if (data.ticket) {
                setSelectedTicket((prev) => ({ ...prev, ...data.ticket }));
            }
        } catch (e) { console.error(e); }
        setLoadingMsgs(false);
    };

    const loadExistingQA = async () => {
        if (!selectedTicket) return;
        setLoadingQA(true);
        try {
            const detail = await teamLeaderApi.getQADetail(selectedTicket._id);
            setQaData(detail);
        } catch (e) {
            setQaData(null);
        }
        setLoadingQA(false);
    };

    const openQAPanel = async () => {
        if (!selectedTicket) return;
        setActivePanel('qa');
        await loadExistingQA();
    };

    const runRegenerateQA = async () => {
        if (!selectedTicket) return;
        setRegenerating(true);
        try {
            await teamLeaderApi.analyzeTicket(selectedTicket._id);
            await loadExistingQA();
            fetchTicketList();
        } catch (e) {
            console.error(e);
            alert(e.message || 'Analysis failed');
        }
        setRegenerating(false);
    };

    const submitTeamNote = async () => {
        if (!selectedTicket || !noteDraft.trim()) return;
        setSavingNote(true);
        try {
            await teamLeaderApi.patchTicketQANotes(selectedTicket._id, noteDraft.trim());
            setNoteDraft('');
            const detail = await teamLeaderApi.getQADetail(selectedTicket._id);
            setQaData(detail);
        } catch (e) {
            alert(e.message || 'Could not save note');
        }
        setSavingNote(false);
    };

    const filtered = tickets.filter((t) =>
        t.ticketNumber?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.channel?.toLowerCase().includes(search.toLowerCase())
    );

    const fa = pickFullAnalysis(qaData);
    const scores = qaData?.scores || {};
    const overallNum = fa?.quality_assessment?.conversation_quality_score ?? scores.quality ?? null;

    const scoreChartData = [
        { name: 'Professionalism', value: scores.professionalism ?? fa?.agent_analysis?.agent_professionalism_score ?? 0, color: '#137c9f' },
        { name: 'Empathy', value: scores.empathy ?? fa?.agent_analysis?.agent_empathy_score ?? 0, color: '#2ecc71' },
        { name: 'Quality', value: scores.quality ?? fa?.quality_assessment?.conversation_quality_score ?? 0, color: '#f39c12' },
    ].filter(d => d.value > 0);

    const EMOTION_COLORS = {
        neutral: '#97a3b6',
        happy: '#22c55e',
        satisfied: '#22c55e',
        positive: '#22c55e',
        frustrated: '#ef4444',
        angry: '#ef4444',
        sad: '#f59e0b',
        disappointed: '#f59e0b',
        anxious: '#f97316',
        worried: '#f97316',
        surprised: '#8b5cf6',
        unclear: '#6b7280',
    };
    const getEmotionColor = (emotion) => EMOTION_COLORS[emotion?.toLowerCase()] || '#97a3b6';

    return (
        <div className="cd-view-container" style={{ display: 'flex', height: '100%', gap: 0 }}>
            <div style={{ width: 340, minWidth: 300, borderRight: '1px solid #e6e9ed', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #e6e9ed' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#042835', margin: '0 0 12px' }}>Tickets</h2>
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                        <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#97a3b6' }} />
                        <input
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tickets..."
                            style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e6e9ed', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <select
                        value={agentFilter}
                        onChange={(e) => setAgentFilter(e.target.value)}
                        style={{ width: '100%', marginBottom: 10, padding: '8px 10px', borderRadius: 8, border: '1px solid #e6e9ed', fontSize: 13, background: '#fff' }}
                    >
                        <option value="">All agents</option>
                        {agents.map((a) => (
                            <option key={a._id} value={a._id}>{a.name}</option>
                        ))}
                    </select>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['', 'open', 'in_progress', 'resolved'].map((s) => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                                    background: statusFilter === s ? '#042835' : '#f0f2f5',
                                    color: statusFilter === s ? '#CAF301' : '#667085' }}>
                                {s === '' ? 'All' : STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {loading ? <p style={{ padding: 20, color: '#97a3b6', fontSize: 13 }}>Loading...</p> :
                        filtered.length === 0 ? <p style={{ padding: 20, color: '#97a3b6', fontSize: 13 }}>No tickets found.</p> :
                        filtered.map((ticket) => {
                            const ast = ticket.context?.analysisStatus || 'not_applicable';
                            const astStyle = ANALYSIS_STATUS_STYLE[ast] || ANALYSIS_STATUS_STYLE.not_applicable;
                            return (
                            <div key={ticket._id}
                                onClick={() => openTicket(ticket)}
                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5',
                                    background: String(selectedTicket?._id) === String(ticket._id) ? '#f5f9ff' : 'transparent',
                                    borderLeft: String(selectedTicket?._id) === String(ticket._id) ? '3px solid #137c9f' : '3px solid transparent' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#042835' }}>#{ticket.ticketNumber}</span>
                                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: STATUS_COLORS[ticket.status] + '20', color: STATUS_COLORS[ticket.status] }}>
                                        {STATUS_LABELS[ticket.status] || ticket.status}
                                    </span>
                                </div>
                                <div style={{ fontSize: 11, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, padding: '2px 6px', borderRadius: 6, background: astStyle.bg, color: astStyle.color }}>{astStyle.label}</span>
                                </div>
                                <div style={{ fontSize: 12, color: '#667085', marginBottom: 3 }}>
                                    {CHANNEL_ICONS[ticket.channel] || '🎫'} {ticket.channel}
                                    {ticket.assignedTo ? ` · ${ticket.assignedTo.name}` : ' · Unassigned'}
                                </div>
                                <div style={{ fontSize: 11, color: '#b0b8c4' }}>{new Date(ticket.createdAt).toLocaleDateString()}</div>
                            </div>
                            );
                        })
                    }
                </div>
            </div>

            {selectedTicket ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                    <div style={{ padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e6e9ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                            <p style={{ fontSize: 12, color: '#97a3b6', margin: 0 }}>Ticket #{selectedTicket.ticketNumber}</p>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#042835', margin: '2px 0 0' }}>
                                {CHANNEL_ICONS[selectedTicket.channel]} {selectedTicket.channel?.toUpperCase()} — {selectedTicket.priority?.toUpperCase()} Priority
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setActivePanel('messages')}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: activePanel === 'messages' ? '#042835' : '#f0f2f5',
                                    color: activePanel === 'messages' ? '#CAF301' : '#667085', fontSize: 13, fontWeight: 600 }}>
                                <ChatBubbleLeftRightIcon style={{ width: 15, height: 15 }} /> Messages
                            </button>
                            <button type="button" onClick={openQAPanel}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: activePanel === 'qa' ? '#042835' : '#f0f2f5',
                                    color: activePanel === 'qa' ? '#CAF301' : '#667085', fontSize: 13, fontWeight: 600 }}>
                                <SparklesIcon style={{ width: 15, height: 15 }} /> QA Analysis
                            </button>
                        </div>
                    </div>

                    {activePanel === 'messages' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {loadingMsgs ? <p style={{ color: '#97a3b6', fontSize: 13 }}>Loading messages...</p> :
                                messages.length === 0 ? <p style={{ color: '#97a3b6', fontSize: 13 }}>No messages found for this ticket.</p> :
                                messages.map((msg, i) => {
                                    const isAgent = msg.role === 'agent';
                                    const isSystem = msg.role === 'system';
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: isAgent ? 'flex-end' : isSystem ? 'center' : 'flex-start' }}>
                                            {isSystem ? (
                                                <span style={{ fontSize: 11, color: '#b0b8c4', background: '#f0f2f5', padding: '4px 10px', borderRadius: 20 }}>{msg.content}</span>
                                            ) : (
                                                <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isAgent ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                                    background: isAgent ? '#042835' : '#fff', color: isAgent ? '#fff' : '#042835',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontSize: 14, lineHeight: 1.5 }}>
                                                    <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.6, marginBottom: 4, textTransform: 'uppercase' }}>{msg.role}</div>
                                                    {msg.content || (msg.mediaUrl && <a href={resolveMediaUrl(msg.mediaUrl)} target="_blank" rel="noreferrer" style={{ color: isAgent ? '#CAF301' : '#137c9f' }}>📎 Attachment</a>)}
                                                    <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4, textAlign: 'right' }}>
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            }
                        </div>
                    )}

                    {activePanel === 'qa' && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                <button type="button" onClick={runRegenerateQA} disabled={regenerating}
                                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', cursor: regenerating ? 'wait' : 'pointer', background: '#042835', color: '#CAF301', fontSize: 13, fontWeight: 600, opacity: regenerating ? 0.7 : 1 }}>
                                    {regenerating ? 'Running…' : 'Run / refresh AI analysis'}
                                </button>
                            </div>
                            {loadingQA ? (
                                <div style={{ textAlign: 'center', color: '#97a3b6', paddingTop: 40 }}>
                                    <SparklesIcon style={{ width: 32, margin: '0 auto 12px', opacity: 0.4 }} />
                                    <p>Loading analysis…</p>
                                </div>
                            ) : qaData && fa ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #e6e9ed', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 20 }}>
                                        <div style={{ position: 'relative', width: 90, height: 90 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={[
                                                        { name: 'Score', value: overallNum != null ? overallNum : 0, color: overallNum >= 4 ? '#22c55e' : overallNum >= 2.5 ? '#f39c12' : '#ef4444' },
                                                        { name: 'Remaining', value: overallNum != null ? 5 - overallNum : 5, color: '#f0f2f5' },
                                                    ]} cx="50%" cy="50%" innerRadius={26} outerRadius={40}
                                                        startAngle={90} endAngle={-270} dataKey="value" stroke="none"
                                                        cornerRadius={4}>
                                                        {[0, 1].map((i) => (
                                                            <Cell key={i} fill={i === 0 ? (overallNum >= 4 ? '#22c55e' : overallNum >= 2.5 ? '#f39c12' : '#ef4444') : '#f0f2f5'}
                                                                style={{ filter: i === 0 ? `drop-shadow(0 2px 6px ${overallNum >= 4 ? '#22c55e' : overallNum >= 2.5 ? '#f39c12' : '#ef4444'}66)` : 'none' }} />
                                                        ))}
                                                    </Pie>
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 20, fontWeight: 800, color: '#042835', textAlign: 'center', lineHeight: 1 }}>
                                                {overallNum != null ? Math.round(overallNum) : '—'}
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, color: '#97a3b6' }}>Conversation quality</p>
                                            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, color: '#042835' }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 13,
                                                    background: (fa.quality_assessment?.qa_verdict === 'high' ? '#22c55e' : fa.quality_assessment?.qa_verdict === 'medium' ? '#f39c12' : fa.quality_assessment?.qa_verdict === 'low' ? '#ef4444' : '#f0f2f5') + '20',
                                                    color: fa.quality_assessment?.qa_verdict === 'high' ? '#16a34a' : fa.quality_assessment?.qa_verdict === 'medium' ? '#d97706' : fa.quality_assessment?.qa_verdict === 'low' ? '#dc2626' : '#667085',
                                                }}>
                                                    {fa.quality_assessment?.qa_verdict || '—'}
                                                </span>
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#667085' }}>{fa.ticket_summary?.short_summary || ''}</p>
                                        </div>
                                    </div>

                                    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Scores</p>
                                        {scoreChartData.length > 0 ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie data={scoreChartData} cx="50%" cy="50%" innerRadius={28} outerRadius={46}
                                                                paddingAngle={3} dataKey="value" stroke="none">
                                                                {scoreChartData.map((entry, index) => (
                                                                    <Cell key={index} fill={entry.color}
                                                                        style={{ filter: `drop-shadow(0 2px 6px ${entry.color}66)` }} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e6e9ed', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                                formatter={(val) => [val, 'Score /5']} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                                                    {scoreChartData.map((entry) => (
                                                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
                                                            <span style={{ fontSize: 12, color: '#667085', flex: 1 }}>{entry.name}</span>
                                                            <div style={{ width: 60, height: 6, background: '#f0f2f5', borderRadius: 3, overflow: 'hidden' }}>
                                                                <div style={{ width: `${(entry.value / 5) * 100}%`, height: '100%', borderRadius: 3, background: entry.color, transition: 'width 0.5s ease' }} />
                                                            </div>
                                                            <strong style={{ fontSize: 13, color: '#042835', width: 24, textAlign: 'right' }}>{entry.value}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: 13, color: '#97a3b6' }}>No scores available</p>
                                        )}
                                    </div>

                                    {fa.customer_analysis && (
                                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Customer analysis</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span style={{ color: '#667085' }}>Dominant emotion:</span>
                                                    <span style={{
                                                        display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                                                        background: `${getEmotionColor(fa.customer_analysis.dominant_emotion)}20`,
                                                        color: getEmotionColor(fa.customer_analysis.dominant_emotion),
                                                        textTransform: 'capitalize',
                                                        boxShadow: `0 1px 4px ${getEmotionColor(fa.customer_analysis.dominant_emotion)}40`,
                                                    }}>
                                                        {fa.customer_analysis.dominant_emotion}
                                                    </span>
                                                </div>
                                                {fa.customer_analysis.emotion_trend && (
                                                    <div>
                                                        <span style={{ color: '#667085', display: 'block', marginBottom: 6 }}>Emotion trend:</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                                            {['start', 'average', 'end'].map((stage, i) => (
                                                                <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, position: 'relative' }}>
                                                                        <div style={{
                                                                            width: 12, height: 12, borderRadius: '50%',
                                                                            background: getEmotionColor(fa.customer_analysis.emotion_trend[stage]),
                                                                            boxShadow: `0 0 0 3px ${getEmotionColor(fa.customer_analysis.emotion_trend[stage])}20, 0 2px 6px ${getEmotionColor(fa.customer_analysis.emotion_trend[stage])}50`,
                                                                            position: 'relative', zIndex: 1,
                                                                        }} />
                                                                        <span style={{ fontSize: 9, color: '#97a3b6', textTransform: 'capitalize', fontWeight: 500 }}>{stage}</span>
                                                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#042835', textTransform: 'capitalize' }}>
                                                                            {fa.customer_analysis.emotion_trend[stage]}
                                                                        </span>
                                                                    </div>
                                                                    {i < 2 && (
                                                                        <div style={{
                                                                            flex: 1, height: 2,
                                                                            background: `linear-gradient(90deg, ${getEmotionColor(fa.customer_analysis.emotion_trend[stage])}, ${getEmotionColor(fa.customer_analysis.emotion_trend[['start', 'average', 'end'][i + 1]])})`,
                                                                            marginBottom: 32, marginLeft: -1, marginRight: -1,
                                                                        }} />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ color: '#667085' }}>Churn probability</span>
                                                        <strong style={{ color: fa.customer_analysis.churn_probability != null && fa.customer_analysis.churn_probability > 0.5 ? '#991b1b' : '#137c9f' }}>
                                                            {fa.customer_analysis.churn_probability != null ? `${Math.round(fa.customer_analysis.churn_probability * 100)}%` : '—'}
                                                        </strong>
                                                    </div>
                                                    {fa.customer_analysis.churn_probability != null && (
                                                        <div style={{ width: '100%', height: 10, background: '#f0f2f5', borderRadius: 5, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)' }}>
                                                            <div style={{
                                                                width: `${Math.min(fa.customer_analysis.churn_probability * 100, 100)}%`,
                                                                height: '100%',
                                                                borderRadius: 5,
                                                                background: fa.customer_analysis.churn_probability > 0.5
                                                                    ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                                                    : 'linear-gradient(90deg, #22c55e, #f59e0b)',
                                                                transition: 'width 0.5s ease',
                                                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                                            }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {fa.resolution_analysis && (
                                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Resolution</p>
                                            <p style={{ margin: 0, fontSize: 13, color: '#667085', lineHeight: 1.5 }}>
                                                <span style={{
                                                    display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                                    background: fa.resolution_analysis.resolution_status === 'resolved' ? '#22c55e20' : fa.resolution_analysis.resolution_status === 'escalated' ? '#ef444420' : '#f59e0b20',
                                                    color: fa.resolution_analysis.resolution_status === 'resolved' ? '#16a34a' : fa.resolution_analysis.resolution_status === 'escalated' ? '#dc2626' : '#d97706',
                                                    textTransform: 'capitalize',
                                                }}>
                                                    {fa.resolution_analysis.resolution_status}
                                                </span>
                                                {fa.resolution_analysis.resolution_reasoning ? ` — ${fa.resolution_analysis.resolution_reasoning}` : ''}
                                            </p>
                                            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: fa.resolution_analysis.ticket_closed_correctly ? '#22c55e' : '#ef4444',
                                                    boxShadow: fa.resolution_analysis.ticket_closed_correctly ? '0 0 6px #22c55e66' : '0 0 6px #ef444466',
                                                    display: 'inline-block',
                                                }} />
                                                <span style={{ fontSize: 12, color: '#97a3b6' }}>
                                                    {fa.resolution_analysis.ticket_closed_correctly ? 'Closed correctly' : 'Not closed correctly'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {fa.agent_analysis && (
                                        <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Agent behavior</p>
                                            <div style={{ padding: 10, background: '#f8f9fa', borderRadius: 8, border: '1px solid #f0f2f5', fontSize: 13, color: '#667085', lineHeight: 1.5 }}>
                                                {fa.agent_analysis.tone_reasoning || fa.agent_analysis.overall_tone}
                                            </div>
                                            {((fa.quality_assessment?.main_failures || fa.agent_analysis?.issues || [])).length > 0 && (
                                                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12, color: '#991b1b' }}>
                                                    {(fa.quality_assessment?.main_failures || fa.agent_analysis?.issues || []).slice(0, 8).map((x, i) => (
                                                        <li key={i}>{typeof x === 'string' ? x : x.message || JSON.stringify(x)}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}

                                    {fa.meta && (fa.meta.provider || fa.meta.analyzedAt) && (
                                        <div style={{ fontSize: 11, color: '#97a3b6', textAlign: 'right' }}>
                                            {fa.meta.provider && <span style={{ textTransform: 'capitalize' }}>{fa.meta.provider}</span>}
                                            {fa.meta.analyzedAt && <span> • {new Date(fa.meta.analyzedAt).toLocaleString()}</span>}
                                        </div>
                                    )}

                                    <div style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid #e6e9ed', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: '#042835' }}>Your notes</p>
                                        {(qaData.teamLeaderNotes || []).length > 0 && (
                                            <div style={{ marginBottom: 12, maxHeight: 160, overflowY: 'auto' }}>
                                                {(qaData.teamLeaderNotes || []).map((n, i) => (
                                                    <div key={i} style={{ fontSize: 12, color: '#667085', padding: '8px 0', borderBottom: '1px solid #f0f2f5' }}>
                                                        {n.content}
                                                        <div style={{ fontSize: 10, color: '#97a3b6', marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <textarea
                                            value={noteDraft}
                                            onChange={(e) => setNoteDraft(e.target.value)}
                                            placeholder="Add coaching or escalation notes for this ticket…"
                                            rows={3}
                                            style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #e6e9ed', fontSize: 13, marginBottom: 8 }}
                                        />
                                        <button type="button" onClick={submitTeamNote} disabled={savingNote || !noteDraft.trim()}
                                            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: savingNote ? 'wait' : 'pointer', background: '#137c9f', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                                            {savingNote ? 'Saving…' : 'Save note'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#97a3b6', paddingTop: 24 }}>
                                    <SparklesIcon style={{ width: 32, margin: '0 auto 12px', opacity: 0.3 }} />
                                    <p style={{ fontSize: 14 }}>No saved QA analysis yet. Run AI analysis on resolved tickets, or click the button above.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#97a3b6' }}>
                    <TicketIcon style={{ width: 48, height: 48, marginBottom: 16, opacity: 0.3 }} />
                    <p style={{ fontSize: 15 }}>Select a ticket to view messages and analysis</p>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALLS VIEW — Listen to recordings and browse call history
// ─────────────────────────────────────────────────────────────────────────────
const CALL_STATUS_LABEL = {
    ringing: 'Ringing',
    active: 'Active',
    ended: 'Ended',
    missed: 'Missed',
    rejected: 'Rejected',
};

function CallsView({ agents = [] }) {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [playingUrl, setPlayingUrl] = useState(null);

    useEffect(() => {
        const fetchCalls = async () => {
            setLoading(true);
            try {
                const data = await teamLeaderApi.getCompanyCalls('?limit=100');
                setCalls(Array.isArray(data) ? data : (data?.calls || []));
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchCalls();
    }, []);

    const formatDuration = (sec) => {
        if (!sec) return '—';
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}m ${s}s`;
    };

    const filtered = calls.filter((c) => {
        const agentName = (c.agentId?.name || '').toLowerCase();
        const channel = (c.channel || '').toLowerCase();
        const q = search.toLowerCase();
        const matchSearch = !q || agentName.includes(q) || channel.includes(q);
        const matchAgent = !agentFilter || String(c.agentId?._id || c.agentId) === String(agentFilter);
        return matchSearch && matchAgent;
    });

    const playRecording = (url) => {
        setPlayingUrl(resolveMediaUrl(url));
    };

    return (
        <div className="cd-bento-layout">
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#042835', margin: '0 0 6px' }}>Call History</h2>
                <p style={{ fontSize: 13, color: '#97a3b6', margin: 0 }}>Team calls — listen to recordings and review details.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 340 }}>
                    <MagnifyingGlassIcon style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 16, color: '#97a3b6' }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agent or channel…"
                        style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e6e9ed', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <select
                    value={agentFilter}
                    onChange={(e) => setAgentFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #e6e9ed', fontSize: 13, minWidth: 180, background: '#fff' }}
                >
                    <option value="">All agents</option>
                    {agents.map((a) => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                </select>
            </div>

            {playingUrl && (
                <div style={{ background: '#042835', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <PhoneIcon style={{ width: 20, color: '#CAF301' }} />
                    <div style={{ flex: 1 }}>
                        <audio controls autoPlay src={playingUrl} style={{ width: '100%', height: 36 }} />
                    </div>
                    <button type="button" onClick={() => setPlayingUrl(null)} style={{ background: 'none', border: 'none', color: '#CAF301', cursor: 'pointer', fontSize: 20 }}>✕</button>
                </div>
            )}

            {loading ? <p style={{ color: '#97a3b6' }}>Loading calls...</p> :
                filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', paddingTop: 60, color: '#97a3b6' }}>
                        <PhoneIcon style={{ width: 48, margin: '0 auto 16px', opacity: 0.3 }} />
                        <p>No calls found.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map((call) => {
                            const st = call.status || 'ended';
                            const endedOk = st === 'ended';
                            return (
                            <div key={call._id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #e6e9ed', display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <PhoneIcon style={{ width: 20, color: '#042835' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#042835' }}>{call.agentId?.name || 'Unknown Agent'}</p>
                                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#97a3b6' }}>
                                        {(call.channel || 'voice')} · {formatDuration(call.duration)} · {new Date(call.startedAt || call.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: endedOk ? '#dcfce7' : '#fef3c7', color: endedOk ? '#166534' : '#92400e' }}>
                                        {CALL_STATUS_LABEL[st] || st}
                                    </span>
                                    {call.recordingUrl && (
                                        <button type="button" onClick={() => playRecording(call.recordingUrl)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#042835', color: '#CAF301', fontSize: 12, fontWeight: 600 }}>
                                            <PlayCircleIcon style={{ width: 15 }} /> Listen
                                        </button>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )
            }
        </div>
    );
}


function AgentPerformanceView({ agent, onBack }) {

    const [period, setPeriod] = useState('Monthly');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agentProfile, setAgentProfile] = useState(null);
    const [supervisorDraft, setSupervisorDraft] = useState('');
    const [savingSupervisor, setSavingSupervisor] = useState(false);

    useEffect(() => {
        const fetchPerf = async () => {
            setLoading(true);
            const aid = agent._id || agent.id;
            try {
                const perf = await teamLeaderApi.getAgentPerformance(aid, period);
                setData({ ...agent, ...perf });
                const prof = await teamLeaderApi.getAgentProfile(aid);
                const p = prof.agent || prof;
                setAgentProfile(p);
            } catch (e) {
                console.error("Failed to load agent perf", e);
            }
            setLoading(false);
        };
        fetchPerf();
    }, [agent._id, agent.id, period]);

    const submitSupervisorNote = async () => {
        if (!supervisorDraft.trim()) return;
        setSavingSupervisor(true);
        try {
            await teamLeaderApi.patchAgentSupervisorNotes(agent._id || agent.id, supervisorDraft.trim());
            setSupervisorDraft('');
            const prof = await teamLeaderApi.getAgentProfile(agent._id);
            const p = prof.agent || prof;
            setAgentProfile(p);
        } catch (e) {
            alert(e.message || 'Could not save note');
        }
        setSavingSupervisor(false);
    };

    const ui = data || agent;

    const trendData = (data?.trendData || []).map((d) => ({
        name: d.label || d.date || '',
        value: d.value || 0,
    }));

    const channelData = (data?.channelDistribution || []).map((c) => ({
        name: c.name || c.channel || 'Unknown',
        value: c.count || c.value || 0,
    }));

    const estimatedCsat = data
        ? Math.min(100, Math.max(0, 100 - (data.avgResolutionTimeMs / 600000) * 5))
        : 0;

    const DAY_SHORT = { Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat' };

    const heatmapGrid = data?.weeklyHeatmap?.days
        ? data.weeklyHeatmap.days.map((d) => ({
            day: DAY_SHORT[d.day] || d.day?.slice(0, 3) || 'N/A',
            cells: (d.hours || []).map((load) => ({ load })),
        }))
        : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header */}
            <div className="cd-bento-header">
                <div>
                    <button onClick={onBack} style={{
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        color: THEME.textSecondary, fontWeight: 600, marginBottom: 8, fontSize: '13px',
                        display: 'flex', alignItems: 'center', gap: 4, fontFamily: THEME.fontFamily,
                    }}>
                        <span>&larr;</span> Back to Team
                    </button>
                    <h1 style={{ margin: 0, fontFamily: THEME.fontFamily }}>{agent.name}&apos;s Analysis</h1>
                    <p style={{ margin: '4px 0 0', color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                        Detailed performance breakdown for {period.toLowerCase()}.
                    </p>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
                <PremiumKPICard label="Resolved Tickets"
                    value={loading ? '\u2026' : (ui.totalResolved || 0)}
                    icon={<TicketIcon style={{ width: 18 }} />}
                    accent={COLORS.primary}
                    hint={`Resolved within ${period.toLowerCase()} period`}
                    loading={loading} />
                <PremiumKPICard label="Avg Response Time"
                    value={loading ? '\u2026' : (ui.avgResponseTimeMs > 0 ? `${Math.round(ui.avgResponseTimeMs / 60000)}m` : '0m')}
                    icon={<ChatBubbleLeftRightIcon style={{ width: 18 }} />}
                    accent={COLORS.secondary}
                    hint="Time to first reply"
                    loading={loading} />
                <PremiumKPICard label="Avg Resolution Time"
                    value={loading ? '\u2026' : (ui.avgResolutionTimeMs > 0 ? `${Math.round(ui.avgResolutionTimeMs / 3600000)}h` : '0h')}
                    icon={<CheckCircleIcon style={{ width: 18 }} />}
                    accent={COLORS.accent}
                    hint="Time to ticket closure"
                    loading={loading} />
                <PremiumKPICard label="Escalated Tickets"
                    value={loading ? '\u2026' : (ui.escalatedCount || 0)}
                    icon={<ArrowUpRightIcon style={{ width: 18 }} />}
                    accent={COLORS.danger}
                    hint={(ui.escalatedCount || 0) > 0 ? 'High & urgent priority' : 'No escalations'}
                    loading={loading} />
            </div>

            {/* Main Grid: Trend + Score */}
            <div className="cd-bento-main">
                <div className="cd-bento-left">
                    <PremiumLineChart
                        data={trendData}
                        lines={[{ dataKey: 'value', name: 'Resolved', color: COLORS.primary }]}
                        title="Resolution Volume"
                        subtitle="Tickets processed over time"
                        loading={loading}
                        height={400}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <PremiumBarChart
                            data={channelData}
                            title="Resolved by Channel"
                            valueKey="value"
                            labelKey="name"
                            layout="horizontal"
                            height={200}
                            loading={loading}
                        />
                        <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>Priority Impact</p>
                            <BarRow label="Escalated" value={ui.escalatedCount || 0} total={Math.max(1, ui.totalResolved || 1)} color={COLORS.danger} />
                            <BarRow label="Standard" value={(ui.totalResolved || 0) - (ui.escalatedCount || 0)} total={Math.max(1, ui.totalResolved || 1)} color={COLORS.success} />
                        </div>
                    </div>
                </div>
                <div className="cd-bento-right">
                    <PremiumGaugeChart
                        value={Math.round(estimatedCsat)}
                        max={100}
                        title="Est. Customer Satisfaction"
                        subtitle="Based on resolution time"
                        size={160}
                        loading={loading}
                    />
                    {trendData.length > 0 && (
                        <PremiumLineChart
                            data={trendData.slice(-7)}
                            lines={[{ dataKey: 'value', name: '7-day', color: COLORS.secondary }]}
                            title="Recent Activity"
                            subtitle="Last 7 data points"
                            loading={loading}
                            height={200}
                        />
                    )}
                </div>
            </div>

            {/* Heatmap */}
            {data?.weeklyHeatmap && (
                <PremiumHeatmapGrid data={heatmapGrid} title="Weekly Activity Heatmap" loading={loading} />
            )}

            {/* Supervisor Notes */}
            <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>Supervisor coaching notes</p>
                <p style={{ fontSize: 12, color: THEME.textMuted, margin: '4px 0 12px', fontFamily: THEME.fontFamily }}>
                    Visible to managers and team leads; persisted on the agent profile.
                </p>
                {(agentProfile?.supervisorNotes || []).length > 0 ? (
                    <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                        {(agentProfile.supervisorNotes || []).map((n, idx) => (
                            <div key={idx} style={{ fontSize: 13, color: THEME.text, padding: '10px 0', borderBottom: `1px solid ${THEME.grid}`, fontFamily: THEME.fontFamily }}>
                                {n.content}
                                <div style={{ fontSize: 11, color: THEME.textMuted, marginTop: 6, fontFamily: THEME.fontFamily }}>
                                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ fontSize: 13, color: THEME.textMuted, marginBottom: 12, fontFamily: THEME.fontFamily }}>No notes yet.</p>
                )}
                <textarea
                    value={supervisorDraft}
                    onChange={(e) => setSupervisorDraft(e.target.value)}
                    placeholder="Add feedback for this employee\u2026"
                    rows={3}
                    style={{
                        width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8,
                        border: `1px solid ${THEME.cardBorder}`, fontSize: 13, marginBottom: 8,
                        fontFamily: THEME.fontFamily, resize: 'vertical',
                    }}
                />
                <button type="button" onClick={submitSupervisorNote} disabled={savingSupervisor || !supervisorDraft.trim()}
                    style={{
                        padding: '8px 16px', borderRadius: 8, border: 'none', alignSelf: 'flex-start',
                        cursor: savingSupervisor ? 'wait' : 'pointer',
                        background: THEME.text, color: '#fff', fontSize: 13, fontWeight: 600,
                        fontFamily: THEME.fontFamily, opacity: savingSupervisor ? 0.75 : 1,
                        transition: THEME.transition,
                    }}>
                    {savingSupervisor ? 'Saving\u2026' : 'Save note'}
                </button>
            </div>

            {/* ── Profile Information ── */}
            {agentProfile && (
                <SectionCard title="Agent Profile">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <InfoRow icon={<UserCircleIcon style={{ width: 16 }} />} label="Name" value={agentProfile.agent?.name || agent.name} />
                        <InfoRow icon={<EnvelopeIcon style={{ width: 16 }} />} label="Email" value={agentProfile.agent?.email || '\u2014'} />
                        <InfoRow icon={<PhoneIcon style={{ width: 16 }} />} label="Phone" value={agentProfile.agent?.phone || '\u2014'} />
                        <InfoRow icon={<CheckCircleIcon style={{ width: 16 }} />} label="Status" value={agentProfile.agent?.isActive ? 'Active' : 'Inactive'} />
                        <InfoRow icon={<ClockIcon style={{ width: 16 }} />} label="Last Login" value={agentProfile.agent?.lastLogin ? new Date(agentProfile.agent.lastLogin).toLocaleString() : '\u2014'} />
                        <InfoRow icon={<BellAlertIcon style={{ width: 16 }} />} label="Onboarding" value={`Step ${agentProfile.agent?.onboardingStep || 0}`} />
                    </div>
                </SectionCard>
            )}

            {/* ── Performance Details ── */}
            {agentProfile?.performance && (
                <SectionCard title="Performance Breakdown">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
                        <StatBox label="Assigned" value={agentProfile.performance.assignedTickets ?? '\u2014'} color={COLORS.primary} />
                        <StatBox label="Pending" value={agentProfile.performance.pendingTickets ?? '\u2014'} color={COLORS.secondary} />
                        <StatBox label="In Progress" value={agentProfile.performance.inProgressTickets ?? '\u2014'} color={COLORS.warning} />
                        <StatBox label="Resolved" value={agentProfile.performance.resolvedTickets ?? '\u2014'} color={COLORS.success} />
                    </div>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>Today&apos;s Stats</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                        <StatBox label="Today Tickets" value={agentProfile.performance.todayTickets ?? '\u2014'} color={COLORS.primary} small />
                        <StatBox label="Today Resolved" value={agentProfile.performance.todayResolved ?? '\u2014'} color={COLORS.success} small />
                        <StatBox label="Today Avg Response" value={agentProfile.performance.todayAvgResponse ? `${Math.round(agentProfile.performance.todayAvgResponse / 60)}m` : '\u2014'} color={COLORS.secondary} small />
                        <StatBox label="Today Avg Resolution" value={agentProfile.performance.todayAvgResolution ? `${Math.round(agentProfile.performance.todayAvgResolution / 3600)}h` : '\u2014'} color={COLORS.accent} small />
                    </div>
                </SectionCard>
            )}

            {/* ── SLA Status & Calls ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {agentProfile?.sla && (
                    <SectionCard title="SLA Status">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <SLARow label="Overdue Tickets" value={agentProfile.sla.overdueTickets ?? 0} threshold={0} danger />
                            <SLARow label="Due Soon" value={agentProfile.sla.dueSoon ?? 0} threshold={0} />
                            <SLARow label="Breached Tickets" value={agentProfile.sla.breachedTickets ?? 0} threshold={0} danger />
                        </div>
                    </SectionCard>
                )}
                {agentProfile?.calls && (
                    <SectionCard title="Call Statistics">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <StatBox label="Total" value={agentProfile.calls.total ?? 0} color={COLORS.primary} small />
                            <StatBox label="Answered" value={agentProfile.calls.answered ?? 0} color={COLORS.success} small />
                            <StatBox label="Missed" value={agentProfile.calls.missed ?? 0} color={COLORS.danger} small />
                            <StatBox label="Avg Duration" value={agentProfile.calls.avgDuration ? `${Math.round(agentProfile.calls.avgDuration / 60)}m` : '0m'} color={COLORS.secondary} small />
                            <StatBox label="Answer Rate" value={agentProfile.calls.answerRate ? `${Math.round(agentProfile.calls.answerRate * 100)}%` : '0%'} color={COLORS.accent} small />
                        </div>
                    </SectionCard>
                )}
            </div>

            {/* ── Active Tickets ── */}
            {agentProfile?.activeTickets?.length > 0 && (
                <SectionCard title={`Active Tickets (${agentProfile.activeTickets.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agentProfile.activeTickets.map((t) => (
                            <MiniTicketRow key={t._id} ticket={t} type="active" />
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ── Recent Resolved ── */}
            {agentProfile?.recentResolved?.length > 0 && (
                <SectionCard title={`Recently Resolved (${agentProfile.recentResolved.length})`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agentProfile.recentResolved.map((t) => (
                            <MiniTicketRow key={t._id} ticket={t} type="resolved" />
                        ))}
                    </div>
                </SectionCard>
            )}

            {/* ── Feedback / CSAT ── */}
            {agentProfile?.feedback && (
                <SectionCard title="Customer Feedback">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <StatBox label="Total Ratings" value={agentProfile.feedback.totalRatings ?? 0} color={COLORS.primary} small />
                        <StatBox label="Avg Rating" value={agentProfile.feedback.avgRating ? agentProfile.feedback.avgRating.toFixed(1) : '\u2014'} color={COLORS.accent} small />
                        <StatBox label="CSAT" value={agentProfile.feedback.csat ? `${agentProfile.feedback.csat}%` : '\u2014'} color={COLORS.success} small />
                    </div>
                    {agentProfile.feedback.ratingBreakdown && (
                        <div>
                            <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: THEME.textSecondary, fontFamily: THEME.fontFamily }}>Rating Breakdown</p>
                            {[5,4,3,2,1].map((star) => {
                                const count = agentProfile.feedback.ratingBreakdown[String(star)] || 0;
                                const total = agentProfile.feedback.totalRatings || 1;
                                return <BarRow key={star} label={`${star} Star`} value={count} total={total} color={star >= 4 ? COLORS.success : star === 3 ? COLORS.accent : COLORS.danger} />;
                            })}
                        </div>
                    )}
                </SectionCard>
            )}
        </div>
    );
}

function BarRow({ label, value, total, color }) {
    const pct = Math.round((value / total) * 100);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, fontFamily: THEME.fontFamily }}>
                <span style={{ color: THEME.textSecondary, fontWeight: 500 }}>{label}</span>
                <strong style={{ color, fontWeight: 700 }}>{value}</strong>
            </div>
            <div style={{ height: 6, borderRadius: 100, background: THEME.grid, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100, background: color, transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </div>
        </div>
    );
}

// ── Profile detail helpers ──

function SectionCard({ title, children }) {
    return (
        <div style={{ ...CARD_STYLE, padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: THEME.text, fontFamily: THEME.fontFamily }}>{title}</p>
            {children}
        </div>
    );
}

function InfoRow({ icon, label, value }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: THEME.fontFamily }}>
            <span style={{ color: THEME.textMuted, display: 'flex' }}>{icon}</span>
            <span style={{ color: THEME.textSecondary, minWidth: 70 }}>{label}</span>
            <strong style={{ color: THEME.text, fontWeight: 600 }}>{value}</strong>
        </div>
    );
}

function StatBox({ label, value, color, small }) {
    return (
        <div style={{ background: THEME.grid, borderRadius: 10, padding: small ? '10px 14px' : '14px 18px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: small ? 20 : 28, fontWeight: 700, color, fontFamily: THEME.fontFamily, lineHeight: 1.2 }}>{value}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{label}</p>
        </div>
    );
}

function SLARow({ label, value, threshold, danger }) {
    const isBad = value > threshold;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: isBad ? 'rgba(239,68,68,0.06)' : THEME.grid }}>
            <span style={{ fontSize: 13, fontFamily: THEME.fontFamily, color: THEME.textSecondary }}>{label}</span>
            <strong style={{ fontSize: 15, color: isBad ? (danger ? COLORS.danger : COLORS.warning) : COLORS.success, fontFamily: THEME.fontFamily }}>{value}</strong>
        </div>
    );
}

function MiniTicketRow({ ticket, type }) {
    const isActive = type === 'active';
    const colorMap = { low: COLORS.success, medium: COLORS.accent, high: COLORS.warning, urgent: COLORS.danger };
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: THEME.grid }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: THEME.text, fontFamily: THEME.fontFamily }}>{ticket.customer?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: colorMap[ticket.priority] || THEME.textMuted, color: '#fff' }}>{ticket.priority}</span>
                    <span style={{ fontSize: 10, color: THEME.textMuted, fontFamily: THEME.fontFamily }}>{ticket.channel}</span>
                </div>
                <span style={{ fontSize: 11, color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                    {isActive
                        ? `Created ${new Date(ticket.createdAt).toLocaleDateString()} \u00b7 ${ticket.hoursSinceCreation}h ago${ticket.hasSlaBreach ? ' \u00b7 SLA Breached' : ''}`
                        : `Resolved ${ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : ''} \u00b7 ${ticket.resolutionHours}h to resolve`
                    }
                </span>
            </div>
        </div>
    );
}


// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function TeamLeaderDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeNav = searchParams.get("tab") || "Dashboard";
    
    const setActiveNav = (tab) => {
        setSearchParams({ tab });
    };

    const tlUser = getAgentUser();
    
    // Use the custom hook for dashboard data
    const { data: dashboardData, loading: loadingData, error: dashboardError } = useDashboardData();
    const [agents, setAgents] = useState([]);
    const [agentsLoading, setAgentsLoading] = useState(true);
    const [selectedAgentPerformance, setSelectedAgentPerformance] = useState(null);

    // Fetch agents separately
    useEffect(() => {
        const loadAgents = async () => {
            setAgentsLoading(true);
            try {
                const agts = await teamLeaderApi.getAgents();
                setAgents(agts || []);
            } catch (e) {
                console.error("Failed to load agents", e);
            } finally {
                setAgentsLoading(false);
            }
        };
        loadAgents();
    }, []);

    // Handle URL agent syncing
    useEffect(() => {
        const agentId = searchParams.get('agentId');
        if (agentId && agents.length > 0) {
            const agt = agents.find(a => String(a._id) === String(agentId));
            if (agt) {
                setSelectedAgentPerformance(agt);
            }
        } else if (!agentId) {
            setSelectedAgentPerformance(null);
        }
    }, [searchParams, agents]);

    const handleSelectAgent = (agent) => {
        setSelectedAgentPerformance(agent);
        setSearchParams({ tab: 'Team', agentId: agent._id || agent.id });
    };

    const handleNavClick = (key) => {
        if (key === "Logout") {
            localStorage.clear();
            window.location.href = '/';
            return;
        }
        setActiveNav(key);
    };

    return (
        <div className="cd-layout">
            {/* ── Left Sidebar ── */}
            <aside className="cd-sidebar">
                <div className="cd-sidebar-logo" onClick={() => setSearchParams({})} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="NATIQ" />
                </div>
                <nav className="cd-sidebar-nav">
                    <p className="cd-nav-label">Menu</p>
                    <ul className="cd-nav-list">
                        {MENU_KEYS.map(({ key, Icon }) => (
                            <li
                                key={key}
                                className={`cd-nav-item${activeNav === key ? ' cd-nav-active' : ''}`}
                                onClick={() => handleNavClick(key)}
                            >
                                <Icon className="cd-nav-icon" />
                                <span className="cd-nav-text">{key}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="cd-nav-label">General</p>
                    <ul className="cd-nav-list">
                        {GENERAL_KEYS.map(({ key, Icon }) => (
                            <li
                                key={key}
                                className={`cd-nav-item${activeNav === key ? ' cd-nav-active' : ''}`}
                                onClick={() => handleNavClick(key)}
                            >
                                <Icon className="cd-nav-icon" />
                                <span className="cd-nav-text">{key}</span>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* ── Main Panel ── */}
            <div className="cd-right-panel">
                {/* ── TOP HEADER ── */}
                <header className="cd-topbar">
                    <div className="cd-topbar-left">
                        <div className="cd-search-wrap">
                            <MagnifyingGlassIcon className="cd-search-icon" />
                            <input className="cd-search" type="text" placeholder="Search task" />
                        </div>
                    </div>

                    <div className="cd-topbar-actions">
                        <div className="cd-user-info" style={{ cursor: 'pointer' }}>
                            <div className="cd-avatar">
                                {tlUser.avatar ? <img src={tlUser.avatar} alt="avatar" /> : tlUser.initials}
                            </div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{tlUser.name}</span>
                                <span className="cd-user-email">Supervisor</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── VIEWS ── */}
                <main className="cd-main" style={{ overflow: activeNav === 'Tickets' ? 'hidden' : undefined, padding: activeNav === 'Tickets' ? 0 : undefined }}>
                    {selectedAgentPerformance ? (
                        <AgentPerformanceView agent={selectedAgentPerformance} onBack={() => setSearchParams({ tab: 'Team' })} />
                    ) : (
                        <>
                            {activeNav === "Dashboard" && <DashboardView data={dashboardData} loading={loadingData} error={dashboardError} onSelectAgent={handleSelectAgent} />}
                            {activeNav === "Team" && <TeamView agents={agents} loading={agentsLoading} onSelectAgent={handleSelectAgent} />}
                            {activeNav === "Queue" && <QueueManagementView agents={agents} />}
                            {activeNav === "Tickets" && <TicketsView agents={agents} />}
                            {activeNav === "Calls" && <CallsView agents={agents} />}
                            {activeNav === "Profile" && (
                                <SettingsPage
                                    user={{
                                        name: tlUser.name,
                                        email: tlUser.email,
                                        phone: tlUser.phone || "",
                                        avatar: tlUser.avatar,
                                        role: "Team Leader",
                                    }}
                                    roleLabel="Team Leader"
                                    onSaveProfile={(payload) => agentApi.updateProfile(payload)}
                                    onChangePassword={(payload) => agentApi.changePassword(payload)}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
