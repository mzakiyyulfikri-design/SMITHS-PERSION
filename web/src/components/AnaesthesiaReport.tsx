"use client";

import { AnaesthesiaRecordSheet } from "@/components/AnaesthesiaRecordSheet";
import { Modal } from "@/components/Modal";
import { ScheduledSurgery } from "@/lib/mock-data";
import { ExecutionSession, VitalSample } from "@/lib/store";
import { lookupStaff, lookupSurgery, lookupRoom } from "@/lib/store/lookups";
import { formatDateTime, formatTime, formatTimeWithSeconds } from "@/lib/fmt";

export function AnaesthesiaReport({
  open,
  onClose,
  surgery,
  session,
  startedAt,
}: {
  open: boolean;
  onClose: () => void;
  surgery: ScheduledSurgery;
  session: ExecutionSession;
  startedAt: number;
}) {
  const surgeryDef = lookupSurgery(surgery.surgeryIds[0]);
  const room = lookupRoom(surgery.roomId);
  const surgeon = lookupStaff(surgery.surgeonId);
  const anesth = lookupStaff(surgery.anesthesiologistId);
  const scrub = lookupStaff(surgery.scrubNurseId);

  const vitals = session.vitals;
  const stats = summarize(vitals);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Anaesthesia Record"
      subtitle={`${surgery.patientName} · ${surgeryDef?.name}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button onClick={handlePrint} className="btn-primary">
            🖨 Print Report
          </button>
        </>
      }
    >
      <div id="anaesthesia-report-print" className="space-y-5 text-sm">
        <div className="border-b border-[var(--border)] pb-4">
          <h1 className="text-lg font-bold">Anaesthesia Record</h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Generated {formatDateTime(new Date())}
          </p>
        </div>

        {/* Patient & case */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Patient & Case
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field k="Patient" v={`${surgery.patientName} (${surgery.patientId})`} />
            <Field k="Age / Gender" v={`${surgery.age} / ${surgery.gender}`} />
            <Field k="Blood Type" v={surgery.bloodType} />
            <Field k="Weight / Height" v={`${surgery.weight} kg / ${surgery.height} cm`} />
            <Field k="ASA / Patient Type" v={surgery.patientType} />
            <Field k="Infection" v={surgery.infection} />
            <Field k="Procedure" v={surgeryDef?.name} />
            <Field k="Operating Room" v={room?.name} />
            <Field
              k="Case Started"
              v={formatDateTime(startedAt)}
            />
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Team
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Field k="Surgeon" v={surgeon?.name} />
            <Field k="Anesthesiologist" v={anesth?.name} />
            <Field k="Scrub Nurse" v={scrub?.name} />
          </div>
        </section>

        {/* Paper-style anaesthesia chart */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Intraoperative Anaesthesia Chart
          </h2>
          <div className="rounded border border-[var(--border)] bg-white">
            <AnaesthesiaRecordSheet
              session={session}
              startedAt={startedAt}
              endedAt={session.completedAt}
            />
          </div>
        </section>

        {/* Anaesthesia events */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Anaesthesia Events
          </h2>
          <table className="w-full text-xs border border-[var(--border)] rounded">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="text-left py-1.5 px-2 font-semibold">Time</th>
                <th className="text-left py-1.5 px-2 font-semibold">T+</th>
                <th className="text-left py-1.5 px-2 font-semibold">Event</th>
                <th className="text-left py-1.5 px-2 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {session.events.length === 0 && (
                <tr><td colSpan={4} className="py-3 px-2 text-center text-[var(--muted)]">No events recorded</td></tr>
              )}
              {session.events.map((e) => (
                <tr key={e.id} className="border-t border-[var(--border)]">
                  <td className="py-1.5 px-2 tabular-nums">{formatTime(e.at)}</td>
                  <td className="py-1.5 px-2 tabular-nums">+{Math.floor((e.at - startedAt) / 60000)}m</td>
                  <td className="py-1.5 px-2 font-semibold">{e.kind}</td>
                  <td className="py-1.5 px-2">{e.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Drugs */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Drug Administration
          </h2>
          <table className="w-full text-xs border border-[var(--border)] rounded">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="text-left py-1.5 px-2 font-semibold">Time</th>
                <th className="text-left py-1.5 px-2 font-semibold">T+</th>
                <th className="text-left py-1.5 px-2 font-semibold">Drug</th>
                <th className="text-left py-1.5 px-2 font-semibold">Dose</th>
                <th className="text-left py-1.5 px-2 font-semibold">Route</th>
              </tr>
            </thead>
            <tbody>
              {session.drugs.length === 0 && (
                <tr><td colSpan={5} className="py-3 px-2 text-center text-[var(--muted)]">No drugs administered</td></tr>
              )}
              {session.drugs.map((d) => (
                <tr key={d.id} className="border-t border-[var(--border)]">
                  <td className="py-1.5 px-2 tabular-nums">{formatTime(d.at)}</td>
                  <td className="py-1.5 px-2 tabular-nums">+{Math.floor((d.at - startedAt) / 60000)}m</td>
                  <td className="py-1.5 px-2 font-semibold">{d.drug}</td>
                  <td className="py-1.5 px-2">{d.dose}</td>
                  <td className="py-1.5 px-2">{d.route}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Vitals summary */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
            Vital Signs Summary
          </h2>
          <table className="w-full text-xs border border-[var(--border)] rounded">
            <thead className="bg-[var(--surface-muted)]">
              <tr>
                <th className="text-left py-1.5 px-2 font-semibold">Metric</th>
                <th className="text-right py-1.5 px-2 font-semibold">Min</th>
                <th className="text-right py-1.5 px-2 font-semibold">Avg</th>
                <th className="text-right py-1.5 px-2 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody>
              <Row k="HR (bpm)" m={stats.hr} />
              <Row k="SpO₂ (%)" m={stats.spo2} digits={1} />
              <Row k="BP Sys (mmHg)" m={stats.sysBp} />
              <Row k="BP Dia (mmHg)" m={stats.diaBp} />
              <Row k="EtCO₂ (mmHg)" m={stats.etco2} />
              <Row k="Temp (°C)" m={stats.temp} digits={1} />
              <Row k="RR (/min)" m={stats.rr} />
            </tbody>
          </table>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Based on {vitals.length} samples over{" "}
            {vitals.length > 1
              ? Math.round((vitals[vitals.length - 1].at - vitals[0].at) / 60000)
              : 0}{" "}
            minutes
          </p>
        </section>

        {/* Alarms */}
        {session.alarms.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Threshold Alarms ({session.alarms.length})
            </h2>
            <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
              {session.alarms.slice(-20).map((a) => (
                <div key={a.id} className="flex justify-between gap-3">
                  <span>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${a.level === "critical" ? "bg-[var(--priority-high)]" : "bg-[var(--priority-medium)]"}`} />
                    {a.message}
                  </span>
                  <span className="text-[var(--muted)] tabular-nums">
                    {formatTimeWithSeconds(a.at)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Signatures */}
        <section className="grid grid-cols-2 gap-8 pt-8">
          <div>
            <div className="border-b border-[var(--foreground)] h-12"></div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {anesth?.name || "Anesthesiologist"}
            </p>
          </div>
          <div>
            <div className="border-b border-[var(--foreground)] h-12"></div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              {surgeon?.name || "Surgeon"}
            </p>
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #anaesthesia-report-print, #anaesthesia-report-print * { visibility: visible; }
          #anaesthesia-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
        }
      `}</style>
    </Modal>
  );
}

function Field({ k, v }: { k: string; v?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">{k}</div>
      <div className="mt-0.5">{v || "—"}</div>
    </div>
  );
}

function Row({ k, m, digits = 0 }: { k: string; m: { min: number; avg: number; max: number }; digits?: number }) {
  const fmt = (v: number) =>
    Number.isFinite(v) ? v.toFixed(digits) : "—";
  return (
    <tr className="border-t border-[var(--border)]">
      <td className="py-1.5 px-2 font-medium">{k}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(m.min)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(m.avg)}</td>
      <td className="py-1.5 px-2 text-right tabular-nums">{fmt(m.max)}</td>
    </tr>
  );
}

function summarize(samples: VitalSample[]) {
  const keys = ["hr", "spo2", "sysBp", "diaBp", "etco2", "temp", "rr"] as const;
  const out: Record<(typeof keys)[number], { min: number; avg: number; max: number }> = {} as never;
  for (const k of keys) {
    const vals = samples.map((s) => s[k]);
    if (vals.length === 0) {
      out[k] = { min: NaN, avg: NaN, max: NaN };
    } else {
      out[k] = {
        min: Math.min(...vals),
        max: Math.max(...vals),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      };
    }
  }
  return out;
}
