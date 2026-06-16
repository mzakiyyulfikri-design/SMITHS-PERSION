export function Topbar({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-7 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-[var(--foreground)]">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="h-8 w-px bg-[var(--border)]" />
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center text-sm font-bold">
            ZH
          </div>
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold">Ziyadul Haq</div>
            <div className="text-[11px] text-[var(--muted)]">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
