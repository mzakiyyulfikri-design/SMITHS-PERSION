"use client";

import { useEffect, useRef, useState } from "react";
import { VitalSample } from "@/lib/store";

/**
 * Abstract vitals stream. Today this returns a richly-simulated signal;
 * when a real device or MONERT WebSocket is wired in, swap the
 * implementation of `subscribeVitals` below. The hook signature
 * stays the same — UI doesn't change.
 */

export type VitalsSource =
  | { kind: "simulation" }
  | { kind: "monert"; endpoint: string }
  | { kind: "device"; deviceId: string };

type Baseline = {
  hr: number;
  spo2: number;
  sysBp: number;
  diaBp: number;
  etco2: number;
  temp: number;
  rr: number;
};

const baseline: Baseline = {
  hr: 78,
  spo2: 98,
  sysBp: 122,
  diaBp: 78,
  etco2: 36,
  temp: 36.6,
  rr: 14,
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Internal simulator state — tracks slow drift, breath phase, event transients. */
type SimState = {
  startedAt: number;
  current: Baseline;
  // Slow drift (changes over minutes)
  drift: Baseline;
  // Event-driven transient (decays toward 0)
  transient: Baseline;
};

function zeroBaseline(): Baseline {
  return { hr: 0, spo2: 0, sysBp: 0, diaBp: 0, etco2: 0, temp: 0, rr: 0 };
}

function newSim(): SimState {
  return {
    startedAt: Date.now(),
    current: { ...baseline },
    drift: zeroBaseline(),
    transient: zeroBaseline(),
  };
}

/**
 * Compute the next sample given the previous state.
 * Models combine:
 *  - Slow baseline drift (random walk over minutes)
 *  - Respiratory modulation (~14/min, affects HR + BP + SpO2 slightly)
 *  - Beat-to-beat HRV (small but visible)
 *  - Event transient (sympathetic surge / parasympathetic drop), decays over time
 *  - Tiny per-tick noise
 */
function step(prev: SimState, eventBias: number, tickMs: number): SimState {
  const t = (Date.now() - prev.startedAt) / 1000; // seconds
  // Respiratory cycle ~14/min → period ~4.3s; varies HR ±3, sysBp ±5, etc.
  const respPhase = Math.sin((2 * Math.PI * t) / 4.3);
  // Slower wave (~30s) for second-order BP variability
  const mayer = Math.sin((2 * Math.PI * t) / 30);

  // Drift random walk (slow): change ~0.01-0.05 per tick
  const driftStep = (mag: number) => (Math.random() - 0.5) * mag * (tickMs / 1000);
  const drift: Baseline = {
    hr: clamp(prev.drift.hr + driftStep(0.4), -8, 8),
    spo2: clamp(prev.drift.spo2 + driftStep(0.08), -1.5, 1),
    sysBp: clamp(prev.drift.sysBp + driftStep(0.5), -15, 15),
    diaBp: clamp(prev.drift.diaBp + driftStep(0.3), -10, 10),
    etco2: clamp(prev.drift.etco2 + driftStep(0.2), -4, 4),
    temp: clamp(prev.drift.temp + driftStep(0.01), -0.6, 0.6),
    rr: clamp(prev.drift.rr + driftStep(0.05), -3, 3),
  };

  // Transient toward eventBias, decays toward 0 with half-life ~30s
  const decay = Math.pow(0.5, tickMs / 30000);
  const transient: Baseline = {
    hr: prev.transient.hr * decay + eventBias * 3 * (1 - decay),
    spo2: prev.transient.spo2 * decay + eventBias * -0.4 * (1 - decay),
    sysBp: prev.transient.sysBp * decay + eventBias * 7 * (1 - decay),
    diaBp: prev.transient.diaBp * decay + eventBias * 4 * (1 - decay),
    etco2: prev.transient.etco2 * decay + eventBias * 0.6 * (1 - decay),
    temp: prev.transient.temp * decay + eventBias * 0.02 * (1 - decay),
    rr: prev.transient.rr * decay + eventBias * 0.5 * (1 - decay),
  };

  // Per-tick noise (small)
  const n = (mag: number) => (Math.random() - 0.5) * mag;

  const current: Baseline = {
    hr: clamp(
      baseline.hr + drift.hr + transient.hr + respPhase * 3.5 + n(1.2),
      40,
      160
    ),
    spo2: clamp(
      baseline.spo2 + drift.spo2 + transient.spo2 + respPhase * 0.3 + n(0.25),
      88,
      100
    ),
    sysBp: clamp(
      baseline.sysBp +
        drift.sysBp +
        transient.sysBp +
        respPhase * 5 +
        mayer * 4 +
        n(2),
      70,
      180
    ),
    diaBp: clamp(
      baseline.diaBp +
        drift.diaBp +
        transient.diaBp +
        respPhase * 3 +
        mayer * 2 +
        n(1.2),
      40,
      110
    ),
    etco2: clamp(
      baseline.etco2 + drift.etco2 + transient.etco2 + respPhase * 1.5 + n(0.5),
      25,
      50
    ),
    temp: clamp(baseline.temp + drift.temp + transient.temp + n(0.03), 35, 39),
    rr: clamp(baseline.rr + drift.rr + transient.rr + n(0.4), 8, 24),
  };

  return { ...prev, drift, transient, current };
}

export function makeInitialVital(): VitalSample {
  return { at: Date.now(), ...baseline };
}

/**
 * Subscribe to a vitals stream. Returns an unsubscribe function.
 * Implementation swap point: replace the simulation with a real
 * WebSocket or device SDK here without touching consumers.
 */
export function subscribeVitals(
  source: VitalsSource,
  onSample: (s: VitalSample) => void,
  getEventBias: () => number = () => 0
): () => void {
  if (source.kind !== "simulation") {
    console.warn(`Vitals source "${source.kind}" not implemented yet, falling back to simulation`);
  }
  let sim = newSim();
  onSample({ at: Date.now(), ...sim.current });
  const tickMs = 500; // 2 Hz — feels alive but not wasteful
  const id = setInterval(() => {
    sim = step(sim, getEventBias(), tickMs);
    onSample({ at: Date.now(), ...sim.current });
  }, tickMs);
  return () => clearInterval(id);
}

const DEFAULT_SOURCE: VitalsSource = { kind: "simulation" };

/** React hook: live vitals + windowed history */
export function useVitalsStream({
  source = DEFAULT_SOURCE,
  paused = false,
  historyLengthSec = 120,
  eventBias = 0,
}: {
  source?: VitalsSource;
  paused?: boolean;
  historyLengthSec?: number;
  eventBias?: number;
} = {}) {
  const [latest, setLatest] = useState<VitalSample>(() => makeInitialVital());
  const [history, setHistory] = useState<VitalSample[]>([]);
  const biasRef = useRef(eventBias);
  biasRef.current = eventBias;

  useEffect(() => {
    if (paused) return;
    const unsub = subscribeVitals(
      source,
      (s) => {
        setLatest(s);
        setHistory((prev) => {
          const cutoff = Date.now() - historyLengthSec * 1000;
          return [...prev.filter((p) => p.at > cutoff), s];
        });
      },
      () => biasRef.current
    );
    return unsub;
  }, [paused, source, historyLengthSec]);

  return { latest, history };
}

/* -------------------- Threshold alerts -------------------- */

export type AlertLevel = "warn" | "critical";

export type ThresholdAlert = {
  metric: keyof Omit<VitalSample, "at">;
  level: AlertLevel;
  message: string;
};

export function checkAlerts(s: VitalSample): ThresholdAlert[] {
  const alerts: ThresholdAlert[] = [];
  if (s.hr < 50) alerts.push({ metric: "hr", level: "critical", message: `Bradycardia (HR ${Math.round(s.hr)})` });
  if (s.hr > 120) alerts.push({ metric: "hr", level: "warn", message: `Tachycardia (HR ${Math.round(s.hr)})` });
  if (s.spo2 < 92) alerts.push({ metric: "spo2", level: "critical", message: `Low SpO₂ (${Math.round(s.spo2)}%)` });
  if (s.sysBp < 90) alerts.push({ metric: "sysBp", level: "warn", message: `Hypotension (BP ${Math.round(s.sysBp)}/${Math.round(s.diaBp)})` });
  if (s.sysBp > 160) alerts.push({ metric: "sysBp", level: "warn", message: `Hypertension (BP ${Math.round(s.sysBp)}/${Math.round(s.diaBp)})` });
  if (s.temp > 38) alerts.push({ metric: "temp", level: "warn", message: `Hyperthermia (${s.temp.toFixed(1)}°C)` });
  if (s.temp < 35.5) alerts.push({ metric: "temp", level: "warn", message: `Hypothermia (${s.temp.toFixed(1)}°C)` });
  return alerts;
}
