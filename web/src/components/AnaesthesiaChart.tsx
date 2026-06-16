"use client";

import { AnaesthesiaRecordSheet } from "@/components/AnaesthesiaRecordSheet";
import { Field, Modal } from "@/components/Modal";
import { formatTime } from "@/lib/fmt";
import {
  AnaesthesiaEventKey,
  DrugEntry,
  executionsStore,
  FluidIn,
  FluidKind,
  FluidOut,
  OutputKind,
  uid,
  updateExecution,
  VentilationSettings,
} from "@/lib/store";
import { useMemo, useState } from "react";

const EVENT_KINDS: { key: AnaesthesiaEventKey; color: string }[] = [
  { key: "Induction", color: "#7c3aed" },
  { key: "Intubation", color: "#0284c7" },
  { key: "Incision", color: "#dc2626" },
  { key: "Closure", color: "#16a34a" },
  { key: "Emergence", color: "#d97706" },
];

const COMMON_DRUGS = [
  { name: "Propofol", routes: ["IV"], doses: ["100 mg", "150 mg", "200 mg"] },
  { name: "Fentanyl", routes: ["IV"], doses: ["50 mcg", "100 mcg", "150 mcg"] },
  { name: "Rocuronium", routes: ["IV"], doses: ["30 mg", "50 mg"] },
  { name: "Sevoflurane", routes: ["INH"], doses: ["1.5 MAC", "2 MAC"] },
  { name: "Midazolam", routes: ["IV"], doses: ["1 mg", "2 mg"] },
  { name: "Ondansetron", routes: ["IV"], doses: ["4 mg", "8 mg"] },
  { name: "Lidocaine", routes: ["IV", "Topical"], doses: ["20 mg", "40 mg"] },
];

const FLUID_KINDS: FluidKind[] = [
  "Saline",
  "RingerLactate",
  "Colloid",
  "PRBC",
  "FFP",
  "Platelet",
  "Other",
];

const OUTPUT_KINDS: OutputKind[] = ["Urine", "BloodLoss", "Drain", "Other"];

