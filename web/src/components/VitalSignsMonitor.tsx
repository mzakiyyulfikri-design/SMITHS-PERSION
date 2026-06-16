"use client";

import { checkAlerts, useVitalsStream } from "@/lib/devices/vitals";
import { updateExecution, VitalSample } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

type Metric = "hr" | "spo2" | "sysBp" | "diaBp" | "etco2" | "rr";

const METRIC_CONFIG: Record<
  Metric,
  { label: string; unit: string; color: string; range: [number, number] }
> = {
  hr: { label: "HR", unit: "bpm", color: "#16a34a", range: [40, 160] },
  spo2: { label: "SpO₂", unit: "%", color: "#0284c7", range: [85, 100] },
  sysBp: { label: "BP Sys", unit: "mmHg", color: "#dc2626", range: [60, 180] },
  diaBp: { label: "BP Dia", unit: "mmHg", color: "#f97316", range: [40, 120] },
  etco2: { label: "EtCO₂", unit: "mmHg", color: "#7c3aed", range: [20, 50] },
  rr: { label: "RR", unit: "/min", color: "#0d9488", range: [5, 30] },
};

export function VitalSignsMonitor({
  surgeryId,
  eventBias = 0,
}: {
  surgeryId: string;
  eventBias?: number;
}) {
  const [paused, setPaused] = useState(false);
  const { latest, history } = useVitalsStream({ paused, eventBias, historyLengthSec: 90 });
  const alerts = checkAlerts(latest);

  // Persist samples & alerts to execution session (throttled to ~every 5s)
  // Use refs so the effect runs ONCE per (surgeryId, paused) — never per sample.
  const latestRef = useRef(latest);
  latestRef.current = latest;
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      const sample = latestRef.current;
      const al = alertsRef.current;
      updateExecution(surgeryId, (prev) => ({
        ...prev,
        vitals: [...prev.vitals.slice(-720), sample], // keep last ~hour
        alarms: al.length
          ? [
              ...prev.alarms,
              ...al.map((a) => ({
                id: `${sample.at}-${a.metric}`,
                at: sample.at,
                level: a.level,
                message: a.message,
              })),
            ].slice(-200)
          : prev.alarms,
      }));
    }, 5000);
    return () => clearInterval(t);
  }, [surgeryId, paused]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Vital Signs Monitor</h2>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Source: Simulation · ready to swap to MONERT / device SDK
          </p>
        </div>
        <button
          onClick={() => setPaused((p) => !p)}
          className="btn-secondary !text-xs !py-1.5 !px-3"
        >
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
      </div>

      {/* Big readouts */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <Readout metric="hr" value={latest.hr} format={(v) => Math.round(v).toString()} />
        <Readout metric="spo2" value={latest.spo2} format={(v) => Math.round(v).toString()} />
        <ReadoutBP sys={latest.sysBp} dia={latest.diaBp} />
        <Readout metric="etco2" value={latest.etco2} format={(v) => Math.round(v).toString()} />
        <Readout metric="rr" value={latest.rr} format={(v) => Math.round(v).toString()} />
        <TempReadout temp={latest.temp} />
      </div>

      {alerts.length > 0 && (
        <div className="rounded-lg border-l-4 border-[var(--priority-high)] bg-[var(--priority-high-soft)] p-3 space-y-1">
          {alerts.map((a, i) => (
            <div key={i} className="text-xs font-semibold text-[var(--priority-high)]">
              ⚠ {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Per-metric auto-scaled strips */}
      <VitalsStrips history={history} />
    </div>
  );
}

function VitalsStrips({ history }: { history: VitalSample[] }) {
  if (history.length < 2) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] h-[200px] grid place-items-center text-sm text-[var(--muted)]">
        Collecting samples…
      </div>
    );
  }

  const strips: { metric: Metric; pick: (s: VitalSample) => number }[] = [
    { metric: "hr", pick: (s) => s.hr },
    { metric: "spo2", pick: (s) => s.spo2 },
    { metric: "sysBp", pick: (s) => s.sysBp },
    { metric: "etco2", pick: (s) => s.etco2 },
    { metric: "rr", pick: (s) => s.rr },
  ];

  return (
    <div className="space-y-1.5">
      {strips.map((sr) => (
        <Strip key={sr.metric} history={history} metric={sr.metric} pick={sr.pick} />
      ))}
    </div>
  );
}

function Strip({
  history,
  metric,
  pick,
}: {
  history: VitalSample[];
  metric: Metric;
  pick: (s: VitalSample) => number;
}) {
  const cfg = METRIC_CONFIG[metric];
  const w = 760;
  const h = 56;
  const padX = 6;
  const padY = 4;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const vals = history.map(pick);
  const liveMin = Math.min(...vals);
  const liveMax = Math.max(...vals);
  // Pad range so the line doesn't kiss the edges
  const padRange = Math.max(1, (liveMax - liveMin) * 0.6);
  const yMin = liveMin - padRange;
  const yMax = liveMax + padRange;
  const span = Math.max(0.5, yMax - yMin);

  const t0 = history[0].at;
  const tN = history[history.length - 1].at;
  const tSpan = Math.max(1000, tN - t0);

  const points = history
    .map((s) => {
      const x = padX + ((s.at - t0) / tSpan) * plotW;
      const y = padY + plotH - ((pick(s) - yMin) / span) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const current = vals[vals.length - 1];
  const fmt = (v: number) => (metric === "spo2" ? v.toFixed(1) : Math.round(v).toString());

  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] pl-3 pr-3 py-1.5">
      <div className="w-16 shrink-0">
        <div className="text-[10px] uppercase font-bold tracking-wider" style={{ color: cfg.color }}>
          {cfg.label}
        </div>
        <div className="text-[10px] text-[var(--muted)]">{cfg.unit}</div>
      </div>
      <div className="flex-1 min-w-0">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[44px] block" preserveAspectRatio="none">
          {/* center baseline */}
          <line
            x1={padX}
            x2={w - padX}
            y1={padY + plotH / 2}
            y2={padY + plotH / 2}
            stroke="#f1f5f9"
            strokeDasharray="2 3"
          />
          <polyline
            points={points}
            fill="none"
            stroke={cfg.color}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* leading dot */}
          {(() => {
            const last = history[history.length - 1];
            const x = padX + plotW;
            const y = padY + plotH - ((pick(last) - yMin) / span) * plotH;
            return <circle cx={x} cy={y} r={2.5} fill={cfg.color} />;
          })()}
        </svg>
      </div>
      <div className="text-right tabular-nums" style={{ color: cfg.color }}>
        <div className="text-xl font-bold leading-none">{fmt(current)}</div>
        <div className="text-[10px] text-[var(--muted)] mt-0.5">
          {fmt(liveMin)} – {fmt(liveMax)}
        </div>
      </div>
    </div>
  );
}

function Readout({
  metric,
  value,
  format,
}: {
  metric: Metric;
  value: number;
  format: (v: number) => string;
}) {
  const cfg = METRIC_CONFIG[metric];
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
        <span>{cfg.label}</span>
        <span>{cfg.unit}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: cfg.color }}>
        {format(value)}
      </div>
    </div>
  );
}

function ReadoutBP({ sys, dia }: { sys: number; dia: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
        <span>BP</span>
        <span>mmHg</span>
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#dc2626" }}>
        {Math.round(sys)}
        <span className="text-sm text-[var(--muted)] font-normal mx-0.5">/</span>
        <span style={{ color: "#f97316" }}>{Math.round(dia)}</span>
      </div>
    </div>
  );
}

function TempReadout({ temp }: { temp: number }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
        <span>Temp</span>
        <span>°C</span>
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1" style={{ color: "#ea580c" }}>
        {temp.toFixed(1)}
      </div>
    </div>
  );
}

