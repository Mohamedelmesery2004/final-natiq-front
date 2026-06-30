# 🧠 NATIQ Dashboard — Project Documentation

> **Last Updated:** April 30, 2026  
> Auto-generated reference doc covering architecture, components, styles, data flow, and design decisions.

---

## 📁 Project Structure

```
front/src/pages/NatiqDashboard/
├── index.js                  # Main monolithic component (~3100 lines)
└── NatiqDashboard.css        # All styles (~4200 lines), class prefix: cd-
```

---

## 🎨 Design System

### Color Palette

| Token | Value | Usage |
|---|---|---|
| **Navy (primary)** | `#0d2137` | Sidebar background |
| **Dark green** | `#1a3a2a → #1e4d2e` | Dark KPI card gradient |
| **Lime** | `#CAF301` | Accent, active indicators |
| **White** | `#ffffff` | Cards, topbar, active sidebar pill |
| **Light gray** | `#f0f2f5` | Main content background |
| **Border gray** | `#eaecf0` | Card borders |
| **Text dark** | `#1a2332 / #111827` | Headings |
| **Text muted** | `#6b7280` | Subtitles, labels |
| **Red** | `#FF4757` | Call badges, errors |
| **Green** | `#22c55e` | Positive KPI change |

### Typography
- **Font:** `'Inter', 'Poppins', sans-serif`
- **Headings:** 700 weight, color `#1a2332`
- **Labels:** 600 weight, uppercase, `#6b7280`
- **Body:** 500 weight, `#374151`

### Spacing & Shape
- **Card radius:** `16px` (main cards), `10px` (nav items)
- **Card padding:** `18px 20px`
- **Card shadow:** `0 1px 4px rgba(0,0,0,0.04)` → hover `0 8px 24px rgba(0,0,0,0.08)`
- **Sidebar width:** `210px`
- **Topbar height:** `64px`
- **Gap (grid):** `16px`

---

## 🏗️ Layout Structure

```
.cd-layout  (display: flex, height: 100vh)
├── <aside class="cd-sidebar">          ← 210px dark navy sidebar
│   ├── .cd-sidebar-logo                ← NATIQ logo (white inverted)
│   └── .cd-sidebar-nav
│       ├── MENU section
│       │   ├── Dashboard  (active = white pill)
│       │   ├── Tickets    (+ pending badge)
│       │   ├── Calls      (+ live call badge, red)
│       │   ├── Calendar
│       │   └── Analytics
│       └── GENERAL section
│           ├── Settings
│           └── Logout
└── .cd-right-panel  (flex: 1)
    ├── <header class="cd-topbar">      ← 64px white topbar
    │   ├── .cd-topbar-left
    │   │   └── .cd-search-wrap         ← "Search task" pill input
    │   └── .cd-topbar-actions
    │       ├── EnvelopeIcon button
    │       ├── BellIcon button + notif badge
    │       ├── NotificationDropdown (conditional)
    │       └── .cd-user-info           ← Avatar + name + email
    └── <main class="cd-main">          ← scrollable content area
        └── [view-specific content]
```

---

## 🧩 Views / Sections

### 1. Dashboard (default)
**Class:** `.cd-bento-layout`

```
.cd-bento-header     ← "Welcome back, [Name]!" + date pill
.cd-bento-kpis       ← 4-column KPI grid
  ├── Flagged Tickets   (dark card: #0d2137→#1a3a2a, lime value)
  ├── Pending Tickets   (white card)
  ├── Avg. Response Time (white card)
  └── Avg. Call Duration (white card)
.cd-bento-main       ← 1.7fr / 1fr two-column grid
  ├── .cd-bento-left
  │   ├── .cd-chart-big-card  ← Performance Trend line chart (SVG)
  │   └── .cd-bento-split     ← 2-col: Channels Breakdown + Goal Tickets
  └── .cd-bento-right
      ├── .cd-timetracker-card (dark)  ← Current Shift Time counter
      ├── .cd-reminders-card           ← Today's Reminder / tasks
      ├── .cd-bento-split
      │   ├── .cd-feedback-card  ← Avg. Feedback (stars)
      │   └── .cd-cast-card      ← CSAT STATUS (donut ring)
      └── .cd-stat-card          ← Avg. Worked Time (dark)
```

### 2. Tickets View (`/tickets`)
WhatsApp-style 3-column layout:
- **Rail** (60px): channel filter icons (WhatsApp, Telegram, Instagram, Email, All)
- **Sidebar** (300px): ticket list with search, filter, status tabs
- **Chat Panel**: message thread + input with attachments

### 3. Calls View (`/calls`)
Live call session with:
- WebRTC audio via `getUserMedia` + `MediaRecorder`
- SVG frequency visualizer (32 bars)
- Ring envelope animation
- Available calls queue list

### 4. Calendar View (`/calendar`)
Monthly calendar grid, event list, draggable events

### 5. Analytics View (`/analytics`)
KPI summaries + charts (calls, resolution rate, etc.)

### 6. Profile View (`/profile`)
Agent personal details, password change

---

## ⚙️ State Management (in `NatiqDashboard`)

| State | Type | Purpose |
|---|---|---|
| `activeNav` | `string` | Current active view (synced with router path) |
| `dashboardData` | `object` | KPIs: flagged, pending tickets, response time, call duration |
| `tasks` | `array` | Today's task reminders |
| `notifications` | `array` | Bell icon notifications |
| `showNotifDropdown` | `bool` | Notification panel toggle |
| `availableCalls` | `array` | Incoming call queue from socket |
| `activeCall` | `object \| null` | Currently active WebRTC call |
| `incomingCall` | `object \| null` | Ringing call (not yet accepted) |
| `callMuted` | `bool` | Mic mute state |
| `agentUser` | `object` | `{ name, email, initials, avatar }` |

