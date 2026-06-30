import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import { gsap } from "gsap";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import logo from "../../assets/logo.png";
import { agentApi } from "../../services/agentApi";
import SettingsPage from "../../components/common/SettingsPage";
import { GaugeChart, DonutChart, GradientBar, DotGrid, CallStatCard } from "./DashboardCharts";
import "./NatiqDashboard.css";
import {
    Squares2X2Icon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    MagnifyingGlassIcon,
    EnvelopeIcon,
    BellIcon,
    ArrowTopRightOnSquareIcon,
    ArrowUpRightIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    StarIcon,
    PlusIcon,
    MicrophoneIcon,
    PaperAirplaneIcon,
    EllipsisHorizontalIcon,
    HashtagIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    NoSymbolIcon,
    PhoneIcon,
    PhoneXMarkIcon,
    PhoneArrowDownLeftIcon,
    CheckCircleIcon,
    TrashIcon,
    XMarkIcon,
    FlagIcon,
    TicketIcon,
    BoltIcon,
    SparklesIcon,
    FireIcon,
    TrophyIcon,
    ArrowTrendingUpIcon,
    LightBulbIcon,
    ExclamationTriangleIcon,
    UserCircleIcon,
    AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

/* ── Helper: get logged-in agent from localStorage ── */
function getAgentUser() {
    try {
        const raw = localStorage.getItem("agent_user");
        if (raw) {
            const u = JSON.parse(raw);
            const nameParts = (u.name || "Agent").split(" ");
            const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
            return {
                name: u.name || "Agent",
                email: u.email || "",
                initials,
                avatar: u.profileImage || null,
                id: u._id || u.id || null,
            };
        }
    } catch (e) { /* ignore */ }
    return { name: "Agent", email: "", initials: "AG", avatar: null, id: null };
}

/* ── Count-up animation hook ── */
function useCountUp(target, loading, duration = 800) {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    useEffect(() => {
        if (loading || target == null) return;
        const numTarget = parseFloat(target) || 0;
        if (numTarget === 0) { setDisplay(0); return; }
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(numTarget * eased));
            if (progress < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, loading, duration]);
    return display;
}

/* ── Chart helpers ── */
function filterByPeriod(seriesData, period) {
    if (!seriesData || seriesData.length === 0) return [];
    if (period === 'Weekly') return seriesData.slice(-7);
    if (period === 'Yearly') {
        const buckets = [];
        for (let i = 0; i < seriesData.length; i += 7) {
            const chunk = seriesData.slice(i, i + 7);
            const total = chunk.reduce((s, d) => s + (d.count || 0), 0);
            buckets.push({ date: chunk[0].date, count: total });
        }
        return buckets;
    }
    return seriesData;
}

function buildChartPoints(seriesData, sharedMax) {
    if (!seriesData || seriesData.length === 0) return '';
    const svgH = 130, svgTop = 10, svgLeft = 28, svgRight = 375;
    const max = sharedMax || Math.max(...seriesData.map(d => d.count || 0), 1);
    return seriesData.map((d, i) => {
        const x = svgLeft + (i / (seriesData.length - 1 || 1)) * (svgRight - svgLeft);
        const y = svgH - ((d.count || 0) / max) * (svgH - svgTop);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
}

const CHANNELS_LIST = ["instagram", "whatsapp", "telegram", "facebook"];

const MENU_KEYS = [
    { key: "Dashboard", Icon: Squares2X2Icon },
    { key: "Tickets", Icon: ClipboardDocumentListIcon, hasBadge: true },
    { key: "Calls", Icon: PhoneIcon, hasCallBadge: true },
    { key: "Calendar", Icon: CalendarDaysIcon },
    { key: "Analytics", Icon: ArrowUpRightIcon },
];
const GENERAL_KEYS = [
    { key: "Profile", Icon: UserCircleIcon },
    { key: "Logout", Icon: ArrowRightOnRectangleIcon },
];

/* SVG brand icons for each channel */
function ChannelIcon({ channel, className }) {
    if (channel === "instagram") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="10%" stopColor="#fdf497" />
                    <stop offset="50%" stopColor="#fd5949" />
                    <stop offset="68%" stopColor="#d6249f" />
                    <stop offset="100%" stopColor="#285AEB" />
                </radialGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
            <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="1.8" fill="none" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
        </svg>
    );
    if (channel === "whatsapp") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#25D366" />
            <path d="M12 6.5a5.5 5.5 0 0 1 4.77 8.22l.67 2.45-2.52-.66A5.5 5.5 0 1 1 12 6.5z" fill="#fff" />
            <path d="M10 10.5c.2.4.42.8.7 1.14l.7.7c.35.27.73.5 1.14.67l.38-.38c.15-.15.37-.2.57-.13.44.17.9.28 1.37.32.25.02.44.23.44.48v1.2c0 .26-.21.47-.47.46A6.5 6.5 0 0 1 8.5 9.47c0-.26.2-.47.46-.47h1.2c.25 0 .46.2.48.44.04.47.15.93.32 1.37.07.2.02.42-.13.57l-.33.32z" fill="#25D366" />
        </svg>
    );
    if (channel === "telegram") return (
        <svg className={className} viewBox="2 2 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#0088cc" />
            <g transform="translate(-0.1, -0.7)">
                <path d="M7 12.35l5.5 2.1 2.3-1.15V13.3l-2.3 1.15-5.5-2.1V11.2l9-3.4 1.2 5.6-2.2 1.1-1-.55L7 11.2v1.15z" fill="#fff" opacity="0.4"/>
                <path d="M17.2 8L7 11.8l3 1.4.7 3.2 1.6-1.5 3.3 2.5 1.6-9.4z" fill="#fff" />
            </g>
        </svg>
    );
    if (channel === "facebook") return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#1877F2" />
            <path d="M13.5 12.5h1.75l.25-2H13.5v-1c0-.55.27-1 1.13-1H15.5V6.72A13.7 13.7 0 0 0 13.7 6.5c-1.84 0-3.04 1.1-3.04 3.1v1.9H9v2h1.66V18h2.34v-5.5z" fill="#fff" />
        </svg>
    );
    return null;
}


const PERIOD_OPTIONS = ["Monthly", "Weekly", "Yearly"];

function PeriodDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="cd-period-wrap">
            <span className="cd-sort-label" onClick={() => setOpen((o) => !o)}>
                Sort by: <strong>{value}</strong> <ChevronDownIcon className="cd-chevron-xs" />
            </span>
            {open && (
                <div className="cd-period-dropdown">
                    {PERIOD_OPTIONS.map((o) => (
                        <div
                            key={o}
                            className={`cd-period-option${value === o ? " cd-period-active" : ""}`}
                            onClick={() => { onChange(o); setOpen(false); }}
                        >
                            {o}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* Tiny inline sparkline (area mini-chart) for KPI cards.
   Renders an honest "no trend yet" placeholder when there's no real series. */
function Sparkline({ data, color = "#84cc16", height = 34, fillId }) {
    if (!data || data.length < 2 || data.every((v) => v === data[0])) {
        return <span className="cd-spark-empty">no trend yet</span>;
    }
    const W = 100, H = height;
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const stepX = W / (data.length - 1);
    const pts = data.map((v, i) => [i * stepX, H - ((v - min) / range) * (H - 4) - 2]);
    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L ${W} ${H} L 0 ${H} Z`;
    const gid = fillId || `spark-${Math.random().toString(36).slice(2, 8)}`;
    return (
        <svg className="cd-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={height}>
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* Compact mini bar-chart for KPI cards — accurate breakdown from real data.
   bars: [{ label, value, color }]. Bars are normalized to the max value. */
function MiniBars({ bars = [], height = 40 }) {
    const real = bars.filter((b) => b && typeof b.value === "number");
    const total = real.reduce((s, b) => s + b.value, 0);
    if (real.length === 0 || total === 0) {
        return <span className="cd-spark-empty">no data yet</span>;
    }
    const max = Math.max(...real.map((b) => b.value), 1);
    return (
        <div className="cd-minibars" style={{ height }}>
            {real.map((b, i) => {
                const pct = Math.max(6, Math.round((b.value / max) * 100));
                return (
                    <div key={i} className="cd-minibar-col" title={`${b.label}: ${b.value}`}>
                        <span className="cd-minibar-val">{b.value}</span>
                        <div className="cd-minibar-track">
                            <span
                                className="cd-minibar-fill"
                                style={{ height: `${pct}%`, background: b.color, animationDelay: `${i * 70}ms` }}
                            />
                        </div>
                        <span className="cd-minibar-label">{b.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

function StatCardLight({ title, value, note, badge, period, onPeriodChange, loading, pulseKey, style, icon: Icon, accent, spark, sparkColor, bars }) {
    const numericTarget = (!loading && value !== null && value !== undefined && /^\d+$/.test(String(value).trim()))
        ? parseFloat(value) : null;
    const animated = useCountUp(numericTarget, loading);
    const isEmpty = !loading && (value === 0 || value === '0' || value === '' || value == null);
    const displayValue = loading ? null
        : numericTarget !== null ? animated.toLocaleString()
        : isEmpty ? '—'
        : value;

    return (
        <div className="cd-stat-card cd-stat-card--animated" style={{ ...style, '--accent': accent || '#CAF301' }}>
            <div className="cd-stat-card-accent-bar" />
            <div className="cd-stat-card-header">
                <div className="cd-stat-title-row">
                    {Icon && (
                        <div className="cd-stat-icon-wrap" style={{ background: accent ? `${accent}18` : 'rgba(202,243,1,0.12)', border: `1px solid ${accent || '#CAF301'}30` }}>
                            <Icon className="cd-stat-icon" style={{ color: accent || '#3e622b' }} />
                        </div>
                    )}
                    <p className="cd-stat-title">{title}</p>
                </div>
                <div className="cd-stat-header-right">
                    {period && <PeriodDropdown value={period} onChange={onPeriodChange} />}
                    {!loading && <span key={pulseKey} className="cd-live-pulse" title="Live" />}
                    <span className="cd-stat-ext-link">
                        <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
                    </span>
                </div>
            </div>
            <div className="cd-stat-value-row">
                {loading
                    ? <div className="cd-stat-skeleton cd-stat-skeleton--value" />
                    : <p className={`cd-stat-value${isEmpty ? ' cd-stat-value--empty' : ''}`}>{displayValue}</p>
                }
                {!loading && !bars && spark && (
                    <div className="cd-stat-spark-wrap">
                        <Sparkline data={spark} color={sparkColor || accent || '#84cc16'} />
                    </div>
                )}
            </div>
            {!loading && bars && <MiniBars bars={bars} />}
            <p className="cd-stat-note">
                {badge !== undefined && badge !== '' && <span className="cd-note-badge">{badge}</span>} {note}
            </p>
        </div>
    );
}

function StatCardDark({ title, value, note, badge, period, onPeriodChange, loading, pulseKey, style, icon: Icon, spark, sparkColor, bars }) {
    const numericTarget = (!loading && value !== null && value !== undefined && /^\d+$/.test(String(value).trim()))
        ? parseFloat(value) : null;
    const animated = useCountUp(numericTarget, loading);
    const isEmpty = !loading && (value === 0 || value === '0' || value === '' || value == null);
    const displayValue = loading ? null
        : numericTarget !== null ? animated.toLocaleString()
        : isEmpty ? '—'
        : value;

    return (
        <div className="cd-stat-card cd-stat-card-dark cd-stat-card--animated" style={style}>
            <div className="cd-stat-card-header">
                <div className="cd-stat-title-row">
                    {Icon && (
                        <div className="cd-stat-icon-wrap cd-stat-icon-wrap--dark">
                            <Icon className="cd-stat-icon" style={{ color: '#CAF301' }} />
                        </div>
                    )}
                    <p className="cd-stat-title">{title}</p>
                </div>
                <div className="cd-stat-header-right">
                    {period && <PeriodDropdown value={period} onChange={onPeriodChange} />}
                    {!loading && <span key={pulseKey} className="cd-live-pulse cd-live-pulse--lime" title="Live" />}
                    <span className="cd-stat-ext-link">
                        <ArrowTopRightOnSquareIcon className="cd-ext-icon" />
                    </span>
                </div>
            </div>
            <div className="cd-stat-value-row">
                {loading
                    ? <div className="cd-stat-skeleton cd-stat-skeleton--value" />
                    : <p className={`cd-stat-value${isEmpty ? ' cd-stat-value--empty' : ''}`}>{displayValue}</p>
                }
                {!loading && !bars && spark && (
                    <div className="cd-stat-spark-wrap">
                        <Sparkline data={spark} color={sparkColor || '#CAF301'} />
                    </div>
                )}
            </div>
            {!loading && bars && <MiniBars bars={bars} />}
            <p className="cd-stat-note">
                {badge !== undefined && badge !== '' && <span className="cd-note-badge cd-note-badge-lime">{badge}</span>} {note}
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════
   CALENDAR VIEW
═══════════════════════════════════════ */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function CalendarView() {
    const today = new Date();
    const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(today);
    const [tasksByDate, setTasksByDate] = useState({});
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDesc, setTaskDesc] = useState("");
    const [taskTime, setTaskTime] = useState("");
    const [daySheetOpen, setDaySheetOpen] = useState(false);
    const [addingTask, setAddingTask] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const storageKey = "natiq_calendar_tasks";

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
        setSelectedDate(today);
    };

    // Build calendar grid (6 rows × 7 cols)
    const cells = [];
    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ day: daysInPrevMonth - i, outside: true, prev: true });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, outside: false });
    }
    // Next month leading days
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, outside: true, next: true });
    }

    const isToday = (day) =>
        !day.outside && day.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = (day) =>
        !day.outside && day.day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    const toDateKey = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, "0");
        const d = String(dateObj.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    useEffect(() => {
        const fetchAllTasks = async () => {
            try {
                const tasks = await agentApi.getTasks();
                const grouped = tasks.reduce((acc, task) => {
                    const key = task.date;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push({
                        id: task._id || task.id,
                        title: task.title,
                        time: task.time,
                        done: task.done
                    });
                    return acc;
                }, {});
                setTasksByDate(grouped);
            } catch (err) {
                console.error("Failed to load calendar tasks:", err);
            }
        };
        fetchAllTasks();
    }, []);

    const selectedKey = toDateKey(selectedDate);
    const selectedTasks = tasksByDate[selectedKey] || [];

    const closeDaySheet = useCallback(() => {
        setDaySheetOpen(false);
        setAddingTask(false);
        setEditingTask(null);
        setTaskTitle("");
        setTaskDesc("");
        setTaskTime("");
    }, []);


    useEffect(() => {
        if (!daySheetOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") closeDaySheet();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [daySheetOpen, closeDaySheet]);

    const getTaskCountForDay = (day) => {
        if (day.outside) return 0;
        const key = toDateKey(new Date(year, month, day.day));
        return (tasksByDate[key] || []).length;
    };

    const addTask = async () => {
        const cleanTitle = taskTitle.trim();
        if (!cleanTitle) return;
        try {
            const newTaskData = {
                title: cleanTitle,
                description: taskDesc.trim() || "",
                date: selectedKey,
                time: taskTime || null
            };
            const task = await agentApi.createTask(newTaskData);

            setTasksByDate((prev) => ({
                ...prev,
                [selectedKey]: [...(prev[selectedKey] || []), {
                    id: task._id || task.id,
                    title: task.title,
                    description: task.description || "",
                    time: task.time,
                    done: task.done
                }],
            }));
            setTaskTitle("");
            setTaskDesc("");
            setTaskTime("");
            setAddingTask(false);
        } catch (err) {
            console.error("Failed to add task:", err);
        }
    };

    const toggleTaskDone = async (taskId) => {
        const task = selectedTasks.find(t => t.id === taskId);
        if (!task) return;

        try {
            await agentApi.updateTask(taskId, { done: !task.done });
            setTasksByDate((prev) => ({
                ...prev,
                [selectedKey]: (prev[selectedKey] || []).map((t) =>
                    t.id === taskId ? { ...t, done: !t.done } : t
                ),
            }));
        } catch (err) {
            console.error("Failed to toggle task:", err);
        }
    };

    const updateTask = async () => {
        if (!editingTask) return;
        const cleanTitle = taskTitle.trim();
        if (!cleanTitle) return;

        try {
            const updatedTaskData = {
                title: cleanTitle,
                description: taskDesc.trim() || "",
                time: taskTime || null
            };
            const task = await agentApi.updateTask(editingTask.id, updatedTaskData);

            setTasksByDate((prev) => ({
                ...prev,
                [selectedKey]: (prev[selectedKey] || []).map((t) =>
                    t.id === editingTask.id ? {
                        ...t,
                        title: task.title,
                        description: task.description || "",
                        time: task.time
                    } : t
                ),
            }));
            setTaskTitle("");
            setTaskDesc("");
            setTaskTime("");
            setEditingTask(null);
            setAddingTask(false);
        } catch (err) {
            console.error("Failed to update task:", err);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await agentApi.deleteTask(taskId);
            setTasksByDate((prev) => ({
                ...prev,
                [selectedKey]: (prev[selectedKey] || []).filter((task) => task.id !== taskId),
            }));
        } catch (err) {
            console.error("Failed to delete task:", err);
        }
    };

    return (
        <div className="cd-calendar-layout">
            <div className="cd-page-heading cd-calendar-heading">
                <h1>Calendar</h1>
                <p>Track your schedule and upcoming tasks with Natiq.</p>
            </div>

            <div className="cd-calendar-card">
                <div className="cd-calendar-workspace">
                    <div className="cd-calendar-main">
                        <div className="cd-calendar-header">
                            <div className="cd-calendar-nav">
                                <button className="cd-cal-nav-btn" onClick={prevMonth}>
                                    <ChevronLeftIcon className="cd-cal-nav-icon" />
                                </button>
                                <h2 className="cd-cal-month-title">{MONTH_NAMES[month]} {year}</h2>
                                <button className="cd-cal-nav-btn" onClick={nextMonth}>
                                    <ChevronRightIcon className="cd-cal-nav-icon" />
                                </button>
                            </div>
                            <button className="cd-cal-today-btn" onClick={goToToday}>Today</button>
                        </div>

                        <div className="cd-calendar-grid cd-calendar-weekdays">
                            {WEEKDAYS.map((w) => (
                                <div key={w} className="cd-cal-weekday">{w}</div>
                            ))}
                        </div>

                        <div className="cd-calendar-grid cd-calendar-days">
                            {cells.map((cell, idx) => {
                                const taskCount = getTaskCountForDay(cell);
                                return (
                                    <div
                                        key={idx}
                                        className={`cd-cal-day${cell.outside ? " cd-cal-day-outside" : ""}${isToday(cell) ? " cd-cal-day-today" : ""}${isSelected(cell) && daySheetOpen ? " cd-cal-day-selected" : ""}`}
                                        onClick={() => {
                                            if (cell.outside) return;
                                            const d = new Date(year, month, cell.day);
                                            setSelectedDate(d);
                                            setDaySheetOpen(true);
                                            setAddingTask(false);
                                            setEditingTask(null);
                                            setTaskTitle("");
                                            setTaskDesc("");
                                            setTaskTime("");
                                        }}

                                    >
                                        <span className="cd-cal-day-number">{cell.day}</span>
                                        {!cell.outside && taskCount > 0 && (
                                            <span className="cd-cal-task-pill">{taskCount}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="cd-cal-hint">Click a day to view tasks and add new ones.</p>
                    </div>
                </div>
            </div>

            {daySheetOpen && (
                <>
                    <button
                        type="button"
                        className="cd-cal-day-sheet-backdrop"
                        aria-label="Close"
                        onClick={closeDaySheet}
                    />
                    <div
                        className="cd-cal-day-sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cd-cal-day-sheet-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="cd-cal-day-sheet-head">
                            <div>
                                <h2 id="cd-cal-day-sheet-title">
                                    {selectedDate.toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </h2>
                                <p className="cd-cal-day-sheet-meta">
                                    {selectedTasks.length === 0
                                        ? "No tasks scheduled"
                                        : `${selectedTasks.length} task${selectedTasks.length === 1 ? "" : "s"}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="cd-cal-day-sheet-close"
                                onClick={closeDaySheet}
                                aria-label="Close"
                            >
                                <XMarkIcon className="cd-cal-day-sheet-close-icon" />
                            </button>
                        </div>

                        <div className="cd-cal-day-sheet-body">
                            <div className="cd-cal-task-list">
                                {selectedTasks.length === 0 && !addingTask ? (
                                    <div className="cd-cal-task-empty cd-cal-task-empty--sheet">
                                        Nothing here yet. Use the button below to add a task.
                                    </div>
                                ) : (
                                    selectedTasks.map((task) => (
                                        <div key={task.id} className={`cd-cal-task-item${task.done ? " cd-cal-task-item-done" : ""}`}>
                                            <button
                                                type="button"
                                                className="cd-cal-task-check"
                                                onClick={() => toggleTaskDone(task.id)}
                                                title="Mark complete"
                                            >
                                                <CheckCircleIcon />
                                            </button>
                                            <div 
                                                className="cd-cal-task-info"
                                                onClick={() => {
                                                    setEditingTask(task);
                                                    setTaskTitle(task.title);
                                                    setTaskDesc(task.description || "");
                                                    setTaskTime(task.time || "");
                                                    setAddingTask(true);
                                                }}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <p>{task.title}</p>
                                                {task.description && <p className="cd-cal-task-desc-text">{task.description}</p>}
                                                <span>{task.time || "No time set"}</span>
                                            </div>
                                            <button
                                                type="button"
                                                className="cd-cal-task-delete"
                                                onClick={() => deleteTask(task.id)}
                                                title="Delete task"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="cd-cal-day-sheet-foot">
                            {!addingTask ? (
                                <button
                                    type="button"
                                    className="cd-cal-day-sheet-primary"
                                    onClick={() => {
                                        setAddingTask(true);
                                        setEditingTask(null);
                                        setTaskTitle("");
                                        setTaskDesc("");
                                        setTaskTime("");
                                    }}
                                >
                                    <PlusIcon className="cd-cal-task-plus" />
                                    Add task
                                </button>
                            ) : (
                                <div className="cd-cal-task-form cd-cal-task-form--sheet">
                                    <p className="cd-cal-task-prompt">
                                        {editingTask ? "Update this task" : "What do you want to add for this day?"}
                                    </p>
                                    <label className="cd-cal-task-field-label" htmlFor="cd-cal-task-title">Task</label>
                                    <input
                                        id="cd-cal-task-title"
                                        type="text"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        placeholder="What needs to be done?"
                                        autoFocus
                                    />
                                    <label className="cd-cal-task-field-label" htmlFor="cd-cal-task-desc">
                                        Description <span className="cd-cal-task-optional">(optional)</span>
                                    </label>
                                    <textarea
                                        id="cd-cal-task-desc"
                                        className="cd-cal-task-textarea"
                                        value={taskDesc}
                                        onChange={(e) => setTaskDesc(e.target.value)}
                                        placeholder="Add more details…"
                                        rows={3}
                                    />
                                    <label className="cd-cal-task-field-label" htmlFor="cd-cal-task-time">
                                        Time <span className="cd-cal-task-optional">(optional)</span>
                                    </label>
                                    <input
                                        id="cd-cal-task-time"
                                        type="time"
                                        value={taskTime}
                                        onChange={(e) => setTaskTime(e.target.value)}
                                    />
                                    <div className="cd-cal-task-form-row">
                                        <button
                                            type="button"
                                            className="cd-cal-task-secondary"
                                            onClick={() => {
                                                setAddingTask(false);
                                                setEditingTask(null);
                                                setTaskTitle("");
                                                setTaskDesc("");
                                                setTaskTime("");
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button" 
                                            className="cd-cal-task-primary" 
                                            onClick={editingTask ? updateTask : addTask}
                                        >
                                            {editingTask ? "Update task" : "Save task"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
══════════════════════════════════════ */
function useToast() {
    const [toasts, setToasts] = useState([]);
    const show = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    const ToastContainer = () => (
        <div className="cd-toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`cd-toast cd-toast-${t.type}`}>
                    <span className="cd-toast-icon">
                        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    {t.message}
                </div>
            ))}
        </div>
    );
    return { show, ToastContainer };
}

/* ═══════════════════════════════════════
   TICKETS VIEW
═══════════════════════════════════════ */
function TicketsView() {
    const [searchParams, setSearchParams] = useSearchParams();
    const filter = searchParams.get("filter") || "Pending";
    const channel = searchParams.get("channel") || "all";
    
    const setFilter = (val) => {
        const params = { filter: val };
        if (channel !== 'all') params.channel = channel;
        setSearchParams(params);
    };
    
    const setChannel = (val) => {
        const params = { filter };
        if (val !== 'all') params.channel = val;
        setSearchParams(params);
    };

    const [tickets, setTickets] = useState([]);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const messagesEndRef = useRef(null);
    const activeTicketRef = useRef(null);
    const chatInputRef = useRef(null);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const { show: showToast, ToastContainer } = useToast();

    // Auto-focus input when ticket selection changes
    useEffect(() => {
        if (selectedTicket && selectedTicket.status !== 'closed' && chatInputRef.current) {
            // Focus when messages finish loading or ticket is selected
            if (!loadingMessages) {
                setTimeout(() => {
                    chatInputRef.current?.focus();
                }, 100);
            }
        }
    }, [selectedTicket, loadingMessages]);

    useEffect(() => {
        activeTicketRef.current = selectedTicket;
    }, [selectedTicket]);

    const [socketInstance, setSocketInstance] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('agent_token');
        if (!token) return;

        const socket = io(`${process.env.REACT_APP_SOCKET_URL || ''}/admin`, {
            auth: { token }
        });

        socket.on('ticket:message:new', (payload) => {
            if (activeTicketRef.current && activeTicketRef.current._id === payload.ticketId) {
                if (payload.role !== 'agent') {
                    setMessages(prev => [...prev, payload]);
                }
            }
            setRefreshTrigger(prev => prev + 1);
        });

        socket.on('ticket:new', () => {
            setRefreshTrigger(prev => prev + 1);
        });

        setSocketInstance(socket);

        return () => {
            socket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socketInstance && selectedTicket) {
            socketInstance.emit('ticket:watch', selectedTicket._id);
            return () => {
                socketInstance.emit('ticket:unwatch', selectedTicket._id);
            };
        }
    }, [socketInstance, selectedTicket]);

    const filters = ["Pending", "Assigned", "Opened", "Closed"];

    const fetchTickets = useCallback(async (silent = false) => {
        if (!silent) setLoadingTickets(true);
        try {
            let queryParams = "";
            const parts = [];
            if (filter === "Pending") parts.push("queue=unassigned");
            else if (filter === "Assigned") parts.push("queue=assigned");
            else if (filter === "Opened") parts.push("status=in_progress");
            else if (filter === "Closed") parts.push("status=closed");
            
            if (channel !== 'all') parts.push(`channel=${channel}`);
            
            if (parts.length > 0) queryParams = "?" + parts.join("&");

            const data = await agentApi.getTickets(queryParams);
            const returnedTickets = data.tickets || [];
            setTickets(returnedTickets);
        } catch (error) {
            console.error("Fetch tickets error:", error);
        } finally {
            if (!silent) setLoadingTickets(false);
        }
    }, [filter, channel]);

    const fetchMessages = useCallback(async (ticketId) => {
        setLoadingMessages(true);
        try {
            const data = await agentApi.getTicketMessages(ticketId);
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Fetch messages error:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        // Only clear selected ticket if it's a manual filter change, 
        // not an automatic selection from claim
        if (!selectedTicket || (selectedTicket.status !== 'in_progress' && filter === 'Opened')) {
            setSelectedTicket(null);
        }
        fetchTickets();
    }, [filter, channel, selectedTicket, fetchTickets]);

    // Use a separate effect for refresh triggered by sockets (debounced)
    useEffect(() => {
        if (refreshTrigger > 0) {
            const timer = setTimeout(() => {
                fetchTickets(true); // silent refresh for sockets
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [refreshTrigger, fetchTickets]);

    useEffect(() => {
        if (selectedTicket) {
            fetchMessages(selectedTicket._id);
        }
    }, [selectedTicket, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!inputMsg.trim() || !selectedTicket) return;
        try {
            // Optimistic update
            const newMsg = { id: Date.now(), role: 'agent', content: inputMsg };
            setMessages(prev => [...prev, newMsg]);
            const msgToSend = inputMsg;
            setInputMsg("");

            await agentApi.replyToTicket(selectedTicket._id, msgToSend);
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    const handleClaim = async () => {
        if (!selectedTicket) return;
        try {
            await agentApi.claimTicket(selectedTicket._id);
            showToast('Ticket claimed successfully!', 'success');
            // Update the local status immediately so the UI doesn't clear it
            setSelectedTicket(prev => ({ ...prev, status: 'in_progress' }));
            setFilter("Opened");
        } catch (error) {
            console.error("Claim failed:", error);
            showToast('Failed to claim ticket.', 'error');
        }
    };

    const handleClose = async () => {
        if (!selectedTicket) return;
        try {
            await agentApi.closeTicket(selectedTicket._id);
            showToast('Ticket closed successfully!', 'success');
            setFilter("Closed");
        } catch (error) {
            console.error("Close failed:", error);
            showToast('Failed to close ticket.', 'error');
        }
    };

    // Helper: format relative time
    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const priorityIcon = (p) => {
        const level = (p || 'normal').toLowerCase();
        if (level === 'urgent' || level === 'high') return 'cd-priority-high';
        if (level === 'low') return 'cd-priority-low';
        return 'cd-priority-normal';
    };

    return (
        <div className="cd-wa-layout">
            <ToastContainer />
            <div className="cd-wa-rail">
                <button 
                    className={`cd-wa-rail-btn ${channel === 'all' ? 'cd-wa-rail-active' : ''}`}
                    onClick={() => setChannel('all')}
                    title="All Channels"
                >
                    <span className="cd-wa-rail-all-text">All</span>
                </button>
                {CHANNELS_LIST.map(ch => (
                    <button 
                        key={ch}
                        className={`cd-wa-rail-btn ${channel === ch ? 'cd-wa-rail-active' : ''}`}
                        onClick={() => setChannel(ch)}
                        title={ch}
                    >
                        <ChannelIcon channel={ch} className="cd-wa-rail-icon" />
                    </button>
                ))}
            </div>

            {/* ── 2. Middle Sidebar (Chats) ── */}
            <div className="cd-wa-sidebar">
                <div className="cd-wa-sidebar-header">
                    <h2>Chats</h2>
                </div>
                
                <div className="cd-wa-search-wrap">
                    <div className="cd-wa-search-box">
                        <MagnifyingGlassIcon className="cd-wa-search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search or start a new chat"
                            className="cd-wa-search-input"
                        />
                    </div>
                </div>

                <div className="cd-wa-pills-row">
                    {filters.map((f) => (
                        <button
                            key={f}
                            className={`cd-wa-pill ${filter === f ? "cd-wa-pill-active" : ""}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="cd-wa-list">
                    {loadingTickets ? (
                        <div className="cd-tkt-loading">
                            <div className="cd-spinner-small" />
                            <span>Syncing conversations...</span>
                        </div>
                    ) : (
                        <>
                            {tickets.map((t) => (
                                <TicketCard
                                    key={t._id}
                                    ticket={t}
                                    isActive={selectedTicket?._id === t._id}
                                    onClick={() => setSelectedTicket(t)}
                                    formatRelativeTime={formatRelativeTime}
                                    priorityIcon={priorityIcon}
                                />
                            ))}
                            {tickets.length === 0 && (
                                <div className="cd-tkt-empty-modern">
                                    <div className="cd-empty-icon-glow">
                                        <ClipboardDocumentListIcon className="cd-tkt-empty-icon-m" />
                                    </div>
                                    <p className="cd-tkt-empty-text-m">No chats found</p>
                                    <p className="cd-tkt-empty-sub-m">Try changing your filters.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── 3. Right Main Area (chat view) ── */}
            <div className="cd-wa-chat-area">
                {!selectedTicket ? (
                    <div className="cd-chat-placeholder">
                        <div className="cd-placeholder-icon-wrap">
                            <ChatBubbleLeftRightIcon className="cd-placeholder-icon" />
                        </div>
                        <h3 className="cd-placeholder-title">Your Conversations</h3>
                        <p className="cd-placeholder-text">Select a ticket from the list on the left to start messaging or view history.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="cd-chat-header">
                            <div className="cd-chat-header-left">
                                <div className={`cd-chat-avatar cd-chat-avatar-active`}>
                                    {selectedTicket.userId?.name?.substring(0, 2).toUpperCase() || 'CU'}
                                </div>
                                <div className="cd-chat-user-info">
                                    <div className="cd-chat-name-row">
                                        <span className="cd-chat-name">{selectedTicket.userId?.name || 'Customer'}</span>
                                        {selectedTicket?.channel && <ChannelIcon channel={selectedTicket.channel} className="cd-chat-channel-badge" />}
                                    </div>
                                    <div className="cd-chat-meta-row">
                                        <span className={`cd-chat-status-pill cd-chat-status-${selectedTicket.status?.replace('_', '-')}`}>
                                            {selectedTicket.status?.replace('_', ' ')}
                                        </span>
                                        <span className="cd-chat-ticket-num">#{selectedTicket.ticketNumber}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="cd-chat-header-actions">
                                {filter === "Pending" && (
                                    <button className="cd-chat-action-btn cd-chat-claim-btn" onClick={handleClaim}>
                                        <PlusIcon className="cd-chat-btn-icon" />
                                        Claim
                                    </button>
                                )}
                                {(filter === "Opened" || filter === "Assigned") && (
                                    <button className="cd-chat-action-btn cd-chat-close-btn" onClick={handleClose}>
                                        Close Ticket
                                    </button>
                                )}
                                <button className="cd-chat-more-btn">
                                    <EllipsisHorizontalIcon className="cd-chat-more-icon" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="cd-chat-messages">
                            {loadingMessages ? (
                                <div className="cd-chat-loading">
                                    <div className="cd-spinner" />
                                    <span>Retrieving messages...</span>
                                </div>
                            ) : (
                                <>
                                    {messages.length === 0 && (
                                        <div className="cd-chat-empty-state">
                                            <EnvelopeIcon className="cd-chat-empty-icon" />
                                            <p>No messages yet</p>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <MessageItem
                                            key={idx}
                                            msg={msg}
                                            idx={idx}
                                            selectedTicket={selectedTicket}
                                        />
                                    ))}
                                </>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input bar or Closed status */}
                        {selectedTicket.status === 'closed' ? (
                            <div className="cd-chat-closed-notice">
                                <div className="cd-closed-icon-wrap">
                                    <NoSymbolIcon className="cd-closed-icon" />
                                </div>
                                <p className="cd-closed-text">Sending or receiving messages in this ticket is not allowed</p>
                            </div>
                        ) : (
                            <div className="cd-chat-input-bar">
                                <button className="cd-chat-attach-btn">
                                    <PlusIcon className="cd-chat-attach-icon" />
                                </button>
                                <div className="cd-chat-input-wrap">
                                    <input
                                        ref={chatInputRef}
                                        className="cd-chat-input"
                                        type="text"
                                        placeholder={selectedTicket.status === 'in_progress' || (filter === "Assigned" && selectedTicket.status === 'open') ? "Type your message..." : "Claim this ticket to reply..."}
                                        value={inputMsg}
                                        onChange={(e) => setInputMsg(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={selectedTicket.status !== 'in_progress' && (filter !== "Assigned" || selectedTicket.status !== 'open')}
                                    />
                                    <button className="cd-chat-mic-btn">
                                        <MicrophoneIcon className="cd-chat-mic-icon" />
                                    </button>
                                </div>
                                <button
                                    className={`cd-chat-send-btn ${inputMsg.trim() ? 'cd-chat-send-active' : ''}`}
                                    onClick={handleSend}
                                    disabled={!inputMsg.trim() || (selectedTicket.status !== 'in_progress' && (filter !== "Assigned" || selectedTicket.status !== 'open'))}
                                >
                                    <PaperAirplaneIcon className="cd-chat-send-icon" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS (Memoized for Performance)
═══════════════════════════════════════ */

const TicketCard = memo(({ ticket, isActive, onClick, formatRelativeTime, priorityIcon }) => {
    const initials = ticket?.userId?.name?.substring(0, 2).toUpperCase() || 'CU';
    const pClass = priorityIcon(ticket?.priority);

    return (
        <div
            className={`cd-tkt-card${isActive ? " cd-tkt-card-active" : ""}`}
            onClick={onClick}
        >
            <div className="cd-tkt-card-top">
                <div className="cd-tkt-card-left">
                    <div className="cd-tkt-avatar-wrap">
                        <div className={`cd-tkt-avatar ${isActive ? 'cd-tkt-avatar-active' : ''}`}>{initials}</div>
                        {ticket.channel && <ChannelIcon channel={ticket.channel} className="cd-tkt-card-chan-icon" />}
                    </div>
                    <div className="cd-tkt-info">
                        <span className="cd-tkt-name">{ticket?.userId?.name || 'Customer'}</span>
                        <span className="cd-tkt-preview-line">
                            <HashtagIcon className="cd-tkt-hash-icon" />
                            {ticket?.ticketNumber}
                            <span className={`cd-tkt-priority-dot ${pClass}`} />
                            <span className="cd-tkt-priority-text">{ticket?.priority || 'normal'}</span>
                        </span>
                    </div>
                </div>
                <div className="cd-tkt-card-right">
                    <span className="cd-tkt-time-ago">
                        <ClockIcon className="cd-tkt-clock-icon" />
                        {formatRelativeTime(ticket?.createdAt)}
                    </span>
                    {ticket?.channel && <ChannelIcon channel={ticket.channel} className="cd-tkt-channel-chip" />}
                </div>
            </div>
            {isActive && <div className="cd-tkt-card-indicator" />}
        </div>
    );
});

const CallQueueCard = memo(({ call, isActive, onClick, formatRelativeTime }) => {
    const initials = (call.customerName || "CU").substring(0, 2).toUpperCase();
    const ts = call.startedAt || call.createdAt;

    return (
        <div
            className={`cd-tkt-card${isActive ? " cd-tkt-card-active" : ""}`}
            onClick={onClick}
        >
            <div className="cd-tkt-card-top">
                <div className="cd-tkt-card-left">
                    <div className="cd-tkt-avatar-wrap">
                        <div className={`cd-tkt-avatar ${isActive ? "cd-tkt-avatar-active" : ""}`}>{initials}</div>
                    </div>
                    <div className="cd-tkt-info">
                        <span className="cd-tkt-name">{call.customerName || "Customer"}</span>
                        <span className="cd-tkt-preview-line">
                            <PhoneIcon className="cd-tkt-hash-icon" />
                            Incoming call
                        </span>
                    </div>
                </div>
                <div className="cd-tkt-card-right">
                    <span className="cd-tkt-time-ago">
                        <ClockIcon className="cd-tkt-clock-icon" />
                        {formatRelativeTime(ts)}
                    </span>
                </div>
            </div>
            {isActive && <div className="cd-tkt-card-indicator" />}
        </div>
    );
});

const MessageItem = memo(({ msg, idx, selectedTicket }) => {
    let source = 'customer';
    if (msg.role === 'agent') source = 'agent';
    if (msg.role === 'assistant' || msg.role === 'system') source = 'assistant';

    const showTime = msg.createdAt || msg.timestamp;

    return (
        <div className={`cd-msg-row cd-msg-${source}`}>
            {source !== 'agent' && (
                <div className="cd-msg-avatar-sm">
                    {source === 'assistant' ? 'AI' : (selectedTicket?.userId?.name?.substring(0, 2).toUpperCase() || 'CU')}
                </div>
            )}
            <div className="cd-msg-content-wrap">
                <div className={`cd-msg-bubble cd-bubble-${source}`}>
                    {msg.content}
                </div>
                {showTime && (
                    <span className={`cd-msg-time cd-msg-time-${source}`}>
                        {new Date(showTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>
        </div>
    );
});

function formatCallDuration(totalSec) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Maps agent microphone frequency energy to bar heights (0–1 per band). */
function useMicLevelBands(mediaStream, bandCount) {
    const [levels, setLevels] = useState(null);
    const smoothRef = useRef([]);

    useEffect(() => {
        if (!mediaStream) {
            smoothRef.current = [];
            setLevels(null);
            return undefined;
        }
        if (!mediaStream.getAudioTracks().length) {
            setLevels(null);
            return undefined;
        }

        let audioCtx;
        let source;
        let analyser;
        let rafId;
        let cancelled = false;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(mediaStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.72;
            source.connect(analyser);
        } catch (e) {
            console.warn("[Mic viz] setup failed:", e);
            setLevels(null);
            return undefined;
        }

        if (smoothRef.current.length !== bandCount) {
            smoothRef.current = Array.from({ length: bandCount }, () => 0.06);
        }

        const freqData = new Uint8Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);
        /* First FFT bins = DC / rumble; on mic they often read “full” even in silence — skip them. */
        const skipLowBins = 20;

        const tick = () => {
            if (cancelled || !analyser) return;
            if (audioCtx.state === "suspended") {
                audioCtx.resume().catch(() => {});
            }
            analyser.getByteTimeDomainData(timeData);
            let sumSq = 0;
            for (let i = 0; i < timeData.length; i++) {
                const x = (timeData[i] - 128) / 128;
                sumSq += x * x;
            }
            const rms = Math.sqrt(sumSq / timeData.length);
            const micOpen = mediaStream.getAudioTracks().some((t) => t.readyState === "live" && t.enabled);
            /* How much real signal is on the mic (time domain). Kills false “full bars” when quiet. */
            const speechGain = !micOpen
                ? 0
                : Math.min(1, Math.max(0, (rms - 0.012) / 0.055));

            analyser.getByteFrequencyData(freqData);
            const maxBin = Math.min(freqData.length - 1, Math.floor(freqData.length * 0.92));
            const span = Math.max(bandCount * 2, maxBin - skipLowBins);

            const next = [];
            for (let i = 0; i < bandCount; i++) {
                const startBin = Math.min(maxBin, skipLowBins + Math.floor((i / bandCount) * span));
                const endBin = Math.min(
                    maxBin,
                    Math.max(startBin, skipLowBins + Math.floor(((i + 1) / bandCount) * span))
                );
                let peak = 0;
                for (let j = startBin; j <= endBin; j++) {
                    peak = Math.max(peak, freqData[j] / 255);
                }
                let boosted = Math.min(1, peak * 2.05);
                boosted *= 0.1 + 0.9 * speechGain;
                const prev = smoothRef.current[i] ?? 0.06;
                const smooth = prev * 0.62 + boosted * 0.38;
                smoothRef.current[i] = smooth;
                const v = micOpen ? smooth : Math.min(smooth * 0.12, 0.07);
                next.push(v);
            }
            setLevels(next);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            try {
                source?.disconnect();
                analyser?.disconnect();
            } catch (_) {
                /* noop */
            }
            if (audioCtx) {
                audioCtx.close().catch(() => {});
            }
        };
    }, [mediaStream, bandCount]);

    return levels;
}

/** Smoothed 0–1 envelope from remote (customer) audio — drives avatar rings. */
function useRemoteAudioEnvelope(mediaStream) {
    const [level, setLevel] = useState(0);
    const smoothRef = useRef(0);

    useEffect(() => {
        if (!mediaStream || !mediaStream.getAudioTracks().length) {
            smoothRef.current = 0;
            setLevel(0);
            return undefined;
        }

        let audioCtx;
        let source;
        let analyser;
        let rafId;
        let cancelled = false;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaStreamSource(mediaStream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.78;
            source.connect(analyser);
        } catch (e) {
            console.warn("[Remote audio viz] setup failed:", e);
            return undefined;
        }

        const buf = new Uint8Array(analyser.fftSize);

        const tick = () => {
            if (cancelled || !analyser) return;
            if (audioCtx.state === "suspended") {
                audioCtx.resume().catch(() => {});
            }
            analyser.getByteTimeDomainData(buf);
            let sumSq = 0;
            for (let i = 0; i < buf.length; i++) {
                const x = (buf[i] - 128) / 128;
                sumSq += x * x;
            }
            const rms = Math.sqrt(sumSq / buf.length);
            const inst = Math.min(1, rms * 5.5);
            smoothRef.current = smoothRef.current * 0.74 + inst * 0.26;
            setLevel(smoothRef.current);
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            try {
                source?.disconnect();
                analyser?.disconnect();
            } catch (_) {
                /* noop */
            }
            if (audioCtx) {
                audioCtx.close().catch(() => {});
            }
        };
    }, [mediaStream]);

    return level;
}

function CallWaveBars({ count = 9, levels = null }) {
    const live = Array.isArray(levels) && levels.length >= count;
    return (
        <div className="cd-call-session-wave" aria-hidden>
            {Array.from({ length: count }, (_, i) => {
                const lv = live ? Math.max(0, Math.min(1, levels[i])) : 0;
                return (
                    <span
                        key={i}
                        className={`cd-call-session-wave-bar${live ? " cd-call-session-wave-bar-live" : ""}`}
                        style={
                            live
                                ? {
                                      height: `${6 + lv * 54}px`,
                                      opacity: 0.4 + lv * 0.6,
                                      animation: "none",
                                  }
                                : { animationDelay: `${i * 0.07}s` }
                        }
                    />
                );
            })}
        </div>
    );
}

function CallSessionLive({ activeCall, callMuted, micStream, customerAudioStream, onHangup, onToggleMute }) {
    const [elapsed, setElapsed] = useState(0);
    const bandLevels = useMicLevelBands(micStream, 9);
    const remoteEnvelope = useRemoteAudioEnvelope(customerAudioStream);
    const ringsFollowCustomer = !!customerAudioStream;

    useEffect(() => {
        if (!activeCall?.answeredAt) return undefined;
        const start = new Date(activeCall.answeredAt).getTime();
        const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [activeCall?.callId, activeCall?.answeredAt]);

    const name = activeCall.customerName || "Customer";
    const initials = name.substring(0, 2).toUpperCase();

    return (
        <div className="cd-call-session cd-call-session-live">
            <div className="cd-call-session-bg" aria-hidden />
            <div className="cd-call-session-vignette" aria-hidden />
            <div className="cd-call-session-inner">
                <p className="cd-call-session-kicker">On air</p>
                <div className="cd-call-session-avatar-stage">
                    <span
                        className={`cd-call-session-ring cd-call-session-ring-1${ringsFollowCustomer ? " cd-call-session-ring-live" : ""}`}
                        style={
                            ringsFollowCustomer
                                ? {
                                      transform: `translate(-50%, -50%) scale(${0.88 + remoteEnvelope * 0.2})`,
                                      opacity: 0.22 + remoteEnvelope * 0.68,
                                  }
                                : undefined
                        }
                    />
                    <span
                        className={`cd-call-session-ring cd-call-session-ring-2${ringsFollowCustomer ? " cd-call-session-ring-live" : ""}`}
                        style={
                            ringsFollowCustomer
                                ? {
                                      transform: `translate(-50%, -50%) scale(${0.88 + remoteEnvelope * 0.28})`,
                                      opacity: 0.12 + remoteEnvelope * 0.58,
                                  }
                                : undefined
                        }
                    />
                    <div className="cd-call-session-avatar">{initials}</div>
                </div>
                <h2 className="cd-call-session-title">{name}</h2>
                <p className="cd-call-session-sub">Voice session · you are connected</p>
                <CallWaveBars levels={bandLevels} />
                <p className="cd-call-session-timer">{formatCallDuration(elapsed)}</p>
                <div className="cd-call-session-dock">
                    <div className="cd-call-session-dock-item">
                        <button
                            type="button"
                            className={`cd-call-session-round cd-call-session-round-mic${callMuted ? " is-muted" : ""}`}
                            onClick={onToggleMute}
                            title={callMuted ? "Unmute microphone" : "Mute microphone"}
                        >
                            <MicrophoneIcon className="cd-call-session-round-icon" />
                        </button>
                        <span className="cd-call-session-dock-label">{callMuted ? "Muted" : "Mic"}</span>
                    </div>
                    <div className="cd-call-session-dock-item">
                        <button
                            type="button"
                            className="cd-call-session-round cd-call-session-round-end"
                            onClick={onHangup}
                            title="End call"
                        >
                            <PhoneXMarkIcon className="cd-call-session-round-icon" />
                        </button>
                        <span className="cd-call-session-dock-label">End</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CallSessionRinging({ call, onAccept }) {
    const name = call.customerName || "Customer";
    const initials = name.substring(0, 2).toUpperCase();

    return (
        <div className="cd-call-session cd-call-session-ringing">
            <div className="cd-call-session-bg cd-call-session-bg-ringing" aria-hidden />
            <div className="cd-call-session-vignette" aria-hidden />
            <div className="cd-call-session-inner">
                <p className="cd-call-session-kicker cd-call-session-kicker-amber">Incoming</p>
                <div className="cd-call-session-avatar-stage">
                    <span className="cd-call-session-ring cd-call-session-ring-1 cd-call-session-ring-amber" />
                    <span className="cd-call-session-ring cd-call-session-ring-2 cd-call-session-ring-amber" />
                    <div className="cd-call-session-avatar cd-call-session-avatar-amber">{initials}</div>
                </div>
                <h2 className="cd-call-session-title">{name}</h2>
                <p className="cd-call-session-sub">Waiting on you — pick up</p>
                <CallWaveBars count={7} />
                <div className="cd-call-session-dock cd-call-session-dock-wide">
                    <button type="button" className="cd-call-btn cd-call-answer" onClick={onAccept} title="Accept">
                        <PhoneIcon style={{ width: 28, height: 28 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   CALLS VIEW
═══════════════════════════════════════ */
function CallsView({
    availableCalls = [],
    activeCall,
    callMuted,
    agentMicStream,
    customerAudioStream,
    onAcceptCall,
    onHangup,
    onToggleMute,
}) {
    const [selectedCallId, setSelectedCallId] = useState(null);

    const sortedCalls = useMemo(
        () =>
            [...availableCalls].sort(
                (a, b) =>
                    new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now())
            ),
        [availableCalls]
    );

    const selectedQueueCall = useMemo(
        () => sortedCalls.find((c) => c.callId === selectedCallId) || null,
        [sortedCalls, selectedCallId]
    );

    useEffect(() => {
        if (activeCall) setSelectedCallId(null);
    }, [activeCall]);

    useEffect(() => {
        if (selectedCallId && !sortedCalls.some((c) => c.callId === selectedCallId)) {
            setSelectedCallId(null);
        }
    }, [selectedCallId, sortedCalls]);

    const formatRelativeTime = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now - d;
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return `${diffDays}d ago`;
    };

    const handleAcceptSelected = () => {
        if (!selectedQueueCall) return;
        onAcceptCall(selectedQueueCall.callId);
    };

    return (
        <div className="cd-wa-layout">
            <div className="cd-wa-sidebar cd-wa-sidebar-calls">
                <div className="cd-wa-sidebar-header">
                    <h2>Calls</h2>
                </div>

                <div className="cd-wa-list">
                    {sortedCalls.length === 0 ? (
                        <div className="cd-tkt-empty-modern">
                            <div className="cd-empty-icon-glow">
                                <PhoneIcon className="cd-tkt-empty-icon-m" />
                            </div>
                            <p className="cd-tkt-empty-text-m">No calls in queue</p>
                            <p className="cd-tkt-empty-sub-m">New calls appear here when someone rings.</p>
                        </div>
                    ) : (
                        sortedCalls.map((call) => (
                            <CallQueueCard
                                key={call.callId}
                                call={call}
                                isActive={selectedCallId === call.callId}
                                formatRelativeTime={formatRelativeTime}
                                onClick={() => setSelectedCallId(call.callId)}
                            />
                        ))
                    )}
                </div>
            </div>

            <div
                className={`cd-wa-chat-area${activeCall || selectedQueueCall ? " cd-wa-chat-area-call-immersive" : ""}`}
            >
                {activeCall ? (
                    <CallSessionLive
                        activeCall={activeCall}
                        callMuted={callMuted}
                        micStream={agentMicStream}
                        customerAudioStream={customerAudioStream}
                        onHangup={onHangup}
                        onToggleMute={onToggleMute}
                    />
                ) : selectedQueueCall ? (
                    <CallSessionRinging
                        call={selectedQueueCall}
                        onAccept={handleAcceptSelected}
                    />
                ) : (
                    <div className="cd-chat-placeholder">
                        <div className="cd-placeholder-icon-wrap">
                            <PhoneIcon className="cd-placeholder-icon" />
                        </div>
                        <h3 className="cd-placeholder-title">Your calls</h3>
                        <p className="cd-placeholder-text">
                            Select a call from the list on the left to accept.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   ANALYTICS VIEW
═══════════════════════════════════════ */

/** Map raw sentiment → { label, tone } for pill styling. */
function emotionMeta(raw) {
    const key = (raw || "neutral").toLowerCase();
    if (key.includes("very") && key.includes("neg")) return { label: "Very negative", tone: "vneg" };
    if (key.includes("neg") || key === "angry") return { label: "Negative", tone: "neg" };
    if (key.includes("pos") || key === "happy") return { label: "Positive", tone: "pos" };
    return { label: raw ? raw.replace(/_/g, " ") : "Neutral", tone: "neu" };
}

/** Map resolution status → tone. */
function statusMeta(raw) {
    const key = (raw || "unknown").toLowerCase();
    if (key.includes("resolved") && !key.includes("un")) return { label: "Resolved", tone: "ok" };
    if (key.includes("contained")) return { label: "Contained", tone: "info" };
    if (key.includes("unresolved") || key.includes("pending")) return { label: "Unresolved", tone: "bad" };
    return { label: raw ? raw.replace(/_/g, " ") : "Unknown", tone: "neu" };
}

/** Score (0–10) → tone band for chips/bars. */
function scoreTone(n) {
    if (n >= 7) return "good";
    if (n >= 4) return "mid";
    return "low";
}

function initialsOf(name) {
    return (name || "U").trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

/* ── Small radial gauge for SLA / score % ── */
function RadialGauge({ value = 0, label, color = "#16a34a", size = 92 }) {
    const r = 40, c = 2 * Math.PI * r;
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className="cd-fa-gauge" style={{ width: size }}>
            <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(4,40,53,0.08)" strokeWidth="9" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                    strokeDasharray={`${(c * pct) / 100} ${c}`}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 0.9s cubic-bezier(0.34,1.4,0.5,1)" }} />
            </svg>
            <div className="cd-fa-gauge-center">
                <span className="cd-fa-gauge-val">{Math.round(value)}%</span>
            </div>
            {label && <span className="cd-fa-gauge-label">{label}</span>}
        </div>
    );
}

/* status pill tone mapper for performance insights */
function statusTone(s) {
    const k = (s || "").toLowerCase();
    if (["high", "excellent", "fast", "improving", "good"].includes(k)) return "good";
    if (["average", "stable", "moderate", "idle"].includes(k)) return "mid";
    if (["low", "slow", "declining", "high_load", "overloaded", "poor"].includes(k)) return "low";
    return "neu";
}

function fmtRelative(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function AnalyticsView() {
    const [filter, setFilter] = useState("All Tickets");
    const [filterOpen, setFilterOpen] = useState(false);
    const [analyticsData, setAnalyticsData] = useState([]);

    // active analytics sub-tab: 'performance' | 'quality' | 'records'
    const [subTab, setSubTab] = useState("performance");

    // GSAP scope root
    const aaRootRef = useRef(null);

    // ── Agent performance analytics (from dashboard overview endpoint) ──
    const [perf, setPerf] = useState(null);
    const [perfLoading, setPerfLoading] = useState(true);

    const fetchPerformance = useCallback(async () => {
        setPerfLoading(true);
        try {
            const data = await agentApi.getDashboardOverview();
            setPerf(data.dashboard || data);
        } catch (error) {
            console.error("Fetch agent analytics failed:", error);
        } finally {
            setPerfLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPerformance();
    }, [fetchPerformance]);

    // ── Full analytics (KPIs/SLA/insights/skills/goals/recs/activity/calls) ──
    const [full, setFull] = useState(null);
    const [fullLoading, setFullLoading] = useState(true);
    const [fullError, setFullError] = useState(false);
    const fetchFull = useCallback(async () => {
        setFullLoading(true);
        setFullError(false);
        try {
            const data = await agentApi.getFullAnalytics();
            setFull(data.analytics || data);
        } catch (error) {
            console.error("Fetch full analytics failed:", error);
            setFullError(true);
        } finally {
            setFullLoading(false);
        }
    }, []);
    useEffect(() => { fetchFull(); }, [fetchFull]);

    const fetchAnalytics = useCallback(async () => {
        try {
            let queryParams = "";
            if (filter === "Resolved") queryParams = "?status=resolved";
            else if (filter === "Pending") queryParams = "?status=unresolved";
            else if (filter === "High Emotion") queryParams = "?sentiment=positive";
            else if (filter === "Low Emotion") queryParams = "?sentiment=negative";

            const data = await agentApi.getQAAutomatedResults(queryParams);
            const formatted = (data.results || []).map(r => ({
                id: r._id,
                name: r.customerId?.name || "Customer",
                email: r.customerId?.email || "-",
                emotion: r.customerSentiment || "Neutral",
                professionalism: r.scores?.professionalism ?? 0,
                status: r.resolutionStatus || "Unknown",
                clarity: r.scores?.quality ?? 0,
                churn: "N/A",
                ticketNumber: r.ticketNumber || "—",
                category: r.category || "General",
                channel: r.channel || "chat",
            }));
            setAnalyticsData(formatted);
        } catch (error) {
            console.error("Fetch analytics failed:", error);
        }
    }, [filter]);

    useEffect(() => {
        fetchAnalytics();
    }, [filter, fetchAnalytics]);

    // ── Coaching state ──
    const [tickets, setTickets] = useState([]);
    const [selectedTicketId, setSelectedTicketId] = useState('');
    const [coachingResult, setCoachingResult] = useState(null);
    const [coachingLoading, setCoachingLoading] = useState(false);
    const [coachingError, setCoachingError] = useState('');

    useEffect(() => {
        agentApi.getTickets('?limit=20&sort=-updatedAt').then(data => {
            setTickets(data.results || data.tickets || []);
        }).catch(() => {});
    }, []);

    const handleStartCoaching = async () => {
        if (!selectedTicketId) return;
        setCoachingLoading(true);
        setCoachingError('');
        setCoachingResult(null);
        try {
            const resp = await agentApi.startCoaching(selectedTicketId);
            const jobId = resp.data?.jobId || resp.jobId;
            if (!jobId) throw new Error('No jobId returned');

            // Poll for results
            const poll = async () => {
                const pollResp = await agentApi.pollCoachingJob(jobId);
                const status = pollResp.data?.status || pollResp.status;
                if (status === 'completed') {
                    setCoachingResult(pollResp.data?.result || pollResp.result);
                    setCoachingLoading(false);
                } else if (status === 'failed') {
                    throw new Error(pollResp.message || 'Coaching analysis failed');
                } else {
                    setTimeout(poll, 3000);
                }
            };
            poll();
        } catch (error) {
            setCoachingError(error.message || 'Failed to start coaching analysis');
            setCoachingLoading(false);
        }
    };

    const filterOptions = ["All Tickets", "Resolved", "Pending", "High Emotion", "Low Emotion"];

    // ── Derived analytics values ──
    const uiKpis = perf?.uiKpis || {};
    const callStats = perf?.callStats || {};
    const tasks = perf?.tasks || {};
    const feedbackStats = perf?.feedbackStats || {};
    const channelDist = perf?.channelDistribution || [];
    const ts = perf?.timeSeries || {};

    // merge assigned/resolved per-day into a single chart series
    const trendChart = (() => {
        const map = new Map();
        (ts.assignedPerDay || []).forEach((d) => map.set(d.date, { date: d.date, assigned: d.count, resolved: 0 }));
        (ts.resolvedPerDay || []).forEach((d) => {
            const e = map.get(d.date) || { date: d.date, assigned: 0, resolved: 0 };
            e.resolved = d.count;
            map.set(d.date, e);
        });
        return Array.from(map.values())
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14)
            .map((d) => ({ ...d, label: d.date.slice(5) }));
    })();

    const completedTickets = (tasks.resolvedTicketsCount || 0) + (tasks.closedTicketsCount || 0);
    const resolutionRate = tasks.assignedTicketsCount > 0
        ? Math.round((completedTickets / tasks.assignedTicketsCount) * 100)
        : 0;
    const answerRate = callStats.totalCalls > 0
        ? Math.round(((callStats.answeredCalls || 0) / callStats.totalCalls) * 100)
        : 0;

    // ── Mini-chart series for the KPI cards (real time-series data) ──
    const resolvedSeries = (ts.resolvedPerDay || []).slice(-14).map((d) => d.count || 0);
    const assignedSeries = (ts.assignedPerDay || []).slice(-14).map((d) => d.count || 0);
    const answeredCallSeries = (ts.callsPerHour || []).map((b) => b.answered || 0);
    // resolution-rate trend per day = resolved / assigned (where assigned > 0)
    const resRateSeries = (() => {
        const map = new Map();
        (ts.assignedPerDay || []).forEach((d) => map.set(d.date, { a: d.count, r: 0 }));
        (ts.resolvedPerDay || []).forEach((d) => {
            const e = map.get(d.date) || { a: 0, r: 0 }; e.r = d.count; map.set(d.date, e);
        });
        return Array.from(map.values()).slice(-14).map((e) => (e.a > 0 ? Math.round((e.r / e.a) * 100) : 0));
    })();

    // green-family palette so every channel bar inherits the brand green
    const channelColors = { telegram: '#0a4a32', whatsapp: '#25D366', web: '#84cc16', webchat: '#84cc16', sms: '#16a34a', email: '#3e8e41' };
    const totalRatings = feedbackStats.totalRatings || 0;
    const breakdown = feedbackStats.ratingBreakdown || {};

    // ── Full-analytics derived data (from /agent/analytics/full, fallback to perf) ──
    const fKpis = full?.kpis || (() => {
        const a = tasks.assignedTicketsCount || 1;
        const r = tasks.resolvedTicketsCount || 0;
        return {
            totalTickets: tasks.assignedTicketsCount || 0,
            resolvedTickets: tasks.resolvedTicketsCount || 0,
            avgFirstResponseTime: uiKpis.avgLateReplySec ? Math.round(uiKpis.avgLateReplySec / 60) : 0,
            avgResolutionTime: Math.round((perf?.kpis?.avgResolutionTime || 0)) || 0,
            reopenedRate: 0,
        };
    })();
    const fSla = full?.kpis?.slaCompliance || (() => ({
        response: Math.min(100, Math.max(0, resolutionRate)),
        resolution: Math.min(100, Math.max(0, resolutionRate)),
        overall: Math.min(100, Math.max(0, Math.round((resolutionRate + answerRate) / 2))),
    }))();
    const fCharts = full?.charts || {};
    const fInsights = full?.performanceInsights || {};
    const fAnalysis = full?.agentAnalysis || {};
    const fSkills = fAnalysis.skillsScore || {};
    const fGoals = full?.goals || (() => {
        const gt = uiKpis.goalTickets || {};
        return {
            rank: { position: '—', totalAgents: 0 },
            streakDays: 0,
            dailyTarget: gt.total || 0,
            weeklyTarget: (gt.total || 0) * 5,
            achievementRate: gt.percentageCompleted || 0,
        };
    })();
    const fRecs = full?.recommendations || [];
    const fActivity = full?.activityFeed || [];
    const fCalls = full?.callInsights || (() => ({
        totalCalls: callStats.totalCalls || 0,
        answerRate: answerRate || 0,
        answeredCalls: callStats.answeredCalls || 0,
        missedCalls: callStats.missedCalls || 0,
        avgDuration: callStats.avgDurationSec || 0,
        peakCallHours: (ts.callsPerHour || []).map((h) => ({ hour: (h.hour || '').split('T')[1]?.split(':')[0] || '0', count: h.total || 0 })),
    }))();
    const fChannels = full?.channelBreakdown || [];
    // merge the two response/resolution trends into one chart series by date
    const fTrend = (() => {
        if (full?.charts) {
            const map = new Map();
            (fCharts.responseTimeTrend || []).forEach((d) => map.set(d.date, { date: d.date, response: d.avgResponseTimeMin, resolution: 0 }));
            (fCharts.resolutionTimeTrend || []).forEach((d) => {
                const e = map.get(d.date) || { date: d.date, response: 0, resolution: 0 };
                e.resolution = d.avgResolutionTimeMin; map.set(d.date, e);
            });
            return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, label: d.date.slice(5) }));
        }
        return trendChart.map((d) => ({ date: d.date, label: d.label, response: d.assigned, resolution: d.resolved }));
    })();
    const skillRows = [
        { key: "communication", label: "Communication" },
        { key: "problemSolving", label: "Problem solving" },
        { key: "speed", label: "Speed" },
        { key: "professionalism", label: "Professionalism" },
    ].map((s) => ({ ...s, score: fSkills[s.key] ?? 0 }));
    // skills are 0–100 (strengths ≥80, weaknesses ≤60 per the spec)
    const skillTone = (v) => (v >= 80 ? "good" : v >= 60 ? "mid" : "low");
    const activityIcon = (t) => {
        if (t === "ticket_closed" || t === "ticket_resolved") return <CheckCircleIcon />;
        if (t === "ticket_claimed") return <FlagIcon />;
        if (t === "agent_replied") return <ChatBubbleLeftRightIcon />;
        return <BoltIcon />;
    };
    const recIcon = (type) => {
        if (type === "critical") return <ExclamationTriangleIcon />;
        if (type === "positive") return <CheckCircleIcon />;
        if (type === "opportunity") return <SparklesIcon />;
        if (type === "warning") return <FireIcon />;
        return <ArrowTrendingUpIcon />; // improvement
    };

    // ── GSAP: count-up KPIs, staggered reveals, bar fills (replays per tab) ──
    useEffect(() => {
        if (perfLoading) return;
        const root = aaRootRef.current;
        if (!root) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // staggered reveal of cards / panels.
            // clearProps:"all" returns every animated element to its exact
            // CSS-defined position so the row stays perfectly aligned.
            tl.from(".cd-aa-kpi, .cd-aa-panel", {
                y: 22,
                opacity: 0,
                duration: 0.55,
                stagger: 0.08,
                clearProps: "transform,opacity",
            });

            // count-up numbers (read target from data-countup, preserve prefix/suffix)
            root.querySelectorAll("[data-countup]").forEach((el) => {
                const target = parseFloat(el.getAttribute("data-countup")) || 0;
                const suffix = el.getAttribute("data-suffix") || "";
                const counter = { v: 0 };
                tl.to(counter, {
                    v: target,
                    duration: 1.1,
                    ease: "power2.out",
                    onUpdate: () => { if (el) el.textContent = `${Math.round(counter.v)}${suffix}`; },
                }, 0.15);
            });

            // bar fills: animate width from 0 → target (set via data-fill)
            root.querySelectorAll("[data-fill]").forEach((el, i) => {
                tl.fromTo(el, { width: 0 }, {
                    width: el.getAttribute("data-fill"),
                    duration: 0.9,
                    ease: "power3.out",
                }, 0.25 + i * 0.05);
            });
        }, aaRootRef);

        return () => ctx.revert();
    }, [subTab, perfLoading, perf]);

    return (
        <div className="cd-analytics-layout" ref={aaRootRef}>
            <div className="cd-page-heading cd-analytics-heading">
                <h1>Analytics</h1>
                <p>Your performance, conversation trends, and quality insights.</p>
            </div>

            {/* ── Sub-tab bar ── */}
            <div className="cd-aa-tabs" data-active={subTab}>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'performance' ? 'active' : ''}`}
                    onClick={() => setSubTab('performance')}
                >
                    <ArrowUpRightIcon /> Performance
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'quality' ? 'active' : ''}`}
                    onClick={() => setSubTab('quality')}
                >
                    <StarSolid /> Quality
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'records' ? 'active' : ''}`}
                    onClick={() => setSubTab('records')}
                >
                    <ClipboardDocumentListIcon /> Records
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'insights' ? 'active' : ''}`}
                    onClick={() => setSubTab('insights')}
                >
                    <BoltIcon /> Insights
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'skills' ? 'active' : ''}`}
                    onClick={() => setSubTab('skills')}
                >
                    <SparklesIcon /> Skills
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setSubTab('activity')}
                >
                    <ClockIcon /> Activity
                </button>
                <button
                    type="button"
                    className={`cd-aa-tab ${subTab === 'coaching' ? 'active' : ''}`}
                    onClick={() => setSubTab('coaching')}
                >
                    <AcademicCapIcon /> Coaching
                </button>
            </div>

            {/* ── Performance tab: KPIs + trend chart ── */}
            {subTab === 'performance' && (
            <div key="performance" className={`cd-aa-wrap ${perfLoading ? 'cd-aa-loading' : ''}`}>
                {/* KPI row */}
                <div className="cd-aa-kpis cd-aa-kpis-cards">
                    <CallStatCard
                        icon={<CheckCircleIcon />}
                        label="Resolution Rate"
                        accent="#16a34a"
                        countTo={resolutionRate}
                        suffix="%"
                        hint={`${completedTickets} of ${tasks.assignedTicketsCount || 0} tickets resolved`}
                        chart={resRateSeries}
                        chartCaption="Resolution rate per day · last 14 days"
                    />
                    <CallStatCard
                        icon={<ClockIcon />}
                        label="Avg. First Reply"
                        accent="#042835"
                        value={uiKpis.avgLateReplyString || '0s'}
                        hint="Average first response time"
                        chart={resolvedSeries}
                        chartCaption="Tickets resolved per day · last 14 days"
                    />
                    <CallStatCard
                        icon={<PhoneIcon />}
                        label="Call Answer Rate"
                        accent="#84cc16"
                        countTo={answerRate}
                        suffix="%"
                        hint={`${callStats.answeredCalls || 0} of ${callStats.totalCalls || 0} calls answered`}
                        chart={answeredCallSeries}
                        chartCaption="Calls answered per hour · last 90 days"
                    />
                    <CallStatCard
                        icon={<StarSolid />}
                        label="CSAT Score"
                        accent="#f59e0b"
                        countTo={feedbackStats.csat || 0}
                        suffix="%"
                        hint={`Avg. rating ${feedbackStats.avgRating || 0} / 5 · ${totalRatings} ratings`}
                        chart={null}
                        chartCaption={null}
                    />
                </div>

                {/* Trend chart */}
                <div className="cd-aa-panel cd-aa-chart-panel">
                    <div className="cd-aa-panel-head">
                        <div>
                            <h3>Tickets over time</h3>
                            <p>Assigned vs. resolved — last 14 days</p>
                        </div>
                        <div className="cd-aa-legend">
                            <span className="cd-aa-legend-item"><i style={{ background: '#042835' }} /> Assigned</span>
                            <span className="cd-aa-legend-item"><i style={{ background: '#CAF301' }} /> Resolved</span>
                        </div>
                    </div>
                    {trendChart.length === 0 ? (
                        <div className="cd-aa-empty">No ticket activity yet.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={trendChart} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="aaAssigned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#042835" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#042835" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="aaResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#CAF301" stopOpacity={0.55} />
                                        <stop offset="100%" stopColor="#CAF301" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(4,40,53,0.06)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(4,40,53,0.1)', fontSize: 12 }} />
                                <Area type="monotone" dataKey="assigned" stroke="#042835" strokeWidth={2} fill="url(#aaAssigned)" />
                                <Area type="monotone" dataKey="resolved" stroke="#8ac33f" strokeWidth={2} fill="url(#aaResolved)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
            )}

            {/* ── Quality tab: channel mix + rating breakdown ── */}
            {subTab === 'quality' && (
            <div key="quality" className={`cd-aa-wrap ${perfLoading ? 'cd-aa-loading' : ''}`}>
                <div className="cd-aa-quality-grid">
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><h3>Channel mix</h3></div>
                        {channelDist.length === 0 ? (
                            <div className="cd-aa-empty cd-aa-empty-sm">No channel data.</div>
                        ) : channelDist.map((c) => {
                            const key = (c.channel || 'web').toLowerCase();
                            return (
                                <div key={c.channel} className="cd-aa-channel">
                                    <div className="cd-aa-channel-top">
                                        <span className="cd-aa-channel-name">{c.channel || 'Web'}</span>
                                        <span className="cd-aa-channel-pct">{c.percentage}%</span>
                                    </div>
                                    <div className="cd-aa-channel-track">
                                        <span data-fill={`${c.percentage}%`} style={{ width: `${c.percentage}%`, background: channelColors[key] || '#042835' }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head">
                            <div>
                                <h3>Rating breakdown</h3>
                                <p>{totalRatings} total ratings · CSAT {feedbackStats.csat || 0}%</p>
                            </div>
                        </div>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = breakdown[String(star)] || 0;
                            const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                            return (
                                <div key={star} className="cd-aa-rating-row">
                                    <span className="cd-aa-rating-star">{star} <StarSolid /></span>
                                    <div className="cd-aa-rating-track"><span data-fill={`${pct}%`} style={{ width: `${pct}%` }} /></div>
                                    <span className="cd-aa-rating-count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            )}

            {/* ── Records tab: QA automated results table ── */}
            {subTab === 'records' && (
            <div key="records" className="cd-qa-card cd-aa-anim">
                <div className="cd-qa-toolbar">
                    <div className="cd-qa-toolbar-left">
                        <h3>QA Records</h3>
                        <span className="cd-qa-count">{analyticsData.length}</span>
                    </div>
                    <div style={{ position: "relative" }}>
                        <button
                            className="cd-qa-filter-btn"
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            {filter} <ChevronDownIcon className="cd-chevron-sm" style={{ marginLeft: 4 }} />
                        </button>
                        {filterOpen && (
                            <div className="cd-period-dropdown" style={{ top: "100%", right: 0, marginTop: 6, width: "170px" }}>
                                {filterOptions.map((f) => (
                                    <div
                                        key={f}
                                        className={`cd-period-option ${filter === f ? 'cd-period-active' : ''}`}
                                        onClick={() => { setFilter(f); setFilterOpen(false); }}
                                    >
                                        {f}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="cd-qa-scroll">
                    <table className="cd-qa-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Emotion</th>
                                <th>Professionalism</th>
                                <th>Resolution</th>
                                <th className="cd-qa-center">Clarity</th>
                                <th className="cd-qa-center">Churn</th>
                                <th>Ticket</th>
                            </tr>
                        </thead>
                        <tbody>
                            {analyticsData.length === 0 ? (
                                <tr><td colSpan={7} className="cd-qa-empty">No QA records for this filter.</td></tr>
                            ) : analyticsData.map((row) => {
                                const em = emotionMeta(row.emotion);
                                const st = statusMeta(row.status);
                                const proTone = scoreTone(row.professionalism);
                                const clrTone = scoreTone(row.clarity);
                                return (
                                    <tr key={row.id}>
                                        <td>
                                            <div className="cd-qa-user">
                                                <span className="cd-qa-avatar">{initialsOf(row.name)}</span>
                                                <div className="cd-qa-user-meta">
                                                    <span className="cd-qa-name">{row.name}</span>
                                                    <span className="cd-qa-email">{row.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`cd-qa-pill cd-qa-emo-${em.tone}`}>
                                                <i className="cd-qa-dot" /> {em.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cd-qa-score">
                                                <div className="cd-qa-score-bar">
                                                    <span className={`cd-qa-score-fill tone-${proTone}`} style={{ width: `${row.professionalism * 10}%` }} />
                                                </div>
                                                <span className="cd-qa-score-num">{row.professionalism}/10</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`cd-qa-pill cd-qa-st-${st.tone}`}>{st.label}</span>
                                        </td>
                                        <td className="cd-qa-center">
                                            <span className={`cd-qa-chip tone-${clrTone}`}>{row.clarity}</span>
                                        </td>
                                        <td className="cd-qa-center">
                                            <span className="cd-qa-na">{row.churn}</span>
                                        </td>
                                        <td>
                                            <div className="cd-qa-ticket">
                                                <span className="cd-qa-ticket-id">#{row.ticketNumber}</span>
                                                <span className="cd-qa-ticket-sub">{row.category} · {row.channel}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* ════ INSIGHTS TAB ════ */}
            {subTab === 'insights' && (
            <div key="insights" className="cd-aa-wrap cd-aa-anim">
                {!full && <div className="cd-fa-info"><LightBulbIcon /><p>Using dashboard overview data.</p></div>}
                {/* KPI strip */}
                <div className="cd-fa-kpis">
                    <div className="cd-fa-kpi"><span className="cd-fa-kpi-num">{fKpis.totalTickets ?? 0}</span><span className="cd-fa-kpi-lab">Total tickets</span></div>
                    <div className="cd-fa-kpi"><span className="cd-fa-kpi-num">{fKpis.resolvedTickets ?? 0}</span><span className="cd-fa-kpi-lab">Resolved</span></div>
                    <div className="cd-fa-kpi"><span className="cd-fa-kpi-num">{fKpis.avgFirstResponseTime ?? 0}<small>min</small></span><span className="cd-fa-kpi-lab">Avg. first reply</span></div>
                    <div className="cd-fa-kpi"><span className="cd-fa-kpi-num">{fKpis.avgResolutionTime ?? 0}<small>min</small></span><span className="cd-fa-kpi-lab">Avg. resolution</span></div>
                    <div className="cd-fa-kpi"><span className="cd-fa-kpi-num">{fKpis.reopenedRate ?? 0}%</span><span className="cd-fa-kpi-lab">Reopened rate</span></div>
                </div>

                <div className="cd-fa-grid">
                    {/* SLA gauges */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>SLA Compliance</h3><p>Response, resolution & overall</p></div></div>
                        <div className="cd-fa-gauges">
                            <RadialGauge value={fSla.response || 0} label="Response" color="#16a34a" />
                            <RadialGauge value={fSla.resolution || 0} label="Resolution" color="#84cc16" />
                            <RadialGauge value={fSla.overall || 0} label="Overall" color="#042835" />
                        </div>
                    </div>

                    {/* Response/resolution time trend */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Time trends</h3><p>Response vs. resolution (min)</p></div>
                            <div className="cd-aa-legend">
                                <span className="cd-aa-legend-item"><i style={{ background: '#042835' }} /> Response</span>
                                <span className="cd-aa-legend-item"><i style={{ background: '#84cc16' }} /> Resolution</span>
                            </div>
                        </div>
                        {fTrend.length === 0 ? <div className="cd-aa-empty cd-aa-empty-sm">No trend data.</div> : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={fTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="faResp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#042835" stopOpacity={0.3} /><stop offset="100%" stopColor="#042835" stopOpacity={0} /></linearGradient>
                                        <linearGradient id="faReso" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#84cc16" stopOpacity={0.5} /><stop offset="100%" stopColor="#84cc16" stopOpacity={0} /></linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(4,40,53,0.06)" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(4,40,53,0.1)', fontSize: 12 }} />
                                    <Area type="monotone" dataKey="response" stroke="#042835" strokeWidth={2} fill="url(#faResp)" />
                                    <Area type="monotone" dataKey="resolution" stroke="#84cc16" strokeWidth={2} fill="url(#faReso)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="cd-fa-grid">
                    {/* Performance status chips + peak day/hour */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Performance status</h3></div></div>
                        <div className="cd-fa-status-grid">
                            {[
                                { lab: "Response time", v: fInsights.responseTimeStatus },
                                { lab: "Resolution", v: fInsights.resolutionEfficiency },
                                { lab: "Workload", v: fInsights.workloadStatus },
                                { lab: "Trend", v: fInsights.performanceTrend },
                            ].map((s) => (
                                <div key={s.lab} className="cd-fa-status">
                                    <span className="cd-fa-status-lab">{s.lab}</span>
                                    <span className={`cd-fa-status-pill tone-${statusTone(s.v)}`}>{(s.v || '—').replace(/_/g, ' ')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="cd-fa-peak">
                            <div className="cd-fa-peak-item"><FireIcon /><div><span>Peak day</span><strong>{fCharts.peakDay?.day || '—'}</strong></div></div>
                            <div className="cd-fa-peak-item"><ClockIcon /><div><span>Busiest hour</span><strong>{fCharts.busiestHour ? `${fCharts.busiestHour.hour}:00` : '—'}</strong></div></div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Recommendations</h3><p>{fRecs.length} suggestions</p></div></div>
                        <div className="cd-fa-recs">
                            {fRecs.length === 0 ? <div className="cd-aa-empty cd-aa-empty-sm">No recommendations.</div> :
                                fRecs.slice(0, 5).map((r, i) => (
                                    <div key={i} className={`cd-fa-rec cd-fa-rec-${r.type}`}>
                                        <span className="cd-fa-rec-icon">{recIcon(r.type)}</span>
                                        <div className="cd-fa-rec-body">
                                            <p className="cd-fa-rec-msg">{r.message}</p>
                                            <p className="cd-fa-rec-impact">{r.impact}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* ════ SKILLS TAB ════ */}
            {subTab === 'skills' && (
            <div key="skills" className="cd-aa-wrap cd-aa-anim">
                {!full && <div className="cd-fa-info"><SparklesIcon /><p>Using dashboard overview data.</p></div>}
                <div className="cd-fa-grid">
                    {/* Quality score + skill bars */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Skill breakdown</h3><p>{fAnalysis.source === 'behavior' ? 'From behavior signals' : 'From QA analysis'} · out of 100</p></div>
                            <span className="cd-fa-quality">{Math.round(fAnalysis.qualityScore ?? 0)}<small>/100</small></span>
                        </div>
                        <div className="cd-fa-skills">
                            {skillRows.map((s) => (
                                <div key={s.key} className="cd-fa-skill">
                                    <div className="cd-fa-skill-top"><span>{s.label}</span><strong>{Math.round(s.score)}/100</strong></div>
                                    <div className="cd-fa-skill-track"><span className={`tone-${skillTone(s.score)}`} style={{ width: `${Math.min(100, s.score)}%` }} /></div>
                                </div>
                            ))}
                        </div>
                        {(fAnalysis.strengths?.length > 0) && (
                            <div className="cd-fa-tags">
                                {fAnalysis.strengths.map((x, i) => <span key={i} className="cd-fa-tag cd-fa-tag-good">{x.label || x.area}</span>)}
                            </div>
                        )}
                        {(fAnalysis.weaknesses?.length > 0) && (
                            <div className="cd-fa-tags">
                                {fAnalysis.weaknesses.map((x, i) => <span key={i} className="cd-fa-tag cd-fa-tag-warn">{x.label || x.area}</span>)}
                            </div>
                        )}
                    </div>

                    {/* Goals & rank */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Goals & ranking</h3></div></div>
                        <div className="cd-fa-rank">
                            <div className="cd-fa-rank-badge"><TrophyIcon /><span className="cd-fa-rank-pos">#{fGoals.rank?.position ?? '—'}</span><span className="cd-fa-rank-sub">of {fGoals.rank?.totalAgents ?? 0} agents</span></div>
                            <div className="cd-fa-streak"><FireIcon /><div><strong>{fGoals.streakDays ?? 0}</strong><span>day streak</span></div></div>
                        </div>
                        <div className="cd-fa-goal-rows">
                            <div className="cd-fa-goal-row"><span>Daily target</span><strong>{fGoals.dailyTarget ?? 0}</strong></div>
                            <div className="cd-fa-goal-row"><span>Weekly target</span><strong>{fGoals.weeklyTarget ?? 0}</strong></div>
                            <div className="cd-fa-goal-row"><span>Achievement rate</span><strong>{fGoals.achievementRate ?? 0}%</strong></div>
                        </div>
                        <div className="cd-fa-goal-bar">
                            <div className="cd-fa-goal-bar-top"><span>Weekly progress</span><strong>{Math.min(100, Math.round(fGoals.achievementRate || 0))}%</strong></div>
                            <div className="cd-goal-progress-track"><span style={{ width: `${Math.min(100, fGoals.achievementRate || 0)}%` }} /></div>
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* ════ ACTIVITY TAB ════ */}
            {subTab === 'activity' && (
            <div key="activity" className="cd-aa-wrap cd-aa-anim">
                {!full && <div className="cd-fa-info"><ClockIcon /><p>Using dashboard overview data.</p></div>}
                <div className="cd-fa-grid cd-fa-grid-activity">
                    {/* Call insights */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Call insights</h3><p>{fCalls.totalCalls ?? 0} calls · {fCalls.answerRate ?? 0}% answered</p></div></div>
                        <div className="cd-fa-call-stats">
                            <div className="cd-fa-call-stat"><span className="cd-fa-call-num" style={{ color: '#16a34a' }}>{fCalls.answeredCalls ?? 0}</span><span>Answered</span></div>
                            <div className="cd-fa-call-stat"><span className="cd-fa-call-num" style={{ color: '#ef4444' }}>{fCalls.missedCalls ?? 0}</span><span>Missed</span></div>
                            <div className="cd-fa-call-stat"><span className="cd-fa-call-num">{fCalls.avgDuration ?? 0}s</span><span>Avg. duration</span></div>
                        </div>
                        <div className="cd-fa-peak-hours">
                            <p className="cd-fa-sub-title">Peak call hours</p>
                            {(fCalls.peakCallHours || []).length === 0 ? <span className="cd-aa-empty-sm">No call data.</span> :
                                (fCalls.peakCallHours || []).map((p, i) => {
                                    const max = Math.max(...(fCalls.peakCallHours || []).map((x) => x.count), 1);
                                    return (
                                        <div key={i} className="cd-fa-hour-row">
                                            <span className="cd-fa-hour-lab">{p.hour}:00</span>
                                            <div className="cd-fa-hour-track"><span style={{ width: `${(p.count / max) * 100}%` }} /></div>
                                            <span className="cd-fa-hour-count">{p.count}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Activity feed */}
                    <div className="cd-aa-panel">
                        <div className="cd-aa-panel-head"><div><h3>Recent activity</h3><p>Your latest ticket actions</p></div></div>
                        <div className="cd-fa-feed">
                            {fActivity.length === 0 ? <div className="cd-aa-empty cd-aa-empty-sm">No recent activity.</div> :
                                fActivity.slice(0, 12).map((a, i) => (
                                    <div key={i} className={`cd-fa-feed-item cd-fa-feed-${a.type}`}>
                                        <span className="cd-fa-feed-icon">{activityIcon(a.type)}</span>
                                        <span className="cd-fa-feed-label">{a.label}</span>
                                        <span className="cd-fa-feed-time">{fmtRelative(a.timestamp)}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
            )}

            {/* ════ COACHING TAB ════ */}
            {subTab === 'coaching' && (
            <div key="coaching" className="cd-aa-wrap cd-aa-anim">
                <div className="cd-aa-panel">
                    <div className="cd-aa-panel-head">
                        <div><h3>AI Coaching</h3><p>Get personalized coaching recommendations for any ticket.</p></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                        <select
                            value={selectedTicketId}
                            onChange={e => setSelectedTicketId(e.target.value)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1px solid #d0d7de',
                                fontSize: 14,
                                minWidth: 280,
                                background: '#fff',
                                color: '#042835',
                            }}
                        >
                            <option value="">Select a ticket…</option>
                            {tickets.map(t => (
                                <option key={t._id} value={t._id}>
                                    {t.ticketNumber || t._id.slice(-6)} — {t.customerId?.name || 'Unknown'}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleStartCoaching}
                            disabled={coachingLoading || !selectedTicketId}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 10,
                                border: 'none',
                                background: coachingLoading ? '#94a3b8' : 'linear-gradient(135deg, #042835, #0a4a36)',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: coachingLoading || !selectedTicketId ? 'not-allowed' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {coachingLoading ? (
                                <>Processing…</>
                            ) : (
                                <><AcademicCapIcon style={{ width: 18, height: 18 }} /> Start Coaching</>
                            )}
                        </button>
                    </div>
                </div>

                {coachingError && (
                    <div className="cd-aa-panel" style={{ borderLeft: '4px solid #ef4444', marginTop: 16 }}>
                        <p style={{ color: '#ef4444', margin: 0 }}>{coachingError}</p>
                    </div>
                )}

                {coachingResult && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
                        <div className="cd-aa-panel">
                            <h4 style={{ margin: '0 0 8px', color: '#042835' }}>AI Recommendations</h4>
                            <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{coachingResult.ai_recommendations}</p>
                        </div>
                        <div className="cd-aa-panel">
                            <h4 style={{ margin: '0 0 8px', color: '#042835' }}>Weakness Analysis</h4>
                            <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{coachingResult.weakness_analysis}</p>
                        </div>
                        <div className="cd-aa-panel">
                            <h4 style={{ margin: '0 0 8px', color: '#042835' }}>Suggested Learning</h4>
                            <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{coachingResult.suggested_learning}</p>
                        </div>
                        <div className="cd-aa-panel" style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', borderLeft: '4px solid #16a34a' }}>
                            <h4 style={{ margin: '0 0 8px', color: '#16a34a' }}>Encouragement</h4>
                            <p style={{ margin: 0, fontStyle: 'italic', lineHeight: 1.6 }}>"{coachingResult.encouragement_quote}"</p>
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
/* ═══════════════════════════════════════
   PROFILE VIEW
 ═══════════════════════════════════════ */
function ProfileView({ user }) {
    return (
        <div className="cd-profile-layout">
            <div className="cd-page-heading">
                <h1>My Profile</h1>
                <p>Manage your professional account and performance statistics.</p>
            </div>
            
            <div className="cd-profile-card">
                <div className="cd-profile-header">
                    <div className="cd-profile-avatar-large">
                        {user.avatar ? <img src={user.avatar} alt="Profile" /> : user.initials}
                    </div>
                    <div className="cd-profile-summary">
                        <h2>{user.name}</h2>
                        <p>{user.email}</p>
                        <span className="cd-role-badge">Agent</span>
                    </div>
                </div>
                
                <div className="cd-profile-stats-grid">
                    <div className="cd-p-stat">
                        <span className="cd-p-stat-val">Today</span>
                        <span className="cd-p-stat-label">Shift Status: Active</span>
                    </div>
                    <div className="cd-p-stat">
                        <span className="cd-p-stat-val">Level</span>
                        <span className="cd-p-stat-label">Senior Support Agent</span>
                    </div>
                </div>
            </div>
            
            <style>{`
                .cd-profile-layout { padding: 24px; animation: fadeIn 0.4s ease-out; }
                .cd-profile-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 24px; padding: 40px; box-shadow: 0 12px 40px rgba(4, 40, 53, 0.05); margin-top: 24px; transition: transform 0.3s ease; }
                .cd-profile-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(4, 40, 53, 0.08); }
                .cd-profile-header { display: flex; align-items: center; gap: 32px; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid rgba(4, 40, 53, 0.08); }
                .cd-profile-avatar-large { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #042835, #084960); color: #CAF301; display: flex; align-items: center; justify-content: center; fontSize: 40px; fontWeight: 700; overflow: hidden; box-shadow: 0 8px 24px rgba(4, 40, 53, 0.2); border: 4px solid rgba(255, 255, 255, 0.5); }
                .cd-profile-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
                .cd-profile-summary h2 { font-size: 32px; color: #042835; margin: 0 0 8px 0; letter-spacing: -0.5px; }
                .cd-profile-summary p { font-size: 16px; color: #666; margin: 0 0 16px 0; }
                .cd-role-badge { background: #CAF301; color: #042835; padding: 6px 16px; border-radius: 30px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(202, 243, 1, 0.4); }
                .cd-profile-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
                .cd-p-stat { padding: 24px; background: rgba(255, 255, 255, 0.5); border-radius: 16px; display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.8); }
                .cd-p-stat-val { font-size: 20px; font-weight: 700; color: #042835; }
                .cd-p-stat-label { font-size: 14px; color: #666; }
            `}</style>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   INCOMING CALL OVERLAY
═══════════════════════════════════════ */
function IncomingCallOverlay({ callInfo, onAnswer }) {
    return (
        <div className="cd-call-overlay">
            <div className="cd-call-overlay-card">
                <div className="cd-call-pulse-ring" />
                <div className="cd-call-avatar-big">
                    {(callInfo.customerName || 'CU').substring(0, 2).toUpperCase()}
                </div>
                <p className="cd-call-overlay-label">Incoming Call</p>
                <p className="cd-call-overlay-name">{callInfo.customerName || 'Customer'}</p>
                <p className="cd-call-overlay-sub">Voice Call • Now</p>
                <div className="cd-call-overlay-actions">
                    <button className="cd-call-btn cd-call-answer" onClick={onAnswer} title="Answer">
                        <PhoneIcon style={{ width: 26, height: 26 }} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   ACTIVE CALL PANEL
═══════════════════════════════════════ */
function ActiveCallPanel({ callInfo, muted, onToggleMute }) {
    const [elapsed, setElapsed] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const t = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    if (isExpanded) {
        return (
            <div className="cd-call-overlay">
                <div className="cd-call-overlay-card" style={{ padding: '40px' }}>
                    <button 
                        className="cd-btn-icon" 
                        style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'transparent', border: 'none' }}
                        onClick={() => setIsExpanded(false)}
                        title="Minimize"
                    >
                        <ChevronDownIcon style={{ width: 24, height: 24 }} />
                    </button>
                    
                    <div className="cd-call-avatar-big" style={{ marginBottom: 16 }}>
                        <div className="cd-call-pulse-ring active-ring" />
                        {(callInfo.customerName || 'CU').substring(0, 2).toUpperCase()}
                    </div>
                    
                    <p className="cd-call-overlay-name">{callInfo.customerName || 'Customer'}</p>
                    <p className="cd-call-overlay-sub" style={{ fontSize: '28px', color: '#CAF301', margin: '16px 0', fontWeight: '300', fontVariantNumeric: 'tabular-nums', letterSpacing: '2px' }}>
                        {fmt(elapsed)}
                    </p>

                    <div className="cd-active-call-wave" style={{ justifyContent: 'center', marginBottom: '32px', height: '40px' }}>
                        {[...Array(7)].map((_, i) => <span key={i} className="cd-wave-bar" style={{ animationDelay: `${i * 0.12}s`, width: '4px', margin: '0 2px' }} />)}
                    </div>

                    <div className="cd-call-overlay-actions">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <button className={`cd-call-btn cd-active-ctrl-btn${muted ? ' cd-ctrl-muted' : ''}`} onClick={onToggleMute} title={muted ? 'Unmute Mic' : 'Mute Mic'} style={{ background: muted ? 'rgba(255, 71, 87, 0.2)' : 'rgba(255,255,255,0.1)', color: muted ? '#ff4757' : '#fff' }}>
                                <MicrophoneIcon style={{ width: 26, height: 26, position: 'relative' }} />
                                {muted && <div style={{ position: 'absolute', width: '30px', height: '2px', background: '#ff4757', transform: 'rotate(45deg)' }} />}
                            </button>
                            <span style={{ fontSize: '12px', color: '#888' }}>{muted ? 'Unmute Mic' : 'Mute Mic'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cd-active-call-bar" onClick={() => setIsExpanded(true)} style={{ cursor: 'pointer' }}>
            <div className="cd-active-call-wave">
                {[...Array(5)].map((_, i) => <span key={i} className="cd-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />)}
            </div>
            <div className="cd-active-call-info" style={{ flexGrow: 1 }}>
                <PhoneIcon style={{ width: 18, height: 18, color: '#22c55e' }} />
                <span className="cd-active-call-name">{callInfo.customerName || 'Customer'}</span>
                <span className="cd-active-call-timer">{fmt(elapsed)}</span>
            </div>
            <div className="cd-active-call-controls" onClick={(e) => e.stopPropagation()}>
                <button className={`cd-active-ctrl-btn${muted ? ' cd-ctrl-muted' : ''}`} style={{ position: 'relative' }} onClick={onToggleMute} title={muted ? 'Unmute Mic' : 'Mute Mic'}>
                    <MicrophoneIcon style={{ width: 18, height: 18 }} />
                    {muted && <div style={{ position: 'absolute', left: '50%', top: '50%', width: '22px', height: '2px', background: '#ff4757', transform: 'translate(-50%, -50%) rotate(45deg)' }} />}
                </button>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   NOTIFICATIONS DROPDOWN
   ═══════════════════════════════════════ */
function NotificationDropdown({ notifications, onMarkRead, onMarkAllRead, onClose }) {
    return (
        <div className="cd-notif-dropdown">
            <div className="cd-notif-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                    <button onClick={onMarkAllRead} className="cd-notif-mark-all">
                        Mark all as read
                    </button>
                )}
                <button onClick={onClose} className="cd-notif-close-mobile"><XMarkIcon /></button>
            </div>
            <div className="cd-notif-list">
                {notifications.length === 0 ? (
                    <div className="cd-notif-empty">
                        <BellIcon className="cd-notif-empty-icon" />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((n) => (
                        <div 
                            key={n._id} 
                            className={`cd-notif-item ${n.isRead ? '' : 'is-unread'}`}
                            onClick={() => onMarkRead(n._id)}
                        >
                            <div className="cd-notif-dot-wrap">
                                {!n.isRead && <div className="cd-notif-dot" />}
                            </div>
                            <div className="cd-notif-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <p className="cd-notif-title">{n.title}</p>
                                    <span className="cd-notif-time" style={{ fontSize: '10px', color: '#94a3b8' }}>
                                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="cd-notif-msg">{n.message}</p>
                                <p className="cd-notif-sender" style={{ fontSize: '11px', color: '#137c9f', fontWeight: '600', marginTop: '4px' }}>
                                    From: {n.senderName || n.senderId?.name || 'System'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function NatiqDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    const getActiveNavFromPath = (path) => {
        if (path.startsWith("/tickets")) return "Tickets";
        if (path.startsWith("/calls")) return "Calls";
        if (path.startsWith("/calendar")) return "Calendar";
        if (path.startsWith("/analytics")) return "Analytics";
        if (path.startsWith("/profile")) return "Profile";
        if (path.startsWith("/settings")) return "Settings";
        return "Dashboard";
    };

    const activeNav = getActiveNavFromPath(location.pathname);
    const [period, setPeriod] = useState("Monthly");
    const [refreshCount, setRefreshCount] = useState(0);
    const [chartTooltip, setChartTooltip] = useState(null);
    const [agentUser, setAgentUser] = useState(getAgentUser());

    // ── Dynamic dashboard data ──
    const [dashData, setDashData] = useState(null);
    const [dashLoading, setDashLoading] = useState(true);

    // ── Dynamic pending tickets count for badge ──
    const [pendingCount, setPendingCount] = useState(0);
    const [todayTasks, setTodayTasks] = useState([]);


    const [trackerTime, setTrackerTime] = useState(() => {
        const savedDate = localStorage.getItem("tracker_date");
        const today = new Date().toISOString().split("T")[0];
        if (savedDate !== today) {
            localStorage.setItem("tracker_date", today);
            localStorage.setItem("tracker_time", "0");
            return 0;
        }
        return parseInt(localStorage.getItem("tracker_time") || "0", 10);
    });
    const [trackerActive, setTrackerActive] = useState(true);

    // ── Call state ──
    const [availableCalls, setAvailableCalls] = useState([]); // only currently available/ringing calls
    const [activeCall, setActiveCall] = useState(null);       // same shape + answeredAt
    const [callMuted, setCallMuted] = useState(false);
    const [agentMicStream, setAgentMicStream] = useState(null);

    // ── Notifications state ──
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [customerAudioStream, setCustomerAudioStream] = useState(null);
    const callSocketRef = useRef(null);
    const peerRef = useRef(null);           // RTCPeerConnection
    const localStreamRef = useRef(null);    // local MediaStream
    const remoteAudioRef = useRef(null);    // <audio> element for remote stream
    const callStartedAtRef = useRef(null);
    const activeCallRef = useRef(null);
    const availableCallsRef = useRef([]);
    const adminSocketRef = useRef(null);
    const incomingCall = availableCalls[0] || null;
    
    // Recording Refs
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioContextRef = useRef(null);

    // Ringtone Refs
    const ringtoneAudioCtxRef = useRef(null);
    const ringtoneIntervalRef = useRef(null);

    // ── Map API response shape to UI-expected shape ──
    const mapDashData = useCallback((raw) => {
        const db = raw?.dashboard || raw || {};
        const k = db.kpis || {};
        const cp = db.callPerformance || {};
        const fb = db.feedbackStats || {};
        const pt = db.performanceTrend || [];
        const gp = db.goalProgress || {};
        const cd = db.channelDistribution || [];

        const assignedPerDay = pt.map((d) => ({ date: d.date, count: d.assigned || 0 }));
        const resolvedPerDay = pt.map((d) => ({ date: d.date, count: d.resolved || 0 }));

        return {
            ...db,
            uiKpis: {
                flaggedTickets: k.assignedTickets || 0,
                pendingTickets: k.pendingTickets || 0,
                avgLateReplyString: k.avgFirstResponseTime != null
                    ? `${Math.round(k.avgFirstResponseTime)}m` : '0m',
                avgLateReplySec: k.avgFirstResponseTime != null
                    ? Math.round(k.avgFirstResponseTime * 60) : 0,
                avgCallDurationString: cp.avgDuration != null
                    ? `${Math.round(cp.avgDuration)}m` : '0m',
                goalTickets: {
                    total: gp.total || 0,
                    current: gp.current || 0,
                    percentage: gp.percentage || 0,
                },
                avgFeedback: fb.avgRating || 0,
                csatScore: k.csatScore || 0,
            },
            callStats: {
                answeredCalls: cp.answered || 0,
                missedCalls: cp.missed || 0,
                totalCalls: cp.totalCalls || 0,
            },
            tasks: {
                openTicketsCount: k.assignedTickets || 0,
                inProgressTicketsCount: k.inProgressTickets || 0,
                resolvedTicketsCount: k.resolvedTickets || 0,
                closedTicketsCount: 0,
            },
            timeSeries: {
                assignedPerDay,
                resolvedPerDay,
                callsPerHour: [],
            },
        };
    }, []);

    // Fetch dashboard data from backend
    const dashLoadedOnceRef = useRef(false);
    const fetchDashboard = useCallback(async () => {
        try {
            // Only show the loading/blur-in state on the FIRST load. Background
            // 30s refreshes update data silently so charts don't re-animate.
            if (!dashLoadedOnceRef.current) setDashLoading(true);
            const data = await agentApi.getDashboardOverview();
            setDashData(mapDashData(data.dashboard || data));
            // Update agent user info from profile returned by dashboard
            const prof = (data.dashboard || data)?.profile;
            if (prof) {
                const nameParts = (prof.name || "Agent").split(" ");
                const initials = nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
                setAgentUser({
                    name: prof.name || "Agent",
                    email: prof.email || "",
                    initials,
                    avatar: prof.profileImage || null,
                    id: prof._id || null,
                });
            }
        } catch (err) {
            console.error("Dashboard fetch error:", err);
        } finally {
            if (!dashLoadedOnceRef.current) {
                setDashLoading(false);
                dashLoadedOnceRef.current = true;
            }
            setRefreshCount(c => c + 1);
        }
    }, []);

    // Fetch pending ticket count for sidebar badge
    const fetchPendingCount = useCallback(async () => {
        try {
            const data = await agentApi.getTickets("?queue=unassigned");
            const count = data.tickets?.length || data.total || 0;
            setPendingCount(count);
        } catch (err) {
            console.error("Pending count fetch error:", err);
        }
    }, []);

    const fetchTodayTasks = useCallback(async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await agentApi.getTasks(today);
            setTodayTasks(data || []);
        } catch (err) {
            console.error("Fetch today tasks error:", err);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await agentApi.getNotifications();
            setNotifications(data.notifications || []);
            setUnreadNotifCount(data.unreadCount || 0);
        } catch (err) {
            console.error("Fetch notifications error:", err);
        }
    }, []);

    const handleMarkNotifRead = async (id) => {
        try {
            await agentApi.markNotificationAsRead(id);
            setNotifications((prev) => 
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
            setUnreadNotifCount(c => Math.max(0, c - 1));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    };

    const handleMarkAllNotifsRead = async () => {
        try {
            await agentApi.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadNotifCount(0);
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    };


    useEffect(() => {
        fetchDashboard();
        fetchPendingCount();
        fetchTodayTasks();
        fetchNotifications();
        // Refresh periodically
        const interval = setInterval(() => {
            fetchDashboard();
            fetchPendingCount();
            fetchTodayTasks();
            fetchNotifications();
        }, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [fetchDashboard, fetchPendingCount, fetchTodayTasks, fetchNotifications]);


    useEffect(() => {
        let interval = null;
        if (trackerActive) {
            interval = setInterval(() => {
                setTrackerTime((t) => {
                    const nextTime = t + 1;
                    localStorage.setItem("tracker_time", nextTime.toString());
                    
                    // Periodic check for day change (e.g., if user leaves tab open overnight)
                    const savedDate = localStorage.getItem("tracker_date");
                    const today = new Date().toISOString().split("T")[0];
                    if (savedDate !== today) {
                        localStorage.setItem("tracker_date", today);
                        return 0;
                    }
                    
                    return nextTime;
                });
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [trackerActive]);

    const formatTime = (totalSecs) => {
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    // ── Extract dynamic values from dashData ──
    const uiKpis = dashData?.uiKpis || {};
    const callStats = dashData?.callStats || {};
    const callTotal = callStats.totalCalls || 0;
    // Per-metric hourly series for the call-card mini area charts (real data).
    const callsPerHour = dashData?.timeSeries?.callsPerHour || [];
    const callSeries = useMemo(() => ({
        answered: callsPerHour.map((b) => b.answered || 0),
        total: callsPerHour.map((b) => b.total || 0),
        missed: callsPerHour.map((b) => b.missed || 0),
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [JSON.stringify(callsPerHour)]);
    const channelDist = dashData?.channelDistribution || [];
    const goalTickets = uiKpis?.goalTickets || {};
    const avgFeedback = uiKpis?.avgFeedback || 0;
    const csatScore = uiKpis?.csatScore || 0;
    const tasks = dashData?.tasks || {};

    // ── Feedback rating distribution (for the donut + legend) ──
    const fbStats = dashData?.feedbackStats || {};
    const fbBreakdown = fbStats.ratingBreakdown || {};
    const fbTotal = fbStats.totalRatings || 0;
    const fbSegments = [
        { label: "5 stars", value: fbBreakdown["5"] || 0, color: "#16a34a" },
        { label: "4 stars", value: fbBreakdown["4"] || 0, color: "#84cc16" },
        { label: "3 stars", value: fbBreakdown["3"] || 0, color: "#eab308" },
        { label: "2 stars", value: fbBreakdown["2"] || 0, color: "#f59e0b" },
        { label: "1 star",  value: fbBreakdown["1"] || 0, color: "#ef4444" },
    ];
    const fbDonut = fbSegments
        .filter((s) => s.value > 0)
        .map((s) => ({ ...s, value: Math.round((s.value / (fbTotal || 1)) * 100) }));

    // ── CSAT satisfaction split (satisfied 4-5★ / neutral 3★ / unhappy 1-2★) ──
    const csatSatisfied = (fbBreakdown["5"] || 0) + (fbBreakdown["4"] || 0);
    const csatNeutral = fbBreakdown["3"] || 0;
    const csatUnhappy = (fbBreakdown["2"] || 0) + (fbBreakdown["1"] || 0);
    const csatPct = (n) => (fbTotal > 0 ? Math.round((n / fbTotal) * 100) : 0);
    const csatBreakdown = [
        { label: "Satisfied", sub: "4–5 ★", count: csatSatisfied, pct: csatPct(csatSatisfied), color: "#16a34a" },
        { label: "Neutral", sub: "3 ★", count: csatNeutral, pct: csatPct(csatNeutral), color: "#f59e0b" },
        { label: "Unhappy", sub: "1–2 ★", count: csatUnhappy, pct: csatPct(csatUnhappy), color: "#ef4444" },
    ];

    // ── DisputeFox-style chart data ──
    // Donut: ticket status breakdown
    const ticketDonut = useMemo(() => {
        const open = tasks.openTicketsCount || 0;
        const prog = tasks.inProgressTicketsCount || 0;
        const res = tasks.resolvedTicketsCount || 0;
        const closed = tasks.closedTicketsCount || 0;
        const total = open + prog + res + closed || 1;
        const pct = (n) => Math.round((n / total) * 100);
        return [
            { label: "Resolved", value: pct(res), color: "#16a34a" },
            { label: "Closed", value: pct(closed), color: "#84cc16" },
            { label: "In progress", value: pct(prog), color: "#f59e0b" },
            { label: "Open", value: pct(open), color: "#042835" },
        ].filter((d) => d.value > 0);
    }, [tasks]);
    const ticketTotal = (tasks.openTicketsCount || 0) + (tasks.inProgressTicketsCount || 0) +
        (tasks.resolvedTicketsCount || 0) + (tasks.closedTicketsCount || 0);
    const completedPct = ticketTotal > 0
        ? Math.round((((tasks.resolvedTicketsCount || 0) + (tasks.closedTicketsCount || 0)) / ticketTotal) * 100)
        : 0;

    // ── KPI card mini-bar data (real backend numbers) ──
    // Flagged & Pending: ticket-status workload breakdown.
    const statusBars = useMemo(() => ([
        { label: "Open", value: tasks.openTicketsCount || 0, color: "#f59e0b" },
        { label: "Active", value: tasks.inProgressTicketsCount || 0, color: "#3e8e41" },
        { label: "Resolved", value: tasks.resolvedTicketsCount || 0, color: "#16a34a" },
        { label: "Closed", value: tasks.closedTicketsCount || 0, color: "#84cc16" },
    ]), [tasks]);
    // Avg. Response Time: your time vs target benchmarks (lower is better).
    const responseBars = useMemo(() => {
        const you = Math.round((uiKpis.avgLateReplySec || 0));
        return [
            { label: "You", value: you, color: you <= 120 ? "#16a34a" : you <= 300 ? "#f59e0b" : "#dc2626" },
            { label: "Goal", value: 120, color: "#84cc16" },
            { label: "Team", value: 240, color: "#0a4a36" },
        ];
    }, [uiKpis.avgLateReplySec]);
    // Avg. Call Duration card: answered vs missed call counts.
    const callBars = useMemo(() => ([
        { label: "Answered", value: callStats.answeredCalls || 0, color: "#16a34a" },
        { label: "Missed", value: callStats.missedCalls || 0, color: "#dc2626" },
        { label: "Total", value: callStats.totalCalls || 0, color: "#0a4a36" },
    ]), [callStats]);

    // Dot-grid: resolved tickets across the last 4 weeks (4 rows × 12 cols).
    // state 1 = had resolutions that day (green), 0 = none/no-data (neutral).
    // We avoid the red "miss" state since the API can't distinguish a real
    // zero-resolution day from simply having no time-series history yet.
    const activityGrid = useMemo(() => {
        const resolved = (dashData?.timeSeries?.resolvedPerDay || []);
        const byDate = new Map(resolved.map((d) => [d.date, d.count]));
        const rows = [];
        const today = new Date();
        let cursor = new Date(today);
        cursor.setDate(cursor.getDate() - (4 * 12 - 1));
        for (let r = 0; r < 4; r++) {
            const days = [];
            for (let c = 0; c < 12; c++) {
                const ds = cursor.toISOString().slice(0, 10);
                const count = byDate.get(ds) || 0;
                days.push(count > 0 ? 1 : 0);
                cursor.setDate(cursor.getDate() + 1);
            }
            rows.push({ label: `W${r + 1}`, days });
        }
        return rows;
    }, [dashData]);
    const activeDays = activityGrid.reduce((s, r) => s + r.days.filter((d) => d === 1).length, 0);

    // ── Sparkline series for KPI cards — REAL data only.
    // Returns null when there's no genuine per-day history (card shows an
    // honest "—" instead of a synthesized/fake trend line). ──
    const kpiSparks = useMemo(() => {
        const real = (arr) => {
            const series = (arr || []).slice(-10).map(d => d.count || 0);
            return series.length > 1 ? series : null;
        };
        const assigned = real(dashData?.timeSeries?.assignedPerDay);
        const resolved = real(dashData?.timeSeries?.resolvedPerDay);
        return {
            flagged: assigned,
            pending: resolved,
            response: assigned, // both response & call lack a per-day series → null until backend provides one
            call: resolved,
        };
    }, [dashData]);

    // Build channel bar data from backend or fallback
    const channelBarData = channelDist.length > 0
        ? channelDist.map(c => ({ name: c.channel || "Unknown", percent: c.percentage || 0 }))
        : [{ name: "No data", percent: 0 }];

    // ── Time-series chart data ──
    const timeSeries = dashData?.timeSeries || {};
    const assignedSeries = useMemo(
        () => filterByPeriod(timeSeries.assignedPerDay || [], period),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [timeSeries.assignedPerDay, period]
    );
    const resolvedSeries = useMemo(
        () => filterByPeriod(timeSeries.resolvedPerDay || [], period),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [timeSeries.resolvedPerDay, period]
    );
    const sharedMax = useMemo(
        () => Math.max(...assignedSeries.map(d => d.count || 0), ...resolvedSeries.map(d => d.count || 0), 1),
        [assignedSeries, resolvedSeries]
    );
    const darkChartPoints = useMemo(() => buildChartPoints(assignedSeries, sharedMax), [assignedSeries, sharedMax]);
    const limeChartPoints = useMemo(() => buildChartPoints(resolvedSeries, sharedMax), [resolvedSeries, sharedMax]);
    const chartYLabels = useMemo(
        () => [sharedMax, Math.round(sharedMax * 0.75), Math.round(sharedMax * 0.5), Math.round(sharedMax * 0.25), 0],
        [sharedMax]
    );
    const chartXLabels = useMemo(() => {
        const src = assignedSeries.length ? assignedSeries : resolvedSeries;
        if (!src.length) return [];
        const step = Math.max(1, Math.floor(src.length / 6));
        return src
            .filter((_, i) => i % step === 0 || i === src.length - 1)
            .map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }, [assignedSeries, resolvedSeries]);

    const rechartsData = useMemo(() => {
        const dateMap = {};
        assignedSeries.forEach(d => {
            dateMap[d.date] = { ...dateMap[d.date], assigned: d.count || 0 };
        });
        resolvedSeries.forEach(d => {
            dateMap[d.date] = { ...dateMap[d.date], resolved: d.count || 0 };
        });
        
        let data = Object.keys(dateMap).sort().map(date => ({
            name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            assigned: dateMap[date].assigned || 0,
            resolved: dateMap[date].resolved || 0,
        }));

        // Inject a visual wave if there's only 2 data points to prevent a boring straight line
        if (data.length === 2) {
            const mid = {
                name: '',
                assigned: Math.max(0, (data[0].assigned + data[1].assigned) / 2 + 0.5),
                resolved: Math.max(0, (data[0].resolved + data[1].resolved) / 2 - 0.5),
            };
            data = [data[0], mid, data[1]];
        }
        
        return data;
    }, [assignedSeries, resolvedSeries]);

    const stopRingtone = useCallback(() => {
        if (ringtoneIntervalRef.current) {
            clearInterval(ringtoneIntervalRef.current);
            ringtoneIntervalRef.current = null;
        }
    }, []);

    // Sync refs with state so that closures can access the latest values
    useEffect(() => {
        activeCallRef.current = activeCall;
        availableCallsRef.current = availableCalls;
    }, [activeCall, availableCalls]);

    useEffect(() => {
        if (!activeCall && availableCalls.length === 0) {
            stopRingtone();
        }
    }, [activeCall, availableCalls, stopRingtone]);

    // ── Synthetic Ringtone ──
    const playRingtone = useCallback(() => {
        try {
            stopRingtone(); // one interval only — multiple call:incoming was stacking intervals
            if (!ringtoneAudioCtxRef.current) {
                ringtoneAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = ringtoneAudioCtxRef.current;
            if (ctx.state === 'suspended') ctx.resume();

            const playBeeps = () => {
                const playSingleBeep = (startTime) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(440, startTime);
                    osc.frequency.setValueAtTime(480, startTime); // dual tone classic SIP ring

                    gain.gain.setValueAtTime(0, startTime);
                    gain.gain.linearRampToValueAtTime(0.5, startTime + 0.05); // fade in
                    gain.gain.setValueAtTime(0.5, startTime + 0.4);
                    gain.gain.linearRampToValueAtTime(0, startTime + 0.5); // fade out

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    
                    osc.start(startTime);
                    osc.stop(startTime + 0.5);
                };

                const now = ctx.currentTime;
                playSingleBeep(now);
                playSingleBeep(now + 0.6); // second beep after 0.1s gap
            };

            playBeeps();
            ringtoneIntervalRef.current = setInterval(playBeeps, 3000); // repeat every 3s
        } catch (e) {
            console.error('[Ringtone] Failed to play:', e);
        }
    }, [stopRingtone]);

    // ── Call socket setup ──
    useEffect(() => {
        const token = localStorage.getItem('agent_token');
        if (!token) return;

        const socket = io(`${process.env.REACT_APP_SOCKET_URL || ''}/calls`, { auth: { token } });
        callSocketRef.current = socket;

        // Admin socket for notifications and ticket updates
        const adminSocket = io(`${process.env.REACT_APP_SOCKET_URL || ''}/admin`, { auth: { token } });
        adminSocketRef.current = adminSocket;

        adminSocket.on('notification:new', (notif) => {
            setNotifications((prev) => [notif, ...prev]);
            setUnreadNotifCount((c) => c + 1);
        });

        socket.on('connect', () => console.log('[Calls] socket connected'));
        socket.on('connect_error', (err) => console.error('[Calls] connect error:', err.message));

        // Incoming call from a customer
        socket.on('call:incoming', (data) => {
            console.log('[Calls] incoming:', data);
            setAvailableCalls((prev) => {
                const exists = prev.some((c) => c.callId === data.callId);
                if (exists) return prev;
                const next = [...prev, data].sort((a, b) => new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now()));
                return next;
            });
            if (!activeCallRef.current) playRingtone();
        });

        // Customer accepted our 'accept' → start WebRTC as answerer
        socket.on('call:offer', async ({ callId, sdp }) => {
            if (!peerRef.current) return;
            try {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(answer);
                socket.emit('call:answer', { callId, sdp: answer });
            } catch (err) {
                console.error('[Calls] SDP answer error:', err);
            }
        });

        socket.on('call:ice-candidate', ({ candidate }) => {
            if (peerRef.current && candidate) {
                peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
            }
        });

        socket.on('call:ended', ({ callId, endedBy, duration }) => {
            console.log('[Calls] ended', callId, 'by', endedBy, 'duration', duration);
            setAvailableCalls((prev) => prev.filter((call) => call.callId !== callId));
            cleanupCall(duration || 0, endedBy || 'customer');
        });

        socket.on('call:rejected', ({ callId }) => {
            setAvailableCalls((prev) => prev.filter((call) => call.callId !== callId));
        });

        return () => { socket.disconnect(); };
    // eslint-disable-next-line
    }, []);

    // Setup Call Recording
    const startRecording = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = ctx;
            const dest = ctx.createMediaStreamDestination();

            if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
                const localSource = ctx.createMediaStreamSource(localStreamRef.current);
                localSource.connect(dest);
            }

            if (remoteAudioRef.current && remoteAudioRef.current.srcObject) {
                const remoteSource = ctx.createMediaStreamSource(remoteAudioRef.current.srcObject);
                remoteSource.connect(dest);
            }

            const recorder = new MediaRecorder(dest.stream);
            mediaRecorderRef.current = recorder;
            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };
            recorder.start(1000); // collect 1s chunks
            console.log('[Recording] Started');
        } catch (err) {
            console.error('[Recording] Failed to start:', err);
        }
    }, []);

    const stopAndUploadRecording = useCallback(async (callId) => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
        
        return new Promise((resolve) => {
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                recordedChunksRef.current = [];
                console.log(`[Recording] Stopped. Blob size: ${blob.size}`);
                
                if (blob.size > 0 && callId) {
                    try {
                        await agentApi.uploadRecording(callId, blob);
                        console.log('[Recording] Uploaded successfully');
                    } catch (err) {
                        console.error('[Recording] Upload failed:', err);
                    }
                }
                
                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(console.error);
                    audioContextRef.current = null;
                }
                resolve();
            };
            mediaRecorderRef.current.stop();
        });
    }, []);

    const cleanupCall = useCallback(async (duration, endedBy) => {
        console.log('[Calls] Cleanup WebRTC, duration =', duration);

        const callSnap = activeCallRef.current;
        const currentCallId = callSnap?.callId;
        
        // Save to backend FIRST so it doesn't fail if recording fails
        if (callSnap) {
            try {
                await agentApi.saveCall({
                    callId: callSnap.callId,
                    customerId: callSnap.customerId,
                    customerName: callSnap.customerName,
                    status: duration > 0 ? 'ended' : 'missed',
                    startedAt: callSnap.startedAt,
                    answeredAt: callSnap.answeredAt || null,
                    endedAt: new Date().toISOString(),
                    duration: Math.round(duration),
                    endedBy,
                });
                console.log('[Calls] saveCall successful');
            } catch (e) {
                console.error('saveCall error:', e);
            }
        }

        // Stop recording and upload
        if (currentCallId) {
            await stopAndUploadRecording(currentCallId).catch(console.error);
        }

        setAgentMicStream(null);
        setCustomerAudioStream(null);

        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        // Close peer
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
        }
        
        setActiveCall(null);
        setCallMuted(false);
        callStartedAtRef.current = null;
        if ((availableCallsRef.current || []).length === 0) stopRingtone();
    }, [stopAndUploadRecording, stopRingtone]);

    const handleAnswerCall = useCallback(async (targetCallId = null) => {
        const targetCall = targetCallId
            ? (availableCallsRef.current || []).find((call) => call.callId === targetCallId)
            : (availableCallsRef.current || [])[0];
        if (!targetCall) return;
        const call = { ...targetCall, answeredAt: new Date().toISOString() };
        setActiveCall(call);
        setAvailableCalls((prev) => prev.filter((item) => item.callId !== call.callId));
        callStartedAtRef.current = Date.now();
        if ((availableCallsRef.current || []).length <= 1) stopRingtone();

        // Emit accept so server notifies customer
        callSocketRef.current?.emit('call:accept', { callId: call.callId });

        // Setup WebRTC
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setAgentMicStream(stream);

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peerRef.current = pc;

            stream.getTracks().forEach(t => pc.addTrack(t, stream));

            pc.ontrack = (event) => {
                const remoteStream = event.streams[0];
                if (remoteStream) {
                    setCustomerAudioStream(remoteStream);
                }
                if (remoteAudioRef.current && remoteStream) {
                    remoteAudioRef.current.srcObject = remoteStream;
                    remoteAudioRef.current.play().catch(console.warn);
                }
                if (remoteStream) {
                    setTimeout(() => startRecording(), 500);
                }
            };

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    callSocketRef.current?.emit('call:ice-candidate', { callId: call.callId, candidate });
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log('[Calls] ICE state:', pc.iceConnectionState);
            };
        } catch (err) {
            console.error('[Calls] getUserMedia error:', err);
            alert('Could not access microphone. Please allow microphone access.');
            setActiveCall(null);
            setAvailableCalls((prev) => [targetCall, ...prev].sort((a, b) => new Date(a.startedAt || a.createdAt || Date.now()) - new Date(b.startedAt || b.createdAt || Date.now())));
        }
    }, [startRecording, stopRingtone]);

    const handleToggleMute = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => {
                t.enabled = callMuted; // toggle
            });
        }
        setCallMuted(m => !m);
    }, [callMuted]);

    const handleHangup = useCallback(() => {
        const duration = callStartedAtRef.current
            ? Math.round((Date.now() - callStartedAtRef.current) / 1000)
            : 0;
        callSocketRef.current?.emit('call:end', {
            callId: activeCall?.callId,
            endedBy: 'agent',
            duration,
        });
        cleanupCall(duration, 'agent');
    }, [activeCall, cleanupCall]);

    // Handle logout
    const handleNavClick = (key) => {
        if (key === "Logout") {
            localStorage.removeItem("agent_token");
            localStorage.removeItem("agent_user");
            window.location.href = "/";
            return;
        }
        
        const pathMap = {
            Dashboard: "/dashboard",
            Tickets: "/tickets",
            Calls: "/calls",
            Calendar: "/calendar",
            Analytics: "/analytics",
            Profile: "/profile",
            Settings: "/settings"
        };
        
        if (pathMap[key]) {
            navigate(pathMap[key]);
        }
    };

    return (
        <div className="cd-layout">
            {/* Hidden audio element for remote stream */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

            {/* Incoming call notification */}
            {incomingCall && !activeCall && (
                <div className="cd-call-notification">
                    <div className="cd-call-notification-content">
                        <PhoneIcon className="cd-call-notification-icon" />
                        <span>Incoming call from {incomingCall.customerName}</span>
                        <button className="cd-call-notification-btn" onClick={() => navigate("/calls")}>View Calls</button>
                    </div>
                </div>
            )}

            {activeCall && activeNav !== "Calls" && (
                <ActiveCallPanel callInfo={activeCall} muted={callMuted} onToggleMute={handleToggleMute} />
            )}

            {/* ── Left Sidebar ── */}
            <aside className="cd-sidebar">
                <div className="cd-sidebar-logo" onClick={() => navigate("/dashboard")} style={{ cursor: 'pointer' }}>
                    <img src={logo} alt="NATIQ" />
                </div>
                <nav className="cd-sidebar-nav">
                    <p className="cd-nav-label">Menu</p>
                    <ul className="cd-nav-list">
                        {MENU_KEYS.map(({ key, Icon, hasBadge, hasCallBadge }) => (
                            <li
                                key={key}
                                className={`cd-nav-item${activeNav === key ? ' cd-nav-active' : ''}`}
                                onClick={() => handleNavClick(key)}
                            >
                                <Icon className="cd-nav-icon" />
                                <span className="cd-nav-text">{key}</span>
                                {hasBadge && pendingCount > 0 && (
                                    <span className="cd-badge">+{pendingCount}</span>
                                )}
                                {hasCallBadge && availableCalls.length > 0 && (
                                    <span className="cd-badge" style={{ background: '#FF4757', color: '#fff' }}>{availableCalls.length}</span>
                                )}
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

                {/* ── Top Bar ── */}
                <header className="cd-topbar">
                    <div className="cd-topbar-left">
                        <div className="cd-search-wrap">
                            <MagnifyingGlassIcon className="cd-search-icon" />
                            <input className="cd-search" type="text" placeholder="Search task" />
                        </div>
                    </div>

                    <div className="cd-topbar-actions">
                        <button className="cd-icon-btn" aria-label="Messages">
                            <EnvelopeIcon className="cd-topbar-icon" />
                        </button>
                        <button className="cd-icon-btn" aria-label="Notifications" onClick={() => setShowNotifDropdown(!showNotifDropdown)} style={{ position: 'relative' }}>
                            <BellIcon className="cd-topbar-icon" />
                            {unreadNotifCount > 0 && <span className="cd-notif-badge">{unreadNotifCount}</span>}
                        </button>
                        {showNotifDropdown && (
                            <NotificationDropdown
                                notifications={notifications}
                                onMarkRead={handleMarkNotifRead}
                                onMarkAllRead={handleMarkAllNotifsRead}
                                onClose={() => setShowNotifDropdown(false)}
                            />
                        )}
                        <div className="cd-user-info" onClick={() => navigate("/profile")} style={{ cursor: 'pointer' }}>
                            <div className="cd-avatar">
                                {agentUser.avatar ? <img src={agentUser.avatar} alt="avatar" /> : agentUser.initials}
                            </div>
                            <div className="cd-user-text">
                                <span className="cd-user-name">{agentUser.name}</span>
                                <span className="cd-user-email">{agentUser.email}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <main className="cd-main">

                    {/* ── Tickets view ── */}
                    {activeNav === "Tickets" && <TicketsView />}

                    {/* ── Calls view ── */}
                    {activeNav === "Calls" && (
                        <CallsView
                            availableCalls={availableCalls}
                            activeCall={activeCall}
                            callMuted={callMuted}
                            agentMicStream={agentMicStream}
                            customerAudioStream={customerAudioStream}
                            onAcceptCall={handleAnswerCall}
                            onHangup={handleHangup}
                            onToggleMute={handleToggleMute}
                        />
                    )}

                    {/* ── Analytics view ── */}
                    {activeNav === "Analytics" && <AnalyticsView />}

                    {/* ── Calendar view ── */}
                    {activeNav === "Calendar" && <CalendarView />}

                    {/* ── Profile view ── */}
                    {activeNav === "Profile" && <ProfileView user={agentUser} />}

                    {/* ── Settings view ── */}
                    {activeNav === "Profile" && (
                        <SettingsPage
                            user={{
                                name: agentUser.name,
                                email: agentUser.email,
                                phone: agentUser.phone || "",
                                avatar: agentUser.avatar,
                                role: "Agent",
                            }}
                            roleLabel="Agent"
                            onSaveProfile={async (payload) => {
                                const updated = await agentApi.updateProfile(payload);
                                setAgentUser(getAgentUser());
                                return updated;
                            }}
                            onChangePassword={(payload) => agentApi.changePassword(payload)}
                        />
                    )}

                    {/* ── Dashboard view ── */}
                    {activeNav !== "Tickets" && activeNav !== "Calls" && activeNav !== "Analytics" && activeNav !== "Calendar" && activeNav !== "Profile" && activeNav !== "Settings" && <>
                        <div className={`cd-bento-layout ${dashLoading ? "cd-dashboard-loading" : ""}`}>
                            {/* ── Welcome Header ── */}
                            <div className="cd-bento-header">
                                <div>
                                    <h1>Welcome back, {agentUser.name.split(" ")[0]}!</h1>
                                    <p>Here is what's happening with your tasks today.</p>
                                </div>
                                <div className="cd-bento-date">
                                    {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                                </div>
                            </div>

                            {/* ── KPIs Row ── */}
                            <div className="cd-bento-kpis">
                                <StatCardDark
                                    title="Flagged Tickets"
                                    value={uiKpis.flaggedTickets ?? 0}
                                    note="Ticket workload breakdown"
                                    badge={tasks.inProgressTicketsCount ?? ""}
                                    loading={dashLoading}
                                    pulseKey={refreshCount}
                                    icon={FlagIcon}
                                    bars={statusBars}
                                    style={{ '--card-delay': '0ms' }}
                                />
                                <StatCardLight
                                    title="Pending Tickets"
                                    value={uiKpis.pendingTickets ?? 0}
                                    note="Workload by status"
                                    badge={pendingCount > 0 ? `${pendingCount}+` : "0"}
                                    loading={dashLoading}
                                    pulseKey={refreshCount}
                                    icon={TicketIcon}
                                    accent="#f59e0b"
                                    bars={statusBars}
                                    style={{ '--card-delay': '60ms' }}
                                />
                                <StatCardLight
                                    title="Avg. Response Time"
                                    value={dashLoading ? null : (uiKpis.avgLateReplyString || null)}
                                    note="Seconds vs goal & team"
                                    badge={uiKpis.avgLateReplySec ?? ""}
                                    loading={dashLoading}
                                    pulseKey={refreshCount}
                                    icon={BoltIcon}
                                    accent="#3b82f6"
                                    bars={responseBars}
                                    style={{ '--card-delay': '120ms' }}
                                />
                                <StatCardLight
                                    title="Avg. Call Duration"
                                    value={dashLoading ? null : (uiKpis.avgCallDurationString || null)}
                                    note="Answered vs missed calls"
                                    badge={(callStats.totalCalls ?? 0) > 0 ? `${callStats.totalCalls} calls` : ""}
                                    loading={dashLoading}
                                    pulseKey={refreshCount}
                                    icon={PhoneIcon}
                                    accent="#22c55e"
                                    bars={callBars}
                                    style={{ '--card-delay': '180ms' }}
                                />
                            </div>

                            {/* ── Call Performance — 3 wide cells w/ hourly area charts ── */}
                            <div className="cd-callcards-row">
                                <CallStatCard
                                    icon={<PhoneArrowDownLeftIcon />}
                                    label="Answered"
                                    accent="#22c55e"
                                    countTo={callStats.answeredCalls || 0}
                                    hint={callTotal > 0
                                        ? `${Math.round(((callStats.answeredCalls || 0) / callTotal) * 100)}% of all calls picked up`
                                        : "Calls you picked up"}
                                    chart={callSeries.answered}
                                    chartCaption="Calls answered per hour · last 90 days"
                                />
                                <CallStatCard
                                    icon={<PhoneIcon />}
                                    label="Total Calls"
                                    accent="#042835"
                                    countTo={callTotal}
                                    hint="All inbound voice sessions"
                                    chart={callSeries.total}
                                    chartCaption="Total calls per hour · last 90 days"
                                />
                                <CallStatCard
                                    icon={<PhoneXMarkIcon />}
                                    label="Missed"
                                    accent="#ff4757"
                                    countTo={callStats.missedCalls || 0}
                                    hint={callTotal > 0
                                        ? `${Math.round(((callStats.missedCalls || 0) / callTotal) * 100)}% of calls went unanswered`
                                        : "Calls that rang out"}
                                    chart={callSeries.missed}
                                    chartCaption="Missed calls per hour · last 90 days"
                                />
                            </div>

                            {/* ── Main Bento Grid ── */}
                            <div className="cd-bento-main">
                                
                                {/* ── Left Column ── */}
                                <div className="cd-bento-left">
                                    {/* Big Line Chart */}
                                    <div className="cd-chart-big-card">
                                        <div className="cd-chart-big-header">
                                            <div>
                                                <p className="cd-chart-big-title">Performance Trend</p>
                                                <p className="cd-chart-big-sub">Tickets vs Calls processed</p>
                                            </div>
                                            <PeriodDropdown value={period} onChange={setPeriod} />
                                        </div>
                                        <div className="cd-chart-area" style={{ height: '220px', padding: '10px 0 0 0' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={rechartsData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                                    <defs>
                                                        <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0d2137" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#0d2137" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#CAF301" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#CAF301" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f2f5" />
                                                    <XAxis 
                                                        dataKey="name" 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                                                        minTickGap={20}
                                                    />
                                                    <YAxis 
                                                        axisLine={false} 
                                                        tickLine={false} 
                                                        tick={{ fontSize: 11, fill: '#9ca3af' }} 
                                                    />
                                                    <RechartsTooltip 
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                                    />
                                                    <Area 
                                                        type="natural" 
                                                        dataKey="assigned" 
                                                        name="Assigned" 
                                                        stroke="#0d2137" 
                                                        fillOpacity={1} 
                                                        fill="url(#colorAssigned)"
                                                        strokeWidth={3} 
                                                        activeDot={{ r: 6, fill: '#0d2137', stroke: '#fff', strokeWidth: 2 }} 
                                                    />
                                                    <Area 
                                                        type="natural" 
                                                        dataKey="resolved" 
                                                        name="Resolved" 
                                                        stroke="#CAF301" 
                                                        fillOpacity={1} 
                                                        fill="url(#colorResolved)"
                                                        strokeWidth={3} 
                                                        activeDot={{ r: 6, fill: '#CAF301', stroke: '#0d2137', strokeWidth: 2 }} 
                                                    />
                                                    <Legend 
                                                        verticalAlign="bottom" 
                                                        height={36} 
                                                        iconType="circle" 
                                                        wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} 
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Activity dot-grid (resolved tickets, last 4 weeks) */}
                                    <div className="cd-chart-card cd-activity-card">
                                        <div className="cd-activity-head">
                                            <div>
                                                <p className="cd-chart-title">Resolution Activity</p>
                                                <p className="cd-activity-sub">{activeDays} active {activeDays === 1 ? 'day' : 'days'} · last 4 weeks</p>
                                            </div>
                                            <div className="cd-activity-legend">
                                                <span><i className="cd-act-dot-done" /> Active</span>
                                                <span><i className="cd-act-dot-empty" /> No activity</span>
                                            </div>
                                        </div>
                                        <DotGrid rows={activityGrid} cols={["", "", "", "", "", "", "", "", "", "", "", ""]} loading={dashLoading} />
                                    </div>

                                    </div>

                                {/* ── Right Column ── */}
                                <div className="cd-bento-right">
                                    
                                    {/* Time Tracker */}
                                    <div className="cd-timetracker-card cd-timetracker-sleek">
                                        <div className="cd-tt-info">
                                            <p className="cd-timetracker-title">Current Shift Time</p>
                                            <p className="cd-timetracker-time">{formatTime(trackerTime)}</p>
                                        </div>
                                        <div className="cd-timetracker-actions">
                                            <button className="cd-tt-btn cd-tt-pause" onClick={() => setTrackerActive(!trackerActive)}>
                                                {trackerActive ? <><b className="cd-tt-pause-bar"></b><b className="cd-tt-pause-bar"></b></> : <b className="cd-tt-play-triangle"></b>}
                                            </button>
                                            <button className="cd-tt-btn cd-tt-stop" onClick={() => { setTrackerActive(false); setTrackerTime(0); }}>
                                                <b className="cd-tt-stop-square"></b>
                                            </button>
                                        </div>
                                    </div>

                                        {/* Today's Tasks Summary Card */}
                                        <div className="cd-stat-card cd-tasks-overview-card" style={{ flex: 1 }}>
                                            <div className="cd-stat-card-header">
                                                <p className="cd-stat-title">Today's Reminder</p>
                                                <div className="cd-stat-header-right">
                                                    <button className="cd-goal-link" onClick={() => navigate("/calendar")}>
                                                        <ArrowUpRightIcon className="cd-icon-link" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="cd-tasks-list-mini">
                                                {todayTasks.length === 0 ? (
                                                    <div className="cd-tasks-empty-wrap">
                                                        <CalendarDaysIcon className="cd-tasks-empty-icon-mini" />
                                                        <p className="cd-tasks-empty-text">No tasks for today</p>
                                                        <button className="cd-tasks-add-link" onClick={() => navigate("/calendar")}>
                                                            + Add a task
                                                        </button>
                                                    </div>
                                                ) : (
                                                    todayTasks.slice(0, 4).map((task) => (
                                                        <div key={task._id} className="cd-task-item-mini">
                                                            <div className={`cd-task-dot ${task.done ? 'is-done' : ''}`} />
                                                            <div className="cd-task-body-mini">
                                                                <span className={`cd-task-title-mini ${task.done ? 'is-done' : ''}`}>
                                                                    {task.title}
                                                                </span>
                                                                {task.description && (
                                                                    <span className="cd-task-desc-mini">{task.description}</span>
                                                                )}
                                                            </div>
                                                            {task.time && <span className="cd-task-time-mini">{task.time}</span>}
                                                        </div>
                                                    ))
                                                )}
                                                {todayTasks.length > 4 && (
                                                    <p className="cd-tasks-more-link" onClick={() => navigate("/calendar")}>
                                                        + {todayTasks.length - 4} more in calendar
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                </div>
                            </div>
                            
                            {/* ── Bottom Bento Row ── */}
                            <div className="cd-bento-bottom">
                                {/* Sub-split: Tickets Stats & Goals */}
                                    <div className="cd-bento-contents" style={{ display: 'contents' }}>
                                        <div className="cd-chart-card cd-donut-card">
                                            <div className="cd-donut-card-head">
                                                <p className="cd-chart-title">Ticket Status</p>
                                                <div className="cd-donut-total">
                                                    <span className="cd-donut-total-num">{ticketTotal}</span>
                                                    <span className="cd-donut-total-cap">total</span>
                                                </div>
                                            </div>
                                            <div className="cd-donut-card-body">
                                                {ticketDonut.length === 0 ? (
                                                    <p className="cd-tasks-empty-text">No ticket data yet</p>
                                                ) : (
                                                    <DonutChart
                                                        data={ticketDonut}
                                                        centerValue={`${completedPct}%`}
                                                        centerSub="completed"
                                                        loading={dashLoading}
                                                    />
                                                )}
                                            </div>
                                            <div className="cd-donut-breakdown">
                                                {[
                                                    { label: 'Resolved', count: tasks.resolvedTicketsCount || 0, color: '#16a34a' },
                                                    { label: 'Closed', count: tasks.closedTicketsCount || 0, color: '#84cc16' },
                                                    { label: 'In progress', count: tasks.inProgressTicketsCount || 0, color: '#f59e0b' },
                                                    { label: 'Open', count: tasks.openTicketsCount || 0, color: '#042835' },
                                                ].map((s) => {
                                                    const pct = ticketTotal > 0 ? Math.round((s.count / ticketTotal) * 100) : 0;
                                                    return (
                                                        <div key={s.label} className="cd-donut-bd-row">
                                                            <span className="cd-donut-bd-dot" style={{ background: s.color }} />
                                                            <span className="cd-donut-bd-label">{s.label}</span>
                                                            <span className="cd-donut-bd-count">{s.count}</span>
                                                            <div className="cd-donut-bd-track">
                                                                <span style={{ width: `${pct}%`, background: s.color }} />
                                                            </div>
                                                            <span className="cd-donut-bd-pct">{pct}%</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="cd-goal-tickets-card cd-gauge-card">
                                            <div className="cd-goal-tickets-header">
                                                <p className="cd-goal-tickets-title">Satisfaction</p>
                                                <button className="cd-goal-link"><ArrowUpRightIcon className="cd-icon-link" /></button>
                                            </div>
                                            <div className="cd-gauge-card-body">
                                                <GaugeChart value={csatScore} label="CSAT" min={0} max={100} loading={dashLoading} />
                                            </div>
                                            <div className="cd-gauge-card-foot">
                                                <GradientBar
                                                    percent={goalTickets.percentageCompleted ?? 0}
                                                    leftLabel="Goal progress"
                                                    leftValue={goalTickets.current ?? tasks.resolvedTicketsCount ?? 0}
                                                    rightLabel={`Target ${goalTickets.total || 500}`}
                                                    rightValue={`${goalTickets.percentageCompleted ?? 0}%`}
                                                    loading={dashLoading}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                
                                    {/* Sub-split: Feedback & CSAT */}
                                    <div className="cd-bento-stack">
                                        <div className="cd-feedback-card cd-feedback-donut-card">
                                            <div className="cd-feedback-header">
                                                <p className="cd-feedback-title">Avg. Feedback</p>
                                            </div>
                                            {dashLoading ? (
                                                <div className="cd-stat-skeleton" style={{ height: 110, width: '100%', margin: '8px 0' }} />
                                            ) : fbTotal === 0 ? (
                                                <div className="cd-fb-empty">
                                                    <span className="cd-empty-dash cd-empty-dash--lg">—</span>
                                                    <p className="cd-fb-empty-sub">No ratings yet</p>
                                                </div>
                                            ) : (
                                                <div className="cd-fb-body">
                                                    <div className="cd-fb-donut-wrap">
                                                        <DonutChart
                                                            data={fbDonut}
                                                            centerValue={`${avgFeedback}`}
                                                            centerSub="out of 5"
                                                            loading={dashLoading}
                                                        />
                                                    </div>
                                                    <div className="cd-fb-side">
                                                        <p className="cd-fb-desc">
                                                            Based on <strong>{fbTotal}</strong> customer rating{fbTotal === 1 ? '' : 's'}.
                                                            CSAT score <strong>{fbStats.csat ?? 0}%</strong>.
                                                        </p>
                                                        <div className="cd-fb-legend">
                                                            {fbSegments.map((s) => (
                                                                <div key={s.label} className="cd-fb-legend-item">
                                                                    <span className="cd-fb-legend-bar" style={{ background: s.color }} />
                                                                    <span className="cd-fb-legend-label">{s.label}</span>
                                                                    <span className="cd-fb-legend-val">{s.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="cd-cast-card">
                                            <div className="cd-cast-header">
                                                <p className="cd-cast-title">CSAT Status</p>
                                            </div>
                                            {(!dashLoading && fbTotal === 0) ? (
                                                <div className="cd-cast-empty">
                                                    <span className="cd-empty-dash cd-empty-dash--lg">—</span>
                                                    <p style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>No CSAT data yet</p>
                                                </div>
                                            ) : (
                                                <div className="cd-csat-body">
                                                    {/* score + summary */}
                                                    <div className="cd-csat-top">
                                                        <div className="cd-csat-score-wrap">
                                                            <span className="cd-csat-score">{csatScore}%</span>
                                                            <span className="cd-csat-score-label">satisfied</span>
                                                        </div>
                                                        <p className="cd-csat-summary">
                                                            <strong>{csatSatisfied}</strong> of <strong>{fbTotal}</strong> customers rated 4★ or higher
                                                        </p>
                                                    </div>

                                                    {/* stacked satisfaction bar */}
                                                    <div className="cd-csat-bar">
                                                        {csatBreakdown.filter((s) => s.count > 0).map((s) => (
                                                            <span
                                                                key={s.label}
                                                                className="cd-csat-bar-seg"
                                                                style={{ width: `${s.pct}%`, background: s.color }}
                                                                title={`${s.label}: ${s.count} (${s.pct}%)`}
                                                            />
                                                        ))}
                                                    </div>

                                                    {/* breakdown rows */}
                                                    <div className="cd-csat-legend">
                                                        {csatBreakdown.map((s) => (
                                                            <div key={s.label} className="cd-csat-legend-row">
                                                                <span className="cd-csat-legend-dot" style={{ background: s.color }} />
                                                                <span className="cd-csat-legend-name">{s.label}</span>
                                                                <span className="cd-csat-legend-sub">{s.sub}</span>
                                                                <span className="cd-csat-legend-count">{s.count}</span>
                                                                <span className="cd-csat-legend-pct">{s.pct}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                            </div>
                        </div>
                    </>}

                </main>
            </div>

        </div>
    );
}

export default NatiqDashboard;
