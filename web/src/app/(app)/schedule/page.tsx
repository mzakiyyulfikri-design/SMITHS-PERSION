"use client";

import { Topbar } from "@/components/Topbar";
import { ScheduledSurgery } from "@/lib/mock-data";
import {
  menuStore,
  orStore,
  scheduledStore,
  staffStore,
} from "@/lib/store";
import { lookupRoom, lookupStaff, lookupSurgery } from "@/lib/store/lookups";
import { formatDate, formatTime } from "@/lib/fmt";
import { priorityBadgeClass } from "@/lib/scoring";
import { useMemo, useState } from "react";

type View = "list" | "gantt";
type Filter = "today" | "next" | "after" | "week" | "month";

const filters: { id: Filter; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "next", label: "Next Day" },
  { id: "after", label: "Day After Tomorrow" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

function dayOffset(iso: string) {
  const a = new Date(iso);
  const b = new Date();
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function matchesFilter(s: ScheduledSurgery, f: Filter) {
  const offset = dayOffset(s.plannedStart);
  if (f === "today") return offset === 0;
  if (f === "next") return offset === 1;
  if (f === "after") return offset === 2;
  if (f === "week") return offset >= 0 && offset < 7;
  if (f === "month") return offset >= 0 && offset < 31;
  return true;
}

export default function SchedulePage() {
  const scheduledSurgeries = scheduledStore.useStore();
  const operatingRooms = orStore.useStore();
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<Filter>("week");
  const [sortKey, setSortKey] = useState<string>("plannedStart");
  const [selected, setSelected] = useState<ScheduledSurgery | null>(null);

  const filtered = useMemo(
    () =>
      scheduledSurgeries
        .filter((s) => !s.completedAt)
        .filter((s) => matchesFilter(s, filter))
        .sort((a, b) => {
          if (sortKey === "patientName") return a.patientName.localeCompare(b.patientName);
          if (sortKey === "priority") {
            const order = { High: 0, Medium: 1, Low: 2 };
            return order[a.priority] - order[b.priority];
          }
          return new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime();
        }),
    [scheduledSurgeries, filter, sortKey]
  );

  return (
    <>
      <Topbar
        title="Surgery Schedule"
        subtitle="Sort, filter, and view scheduled surgeries across all operating rooms"
        actions={
          <div className="flex rounded-lg border border-[var(--border-strong)] overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm font-medium ${
                view === "list"
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "bg-[var(--surface)] text-[var(--muted-foreground)]"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setView("gantt")}
              className={`px-3 py-1.5 text-sm font-medium border-l border-[var(--border-strong)] ${
                view === "gantt"
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "bg-[var(--surface)] text-[var(--muted-foreground)]"
              }`}
            >
              Gantt
            </button>
          </div>
        }
      />

      <div className="p-7 space-y-5">
        <div className="card">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1.5 bg-[var(--surface-muted)] p-1 rounded-lg">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                    filter === f.id
                      ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider">
                Sort by
              </label>
              <select
                className="input-base !w-auto !py-1.5 !text-xs"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="plannedStart">Planned Time</option>
                <option value="patientName">Patient Name</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {view === "list" ? (
          <ListView surgeries={filtered} onSelect={setSelected} />
        ) : (
          <GanttView
            surgeries={filtered}
            rooms={operatingRooms}
            onSelect={setSelected}
          />
        )}
      </div>

      {selected && <DetailDrawer surgery={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ListView({
  surgeries,
  onSelect,
}: {
  surgeries: ScheduledSurgery[];
  onSelect: (s: ScheduledSurgery) => void;
}) {
  return (
    <div className="card !p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] bg-[var(--surface-muted)]">
            <th className="py-3 px-4 font-semibold">No</th>
            <th className="py-3 px-4 font-semibold">Patient</th>
            <th className="py-3 px-4 font-semibold">Surgery</th>
            <th className="py-3 px-4 font-semibold">OR</th>
            <th className="py-3 px-4 font-semibold">Time</th>
            <th className="py-3 px-4 font-semibold">Surgeon</th>
            <th className="py-3 px-4 font-semibold">Score</th>
            <th className="py-3 px-4 font-semibold">Priority</th>
            <th className="py-3 px-4 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {surgeries.map((s, i) => {
            const surgery = lookupSurgery(s.surgeryIds[0]);
            const room = lookupRoom(s.roomId);
            const surgeon = lookupStaff(s.surgeonId);
            return (
              <tr
                key={s.id}
                className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]/40"
              >
                <td className="py-3 px-4 text-[var(--muted)]">{i + 1}</td>
                <td className="py-3 px-4">
                  <div className="font-medium">{s.patientName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {s.patientId} · {s.patientType} · {s.age}y
                  </div>
                </td>
                <td className="py-3 px-4">{surgery?.name}</td>
                <td className="py-3 px-4">{room?.name}</td>
                <td className="py-3 px-4 tabular-nums">
                  <div>{formatDate(s.plannedStart)}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {formatTime(s.plannedStart)}
                  </div>
                </td>
                <td className="py-3 px-4">{surgeon?.name}</td>
                <td className="py-3 px-4 font-semibold tabular-nums">
                  {s.finalScore}
                </td>
                <td className="py-3 px-4">
                  <span className={priorityBadgeClass(s.priority)}>
                    {s.priority}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onSelect(s)}
                    className="text-[var(--primary)] text-xs font-semibold hover:underline"
                  >
                    View Details →
                  </button>
                </td>
              </tr>
            );
          })}
          {surgeries.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="py-12 text-center text-sm text-[var(--muted)]"
              >
                No surgeries in this range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function GanttView({
  surgeries,
  rooms,
  onSelect,
}: {
  surgeries: ScheduledSurgery[];
  rooms: { id: string; name: string }[];
  onSelect: (s: ScheduledSurgery) => void;
}) {
  const dayStartHour = 7;
  const dayEndHour = 21;
  const hours = dayEndHour - dayStartHour;

  // group by day
  const byDay = surgeries.reduce<Record<string, ScheduledSurgery[]>>((acc, s) => {
    const key = new Date(s.plannedStart).toDateString();
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  if (Object.keys(byDay).length === 0) {
    return (
      <div className="card text-center text-sm text-[var(--muted)] py-12">
        No surgeries in this range.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(byDay).map(([day, items]) => (
        <div key={day} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{day}</h3>
            <span className="text-xs text-[var(--muted)]">
              {items.length} surgeries
            </span>
          </div>

          {/* hour ruler */}
          <div className="relative pl-32">
            <div className="flex border-b border-[var(--border)] pb-1">
              {Array.from({ length: hours + 1 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 text-[10px] text-[var(--muted)] tabular-nums"
                >
                  {String(dayStartHour + i).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div className="space-y-2 mt-3">
              {rooms.map((or) => {
                const orItems = items.filter((it) => it.roomId === or.id);
                return (
                  <div key={or.id} className="relative h-9 flex items-center">
                    <div className="absolute -left-32 w-28 text-xs font-semibold text-[var(--muted-foreground)] truncate">
                      {or.name}
                    </div>
                    <div className="relative w-full h-full bg-[var(--surface-muted)]/50 rounded-md">
                      {orItems.map((it) => {
                        const start = new Date(it.plannedStart);
                        const startH =
                          start.getHours() + start.getMinutes() / 60;
                        const surgery = lookupSurgery(it.surgeryIds[0]);
                        const duration = surgery?.durationMin || 60;
                        const turnover = surgery?.turnoverMin || 30;
                        const totalH = (duration + turnover) / 60;
                        const left = ((startH - dayStartHour) / hours) * 100;
                        const width = (totalH / hours) * 100;
                        const durWidth = (duration / 60 / hours) * 100;
                        const tintBg =
                          it.priority === "High"
                            ? "bg-[var(--priority-high-soft)] border-[var(--priority-high)]"
                            : it.priority === "Medium"
                            ? "bg-[var(--priority-medium-soft)] border-[var(--priority-medium)]"
                            : "bg-[var(--priority-low-soft)] border-[var(--priority-low)]";
                        return (
                          <button
                            key={it.id}
                            onClick={() => onSelect(it)}
                            className={`absolute top-0 h-full rounded-md border-l-[3px] ${tintBg} text-left text-[11px] font-semibold pl-2 pr-1 truncate hover:brightness-95`}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              minWidth: "100px",
                            }}
                            title={`${it.patientName} · ${surgery?.name}`}
                          >
                            <span className="block truncate">
                              {it.patientName}
                            </span>
                            <span className="block text-[10px] font-normal opacity-80 truncate">
                              {surgery?.name} · {duration}+{turnover}m
                            </span>
                            <span
                              className="absolute right-0 top-0 h-full bg-black/5 rounded-r-md"
                              style={{
                                width: `${100 - (durWidth / (width || 1)) * 100}%`,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-5 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[var(--priority-high-soft)] border-l-2 border-[var(--priority-high)]" />
              High
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[var(--priority-medium-soft)] border-l-2 border-[var(--priority-medium)]" />
              Medium
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-[var(--priority-low-soft)] border-l-2 border-[var(--priority-low)]" />
              Low
            </span>
            <span className="flex items-center gap-1.5 ml-4">
              <span className="inline-block w-3 h-3 rounded-sm bg-black/5" />
              Turnover
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailDrawer({
  surgery,
  onClose,
}: {
  surgery: ScheduledSurgery;
  onClose: () => void;
}) {
  const [accessUnlocked, setAccessUnlocked] = useState(false);
  const [accessPw, setAccessPw] = useState("");
  const surgeryDef = lookupSurgery(surgery.surgeryIds[0]);
  const room = lookupRoom(surgery.roomId);

  const rows: [string, React.ReactNode][] = [
    ["Patient ID", surgery.patientId],
    ["Patient Name", surgery.patientName],
    ["Patient Type", surgery.patientType],
    ["Operating Room", room?.name],
    ["Age", `${surgery.age} years`],
    ["Gender", surgery.gender],
    ["Blood Type", surgery.bloodType],
    ["Weight", `${surgery.weight} kg`],
    [
      "Urgency Level",
      <span key="u" className={priorityBadgeClass(surgery.priority)}>
        {surgery.urgency}
      </span>,
    ],
    ["Surgeon", lookupStaff(surgery.surgeonId)?.name],
    ["Assistant Surgeon", lookupStaff(surgery.assistantSurgeonId)?.name],
    ["Anesthesiologist", lookupStaff(surgery.anesthesiologistId)?.name],
    ["Scrub Nurse", lookupStaff(surgery.scrubNurseId)?.name],
    ["Circulating Nurse", lookupStaff(surgery.circulatingNurseId)?.name],
    ["Operator", lookupStaff(surgery.operatorId)?.name],
    ["Complexity Level", surgery.complexity],
    ["Surgical Duration", `${surgeryDef?.durationMin} min`],
    ["Turnover", `${surgeryDef?.turnoverMin} min`],
    ["Preoperative Diagnosis", surgery.preoperativeDiagnosis],
    ["Prepose Diagnosis", surgery.preposeDiagnosis],
    ["Notes", surgery.notes || "—"],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-40 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--surface)] h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10 flex items-center justify-between">
          <div>
            <h2 className="font-bold">{surgery.patientName}</h2>
            <p className="text-xs text-[var(--muted)]">
              {surgeryDef?.name} · {room?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-[var(--surface-muted)]"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {rows.map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
                  {k}
                </div>
                <div className="mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="text-[11px] uppercase tracking-wider text-[var(--muted)] font-semibold">
              Access Code
            </div>
            {!accessUnlocked ? (
              <div className="mt-2 flex gap-2">
                <input
                  type="password"
                  className="input-base"
                  placeholder="Enter password to reveal"
                  value={accessPw}
                  onChange={(e) => setAccessPw(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (accessPw === "smiths") setAccessUnlocked(true);
                    else alert("Access declined.");
                  }}
                  className="btn-primary !px-3 whitespace-nowrap"
                >
                  Show
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <div className="font-mono text-2xl font-bold tracking-widest">
                  {surgery.accessCode}
                </div>
                <button
                  onClick={() => setAccessUnlocked(false)}
                  className="btn-secondary !px-3 !py-1 !text-xs"
                >
                  Hide
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
