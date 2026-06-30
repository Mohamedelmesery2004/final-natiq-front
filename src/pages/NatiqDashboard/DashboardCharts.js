import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./DashboardCharts.css";

/* ════════════════════════════════════════════════════════
   DisputeFox-style charts — custom SVG + GSAP animations
   Green NATIQ theme.
════════════════════════════════════════════════════════ */

const GREEN_DEEP = "#0a4a36";
const LIME = "#84cc16";
const LIME_BRIGHT = "#CAF301";
const AMBER = "#f59e0b";
const RED = "#ef4444";

/* ── 1. Semicircular gauge (credit-score style) ──
   value 0–100. Animated sweep + count-up. */
export function GaugeChart({ value = 0, label = "Score", min = 0, max = 100, loading }) {
    const arcRef = useRef(null);
    const numRef = useRef(null);
    const rootRef = useRef(null);

    // geometry: 180° arc, radius 80, center (100,100)
    const R = 80;
    const CX = 100;
    const CY = 100;
    const circumference = Math.PI * R; // half circle length

    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            const dash = { v: 0 };
            const counter = { n: 0 };
            const tl = gsap.timeline();
            tl.to(dash, {
                v: pct,
                duration: 1.3,
                ease: "power3.out",
                onUpdate: () => {
                    if (arcRef.current)
                        arcRef.current.style.strokeDasharray = `${circumference * dash.v} ${circumference}`;
                },
            }, 0);
            tl.to(counter, {
                n: value,
                duration: 1.3,
                ease: "power3.out",
                onUpdate: () => {
                    if (numRef.current) numRef.current.textContent = Math.round(counter.n);
                },
            }, 0);
        }, rootRef);
        return () => ctx.revert();
    }, [value, pct, circumference, loading]);

    return (
        <div className="dfc-gauge" ref={rootRef}>
            <svg viewBox="0 0 200 120" className="dfc-gauge-svg">
                <defs>
                    <linearGradient id="dfcGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={RED} />
                        <stop offset="45%" stopColor={AMBER} />
                        <stop offset="100%" stopColor={LIME} />
                    </linearGradient>
                </defs>
                {/* track */}
                <path
                    d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                    fill="none"
                    stroke="rgba(4,40,53,0.08)"
                    strokeWidth="14"
                    strokeLinecap="round"
                />
                {/* value arc */}
                <path
                    ref={arcRef}
                    d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                    fill="none"
                    stroke="url(#dfcGaugeGrad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`0 ${circumference}`}
                />
            </svg>
            <div className="dfc-gauge-center">
                <span className="dfc-gauge-value" ref={numRef}>{loading ? "—" : 0}</span>
                <span className="dfc-gauge-label">{label}</span>
            </div>
            <div className="dfc-gauge-bounds">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

/* ── 2. Segmented donut (credit-card-use style) ──
   data: [{ label, value, color }]. Center shows main %. */
export function DonutChart({ data = [], centerValue = "", centerSub = "", loading }) {
    const rootRef = useRef(null);
    const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;

    const R = 54;
    const C = 2 * Math.PI * R;
    let offset = 0;
    const segs = data.map((d) => {
        const frac = (d.value || 0) / total;
        const seg = { ...d, frac, dash: C * frac, gap: C * (1 - frac), rot: offset * 360 };
        offset += frac;
        return seg;
    });

    // Stable signature of the data so the animation only replays when the
    // values actually change — not on every re-render / 30s auto-refresh.
    const dataKey = data.map((d) => `${d.label}:${d.value}`).join("|");
    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.from(".dfc-donut-seg", {
                opacity: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: "power2.out",
            });
            gsap.fromTo(
                ".dfc-donut-svg",
                { rotate: -18, scale: 0.92, transformOrigin: "50% 50%" },
                { rotate: 0, scale: 1, duration: 0.9, ease: "back.out(1.5)" }
            );
        }, rootRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, dataKey]);

    return (
        <div className="dfc-donut-wrap" ref={rootRef}>
            <div className="dfc-donut">
                <svg viewBox="0 0 140 140" className="dfc-donut-svg">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(4,40,53,0.06)" strokeWidth="14" />
                    {segs.map((s, i) => (
                        <circle
                            key={i}
                            className="dfc-donut-seg"
                            cx="70" cy="70" r={R}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${s.dash} ${s.gap}`}
                            strokeDashoffset={-(s.rot / 360) * C}
                            transform="rotate(-90 70 70)"
                        />
                    ))}
                </svg>
                <div className="dfc-donut-center">
                    <span className="dfc-donut-val">{loading ? "—" : centerValue}</span>
                    {centerSub && <span className="dfc-donut-sub">{centerSub}</span>}
                </div>
            </div>
            <div className="dfc-donut-legend">
                {data.map((d, i) => (
                    <div key={i} className="dfc-legend-item">
                        <i style={{ background: d.color }} />
                        <span className="dfc-legend-label">{d.label}</span>
                        <span className="dfc-legend-val">{d.value}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── 3. Gradient progress bar (overview style) ── */
export function GradientBar({ percent = 0, leftLabel, leftValue, rightLabel, rightValue, loading }) {
    const fillRef = useRef(null);
    const rootRef = useRef(null);

    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.fromTo(
                fillRef.current,
                { width: "0%" },
                { width: `${Math.max(0, Math.min(100, percent))}%`, duration: 1.1, ease: "power3.out" }
            );
        }, rootRef);
        return () => ctx.revert();
    }, [percent, loading]);

    return (
        <div className="dfc-gbar" ref={rootRef}>
            <div className="dfc-gbar-track">
                <div className="dfc-gbar-fill" ref={fillRef} style={{ width: 0 }} />
            </div>
            <div className="dfc-gbar-labels">
                <div>
                    <span className="dfc-gbar-cap">{leftLabel}</span>
                    <strong className="dfc-gbar-num">{leftValue}</strong>
                </div>
                <div className="dfc-gbar-right">
                    <span className="dfc-gbar-cap">{rightLabel}</span>
                    <strong className="dfc-gbar-num">{rightValue}</strong>
                </div>
            </div>
        </div>
    );
}

/* ── 4. Activity dot-grid (payment-history style) ──
   weeks: array of { label, days: [0|1|2,...] }  (0 empty, 1 done, 2 miss) */
export function DotGrid({ rows = [], cols = [], loading }) {
    const rootRef = useRef(null);

    // stable signature → only re-animate when the grid actually changes
    const rowsKey = rows.map((r) => r.days.join("")).join("|");
    useEffect(() => {
        if (loading) return;
        const ctx = gsap.context(() => {
            gsap.from(".dfc-dot", {
                scale: 0,
                opacity: 0,
                duration: 0.4,
                ease: "back.out(2)",
                stagger: { each: 0.012, grid: "auto", from: "start" },
            });
        }, rootRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, rowsKey]);

    return (
        <div className="dfc-dotgrid" ref={rootRef}>
            <div className="dfc-dotgrid-cols">
                <span className="dfc-dotgrid-rowhead" />
                {cols.map((c, i) => <span key={i} className="dfc-dotgrid-col">{c}</span>)}
            </div>
            {rows.map((row, ri) => (
                <div key={ri} className="dfc-dotgrid-row">
                    <span className="dfc-dotgrid-rowhead">{row.label}</span>
                    {row.days.map((state, ci) => (
                        <span
                            key={ci}
                            className={`dfc-dot dfc-dot-${state === 2 ? "miss" : state === 1 ? "done" : "empty"}`}
                        >
                            {state === 2 ? "×" : ""}
                        </span>
                    ))}
                </div>
            ))}
        </div>
    );
}

/* Catmull-Rom → cubic-bezier smoothing for a soft area-chart line. */
function smoothPath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
}

/* ── Small area chart + dashed mean line (sleep-tracker style) ──
   data: number[] (the metric over time). Dashed line = series mean.
   Draw-on animates once, keyed to a stable data signature. */
export function MiniAreaChart({ data = [], accent = "#16a34a", height = 46 }) {
    const lineRef = useRef(null);
    const rootRef = useRef(null);
    const sig = Array.isArray(data) ? data.join(",") : "";
    const valid = Array.isArray(data) ? data.filter((v) => typeof v === "number") : [];
    const hasTrend = valid.length >= 2 && !valid.every((v) => v === valid[0]);

    const W = 120, H = height;
    const gid = `ma-${accent.replace("#", "")}-${valid.length}`;
    let line = "", area = "", meanY = H / 2;
    if (hasTrend) {
        const max = Math.max(...valid, 1);
        const min = Math.min(...valid, 0);
        const range = max - min || 1;
        const stepX = W / (valid.length - 1);
        const pts = valid.map((v, i) => [i * stepX, H - ((v - min) / range) * (H - 6) - 3]);
        line = smoothPath(pts);
        area = `${line} L ${W} ${H} L 0 ${H} Z`;
        const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
        meanY = H - ((mean - min) / range) * (H - 6) - 3;
    }

    useEffect(() => {
        if (!hasTrend || !lineRef.current) return;
        const path = lineRef.current;
        const len = path.getTotalLength();
        const ctx = gsap.context(() => {
            gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
            gsap.to(path, { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" });
        }, rootRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sig, hasTrend]);

    if (!hasTrend) return <span className="cd-callcard-spark-empty">no trend yet</span>;

    return (
        <svg ref={rootRef} className="cd-callcard-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={height} width="100%">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <line x1="0" y1={meanY} x2={W} y2={meanY} stroke={accent} strokeWidth="1.3" strokeDasharray="4 4" opacity="0.55" />
            <path ref={lineRef} d={line} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/* ── Standalone call-stat card ──
   value/countTo: the big number. icon, accent, label.
   hint: short explanatory sub-line under the number.
   chart: optional number[] → MiniAreaChart. chartCaption: what the chart shows.
   ringPct: optional 0–100 ring (omit to hide the ring). */
export function CallStatCard({ icon, label, value, accent = "#16a34a", ringPct = null, countTo = null, suffix = "", chart = null, hint = null, chartCaption = null }) {
    const ringRef = useRef(null);
    const numRef = useRef(null);
    const rootRef = useRef(null);
    const R = 22;
    const C = 2 * Math.PI * R;
    const pct = ringPct == null ? null : Math.max(0, Math.min(100, ringPct));

    useEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline();
            tl.fromTo(rootRef.current, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", clearProps: "transform,opacity" }, 0);
            if (pct != null && ringRef.current) {
                const d = { v: 0 };
                tl.to(d, { v: pct, duration: 1, ease: "power3.out", onUpdate: () => {
                    ringRef.current.style.strokeDasharray = `${(C * d.v) / 100} ${C}`;
                } }, 0.1);
            }
            if (countTo != null && numRef.current) {
                const n = { v: 0 };
                tl.to(n, { v: countTo, duration: 1, ease: "power2.out", onUpdate: () => {
                    if (numRef.current) numRef.current.textContent = `${Math.round(n.v)}${suffix}`;
                } }, 0.1);
            }
        }, rootRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pct, countTo, suffix]);

    return (
        <div className="cd-callcard" ref={rootRef} style={{ "--cc": accent }}>
            <span className="cd-callcard-glow" />
            <div className="cd-callcard-top">
                <span className="cd-callcard-icon">{icon}</span>
                {pct != null && (
                    <svg className="cd-callcard-ring" viewBox="0 0 52 52">
                        <circle cx="26" cy="26" r={R} fill="none" stroke="rgba(4,40,53,0.10)" strokeWidth="5" />
                        <circle ref={ringRef} cx="26" cy="26" r={R} fill="none" stroke={accent} strokeWidth="5"
                            strokeLinecap="round" strokeDasharray={`0 ${C}`} transform="rotate(-90 26 26)" />
                    </svg>
                )}
            </div>
            <span className="cd-callcard-label">{label}</span>
            <strong className="cd-callcard-value" ref={countTo != null ? numRef : null}>
                {countTo != null ? `0${suffix}` : value}
            </strong>
            {hint && <span className="cd-callcard-hint">{hint}</span>}
            {chart && (
                <div className="cd-callcard-chart">
                    <MiniAreaChart data={chart} accent={accent} />
                    {chartCaption && (
                        <div className="cd-callcard-caption">
                            <span className="cd-callcard-caption-text">{chartCaption}</span>
                            <span className="cd-callcard-caption-legend">
                                <i className="cd-callcard-legend-line" style={{ background: accent }} />
                                trend
                                <i className="cd-callcard-legend-dash" style={{ borderColor: accent }} />
                                avg
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { GREEN_DEEP, LIME, LIME_BRIGHT, AMBER, RED };
