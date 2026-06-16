"use client";

import { ConfirmDialog, Field, Modal } from "@/components/Modal";
import { Topbar } from "@/components/Topbar";
import type {
  HospitalSettings,
  OperatingRoom,
  Staff,
  SurgicalMenuItem,
} from "@/lib/mock-data";
import {
  hospitalStore,
  menuStore,
  orStore,
  removeById,
  staffStore,
  uid,
  upsert,
} from "@/lib/store";
import type { Priority } from "@/lib/scoring";
import { priorityBadgeClass } from "@/lib/scoring";
import { useMemo, useState } from "react";

type Tab = "users" | "rooms" | "menu" | "hospital" | "hours";

const ALL_ROLES: Staff["role"][] = [
  "Surgeon",
  "AssistantSurgeon",
  "Anesthesiologist",
  "ScrubNurse",
  "CirculatingNurse",
  "Operator",
  "Admin",
];

export default function ConfigurationPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <>
      <Topbar
        title="Configuration"
        subtitle="Manage users, operating rooms, surgical menu, and hospital settings"
      />
      <div className="p-7">
        <div className="card !p-0 overflow-hidden">
          <div className="flex border-b border-[var(--border)] overflow-x-auto">
            {(
              [
                ["users", "Account Management"],
                ["rooms", "Operating Rooms"],
                ["menu", "Surgical Menu"],
                ["hospital", "Hospital Details"],
                ["hours", "Working Hours"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${
                  tab === id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === "users" && <UsersTab />}
            {tab === "rooms" && <RoomsTab />}
            {tab === "menu" && <MenuTab />}
            {tab === "hospital" && <HospitalTab />}
            {tab === "hours" && <HoursTab />}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * USERS
 * ============================================================ */

function UsersTab() {
  const staff = staffStore.useStore();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [creating, setCreating] = useState<Staff["role"] | null>(null);
  const [deleting, setDeleting] = useState<Staff | null>(null);

  const filtered = useMemo(
    () => (roleFilter === "all" ? staff : staff.filter((s) => s.role === roleFilter)),
    [staff, roleFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 bg-[var(--surface-muted)] p-1 rounded-lg flex-wrap">
          {["all", ...ALL_ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                roleFilter === r
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>

        <div className="relative">
          <details className="group">
            <summary className="btn-primary cursor-pointer list-none">
              + Add User
            </summary>
            <div className="absolute right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg w-56 z-10">
              {ALL_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={(e) => {
                    setCreating(r);
                    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute(
                      "open"
                    );
                  }}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--surface-muted)] first:rounded-t-lg last:rounded-b-lg"
                >
                  {r}
                </button>
              ))}
            </div>
          </details>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2.5 pr-3 font-semibold">Name</th>
              <th className="py-2.5 pr-3 font-semibold">Role</th>
              <th className="py-2.5 pr-3 font-semibold">Specialist</th>
              <th className="py-2.5 pr-3 font-semibold">NIP / STR</th>
              <th className="py-2.5 pr-3 font-semibold">Preferred Day</th>
              <th className="py-2.5 pr-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr
                key={s.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="py-3 pr-3 font-medium">{s.name}</td>
                <td className="py-3 pr-3 text-[var(--muted-foreground)]">{s.role}</td>
                <td className="py-3 pr-3">{s.specialist || "—"}</td>
                <td className="py-3 pr-3 font-mono text-xs">{s.nipStr}</td>
                <td className="py-3 pr-3">{s.preferredDay || "—"}</td>
                <td className="py-3 pr-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(s)}
                    className="text-[var(--primary)] text-xs font-semibold hover:underline mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleting(s)}
                    className="text-[var(--priority-high)] text-xs font-semibold hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-[var(--muted)]">
                  No users in this role.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <UserForm
        open={!!editing || !!creating}
        initial={editing || (creating ? { id: "", name: "", role: creating } : null)}
        onClose={() => {
          setEditing(null);
          setCreating(null);
        }}
        onSave={(user) => {
          staffStore.set((list) => upsert(list, user.id ? user : { ...user, id: uid("staff") }));
          setEditing(null);
          setCreating(null);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) staffStore.set((list) => removeById(list, deleting.id));
        }}
        title={`Delete ${deleting?.name}?`}
        message="This will remove the user from the system. Existing schedules referencing them will keep their name but not be editable until reassigned."
      />
    </div>
  );
}

function UserForm({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: Partial<Staff> | null;
  onClose: () => void;
  onSave: (s: Staff) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [role, setRole] = useState<Staff["role"]>(initial?.role || "Surgeon");
  const [specialist, setSpecialist] = useState(initial?.specialist || "");
  const [nipStr, setNipStr] = useState(initial?.nipStr || "");
  const [preferredDay, setPreferredDay] = useState(initial?.preferredDay || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // re-init when modal opens with new initial
  useMemo(() => {
    if (open) {
      setName(initial?.name || "");
      setRole(initial?.role || "Surgeon");
      setSpecialist(initial?.specialist || "");
      setNipStr(initial?.nipStr || "");
      setPreferredDay(initial?.preferredDay || "");
      setPassword("");
      setConfirm("");
      setError(null);
    }
  }, [open, initial]);

  const requiresSpecialist = ["Surgeon", "AssistantSurgeon", "Anesthesiologist"].includes(role);

  const submit = () => {
    if (!name.trim()) return setError("Name is required");
    if (!nipStr.trim()) return setError("NIP/STR is required");
    if (!initial?.id && password.length < 4) return setError("Password must be at least 4 characters");
    if (password && password !== confirm) return setError("Password confirmation does not match");
    onSave({
      id: initial?.id || "",
      name: name.trim(),
      role,
      specialist: requiresSpecialist ? specialist : undefined,
      nipStr,
      preferredDay: preferredDay || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? `Edit ${initial.name}` : `Add ${role}`}
      subtitle={initial?.id ? "Update user details" : "Register a new team member"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Save</button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Name" required>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Role" required>
          <select className="input-base" value={role} onChange={(e) => setRole(e.target.value as Staff["role"])}>
            {ALL_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        {requiresSpecialist && (
          <Field label="Specialist">
            <input className="input-base" value={specialist} onChange={(e) => setSpecialist(e.target.value)} placeholder="e.g. Cardiac Surgery" />
          </Field>
        )}
        <Field label="NIP / STR" required>
          <input className="input-base font-mono" value={nipStr} onChange={(e) => setNipStr(e.target.value)} />
        </Field>
        <Field label="Preferred Day" hint="Optional, e.g. Mon-Wed">
          <input className="input-base" value={preferredDay} onChange={(e) => setPreferredDay(e.target.value)} />
        </Field>
        <Field label={initial?.id ? "New Password" : "Password"} required={!initial?.id}>
          <input type="password" className="input-base" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={initial?.id ? "Leave blank to keep current" : ""} />
        </Field>
        <Field label="Password Confirmation">
          <input type="password" className="input-base" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
      </div>
      {error && (
        <div className="mt-4 text-sm rounded-lg bg-[var(--priority-high-soft)] text-[var(--priority-high)] px-3 py-2">
          {error}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
 * OPERATING ROOMS
 * ============================================================ */

function RoomsTab() {
  const rooms = orStore.useStore();
  const menu = menuStore.useStore();
  const [editing, setEditing] = useState<OperatingRoom | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<OperatingRoom | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{rooms.length} rooms configured</p>
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add Operating Room
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((or) => (
          <div key={or.id} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{or.name}</h3>
              <span className={priorityBadgeClass(or.priority)}>{or.priority}</span>
            </div>
            <div className="mt-2 text-xs text-[var(--muted)]">
              {or.allowedSurgeries.length} surgery types
            </div>
            <ul className="mt-3 space-y-1 text-xs max-h-32 overflow-y-auto">
              {or.allowedSurgeries.map((id) => (
                <li key={id} className="text-[var(--muted-foreground)] truncate">
                  · {menu.find((m) => m.id === id)?.name || id}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setEditing(or)} className="btn-secondary !text-xs !py-1.5 !px-3 flex-1">
                Edit
              </button>
              <button onClick={() => setDeleting(or)} className="btn-secondary !text-xs !py-1.5 !px-3 !text-[var(--priority-high)] !border-[var(--priority-high-soft)]">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <RoomForm
        open={!!editing || creating}
        initial={editing}
        menu={menu}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={(or) => {
          orStore.set((list) => upsert(list, or.id ? or : { ...or, id: uid("or") }));
          setEditing(null);
          setCreating(false);
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) orStore.set((list) => removeById(list, deleting.id));
        }}
        title={`Delete ${deleting?.name}?`}
        message="This operating room will be removed. Make sure no surgeries are currently assigned to it."
      />
    </div>
  );
}

function RoomForm({
  open,
  initial,
  menu,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: OperatingRoom | null;
  menu: SurgicalMenuItem[];
  onClose: () => void;
  onSave: (or: OperatingRoom) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [priority, setPriority] = useState<Priority>(initial?.priority || "Medium");
  const [allowed, setAllowed] = useState<string[]>(initial?.allowedSurgeries || []);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    if (open) {
      setName(initial?.name || "");
      setPriority(initial?.priority || "Medium");
      setAllowed(initial?.allowedSurgeries || []);
      setError(null);
    }
  }, [open, initial]);

  const toggle = (id: string) =>
    setAllowed((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const submit = () => {
    if (!name.trim()) return setError("Operating room name is required");
    onSave({
      id: initial?.id || "",
      name: name.trim(),
      priority,
      allowedSurgeries: allowed,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? `Edit ${initial.name}` : "Add Operating Room"}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Save</button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Operating Room Name" required>
            <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. OR-1 General" />
          </Field>
          <Field label="Priority">
            <select className="input-base" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </Field>
        </div>
        <Field label="Allowed Surgeries">
          <div className="border border-[var(--border-strong)] rounded-lg max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
            {Object.entries(
              menu.reduce<Record<string, SurgicalMenuItem[]>>((acc, m) => {
                (acc[m.category] = acc[m.category] || []).push(m);
                return acc;
              }, {})
            ).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-3 py-1.5 bg-[var(--surface-muted)] text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                  {cat}
                </div>
                {items.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--surface-muted)] cursor-pointer text-sm">
                    <input type="checkbox" checked={allowed.includes(m.id)} onChange={() => toggle(m.id)} className="accent-[var(--primary)]" />
                    {m.name}
                  </label>
                ))}
              </div>
            ))}
          </div>
        </Field>
      </div>
      {error && (
        <div className="mt-4 text-sm rounded-lg bg-[var(--priority-high-soft)] text-[var(--priority-high)] px-3 py-2">
          {error}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
 * SURGICAL MENU
 * ============================================================ */

function MenuTab() {
  const menu = menuStore.useStore();
  const [editing, setEditing] = useState<SurgicalMenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<SurgicalMenuItem | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">{menu.length} surgical procedures</p>
        <button onClick={() => setCreating(true)} className="btn-primary">
          + Add Surgical Menu
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2.5 pr-3 font-semibold">Category</th>
              <th className="py-2.5 pr-3 font-semibold">Surgery Name</th>
              <th className="py-2.5 pr-3 font-semibold">Duration</th>
              <th className="py-2.5 pr-3 font-semibold">Turnover</th>
              <th className="py-2.5 pr-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {menu.map((m) => (
              <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-3 pr-3 text-[var(--muted-foreground)]">{m.category}</td>
                <td className="py-3 pr-3 font-medium">{m.name}</td>
                <td className="py-3 pr-3 tabular-nums">{m.durationMin} min</td>
                <td className="py-3 pr-3 tabular-nums">{m.turnoverMin} min</td>
                <td className="py-3 pr-3 text-right whitespace-nowrap">
                  <button onClick={() => setEditing(m)} className="text-[var(--primary)] text-xs font-semibold hover:underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => setDeleting(m)} className="text-[var(--priority-high)] text-xs font-semibold hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MenuForm
        open={!!editing || creating}
        initial={editing}
        existingCategories={Array.from(new Set(menu.map((m) => m.category)))}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSave={(item) => {
          menuStore.set((list) => upsert(list, item.id ? item : { ...item, id: uid("menu") }));
          setEditing(null);
          setCreating(false);
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) menuStore.set((list) => removeById(list, deleting.id));
        }}
        title={`Delete ${deleting?.name}?`}
        message="This procedure will be removed from the surgical menu."
      />
    </div>
  );
}

function MenuForm({
  open,
  initial,
  existingCategories,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: SurgicalMenuItem | null;
  existingCategories: string[];
  onClose: () => void;
  onSave: (m: SurgicalMenuItem) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || existingCategories[0] || "");
  const [duration, setDuration] = useState<number>(initial?.durationMin || 60);
  const [turnover, setTurnover] = useState<number>(initial?.turnoverMin || 30);
  const [error, setError] = useState<string | null>(null);

  useMemo(() => {
    if (open) {
      setName(initial?.name || "");
      setCategory(initial?.category || existingCategories[0] || "");
      setDuration(initial?.durationMin || 60);
      setTurnover(initial?.turnoverMin || 30);
      setError(null);
    }
  }, [open, initial, existingCategories]);

  const submit = () => {
    if (!name.trim()) return setError("Surgery name is required");
    if (!category.trim()) return setError("Category is required");
    if (duration <= 0) return setError("Duration must be positive");
    onSave({
      id: initial?.id || "",
      name: name.trim(),
      category: category.trim(),
      durationMin: duration,
      turnoverMin: turnover,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? `Edit ${initial.name}` : "Add Surgical Menu"}
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} className="btn-primary">Save</button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Surgery Name" required>
          <input className="input-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Appendectomy" />
        </Field>
        <Field label="Category" required hint="Reuse an existing or type new one">
          <input className="input-base" list="cat-options" value={category} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="cat-options">
            {existingCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration (min)" required>
            <input type="number" className="input-base" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </Field>
          <Field label="Turnover (min)" required>
            <input type="number" className="input-base" value={turnover} onChange={(e) => setTurnover(Number(e.target.value))} />
          </Field>
        </div>
      </div>
      {error && (
        <div className="mt-4 text-sm rounded-lg bg-[var(--priority-high-soft)] text-[var(--priority-high)] px-3 py-2">
          {error}
        </div>
      )}
    </Modal>
  );
}

/* ============================================================
 * HOSPITAL DETAILS
 * ============================================================ */

function HospitalTab() {
  const settings = hospitalStore.useStore();
  const [draft, setDraft] = useState<HospitalSettings>(settings);
  const [saved, setSaved] = useState(false);

  useMemo(() => {
    setDraft(settings);
  }, [settings]);

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (max 10MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((p) => ({ ...p, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        hospitalStore.set(draft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-5 max-w-2xl"
    >
      <Field label="Hospital Name" required>
        <input className="input-base" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </Field>
      <Field label="Hospital Address">
        <textarea className="input-base min-h-[80px]" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
      </Field>
      <Field label="Hospital Logo" hint="PNG / JPG / JPEG · max 10 MB">
        <div className="border-2 border-dashed border-[var(--border-strong)] rounded-lg p-6 text-center">
          {draft.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.logo} alt="Logo" className="mx-auto max-h-24 mb-3" />
          ) : (
            <div className="text-3xl text-[var(--border-strong)] mb-2">⬆</div>
          )}
          <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleLogo} className="hidden" />
          <label htmlFor="logo-upload" className="btn-secondary !text-xs cursor-pointer inline-block">
            {draft.logo ? "Replace logo" : "Browse"}
          </label>
          {draft.logo && (
            <button type="button" onClick={() => setDraft({ ...draft, logo: "" })} className="ml-2 text-xs text-[var(--muted)] hover:underline">
              Remove
            </button>
          )}
        </div>
      </Field>
      <div className="flex gap-2 justify-end items-center">
        {saved && <span className="text-xs text-[var(--success)] font-semibold">Saved ✓</span>}
        <button type="button" onClick={() => setDraft(settings)} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

/* ============================================================
 * WORKING HOURS
 * ============================================================ */

function HoursTab() {
  const settings = hospitalStore.useStore();
  const wh = settings.workingHours;
  const [saved, setSaved] = useState(false);

  const update = (patch: Partial<HospitalSettings["workingHours"]>) => {
    hospitalStore.set({ ...settings, workingHours: { ...wh, ...patch } });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {saved && (
        <div className="text-xs text-[var(--success)] font-semibold">Saved ✓</div>
      )}
      <div>
        <h3 className="text-sm font-semibold mb-3">Monday — Friday (08:00 - 20:00)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShiftEditor
            title="Morning Shift"
            start={wh.weekdayMorningStart}
            breakAt={wh.weekdayMorningBreak}
            end="14:00"
            onStartChange={(v) => update({ weekdayMorningStart: v })}
            onBreakChange={(v) => update({ weekdayMorningBreak: v })}
          />
          <ShiftEditor
            title="Afternoon Shift"
            start={wh.weekdayAfternoonStart}
            breakAt={wh.weekdayAfternoonBreak}
            end={wh.weekdayEnd}
            onStartChange={(v) => update({ weekdayAfternoonStart: v })}
            onBreakChange={(v) => update({ weekdayAfternoonBreak: v })}
            onEndChange={(v) => update({ weekdayEnd: v })}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Saturday (09:00 - 17:00)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ShiftEditor
            title="Morning Shift"
            start={wh.saturdayStart}
            breakAt={wh.saturdayBreak}
            end="13:00"
            onStartChange={(v) => update({ saturdayStart: v })}
            onBreakChange={(v) => update({ saturdayBreak: v })}
          />
          <ShiftEditor
            title="Afternoon Shift"
            start="13:00"
            breakAt="—"
            end={wh.saturdayEnd}
            onEndChange={(v) => update({ saturdayEnd: v })}
          />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3">Sunday</h3>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted-foreground)]">
          Off Day — no scheduled OR operations
        </div>
      </div>
    </div>
  );
}

function ShiftEditor({
  title,
  start,
  breakAt,
  end,
  onStartChange,
  onBreakChange,
  onEndChange,
}: {
  title: string;
  start: string;
  breakAt: string;
  end: string;
  onStartChange?: (v: string) => void;
  onBreakChange?: (v: string) => void;
  onEndChange?: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] p-4">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Slot label="Start" value={start} onChange={onStartChange} />
        <Slot label="Break" value={breakAt} onChange={onBreakChange} />
        <Slot label="End" value={end} onChange={onEndChange} />
      </div>
    </div>
  );
}

function Slot({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase text-[var(--muted)] font-semibold">{label}</div>
      {onChange ? (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-base !py-1 !px-2 !text-xs font-mono mt-0.5"
        />
      ) : (
        <div className="font-mono tabular-nums mt-1">{value}</div>
      )}
    </div>
  );
}
