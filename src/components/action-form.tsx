"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/actions/public";

/** Submit button that reflects pending state. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "soft" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const variants: Record<string, string> = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
    secondary: "bg-surface border border-line text-text hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
    ghost: "text-muted hover:text-text hover:bg-surface-2",
    danger: "bg-danger text-white hover:opacity-90",
    soft: "bg-primary-50 text-primary-800 hover:bg-primary-100 dark:bg-primary-950 dark:text-primary-200 dark:hover:bg-primary-900",
  };
  const sizes: Record<string, string> = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2", lg: "text-[15px] px-6 py-3" };
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:opacity-60 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {pending && (
        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
          <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

/** Form wrapper wired to a server action; shows inline error/success and resets on success. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = true,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {state?.error && (
        <div role="alert" className="mb-3 animate-fade rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger dark:bg-danger/15 dark:text-red-300">
          {state.error}
        </div>
      )}
      {state?.ok && state.message && (
        <div role="status" className="mb-3 animate-fade rounded-xl border border-success/30 bg-success-soft px-4 py-2.5 text-[13px] font-medium text-success dark:bg-success/15 dark:text-emerald-300">
          {state.message}
        </div>
      )}
      {children}
    </form>
  );
}

/** One-click action (approve / reject / etc.) with hidden fields. */
export function QuickAction({
  action,
  fields,
  label,
  variant = "secondary",
  size = "sm",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Record<string, string>;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "soft" | "ghost";
  size?: "sm" | "md";
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} size={size}>{label}</SubmitButton>
      {state?.error && <span className="max-w-52 text-[11px] font-medium text-danger">{state.error}</span>}
      {state?.ok && <span className="max-w-52 text-[11px] font-medium text-success">{state.message}</span>}
    </form>
  );
}