---

## 🔌 Real-time (Socket.IO)

**Connection:** `socket.io-client` → backend URL from env

| Event (listen) | Trigger |
|---|---|
| `new_ticket` | Increments pending badge |
| `call_available` | Adds to `availableCalls` queue |
| `call_ended` | Clears `activeCall` |
| `notification` | Pushes to notifications list |

---

## 🧬 Key Components (all in `index.js`)

| Component | Purpose |
|---|---|
| `StatCardLight` | KPI card with count-up animation, period dropdown |
| `CallSessionLive` | Live call UI: waveform bars, ring animation, timer |
| `ActiveCallPanel` | Floating bottom bar when on call outside Calls view |
| `NotificationDropdown` | Bell dropdown: unread dot, mark all, list |
| `TicketsView` | Full tickets + messaging panel |
| `CalendarView` | Monthly calendar |
| `AnalyticsView` | Charts and metrics |
| `ProfileView` | Agent profile |
| `ChannelIcon` | SVG brand icons (WhatsApp, Telegram, etc.) |
| `StarRating` | Half/full star renderer from 0–5 value |
| `CastDonut` | SVG donut ring for CSAT percentage |

---

## 📡 API Calls (`agentApi`)

| Method | Endpoint | Used in |
|---|---|---|
| `getDashboardData()` | `GET /agent/dashboard` | KPIs on mount |
| `getTasks()` | `GET /agent/tasks` | Reminders card |
| `getNotifications()` | `GET /agent/notifications` | Bell dropdown |
| `getTickets(filter)` | `GET /agent/tickets` | TicketsView |
| `sendMessage(ticketId, msg)` | `POST /agent/tickets/:id/message` | Chat panel |
| `markNotifRead(id)` | `PATCH /agent/notifications/:id` | Notif dropdown |

---

## 🎭 Navigation

```js
const MENU_KEYS = [
  { key: "Dashboard", Icon: Squares2X2Icon },
  { key: "Tickets",   Icon: ClipboardDocumentListIcon, hasBadge: true },
  { key: "Calls",     Icon: PhoneIcon, hasCallBadge: true },
  { key: "Calendar",  Icon: CalendarDaysIcon },
  { key: "Analytics", Icon: ArrowUpRightIcon },
];

const GENERAL_KEYS = [
  { key: "Settings", Icon: Cog6ToothIcon },
  { key: "Logout",   Icon: ArrowRightOnRectangleIcon },
];
```

Path mapping: `/dashboard`, `/tickets`, `/calls`, `/calendar`, `/analytics`, `/profile`, `/settings`

---

## 🖼️ CSS Class Reference (prefix: `cd-`)

### Layout
| Class | Description |
|---|---|
| `.cd-layout` | Root flex container (100vh) |
| `.cd-sidebar` | Left nav (210px, `#0d2137`) |
| `.cd-sidebar-logo` | Logo area with bottom border |
| `.cd-sidebar-nav` | Nav list area |
| `.cd-nav-label` | Section label (MENU / GENERAL) |
| `.cd-nav-item` | Each nav button |
| `.cd-nav-active` | Active state → **white bg, dark text** |
| `.cd-badge` | Count badge on nav item |
| `.cd-right-panel` | Main content flex column |
| `.cd-topbar` | 64px white header |
| `.cd-search` | Pill search input |
| `.cd-icon-btn` | Transparent icon button in topbar |
| `.cd-avatar` | Round user avatar (38px) |
| `.cd-main` | Scrollable content area (`#f0f2f5`) |

### Dashboard Cards
| Class | Description |
|---|---|
| `.cd-bento-layout` | Outer flex column |
| `.cd-bento-kpis` | 4-column KPI grid |
| `.cd-bento-main` | 1.7fr / 1fr two-col grid |
| `.cd-stat-card` | White KPI card |
| `.cd-stat-card-dark` | Dark gradient KPI card |
| `.cd-stat-value` | Large number (30px, bold) |
| `.cd-stat-note` | Green change indicator |
| `.cd-chart-big-card` | Line chart container |
| `.cd-chart-card` | Bar chart container |
| `.cd-goal-tickets-card` | Goal ring card |
| `.cd-reminders-card` | Task list card |
| `.cd-feedback-card` | Star rating card |
| `.cd-cast-card` | CSAT donut card |
| `.cd-timetracker-card` | Shift time dark card |

### Tickets View
| Class | Description |
|---|---|
| `.cd-wa-layout` | 3-panel tickets container |
| `.cd-wa-rail` | Channel icon rail (60px) |
| `.cd-wa-sidebar` | Ticket list panel |
| `.cd-wa-chat` | Message thread panel |
| `.cd-wa-bubble` | Individual chat bubble |

---

## 🔧 Performance Notes

- **Count-up animation:** `requestAnimationFrame` in `StatCardLight.useEffect`
- **SVG charts:** Points generated with `useMemo` from ticket data
- **Audio visualizer:** `AnalyserNode` → 32 frequency bands → SVG bars
- **Memoized callbacks:** `useCallback` on socket handlers to avoid re-registration
- **Heavy file:** `index.js` is ~3100 lines — future refactor target is splitting into per-view files

---

## 🚀 Dev Commands

```bash
# Start dev server (port 3000)
npm start          # in /front directory

# Already running? Check:
# http://localhost:3000/dashboard
```

---

## 📝 Known Issues / TODOs

- [ ] Split `index.js` into separate view components for maintainability
- [ ] Add `React.lazy()` / code splitting per view
- [ ] Add responsive/mobile sidebar (hamburger menu)
- [ ] Analytics view charts need real data wiring
- [ ] Performance Trend chart x-axis labels sometimes overlap on small screens
