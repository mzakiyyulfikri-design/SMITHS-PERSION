"use client";

import { hospitalStore } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/application", label: "Application", icon: "✚" },
  { href: "/schedule", label: "Surgery Schedule", icon: "▤" },
  { href: "/action", label: "Surgery Action", icon: "▶" },
  { href: "/history", label: "Surgical History", icon: "◷" },
  { href: "/configuration", label: "Configuration", icon: "⚙" },
];

export function Sidebar() {
  const pathname = usePathname();
  const hospital = hospitalStore.useStore();
  return (
    <aside className="w-64 shrink-0 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col">
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)] text-white grid place-items-center font-bold overflow-hidden">
            {hospital.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hospital.logo} alt={hospital.name} className="w-full h-full object-cover" />
            ) : (
              "S"
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight truncate" title={hospital.name}>
              {hospital.name || "SMITHS"}
            </div>
            <div className="text-[11px] text-[var(--muted)] tracking-wider">
              PERSION
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-2.5 space-y-0.5">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              <span
                className={`text-base ${active ? "text-[var(--primary)]" : ""}`}
              >
                {it.icon}
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]"
        >
          <span>↩</span> Log out
        </Link>
      </div>
    </aside>
  );
}
