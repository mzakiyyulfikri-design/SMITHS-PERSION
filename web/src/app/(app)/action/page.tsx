"use client";

import { Topbar } from "@/components/Topbar";
import { scheduledStore } from "@/lib/store";
import {
  lookupRoom as getRoomById,
  lookupStaff as getStaffById,
  lookupSurgery as getSurgeryById,
} from "@/lib/store/lookups";
import { priorityBadgeClass } from "@/lib/scoring";
import { formatTime } from "@/lib/fmt";
import Link from "next/link";
import { useState } from "react";

export default function ActionListPage() {
  const scheduledSurgeries = scheduledStore.useStore();
  const today = new Date().toDateString();
  const todays = scheduledSurgeries.filter((s) => !s.completedAt).filter(
    (s) => new Date(s.plannedStart).toDateString() === today
  );
  const [accessOpen, setAccessOpen] = useState<string | null>(null);
  const [accessInput, setAccessInput] = useState("");

  return (
    <>
      <Topbar
        title="Surgery Action"
        subtitle="Today's surgery list — enter access code to start execution"
      />
      <div className="p-7">
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] bg-[var(--surface-muted)]">
                <th className="py-3 px-4 font-semibold">Patient</th>
                <th className="py-3 px-4 font-semibold">Surgery</th>
                <th className="py-3 px-4 font-semibold">OR</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Surgeon</th>
                <th className="py-3 px-4 font-semibold">Priority</th>
                <th className="py-3 px-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {todays.map((s) => {
                const surgery = getSurgeryById(s.surgeryIds[0]);
                const room = getRoomById(s.roomId);
                const surgeon = getStaffById(s.surgeonId);
                return (
                  <tr
                    key={s.id}
                    className="border-t border-[var(--border)]"
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium">{s.patientName}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {s.patientId}
                      </div>
                    </td>
                    <td className="py-3 px-4">{surgery?.name}</td>
                    <td className="py-3 px-4">{room?.name}</td>
                    <td className="py-3 px-4 tabular-nums">
                      {formatTime(s.plannedStart)}
                    </td>
                    <td className="py-3 px-4">{surgeon?.name}</td>
                    <td className="py-3 px-4">
                      <span className={priorityBadgeClass(s.priority)}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setAccessOpen(s.id);
                          setAccessInput("");
                        }}
                        className="btn-primary !px-3 !py-1 !text-xs"
                      >
                        Enter →
                      </button>
                    </td>
                  </tr>
                );
              })}
              {todays.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[var(--muted)]">
                    No surgeries scheduled for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accessOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 grid place-items-center"
          onClick={() => setAccessOpen(null)}
        >
          <div
            className="bg-[var(--surface)] rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">Enter Access Code</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Required to enter the surgery execution workflow.
            </p>
            <input
              type="password"
              className="input-base mt-4"
              placeholder="4-digit access code"
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setAccessOpen(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <AccessConfirm
                surgeryId={accessOpen}
                accessInput={accessInput}
                onDecline={() => alert("Access declined.")}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AccessConfirm({
  surgeryId,
  accessInput,
  onDecline,
}: {
  surgeryId: string;
  accessInput: string;
  onDecline: () => void;
}) {
  const s = scheduledStore.get().find((x) => x.id === surgeryId);
  if (!s) return null;
  const ok = accessInput === s.accessCode;
  return ok ? (
    <Link href={`/action/${s.id}`} className="btn-primary flex-1">
      Enter
    </Link>
  ) : (
    <button onClick={onDecline} className="btn-primary flex-1" disabled={!accessInput}>
      Confirm
    </button>
  );
}