export function AnaesthesiaChart({
  surgeryId,
  startedAt,
}: {
  surgeryId: string;
  startedAt: number;
}) {
  const session = executionsStore.useStore((s) => s[surgeryId]);
  const [drugOpen, setDrugOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [fluidInOpen, setFluidInOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [ventOpen, setVentOpen] = useState(false);

  if (!session) return null;

  const drugs = session.drugs;
  const events = session.events;
  const fluidsIn = session.fluidsIn || [];
  const fluidsOut = session.fluidsOut || [];
  const vent = session.ventilation;

  const totalIn = fluidsIn.reduce((acc, f) => acc + f.volumeMl, 0);
  const totalOut = fluidsOut.reduce((acc, f) => acc + f.volumeMl, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold">Anaesthesia Record</h2>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            Manual entry · ready for anaesthesia machine integration
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setVentOpen(true)}
            className="btn-secondary !text-xs !py-1.5 !px-3"
          >
            {vent.startedAt && !vent.endedAt ? "⏵ Ventilating" : "Ventilation"}
          </button>
          <button onClick={() => setOutputOpen(true)} className="btn-secondary !text-xs !py-1.5 !px-3">
            + Output
          </button>
          <button onClick={() => setFluidInOpen(true)} className="btn-secondary !text-xs !py-1.5 !px-3">
            + Fluid In
          </button>
          <button onClick={() => setEventOpen(true)} className="btn-secondary !text-xs !py-1.5 !px-3">
            + Event
          </button>
          <button onClick={() => setDrugOpen(true)} className="btn-primary !text-xs !py-1.5 !px-3">
            + Drug
          </button>
        </div>
      </div>

      {/* Quick totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Fluid In" value={`${totalIn} ml`} color="#0284c7" />
        <Stat label="Output" value={`${totalOut} ml`} color="#d97706" />
        <Stat label="Net" value={`${totalIn - totalOut > 0 ? "+" : ""}${totalIn - totalOut} ml`} color="#16a34a" />
        <Stat label="Drugs given" value={drugs.length.toString()} color="#7c3aed" />
      </div>

      {/* Paper-record sheet */}
      <div className="rounded-lg border border-[var(--border)] bg-white">
        <AnaesthesiaRecordSheet session={session} startedAt={startedAt} />
      </div>

      {/* Log lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LogList
          title="Drug administration"
          count={drugs.length}
          items={drugs}
          startedAt={startedAt}
          render={(d) => (
            <>
              <div className="font-medium">
                {d.drug} <span className="text-xs text-[var(--muted)] font-normal">{d.route}</span>
              </div>
              <div className="text-xs text-[var(--muted)]">{d.dose}</div>
            </>
          )}
          onDelete={(id) =>
            updateExecution(surgeryId, (prev) => ({
              ...prev,
              drugs: prev.drugs.filter((d) => d.id !== id),
            }))
          }
        />

        <LogList
          title="Anaesthesia events"
          count={events.length}
          items={events}
          startedAt={startedAt}
          render={(e) => {
            const color = EVENT_KINDS.find((k) => k.key === e.kind)?.color || "#475569";
            return (
              <>
                <div className="font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {e.kind}
                </div>
                {e.note && <div className="text-xs text-[var(--muted)]">{e.note}</div>}
              </>
            );
          }}
          onDelete={(id) =>
            updateExecution(surgeryId, (prev) => ({
              ...prev,
              events: prev.events.filter((e) => e.id !== id),
            }))
          }
        />

        <LogList
          title="Fluid input"
          count={fluidsIn.length}
          items={fluidsIn}
          startedAt={startedAt}
          render={(f) => (
            <>
              <div className="font-medium">{f.kind}</div>
              <div className="text-xs text-[var(--muted)]">{f.volumeMl} ml {f.note ? `· ${f.note}` : ""}</div>
            </>
          )}
          onDelete={(id) =>
            updateExecution(surgeryId, (prev) => ({
              ...prev,
              fluidsIn: prev.fluidsIn.filter((f) => f.id !== id),
            }))
          }
        />

        <LogList
          title="Output"
          count={fluidsOut.length}
          items={fluidsOut}
          startedAt={startedAt}
          render={(o) => (
            <>
              <div className="font-medium">{o.kind}</div>
              <div className="text-xs text-[var(--muted)]">{o.volumeMl} ml {o.note ? `· ${o.note}` : ""}</div>
            </>
          )}
          onDelete={(id) =>
            updateExecution(surgeryId, (prev) => ({
              ...prev,
              fluidsOut: prev.fluidsOut.filter((f) => f.id !== id),
            }))
          }
        />
      </div>

      <DrugDialog
        open={drugOpen}
        onClose={() => setDrugOpen(false)}
        onSave={(drug) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            drugs: [...prev.drugs, { ...drug, id: uid("drug"), at: Date.now() }],
          }));
          setDrugOpen(false);
        }}
      />
      <EventDialog
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        onSave={(ev) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            events: [...prev.events, { ...ev, id: uid("evt"), at: Date.now() }],
          }));
          setEventOpen(false);
        }}
      />
      <FluidInDialog
        open={fluidInOpen}
        onClose={() => setFluidInOpen(false)}
        onSave={(f) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            fluidsIn: [...prev.fluidsIn, { ...f, id: uid("fin"), at: Date.now() }],
          }));
          setFluidInOpen(false);
        }}
      />
      <OutputDialog
        open={outputOpen}
        onClose={() => setOutputOpen(false)}
        onSave={(o) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            fluidsOut: [...prev.fluidsOut, { ...o, id: uid("fout"), at: Date.now() }],
          }));
          setOutputOpen(false);
        }}
      />
      <VentilationDialog
        open={ventOpen}
        onClose={() => setVentOpen(false)}
        current={vent}
        onStart={(settings) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            ventilation: { ...settings, startedAt: Date.now() },
          }));
          setVentOpen(false);
        }}
        onStop={() => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            ventilation: { ...prev.ventilation, endedAt: Date.now() },
          }));
          setVentOpen(false);
        }}
        onUpdate={(settings) => {
          updateExecution(surgeryId, (prev) => ({
            ...prev,
            ventilation: { ...prev.ventilation, ...settings },
          }));
          setVentOpen(false);
        }}
      />
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] font-semibold">
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

type WithIdAt = { id: string; at: number };

function LogList<T extends WithIdAt>({
  title,
  count,
  items,
  startedAt,
  render,
  onDelete,
}: {
  title: string;
  count: number;
  items: T[];
  startedAt: number;
  render: (item: T) => React.ReactNode;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)]">
      <div className="px-4 py-2 border-b border-[var(--border)] bg-[var(--surface-muted)] text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center justify-between">
        <span>{title}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <div className="max-h-40 overflow-y-auto divide-y divide-[var(--border)]">
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">No entries yet.</div>
        )}
        {items
          .slice()
          .reverse()
          .map((it) => {
            const elapsedM = Math.floor((it.at - startedAt) / 60000);
            return (
              <div
                key={it.id}
                className="px-4 py-2 flex items-center justify-between gap-2 text-sm"
              >
                <div className="min-w-0">
                  {render(it)}
                  <div className="text-[11px] text-[var(--muted)] mt-0.5 tabular-nums">
                    T+{elapsedM}m · {formatTime(it.at)}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(it.id)}
                  className="text-[var(--priority-high)] text-xs hover:underline shrink-0"
                >
                  Remove
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ---------------- Drug Dialog ---------------- */

function DrugDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (d: Omit<DrugEntry, "id" | "at">) => void;
}) {
  const [drug, setDrug] = useState(COMMON_DRUGS[0].name);
  const [dose, setDose] = useState(COMMON_DRUGS[0].doses[0]);
  const [route, setRoute] = useState(COMMON_DRUGS[0].routes[0]);
  const drugDef = useMemo(() => COMMON_DRUGS.find((d) => d.name === drug), [drug]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record drug administration"
      subtitle="Timestamp set automatically to now"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave({ drug, dose, route })} className="btn-primary">
            Add to chart
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Drug">
          <select
            className="input-base"
            value={drug}
            onChange={(e) => {
              setDrug(e.target.value);
              const d = COMMON_DRUGS.find((x) => x.name === e.target.value);
              setDose(d?.doses[0] || "");
              setRoute(d?.routes[0] || "IV");
            }}
          >
            {COMMON_DRUGS.map((d) => (
              <option key={d.name}>{d.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dose">
            <input className="input-base" value={dose} onChange={(e) => setDose(e.target.value)} list="drug-doses" />
            <datalist id="drug-doses">
              {drugDef?.doses.map((d) => <option key={d} value={d} />)}
            </datalist>
          </Field>
          <Field label="Route">
            <select className="input-base" value={route} onChange={(e) => setRoute(e.target.value)}>
              {drugDef?.routes.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Event Dialog ---------------- */

function EventDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: { kind: AnaesthesiaEventKey; note: string }) => void;
}) {
  const [kind, setKind] = useState<AnaesthesiaEventKey>("Induction");
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark anaesthesia event"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { onSave({ kind, note }); setNote(""); }} className="btn-primary">
            Add event
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Event">
          <div className="grid grid-cols-3 gap-2">
            {EVENT_KINDS.map((e) => (
              <button
                key={e.key}
                type="button"
                onClick={() => setKind(e.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  kind === e.key
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                {e.key}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Note" hint="Optional">
          <textarea className="input-base min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. ETT #7.5, easy intubation" />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Fluid In Dialog ---------------- */

function FluidInDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: Omit<FluidIn, "id" | "at">) => void;
}) {
  const [kind, setKind] = useState<FluidKind>("Saline");
  const [volume, setVolume] = useState(500);
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record fluid input"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave({ kind, volumeMl: volume, note })} className="btn-primary">
            Add
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <select className="input-base" value={kind} onChange={(e) => setKind(e.target.value as FluidKind)}>
            {FLUID_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Volume (ml)">
          <input type="number" className="input-base" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </Field>
        <Field label="Note" hint="Optional">
          <input className="input-base" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Output Dialog ---------------- */

function OutputDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (f: Omit<FluidOut, "id" | "at">) => void;
}) {
  const [kind, setKind] = useState<OutputKind>("Urine");
  const [volume, setVolume] = useState(100);
  const [note, setNote] = useState("");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record output"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => onSave({ kind, volumeMl: volume, note })} className="btn-primary">
            Add
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <select className="input-base" value={kind} onChange={(e) => setKind(e.target.value as OutputKind)}>
            {OUTPUT_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Volume (ml)">
          <input type="number" className="input-base" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </Field>
        <Field label="Note" hint="Optional">
          <input className="input-base" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

/* ---------------- Ventilation Dialog ---------------- */

function VentilationDialog({
  open,
  onClose,
  current,
  onStart,
  onStop,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  current: VentilationSettings;
  onStart: (s: VentilationSettings) => void;
  onStop: () => void;
  onUpdate: (s: Partial<VentilationSettings>) => void;
}) {
  const isActive = !!current.startedAt && !current.endedAt;
  const [ie, setIe] = useState(current.ieRatio);
  const [vt, setVt] = useState(current.tidalVolume);
  const [rr, setRr] = useState(current.rrSet);
  const [fio2, setFio2] = useState(current.fio2);
  const [peep, setPeep] = useState(current.peep);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isActive ? "Update ventilation" : "Start mechanical ventilation"}
      subtitle={isActive ? "Currently ventilating — adjust settings or stop" : "Configure ventilator and start"}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          {isActive ? (
            <>
              <button onClick={onStop} className="btn-secondary !border-[var(--priority-high)] !text-[var(--priority-high)]">
                Stop Ventilation
              </button>
              <button
                onClick={() => onUpdate({ ieRatio: ie, tidalVolume: vt, rrSet: rr, fio2, peep })}
                className="btn-primary"
              >
                Update settings
              </button>
            </>
          ) : (
            <button
              onClick={() => onStart({ ieRatio: ie, tidalVolume: vt, rrSet: rr, fio2, peep })}
              className="btn-primary"
            >
              Start Ventilation
            </button>
          )}
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="I:E ratio">
          <input className="input-base" value={ie} onChange={(e) => setIe(e.target.value)} placeholder="1:2" />
        </Field>
        <Field label="Tidal Volume (ml)">
          <input type="number" className="input-base" value={vt} onChange={(e) => setVt(Number(e.target.value))} />
        </Field>
        <Field label="RR set (/min)">
          <input type="number" className="input-base" value={rr} onChange={(e) => setRr(Number(e.target.value))} />
        </Field>
        <Field label="FiO₂ (%)">
          <input type="number" className="input-base" value={fio2} onChange={(e) => setFio2(Number(e.target.value))} />
        </Field>
        <Field label="PEEP (cmH₂O)">
          <input type="number" className="input-base" value={peep} onChange={(e) => setPeep(Number(e.target.value))} />
        </Field>
      </div>
    </Modal>
  );
}
