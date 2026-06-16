"use client";

import { AnaesthesiaChart } from "@/components/AnaesthesiaChart";
import { AnaesthesiaReport } from "@/components/AnaesthesiaReport";
import { ConfirmDialog } from "@/components/Modal";
import { Topbar } from "@/components/Topbar";
import { VitalSignsMonitor } from "@/components/VitalSignsMonitor";
import {
  completeSurgery,
  executionsStore,
  getOrCreateExecution,
  scheduledStore,
  updateExecution,
} from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  lookupRoom,
  lookupStaff,
  lookupSurgery,
} from "@/lib/store/lookups";
import { formatTimeWithSeconds } from "@/lib/fmt";
import { priorityBadgeClass } from "@/lib/scoring";
import { notFound, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const PHASES = [
  {
    id: "preop",
    title: "Pre-operative",
    steps: [
      { id: "prep-area", label: "Persiapan area operasi" },
      { id: "identifikasi", label: "Identifikasi pasien" },
      { id: "pemeriksaan", label: "Pemeriksaan penunjang" },
    ],
  },
  {
    id: "anesthesia",
    title: "Anesthesia",
    steps: [
      { id: "delivery", label: "Anesthesia delivery" },
      { id: "intubasi", label: "Intubasi / ventilation" },
      { id: "vital", label: "Vital sign monitoring" },
    ],
  },
  {
    id: "intraop",
    title: "Intra-operative",
    steps: [{ id: "intra", label: "Intra-operative procedure" }],
  },
  {
    id: "postop",
    title: "Post-operative",
    steps: [{ id: "recovery", label: "Recovery Room delivery" }],
  },
] as const;

type Tab = "phases" | "anesthesia" | "vitals";

export default function ActionExecutionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const surgery = scheduledStore.useStore((list) =>
    list.find((s) => s.id === params.id)
  );
  const session = executionsStore.useStore((s) => s[params.id]);
  const [now, setNow] = useState(Date.now());
  const [reportOpen, setReportOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("phases");

  // Ensure execution session exists (only while case still active)
  useEffect(() => {
    if (surgery && !surgery.completedAt) {
      getOrCreateExecution(params.id);
    }
  }, [params.id, surgery]);

  // Redirect to history once case is marked completed
  useEffect(() => {
    if (surgery?.completedAt) {
      router.replace("/history");
    }
  }, [surgery?.completedAt, router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Case start time: take earliest step start, or now if none yet
  const startedAt = useMemo(() => {
    if (!session) return Date.now();
    const starts = Object.values(session.steps)
      .map((s) => s.startAt)
      .filter((v): v is number => typeof v === "number");
    if (starts.length === 0) return Date.now();
    return Math.min(...starts);
  }, [session]);

  // All hooks above. Now safe to handle the not-found / completed cases.
  if (!surgery) {
    notFound();
  }
  // While the case is being completed, the redirect effect above is running.
  // Render nothing instead of unmounting via notFound to keep hook order stable.
  if (surgery.completedAt) {
    return null;
  }

  const surgeryDef = lookupSurgery(surgery.surgeryIds[0]);
  const room = lookupRoom(surgery.roomId);

  const start = (stepId: string) =>
    updateExecution(params.id, (prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [stepId]: { ...(prev.steps[stepId] || { note: "" }), startAt: Date.now() },
      },
    }));

  const end = (stepId: string) =>
    updateExecution(params.id, (prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [stepId]: { ...(prev.steps[stepId] || { note: "" }), endAt: Date.now() },
      },
    }));

  const setNote = (stepId: string, note: string) =>
    updateExecution(params.id, (prev) => ({
      ...prev,
      steps: {
        ...prev.steps,
        [stepId]: { ...(prev.steps[stepId] || {}), note },
      },
    }));

  // Event bias for vitals — drives realistic shifts after induction/incision
  const lastEventKind = session?.events[session.events.length - 1]?.kind;
  const eventBias = useMemo(() => {
    if (!lastEventKind) return 0;
    if (lastEventKind === "Induction") return -1; // HR/BP drop
    if (lastEventKind === "Intubation") return 1.5; // surge
    if (lastEventKind === "Incision") return 2;
    if (lastEventKind === "Closure") return 0;
    if (lastEventKind === "Emergence") return 1;
    return 0;
  }, [lastEventKind]);

  const fmt = (ms: number) => {
    const safe = Math.max(0, ms);
    const s = Math.floor(safe / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map((x) => String(x).padStart(2, "0")).join(":");
  };

  return (
    <>
      <Topbar
        title={`Execution — ${surgery.patientName}`}
        subtitle={`${surgeryDef?.name} · ${room?.name}`}
        actions={
          <div className="flex items-center gap-2">
            <span className={priorityBadgeClass(surgery.priority)}>
              {surgery.priority} Priority
            </span>
            <button
              onClick={() => setReportOpen(true)}
              className="btn-secondary !text-xs !py-1.5 !px-3"
            >
              Generate Report
            </button>
            <button
              onClick={() => setCompleteOpen(true)}
              className="btn-primary !text-xs !py-1.5 !px-3"
            >
              ✓ Complete Case
            </button>
          </div>
        }
      />

      <div className="border-b border-[var(--border)] bg-[var(--surface)] px-7">
        <div className="flex gap-1">
          {(
            [
              ["phases", "Workflow Phases"],
              ["anesthesia", "Anaesthesia Chart"],
              ["vitals", "Vital Signs Monitor"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${
                tab === id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-7 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-5 min-w-0">
          {tab === "phases" &&
            PHASES.map((phase) => (
              <div key={phase.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-semibold">{phase.title}</h2>
                    <p className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                      Phase
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {phase.steps.map((step) => {
                    const state = session?.steps[step.id];
                    const isRunning = state?.startAt && !state?.endAt;
                    const elapsed = state?.startAt
                      ? (state.endAt || now) - state.startAt
                      : 0;
                    const isDone = state?.startAt && state?.endAt;
                    return (
                      <div
                        key={step.id}
                        className="rounded-lg border border-[var(--border)] p-4"
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                isRunning
                                  ? "bg-[var(--warning)] animate-pulse"
                                  : isDone
                                  ? "bg-[var(--success)]"
                                  : "bg-[var(--border-strong)]"
                              }`}
                            />
                            <div>
                              <div className="font-medium">{step.label}</div>
                              <div className="text-xs text-[var(--muted)] tabular-nums">
                                {state?.startAt
                                  ? `Started ${formatTimeWithSeconds(state.startAt)}`
                                  : "Not started"}
                                {state?.endAt
                                  ? ` · Ended ${formatTimeWithSeconds(state.endAt)}`
                                  : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="font-mono text-sm tabular-nums px-3 py-1.5 bg-[var(--surface-muted)] rounded-md min-w-[100px] text-center">
                              {fmt(elapsed)}
                            </div>
                            {!state?.startAt && (
                              <button
                                onClick={() => start(step.id)}
                                className="btn-primary !px-3 !py-1.5 !text-xs"
                              >
                                Start
                              </button>
                            )}
                            {isRunning && (
                              <button
                                onClick={() => end(step.id)}
                                className="btn-secondary !px-3 !py-1.5 !text-xs !border-[var(--priority-high)] !text-[var(--priority-high)]"
                              >
                                End
                              </button>
                            )}
                            {isDone && (
                              <span className="badge badge-low">Done</span>
                            )}
                          </div>
                        </div>
                        <textarea
                          placeholder="Note (optional)..."
                          value={state?.note || ""}
                          onChange={(e) => setNote(step.id, e.target.value)}
                          className="input-base mt-3 min-h-[60px] text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {tab === "anesthesia" && (
            <div className="card">
              <AnaesthesiaChart surgeryId={params.id} startedAt={startedAt} />
            </div>
          )}

          {tab === "vitals" && (
            <div className="card">
              <VitalSignsMonitor surgeryId={params.id} eventBias={eventBias} />
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-7 h-fit space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold">Patient Snapshot</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Patient ID" value={surgery.patientId} />
              <Row label="Age / Gender" value={`${surgery.age} / ${surgery.gender}`} />
              <Row label="Blood Type" value={surgery.bloodType} />
              <Row
                label="Infection"
                value={
                  surgery.infection === "Infectious" ? (
                    <span className="badge badge-high">Infectious</span>
                  ) : (
                    "Non-infectious"
                  )
                }
              />
              <Row label="Case elapsed" value={fmt(now - startedAt)} />
            </dl>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold">Team</h3>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Surgeon" value={lookupStaff(surgery.surgeonId)?.name} />
              <Row label="Assistant" value={lookupStaff(surgery.assistantSurgeonId)?.name} />
              <Row label="Anesthesiologist" value={lookupStaff(surgery.anesthesiologistId)?.name} />
              <Row label="Scrub Nurse" value={lookupStaff(surgery.scrubNurseId)?.name} />
              <Row label="Circulating" value={lookupStaff(surgery.circulatingNurseId)?.name} />
              <Row label="Operator" value={lookupStaff(surgery.operatorId)?.name} />
            </dl>
          </div>
          {session && (
            <div className="card">
              <h3 className="text-sm font-semibold">Session</h3>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Drugs logged" value={session.drugs.length} />
                <Row label="Events" value={session.events.length} />
                <Row label="Vital samples" value={session.vitals.length} />
                <Row label="Alarms" value={session.alarms.length} />
              </dl>
            </div>
          )}
        </aside>
      </div>

      {session && (
        <AnaesthesiaReport
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          surgery={surgery}
          session={session}
          startedAt={startedAt}
        />
      )}

      <ConfirmDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => {
          completeSurgery(params.id);
          router.push("/history");
        }}
        title={`Complete case for ${surgery.patientName}?`}
        message="This will finalize the case, stop all timers, and move it to Surgical History. Steps still running will be marked ended now."
        confirmLabel="Complete case"
        destructive={false}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-[var(--muted)] font-semibold">
        {label}
      </dt>
      <dd className="text-right">{value ?? "—"}</dd>
    </div>
  );
}
