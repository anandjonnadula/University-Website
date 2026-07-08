export function inr(minor: number): string {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(minor / 100));
}

export function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(d: Date | string): string {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

export function fmtTimeMin(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function relDays(d: Date | string): string {
  const diff = Math.round((new Date(d).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export function initials(name: string): string {
  return name
    .replace(/^(Dr|Prof|Mr|Ms|Mrs)\.?\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function pct(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 1000) / 10;
}

/** Marks (out of 100) → [grade, gradePoints] on the 10-point scale. */
export function gradeFor(marks: number): [string, number] {
  if (marks >= 90) return ["O", 10];
  if (marks >= 80) return ["A+", 9];
  if (marks >= 70) return ["A", 8];
  if (marks >= 60) return ["B+", 7];
  if (marks >= 50) return ["B", 6];
  if (marks >= 40) return ["C", 5];
  return ["F", 0];
}

export function gpa(results: { gradePoints: number; credits: number }[]): number {
  const cr = results.reduce((s, r) => s + r.credits, 0);
  if (!cr) return 0;
  return Math.round((results.reduce((s, r) => s + r.gradePoints * r.credits, 0) / cr) * 100) / 100;
}

const STATUS_TONES: Record<string, string> = {
  // generic
  active: "success", open: "info", closed: "neutral", pending: "warning",
  approved: "success", rejected: "danger", resolved: "success", in_progress: "info",
  // finance
  paid: "success", partial: "warning", overdue: "danger",
  // admissions
  submitted: "info", under_review: "warning", shortlisted: "info", offered: "brand",
  accepted: "success", waitlisted: "warning", enrolled: "success",
  // results
  provisional: "warning", moderated: "info", published: "success",
  // attendance
  present: "success", absent: "danger", late: "warning", excused: "neutral",
  // placement
  applied: "info", interview: "warning", registered: "info", completed: "success", dropped: "neutral",
  new: "info", scheduled: "info",
};

export function statusTone(status: string): string {
  return STATUS_TONES[status] ?? "neutral";
}

export function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
