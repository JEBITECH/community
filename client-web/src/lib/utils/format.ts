import type { Decimal } from "@/lib/api/types";

/** Coerces a TypeORM decimal (string on the wire) to a number. */
export function toNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: Decimal | null | undefined): string {
  return inr.format(toNumber(value));
}

/** Compact form for stat tiles: ₹42K, ₹1.2L. */
export function formatMoneyCompact(value: Decimal | null | undefined): string {
  const n = toNumber(value);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return inr.format(n);
}

/**
 * Parses a `date` column ("YYYY-MM-DD") as LOCAL midnight.
 * `new Date("2026-09-20")` parses as UTC and can land on the previous day for
 * negative offsets, shifting every event by one day.
 */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date(value);
  return new Date(y, m - 1, d);
}

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const weekdayLong = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function formatDate(value: string): string {
  return dayMonth.format(parseDateOnly(value));
}

export function formatDateFull(value: string): string {
  return dayMonthYear.format(parseDateOnly(value));
}

export function formatDateWeekday(value: string): string {
  return weekdayLong.format(parseDateOnly(value));
}

/** "20 Sep 2026" or "20–25 Sep 2026" / "28 Sep – 2 Oct 2026" for a range. */
export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDateFull(start);

  const s = parseDateOnly(start);
  const e = parseDateOnly(end);

  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${dayMonthYear.format(e)}`;
  }
  return `${dayMonth.format(s)} – ${dayMonthYear.format(e)}`;
}

/** "HH:MM:SS" -> "7:30 PM". Returns "" for null so callers can concatenate. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const [hRaw, mRaw] = value.split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return value;

  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatTimeRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** Today as "YYYY-MM-DD" in local time (matches how `date` columns compare). */
export function todayISO(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Whole days from today; negative for past. */
export function daysFromToday(iso: string): number {
  const target = parseDateOnly(iso);
  const today = parseDateOnly(todayISO());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** "in 4 days", "today", "tomorrow", "3 days ago". */
export function describeWhen(iso: string): string {
  const delta = daysFromToday(iso);
  if (delta === 0) return "today";
  if (delta === 1) return "tomorrow";
  if (delta === -1) return "yesterday";
  if (delta > 0) return `in ${delta} days`;
  return `${Math.abs(delta)} days ago`;
}

export function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim().charAt(0);
  const b = (last ?? "").trim().charAt(0);
  return ((a + b) || a || "?").toUpperCase();
}

export function fullName(first?: string | null, last?: string | null): string {
  return [first, last].filter(Boolean).join(" ").trim() || "Member";
}

/** Turns snake_case enum values into "Sentence case" labels. */
export function humanize(value: string | null | undefined): string {
  if (!value) return "";
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
