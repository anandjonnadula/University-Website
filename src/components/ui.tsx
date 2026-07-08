import Link from "next/link";
import { initials, statusTone, titleCase } from "@/lib/format";
import { Icon } from "./icons";

/* ---------- Buttons ---------- */
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
const btnVariants: Record<string, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
  secondary: "bg-surface border border-line text-text hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
  ghost: "text-muted hover:text-text hover:bg-surface-2",
  danger: "bg-danger text-white hover:opacity-90",
  soft: "bg-primary-50 text-primary-800 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-200 dark:hover:bg-primary-900",
};
const btnSizes: Record<string, string> = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-[15px] px-6 py-3",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  return <button className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: string;
  size?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}>
      {children}
    </Link>
  );
}

/* ---------- Card ---------- */
export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}>{children}</div>;
}

export function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h3 className="font-semibold text-[15px]">{title}</h3>
        {sub && <p className="mt-0.5 text-[13px] text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */
const tones: Record<string, string> = {
  success: "bg-success-soft text-success dark:bg-success/15 dark:text-emerald-300",
  warning: "bg-warning-soft text-warning dark:bg-warning/15 dark:text-amber-300",
  danger: "bg-danger-soft text-danger dark:bg-danger/15 dark:text-red-300",
  info: "bg-info-soft text-info dark:bg-info/15 dark:text-blue-300",
  brand: "bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300",
  neutral: "bg-surface-2 text-muted",
};

export function Badge({ tone = "neutral", children }: { tone?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tracking-wide ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{titleCase(status)}</Badge>;
}

/* ---------- Stat tile ---------- */
export function Stat({
  label,
  value,
  hint,
  icon,
  tone = "brand",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: string;
  tone?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium uppercase tracking-wider text-muted">{label}</p>
        {icon && (
          <span className={`grid size-9 place-items-center rounded-xl ${tones[tone] ?? tones.brand}`}>
            <Icon name={icon} className="size-[18px]" />
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      {hint && <div className="mt-2 text-[13px] text-muted">{hint}</div>}
    </Card>
  );
}

/* ---------- Table ---------- */
export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>;
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon = "inbox", title, hint, action }: { icon?: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-muted">
        <Icon name={icon} className="size-7" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-8 text-[11px]", md: "size-10 text-[13px]", lg: "size-14 text-lg" };
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300 ${sizes[size]}`}>
      {initials(name)}
    </span>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "success" | "warning" | "danger" }) {
  const colors = { brand: "bg-primary-500", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${colors[tone]} transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* ---------- Form primitives ---------- */
const fieldBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-text placeholder:text-muted/70 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldBase} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldBase} min-h-24 ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldBase} ${props.className ?? ""}`} />;
}
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

/* ---------- Section label ---------- */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
      <span className="h-px w-6 bg-primary-500" />
      {children}
    </p>
  );
}
