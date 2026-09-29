/** Asia/Kuala_Lumpur (UTC+8). Stored timestamps are UTC ISO strings. */

const KL_OFFSET_MS = 8 * 60 * 60 * 1000;

const MONTHS_MS = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogo",
  "September",
  "Oktober",
  "November",
  "Disember",
];

export function getNowUtc(): Date {
  const demo = process.env.DEMO_AS_OF_DATE;
  if (demo) {
    const [y, m, d] = demo.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 2, 15, 0));
  }
  return new Date();
}

export function toKlParts(date: Date) {
  const kl = new Date(date.getTime() + KL_OFFSET_MS);
  return {
    year: kl.getUTCFullYear(),
    month: kl.getUTCMonth() + 1,
    day: kl.getUTCDate(),
    hour: kl.getUTCHours(),
    minute: kl.getUTCMinutes(),
  };
}

export function formatDateTimeKl(isoUtc: string | Date): string {
  const date = typeof isoUtc === "string" ? new Date(isoUtc) : isoUtc;
  const p = toKlParts(date);
  const hour12 = p.hour % 12 || 12;
  const ampm = p.hour >= 12 ? "PM" : "AM";
  const mm = String(p.minute).padStart(2, "0");
  return `${p.day} ${MONTHS_MS[p.month - 1]} ${p.year}, ${hour12}:${mm} ${ampm}`;
}

export function formatDateKl(isoOrYmd: string | Date): string {
  if (typeof isoOrYmd === "string" && /^\d{4}-\d{2}-\d{2}$/.test(isoOrYmd)) {
    const [y, m, d] = isoOrYmd.split("-").map(Number);
    return `${d} ${MONTHS_MS[m - 1]} ${y}`;
  }
  const date = typeof isoOrYmd === "string" ? new Date(isoOrYmd) : isoOrYmd;
  const p = toKlParts(date);
  return `${p.day} ${MONTHS_MS[p.month - 1]} ${p.year}`;
}

export function formatMonthShort(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return `${MONTHS_MS[m - 1].slice(0, 3)} ${y}`;
}

export function ymdFromKl(date: Date): string {
  const p = toKlParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function yearMonthFromYmd(ymd: string): string {
  return ymd.slice(0, 7);
}

export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function monthStart(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

export function addMonths(yearMonth: string, delta: number): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nowUtcIso(date = getNowUtc()): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function formatRm(amount: number): string {
  const formatted = new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `RM ${formatted}`;
}

export function formatPercent(value: number | null): string {
  if (value === null) {
    return "N/A";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
