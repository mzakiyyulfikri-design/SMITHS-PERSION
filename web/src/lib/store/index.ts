"use client";

import {
  hospitalSettings as defaultHospital,
  HospitalSettings,
  OperatingRoom,
  operatingRooms as defaultORs,
  ScheduledSurgery,
  scheduledSurgeries as defaultScheduled,
  Staff,
  staff as defaultStaff,
  SurgicalMenuItem,
  surgicalMenu as defaultMenu,
} from "@/lib/mock-data";
import { historicalSurgeries, HistoricalSurgery } from "@/lib/history-mock";
import { createStore } from "./createStore";

const PREFIX = "smiths.persion.v1.";

export const staffStore = createStore<Staff[]>(PREFIX + "staff", defaultStaff);
export const orStore = createStore<OperatingRoom[]>(
  PREFIX + "ors",
  defaultORs
);
export const menuStore = createStore<SurgicalMenuItem[]>(
  PREFIX + "menu",
  defaultMenu
);
export const hospitalStore = createStore<HospitalSettings>(
  PREFIX + "hospital",
  defaultHospital
);
export const scheduledStore = createStore<ScheduledSurgery[]>(
  PREFIX + "scheduled",
  defaultScheduled
);
export const historyStore = createStore<HistoricalSurgery[]>(
  PREFIX + "history",
  historicalSurgeries
);

/* -------------------- Execution sessions (per surgery) -------------------- */

export type StepLog = {
  startAt?: number;
  endAt?: number;
  note: string;
};

export type DrugEntry = {
  id: string;
  at: number; // timestamp
  drug: string;
  dose: string;
  route: string;
};

export type AnaesthesiaEventKey =
  | "Induction"
  | "Intubation"
  | "Incision"
  | "Closure"
  | "Emergence";

export type AnaesthesiaEvent = {
  id: string;
  at: number;
  kind: AnaesthesiaEventKey;
  note: string;
};

export type VitalSample = {
  at: number;
  hr: number; // bpm
  spo2: number; // %
  sysBp: number; // mmHg
  diaBp: number; // mmHg
  etco2: number; // mmHg
  temp: number; // °C
  rr: number; // breaths/min
};

export type FluidKind =
  | "Saline"
  | "RingerLactate"
  | "Colloid"
  | "PRBC"
  | "FFP"
  | "Platelet"
  | "Other";

export type FluidIn = {
  id: string;
  at: number;
  kind: FluidKind;
  volumeMl: number;
  note?: string;
};

export type OutputKind = "Urine" | "BloodLoss" | "Drain" | "Other";

export type FluidOut = {
  id: string;
  at: number;
  kind: OutputKind;
  volumeMl: number;
  note?: string;
};

export type VentilationSettings = {
  startedAt?: number;
  endedAt?: number;
  ieRatio: string; // e.g. "1:2"
  tidalVolume: number; // mL
  rrSet: number; // breaths/min
  fio2: number; // %
  peep: number; // cmH2O
};

export type ExecutionSession = {
  surgeryId: string;
  steps: Record<string, StepLog>;
  drugs: DrugEntry[];
  events: AnaesthesiaEvent[];
  vitals: VitalSample[];
  alarms: { id: string; at: number; level: "warn" | "critical"; message: string }[];
  fluidsIn: FluidIn[];
  fluidsOut: FluidOut[];
  ventilation: VentilationSettings;
  completedAt?: number;
};

export const executionsStore = createStore<Record<string, ExecutionSession>>(
  PREFIX + "executions",
  {}
);

export function getOrCreateExecution(surgeryId: string): ExecutionSession {
  const existing = executionsStore.get()[surgeryId];
  if (existing) return existing;
  const fresh: ExecutionSession = {
    surgeryId,
    steps: {},
    drugs: [],
    events: [],
    vitals: [],
    alarms: [],
    fluidsIn: [],
    fluidsOut: [],
    ventilation: {
      ieRatio: "1:2",
      tidalVolume: 450,
      rrSet: 12,
      fio2: 50,
      peep: 5,
    },
  };
  executionsStore.set((prev) => ({ ...prev, [surgeryId]: fresh }));
  return fresh;
}

