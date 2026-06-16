"use client";

import { Topbar } from "@/components/Topbar";
import { orStore, scheduledStore } from "@/lib/store";
import { lookupRoom, lookupStaff, lookupSurgery } from "@/lib/store/lookups";
import { priorityBadgeClass } from "@/lib/scoring";
import { formatDate, formatTime } from "@/lib/fmt";

export default function DashboardPage() {
  const scheduledSurgeries = scheduledStore.useStore();
  const operatingRooms = orStore.useStore();
  const getStaffById = lookupStaff;
  const getSurgeryById = lookupSurgery;
  const getRoomById = lookupRoom;
  const active = scheduledSurgeries.filter((s) => !s.completedAt);
  const total = active.length;
  const high = active.filter((s) => s.priority === "High").length;
  const medium = active.filter((s) => s.priority === "Medium").length;
  const low = active.filter((s) => s.priority === "Low").length;
  const infectious = active.filter(
    (s) => s.infection === "Infectious"
  ).length;

  const today = new Date().toDateString();
  const todaySurgeries = active.filter(
    (s) => new Date(s.plannedStart).toDateString() === today
  );

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Real-time overview of operating room performance and surgical workload"
      />
      <div className="p-7 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Scheduled Surgeries"
            value={total}
            hint="Active in pipeline"
            tint="primary"
          />
          <KpiCard
            label="High Priority"
            value={high}
            hint="Score ≥ 17"
            tint="high"
          />
          <KpiCard
            label="OR Utilization"
            value="78%"
            hint="Avg today"
            tint="accent"
          />
          <KpiCard
            label="Infectious Cases"
            value={infectious}
            hint="Special handling"
            tint="warning"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Priority breakdown */}
          <div className="card lg:col-span-1">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">
              Priority breakdown
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Based on final scoring
            </p>
            <div className="mt-5 space-y-3">
              <PriorityBar label="High" value={high} total={total} tint="high" />
              <PriorityBar
                label="Medium"
                value={medium}
                total={total}
                tint="medium"
              />
              <PriorityBar label="Low" value={low} total={total} tint="low" />
            </div>
          </div>

          {/* OR status */}
          <div className="card lg:col-span-2">
            <h3 className="text-sm font-semibold">Operating room status</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Live OR allocation today
            </p>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {operatingRooms.map((or) => {
                const inUse = todaySurgeries.find((s) => s.roomId === or.id);
                return (
                  <div
                    key={or.id}
                    className="rounded-lg border border-[var(--border)] p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">{or.name}</div>
                      <span className={priorityBadgeClass(or.priority)}>
                        {or.priority}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      {inUse ? (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-[var(--success)] mr-1.5" />
                          In use: {inUse.patientName}
                        </>
                      ) : (
                        <>
                          <span className="inline-block w-2 h-2 rounded-full bg-[var(--border-strong)] mr-1.5" />
                          Available
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's pipeline */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Today&apos;s pipeline</h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Surgeries planned for {formatDate(new Date())}
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="py-2.5 pr-3 font-semibold">Patient</th>
                  <th className="py-2.5 pr-3 font-semibold">Surgery</th>
                  <th className="py-2.5 pr-3 font-semibold">OR</th>
                  <th className="py-2.5 pr-3 font-semibold">Time</th>
                  <th className="py-2.5 pr-3 font-semibold">Surgeon</th>
                  <th className="py-2.5 pr-3 font-semibold">Score</th>
                  <th className="py-2.5 pr-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {todaySurgeries
                  .sort(
                    (a, b) =>
                      new Date(a.plannedStart).getTime() -
                      new Date(b.plannedStart).getTime()
                  )
                  .map((s) => {
                    const surgery = getSurgeryById(s.surgeryIds[0]);
                    const room = getRoomById(s.roomId);
                    const surgeon = getStaffById(s.surgeonId);
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-[var(--border)] last:border-0"
                      >
                        <td className="py-3 pr-3">
                          <div className="font-medium">{s.patientName}</div>
                          <div className="text-xs text-[var(--muted)]">
                            {s.patientId} · {s.gender} · {s.age}y
                          </div>
                        </td>
                        <td className="py-3 pr-3">{surgery?.name}</td>
                        <td className="py-3 pr-3">{room?.name}</td>
                        <td className="py-3 pr-3 tabular-nums">
                          {formatTime(s.plannedStart)}
                        </td>
                        <td className="py-3 pr-3">{surgeon?.name}</td>
                        <td className="py-3 pr-3 font-semibold tabular-nums">
                          {s.finalScore}
                        </td>
                        <td className="py-3 pr-3">
                          <span className={priorityBadgeClass(s.priority)}>
                            {s.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tint,
}: {
  label: string;
  value: number | string;
  hint: string;
  tint: "primary" | "high" | "accent" | "warning";
}) {
  const colorMap: Record<typeof tint, string> = {
    primary: "bg-[var(--primary-soft)] text-[var(--primary)]",
    high: "bg-[var(--priority-high-soft)] text-[var(--priority-high)]",
    accent: "bg-[var(--accent-soft)] text-[var(--accent)]",
    warning: "bg-[var(--priority-medium-soft)] text-[var(--priority-medium)]",
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          {label}
        </div>
        <div className={`h-7 w-7 rounded-md grid place-items-center text-sm ${colorMap[tint]}`}>
          ▣
        </div>
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-[var(--muted)]">{hint}</div>
    </div>
  );
}

function PriorityBar({
  label,
  value,
  total,
  tint,
}: {
  label: string;
  value: number;
  total: number;
  tint: "high" | "medium" | "low";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const barColor =
    tint === "high"
      ? "bg-[var(--priority-high)]"
      : tint === "medium"
      ? "bg-[var(--priority-medium)]"
      : "bg-[var(--priority-low)]";
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-[var(--muted)]">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
