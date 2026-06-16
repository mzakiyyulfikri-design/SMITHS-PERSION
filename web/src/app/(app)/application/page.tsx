"use client";

import { Topbar } from "@/components/Topbar";
import {
  menuStore,
  orStore,
  scheduledStore,
  staffStore,
  uid,
} from "@/lib/store";
import {
  Complexity,
  computeScore,
  InfectionStatus,
  MultiDisciplinary,
  PatientClass,
  PatientType,
  priorityBadgeClass,
  Urgency,
  WorkingHourFit,
} from "@/lib/scoring";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ApplicationPage() {
  const router = useRouter();
  const staff = staffStore.useStore();
  const surgicalMenu = menuStore.useStore();
  const operatingRooms = orStore.useStore();
  const getStaffById = (id: string) => staff.find((s) => s.id === id);
  const [emergency, setEmergency] = useState(false);
  const [patientId, setPatientId] = useState("P-—————");
  useEffect(() => {
    setPatientId(`P-${Math.floor(Math.random() * 90000 + 10000)}`);
  }, []);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [bloodType, setBloodType] = useState("A+");
  const [patientType, setPatientType] = useState<PatientType>("Adult");
  const [infection, setInfection] = useState<InfectionStatus>("Non-infectious");
  const [patientClass, setPatientClass] = useState<PatientClass>("Umum");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [preoperativeDiagnosis, setPreoperativeDiagnosis] = useState("");
  const [preposeDiagnosis, setPreposeDiagnosis] = useState("");
  const [surgeryIds, setSurgeryIds] = useState<string[]>([]);
  const [complexity, setComplexity] = useState<Complexity>("General");
  const [multiDisciplinary, setMultiDisciplinary] = useState<MultiDisciplinary>("1");
  const [workingHourFit, setWorkingHourFit] = useState<WorkingHourFit>("FitMorning");
  const [notes, setNotes] = useState("");
  const [plannedTime, setPlannedTime] = useState("");
  useEffect(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    setPlannedTime(d.toISOString().slice(0, 16));
  }, []);

  // Aggregate duration + turnover from selected surgeries
  const aggregated = useMemo(() => {
    const selected = surgicalMenu.filter((m) => surgeryIds.includes(m.id));
    const durationMinutes = selected.reduce((acc, m) => acc + m.durationMin, 0);
    const turnoverMinutes = selected.reduce(
      (acc, m) => Math.max(acc, m.turnoverMin),
      0
    );
    return { durationMinutes, turnoverMinutes, selected };
  }, [surgeryIds]);

  // Live scoring
  const breakdown = useMemo(
    () =>
      computeScore({
        durationMinutes: aggregated.durationMinutes,
        turnoverMinutes: aggregated.turnoverMinutes,
        complexity,
        urgency,
        multiDisciplinary,
        patientType,
        patientClass,
        workingHourFit,
        infection,
      }),
    [
      aggregated.durationMinutes,
      aggregated.turnoverMinutes,
      complexity,
      urgency,
      multiDisciplinary,
      patientType,
      patientClass,
      workingHourFit,
      infection,
    ]
  );

  // Auto-assigned staff (mock: pick based on surgery category match)
  const autoAssigned = useMemo(() => {
    const category = aggregated.selected[0]?.category;
    const surgeon =
      staff.find((s) => s.role === "Surgeon" && s.specialist === category) ||
      staff.find((s) => s.role === "Surgeon");
    return {
      surgeon: surgeon?.id || "",
      assistantSurgeon: staff.find((s) => s.role === "AssistantSurgeon")?.id || "",
      anesthesiologist: staff.find((s) => s.role === "Anesthesiologist")?.id || "",
      scrubNurse: staff.find((s) => s.role === "ScrubNurse")?.id || "",
      circulatingNurse: staff.find((s) => s.role === "CirculatingNurse")?.id || "",
      operator: staff.find((s) => s.role === "Operator")?.id || "",
    };
  }, [aggregated.selected]);

  // Auto OR assignment by priority + match
  const assignedOR = useMemo(() => {
    const firstSurgery = aggregated.selected[0];
    if (!firstSurgery) return undefined;
    return (
      operatingRooms.find((or) =>
        or.allowedSurgeries.includes(firstSurgery.id) &&
        or.priority === breakdown.priority
      ) ||
      operatingRooms.find((or) => or.allowedSurgeries.includes(firstSurgery.id))
    );
  }, [aggregated.selected, breakdown.priority]);

  const toggleSurgery = (id: string) => {
    setSurgeryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name || !dob || surgeryIds.length === 0) {
      alert("Please fill patient name, date of birth, and select at least one surgery.");
      return;
    }
    const surgeryId = uid("sg");
    const accessCode = String(Math.floor(1000 + Math.random() * 9000));
    scheduledStore.set((prev) => [
      ...prev,
      {
        id: surgeryId,
        patientId,
        patientName: name,
        gender,
        dob,
        age: typeof age === "number" ? age : 0,
        height: typeof height === "number" ? height : 0,
        weight: typeof weight === "number" ? weight : 0,
        bloodType,
        patientType,
        infection,
        patientClass,
        urgency,
        preoperativeDiagnosis,
        preposeDiagnosis,
        surgeryIds,
        complexity,
        multiDisciplinary,
        workingHourFit,
        surgeonId: autoAssigned.surgeon,
        assistantSurgeonId: autoAssigned.assistantSurgeon,
        anesthesiologistId: autoAssigned.anesthesiologist,
        scrubNurseId: autoAssigned.scrubNurse,
        circulatingNurseId: autoAssigned.circulatingNurse,
        operatorId: autoAssigned.operator,
        roomId: assignedOR?.id || "",
        plannedStart: new Date(plannedTime).toISOString(),
        notes,
        accessCode,
        finalScore: breakdown.finalScore,
        priority: breakdown.priority,
      },
    ]);
    alert(
      `Surgery saved & assigned ✓\n\nPatient: ${name}\nFinal Score: ${breakdown.finalScore}\nPriority: ${breakdown.priority}\nOR: ${assignedOR?.name || "—"}\nAccess Code: ${accessCode}`
    );
    router.push("/schedule");
  };

  return (
    <>
      <Topbar
        title="Surgery Application"
        subtitle="Patient input → automatic scoring → priority & OR assignment"
        actions={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emergency}
              onChange={(e) => {
                setEmergency(e.target.checked);
                if (e.target.checked) setUrgency("High");
              }}
              className="accent-[var(--priority-high)]"
            />
            <span className="font-semibold text-[var(--priority-high)]">
              Emergency Surgery
            </span>
          </label>
        }
      />
      <div className="p-7 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        {/* Form */}
        <div className="space-y-5">
          <Section title="Patient Identity">
            <Grid cols={3}>
              <Field label="Patient ID">
                <input className="input-base" value={patientId} disabled />
              </Field>
              <Field label="Name">
                <input
                  className="input-base"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <select
                  className="input-base"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                >
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  className="input-base"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  className="input-base"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                />
              </Field>
              <Field label="Blood Type">
                <select
                  className="input-base"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  {bloodTypes.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label="Height (cm)">
                <input
                  type="number"
                  className="input-base"
                  value={height}
                  onChange={(e) =>
                    setHeight(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  className="input-base"
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value ? Number(e.target.value) : "")
                  }
                />
              </Field>
              <Field label="Patient Type">
                <select
                  className="input-base"
                  value={patientType}
                  onChange={(e) => setPatientType(e.target.value as PatientType)}
                >
                  <option>Adult</option>
                  <option>Pediatric</option>
                  <option>Neonate</option>
                </select>
              </Field>
            </Grid>
          </Section>

          <Section title="Clinical Classification">
            <Grid cols={3}>
              <Field label="Infectious Category">
                <select
                  className="input-base"
                  value={infection}
                  onChange={(e) =>
                    setInfection(e.target.value as InfectionStatus)
                  }
                >
                  <option value="Non-infectious">Non-infectious</option>
                  <option value="Infectious">Infectious</option>
                </select>
              </Field>
              <Field label="Patient Class">
                <select
                  className="input-base"
                  value={patientClass}
                  onChange={(e) =>
                    setPatientClass(e.target.value as PatientClass)
                  }
                >
                  <option>Umum</option>
                  <option>VIP</option>
                  <option>Khusus</option>
                </select>
              </Field>
              <Field label="Urgency Level">
                <div className="flex gap-2">
                  {(["High", "Medium", "Low"] as Urgency[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        urgency === u
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </Field>
            </Grid>
            <Grid cols={2}>
              <Field label="Preoperative Diagnosis">
                <textarea
                  className="input-base min-h-[80px]"
                  value={preoperativeDiagnosis}
                  onChange={(e) => setPreoperativeDiagnosis(e.target.value)}
                />
              </Field>
              <Field label="Prepose Diagnosis">
                <textarea
                  className="input-base min-h-[80px]"
                  value={preposeDiagnosis}
                  onChange={(e) => setPreposeDiagnosis(e.target.value)}
                />
              </Field>
            </Grid>
          </Section>

          <Section title="Surgery Selection">
            <Field label="Name & Duration of Surgery (multi-select)">
              <div className="border border-[var(--border-strong)] rounded-lg max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
                {Object.entries(
                  surgicalMenu.reduce<Record<string, typeof surgicalMenu>>(
                    (acc, m) => {
                      (acc[m.category] = acc[m.category] || []).push(m);
                      return acc;
                    },
                    {}
                  )
                ).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="px-3 py-1.5 bg-[var(--surface-muted)] text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      {cat}
                    </div>
                    {items.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-[var(--surface-muted)] cursor-pointer text-sm"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={surgeryIds.includes(m.id)}
                            onChange={() => toggleSurgery(m.id)}
                            className="accent-[var(--primary)]"
                          />
                          {m.name}
                        </span>
                        <span className="text-xs text-[var(--muted)] tabular-nums">
                          {m.durationMin}m + {m.turnoverMin}m T/O
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </Field>

            <Grid cols={3}>
              <Field label="Surgical Complexity">
                <select
                  className="input-base"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as Complexity)}
                >
                  <option>General</option>
                  <option>Moderate</option>
                  <option>Complex</option>
                </select>
              </Field>
              <Field label="Multi-disciplinary">
                <select
                  className="input-base"
                  value={multiDisciplinary}
                  onChange={(e) =>
                    setMultiDisciplinary(e.target.value as MultiDisciplinary)
                  }
                >
                  <option value="1">1 SMF/KSM</option>
                  <option value="2">2 SMF/KSM</option>
                  <option value=">2">&gt;2 SMF/KSM</option>
                </select>
              </Field>
              <Field label="Working Hour Fit (auto-checked)">
                <select
                  className="input-base"
                  value={workingHourFit}
                  onChange={(e) =>
                    setWorkingHourFit(e.target.value as WorkingHourFit)
                  }
                >
                  <option value="FitMorning">Fit in morning (no break)</option>
                  <option value="FitWithBreak">Fit with break / shift</option>
                  <option value="Overrun">Overrun</option>
                </select>
              </Field>
            </Grid>
          </Section>

          <Section title="Team & Scheduling (Auto-generated)">
            <Grid cols={3}>
              <ReadOnlyField label="Surgeon" value={getStaffById(autoAssigned.surgeon)?.name || "—"} />
              <ReadOnlyField label="Assistant Surgeon" value={getStaffById(autoAssigned.assistantSurgeon)?.name || "—"} />
              <ReadOnlyField label="Anesthesiologist" value={getStaffById(autoAssigned.anesthesiologist)?.name || "—"} />
              <ReadOnlyField label="Scrub Nurse" value={getStaffById(autoAssigned.scrubNurse)?.name || "—"} />
              <ReadOnlyField label="Circulating Nurse" value={getStaffById(autoAssigned.circulatingNurse)?.name || "—"} />
              <ReadOnlyField label="Operator" value={getStaffById(autoAssigned.operator)?.name || "—"} />
              <ReadOnlyField label="Assigned OR" value={assignedOR?.name || "Pending"} />
              <Field label="Planned Surgery Time">
                <input
                  type="datetime-local"
                  className="input-base"
                  value={plannedTime}
                  onChange={(e) => setPlannedTime(e.target.value)}
                />
              </Field>
              <Field label="Note Scheduling">
                <input
                  className="input-base"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </Field>
            </Grid>
          </Section>

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSave} className="btn-primary">
              Save &amp; Assign
            </button>
          </div>
        </div>

        {/* Live scoring panel */}
        <aside className="xl:sticky xl:top-7 h-fit space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold">Accumulated Scoring</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Live calculation</p>

            <div className="mt-5 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Final Score
                </div>
                <div className="text-4xl font-bold tabular-nums">
                  {breakdown.finalScore}
                </div>
              </div>
              <span className={priorityBadgeClass(breakdown.priority)}>
                {breakdown.priority} Priority
              </span>
            </div>

            <div className="mt-5 text-xs space-y-2">
              <ScoreRow
                label="Duration"
                hint={`${aggregated.durationMinutes} min`}
                value={breakdown.durationScore}
              />
              <ScoreRow
                label="Turnover"
                hint={`${aggregated.turnoverMinutes} min`}
                value={breakdown.turnoverScore}
              />
              <ScoreRow label="Complexity" hint={complexity} value={breakdown.complexityScore} />
              <ScoreRow label="Urgency" hint={urgency} value={breakdown.urgencyScore} />
              <ScoreRow
                label="Multi-disciplinary"
                hint={`${multiDisciplinary} SMF`}
                value={breakdown.multiDisciplinaryScore}
              />
              <ScoreRow label="Patient Type" hint={patientType} value={breakdown.patientTypeScore} />
              <ScoreRow label="Patient Class" hint={patientClass} value={breakdown.patientClassScore} />
              <ScoreRow
                label="Working Hour Fit"
                hint={workingHourFit.replace(/([A-Z])/g, " $1").trim()}
                value={breakdown.workingHourFitScore}
              />

              <div className="border-t border-[var(--border)] my-2" />
              <ScoreRow
                label="Base Score"
                hint=""
                value={breakdown.baseScore}
                bold
              />
              <ScoreRow
                label="Infection Modifier"
                hint={infection}
                value={breakdown.infectionModifier}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold">Priority threshold</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="badge badge-high">High</span>
                <span className="text-[var(--muted)]">Score ≥ 17</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-medium">Medium</span>
                <span className="text-[var(--muted)]">Score 13 – 16</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-low">Low</span>
                <span className="text-[var(--muted)]">Score ≤ 12</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${
        cols === 3 ? "lg:grid-cols-3" : ""
      } gap-4`}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-base">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <div className="input-base bg-[var(--surface-muted)] text-[var(--muted-foreground)]">
        {value}
      </div>
    </Field>
  );
}

function ScoreRow({
  label,
  hint,
  value,
  bold,
}: {
  label: string;
  hint: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className={bold ? "font-semibold text-sm" : ""}>{label}</div>
        {hint && (
          <div className="text-[11px] text-[var(--muted)]">{hint}</div>
        )}
      </div>
      <div className={`tabular-nums ${bold ? "font-bold text-base" : "font-semibold"}`}>
        {value > 0 ? `+${value}` : value}
      </div>
    </div>
  );
}
