/**
 * Deterministic date/time formatters — produce the same string on server and client,
 * avoiding locale-based hydration mismatches that toLocale*String causes.
 *
 * Format choice: DD/MM/YYYY (Indonesian convention).
 */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** "16/06/2026" */
export function formatDate(input: string | number | Date): string {
  const d = new Date(input);
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** "08:30" (24-hour, HH:mm) */
export function formatTime(input: string | number | Date): string {
  const d = new Date(input);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** "08:30:15" (24-hour, HH:mm:ss) */
export function formatTimeWithSeconds(input: string | number | Date): string {
  const d = new Date(input);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** "16/06/2026 08:30" */
export function formatDateTime(input: string | number | Date): string {
  return `${formatDate(input)} ${formatTime(input)}`;
}