export function updateExecution(
  surgeryId: string,
  patch: (prev: ExecutionSession) => ExecutionSession
) {
  executionsStore.set((prev) => {
    const existing = prev[surgeryId] || getOrCreateExecution(surgeryId);
    // Migrate old sessions missing the new fields
    const migrated: ExecutionSession = {
      ...existing,
      fluidsIn: existing.fluidsIn || [],
      fluidsOut: existing.fluidsOut || [],
      ventilation:
        existing.ventilation || {
          ieRatio: "1:2",
          tidalVolume: 450,
          rrSet: 12,
          fio2: 50,
          peep: 5,
        },
    };
    return { ...prev, [surgeryId]: patch(migrated) };
  });
}

/** Complete a case: marks completedAt, snapshots execution into history. */
export function completeSurgery(surgeryId: string) {
  const surgery = scheduledStore.get().find((s) => s.id === surgeryId);
  if (!surgery) return;

  const session = executionsStore.get()[surgeryId];
  const now = Date.now();

  // Mark execution completed and end any running steps / ventilation
  updateExecution(surgeryId, (prev) => {
    const endedSteps: Record<string, StepLog> = {};
    for (const [k, v] of Object.entries(prev.steps)) {
      endedSteps[k] = v.startAt && !v.endAt ? { ...v, endAt: now } : v;
    }
    return {
      ...prev,
      steps: endedSteps,
      ventilation:
        prev.ventilation.startedAt && !prev.ventilation.endedAt
          ? { ...prev.ventilation, endedAt: now }
          : prev.ventilation,
      completedAt: now,
    };
  });

  // Push to history (re-shaping minimal)
  import("@/lib/history-mock").then(({}) => {});
  historyStore.set((prev) => {
    // Build a HistoricalSurgery-like record
    const record = {
      id: `h-${surgeryId}`,
      date: new Date(now).toISOString(),
      patientId: surgery.patientId,
      patientName: surgery.patientName,
      patientType: surgery.patientType,
      age: surgery.age,
      gender: surgery.gender,
      weight: surgery.weight,
      bloodType: surgery.bloodType,
      urgency: surgery.urgency,
      surgeonId: surgery.surgeonId,
      assistantSurgeonId: surgery.assistantSurgeonId,
      anesthesiologistId: surgery.anesthesiologistId,
      scrubNurseId: surgery.scrubNurseId,
      circulatingNurseId: surgery.circulatingNurseId,
      operatorId: surgery.operatorId,
      roomId: surgery.roomId,
      surgeryId: surgery.surgeryIds[0],
      complexity: surgery.complexity,
      preoperativeDiagnosis: surgery.preoperativeDiagnosis,
      preposeDiagnosis: surgery.preposeDiagnosis,
      notes: surgery.notes,
      log: session
        ? Object.entries(session.steps).map(([stepId, st]) => ({
            phase: "Workflow",
            step: stepId,
            start: st.startAt ? new Date(st.startAt).toISOString() : new Date(now).toISOString(),
            end: st.endAt ? new Date(st.endAt).toISOString() : new Date(now).toISOString(),
            note: st.note,
          }))
        : [],
    };
    // Replace if exists, else add
    const idx = prev.findIndex((p) => p.id === record.id);
    if (idx === -1) return [record, ...prev];
    const next = prev.slice();
    next[idx] = record;
    return next;
  });

  // Mark scheduled surgery completed (kept in store as audit; views filter it out)
  scheduledStore.set((list) =>
    list.map((s) => (s.id === surgeryId ? { ...s, completedAt: now } : s))
  );
}

/* -------------------- CRUD helpers -------------------- */

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = list.slice();
  next[idx] = item;
  return next;
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}
