"use client";

import { Topbar } from "@/components/Topbar";
import { HistoricalSurgery } from "@/lib/history-mock";
import { historyStore } from "@/lib/store";
import {
  lookupRoom as getRoomById,
  lookupStaff as getStaffById,
  lookupSurgery as getSurgeryById,
} from "@/lib/store/lookups";
import { formatDate, formatDateTime, formatTime } from "@/lib/fmt";
import { useState } from "react";

export default function HistoryPage() {
  const historicalSurgeries = historyStore.useStore();
  const [selected, setSelected] = useState<HistoricalSurgery | null>(null);

  return (
    <>
      <Topbar
        title="Surgical History"
        subtitle="Full audit trail of completed surgeries"
      />
      <div className="p-7">
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] bg-[var(--surface-muted)]">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">OR</th>
                <th className="py-3 px-4 font-semibold">Surgeon</th>
                <th className="py-3 px-4 font-semibold">Surgery</th>
                <th className="py-3 px-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {historicalSurgeries.map((h) => (
                <tr
                  key={h.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]/40"
                >
                  <td className="py-3 px-4 tabular-nums">
                    {formatDate(h.date)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{h.patientName}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {h.patientId} · {h.age}y · {h.gender}
                    </div>
                  </td>
                  <td className="py-3 px-4">{h.patientType}</td>
                  <td className="py-3 px-4">{getRoomById(h.roomId)?.name}</td>
                  <td className="py-3 px-4">{getStaffById(h.surgeonId)?.name}</td>
                  <td className="py-3 px-4">{getSurgeryById(h.surgeryId)?.name}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelected(h)}
                      className="text-[var(--primary)] text-xs font-semibold hover:underline"
                    >
                      View Details →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <Drawer surgery={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

function Drawer({
  surgery,
  onClose,
}: {
  surgery: HistoricalSurgery;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"patient" | "action" | "report">("patient");
  const surgeryDef = getSurgeryById(surgery.surgeryId);
  const room = getRoomById(surgery.roomId);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[var(--surface)] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 flex items-center justify-between">
          <div>
            <h2 className="font-bold">{surgery.patientName}</h2>
            <p className="text-xs text-[var(--muted)]">
              {surgeryDef?.name} · {room?.name} ·{" "}
              {formatDateTime(surgery.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-[var(--surface-muted)]"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pt-4 border-b border-[var(--border)] flex gap-1">
          {(
            [
              ["patient", "Patient Details"],
              ["action", "Action Timeline"],
              ["report", "Report"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "patient" && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Row k="Patient ID" v={surgery.patientId} />
              <Row k="Patient Name" v={surgery.patientName} />
              <Row k="Patient Type" v={surgery.patientType} />
              <Row k="Operating Room" v={room?.name} />
              <Row k="Age" v={`${surgery.age} years`} />
              <Row k="Gender" v={surgery.gender} />
              <Row k="Blood Type" v={surgery.bloodType} />
              <Row k="Weight" v={`${surgery.weight} kg`} />
              <Row k="Urgency Level" v={surgery.urgency} />
              <Row k="Complexity" v={surgery.complexity} />
              <Row k="Surgical Duration" v={`${surgeryDef?.durationMin} min`} />
              <Row k="Turnover" v={`${surgeryDef?.turnoverMin} min`} />
              <Row k="Surgeon" v={getStaffById(surgery.surgeonId)?.name} />
              <Row k="Assistant" v={getStaffById(surgery.assistantSurgeonId)?.name} />
              <Row k="Anesthesiologist" v={getStaffById(surgery.anesthesiologistId)?.name} />
              <Row k="Scrub Nurse" v={getStaffById(surgery.scrubNurseId)?.name} />
              <Row k="Circulating" v={getStaffById(surgery.circulatingNurseId)?.name} />
              <Row k="Operator" v={getStaffById(surgery.operatorId)?.name} />
              <Row k="Preop Diagnosis" v={surgery.preoperativeDiagnosis} />
              <Row k="Prepose Diagnosis" v={surgery.preposeDiagnosis} />
              <Row k="Notes" v={surgery.notes} />
            </div>
          )}

          {tab === "action" && (
            <div className="space-y-5">
              {["Pre-operative", "Anesthesia", "Intra-operative", "Post-operative"].map(
                (phase) => (
                  <div key={phase}>
                    <h3 className="text-sm font-semibold mb-3">{phase}</h3>
                    <div className="space-y-2">
                      {surgery.log
                        .filter((l) => l.phase === phase)
                        .map((l, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-[var(--border)] p-3 text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{l.step}</span>
                              <span className="text-xs text-[var(--muted)] tabular-nums">
                                {formatTime(l.start)}
                                {" → "}
                                {formatTime(l.end)}
                              </span>
                            </div>
                            {l.note && (
                              <div className="text-xs text-[var(--muted-foreground)] mt-1.5">
                                {l.note}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {tab === "report" && (
            <div className="space-y-4">
              <div className="card !bg-[var(--surface-muted)] !border-0">
                <h3 className="font-bold text-base">Surgical Report</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p>
                    <b>Patient</b>: {surgery.patientName} ({surgery.patientId}),{" "}
                    {surgery.age}y {surgery.gender}, {surgery.bloodType}
                  </p>
                  <p>
                    <b>Procedure</b>: {surgeryDef?.name}
                  </p>
                  <p>
                    <b>OR</b>: {room?.name} on {formatDate(surgery.date)}
                  </p>
                  <p>
                    <b>Surgeon</b>: {getStaffById(surgery.surgeonId)?.name}
                  </p>
                  <p>
                    <b>Anesthesiologist</b>:{" "}
                    {getStaffById(surgery.anesthesiologistId)?.name}
                  </p>
                  <p>
                    <b>Diagnosis</b>: {surgery.preoperativeDiagnosis}
                  </p>
                  <p>
                    <b>Outcome notes</b>: {surgery.notes}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                >
                  Print Report
                </button>
                <button className="btn-secondary">Export PDF</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
        {k}
      </div>
      <div className="mt-0.5">{v || "—"}</div>
    </div>
  );
}
