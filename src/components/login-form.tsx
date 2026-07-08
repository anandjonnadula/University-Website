"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { SubmitButton } from "./action-form";
import { Field, Input } from "./ui";

const demoAccounts: [string, string, string][] = [
  ["Student", "student@aurora.edu", "Rahul Verma · B.Tech CSE, Sem 5"],
  ["Faculty", "faculty@aurora.edu", "Dr. Ananya Iyer · teaches DBMS"],
  ["HOD", "hod@aurora.edu", "Prof. Vikram Rao · CSE department"],
  ["Parent", "parent@aurora.edu", "Suresh Verma · Rahul's father"],
  ["Admissions", "admissions@aurora.edu", "Arjun Nair · application pipeline"],
  ["Exam Cell", "exams@aurora.edu", "Dr. Suresh Menon · results & schedules"],
  ["Accounts", "accounts@aurora.edu", "Kavitha Iyer · fees & payments"],
  ["Librarian", "librarian@aurora.edu", "Lakshmi Pillai · circulation desk"],
  ["Warden", "warden@aurora.edu", "Rajesh Kumar · hostels & outpasses"],
  ["Placement", "placement@aurora.edu", "Divya Sharma · drives & pipeline"],
  ["Principal", "principal@aurora.edu", "Dr. Meera Krishnan · analytics"],
  ["Admin", "admin@aurora.edu", "Priya Raman · users, CMS, audit"],
];

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div>
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div role="alert" className="animate-fade rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-[13px] font-medium text-danger dark:bg-danger/15 dark:text-red-300">
            {state.error}
          </div>
        )}
        <Field label="Email">
          <Input
            name="email"
            type="email"
            required
            placeholder="you@aurora.edu"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <SubmitButton size="lg" className="w-full">Sign in</SubmitButton>
      </form>

      <div className="mt-8">
        <p className="text-center text-[12px] font-bold uppercase tracking-[0.15em] text-muted">
          Demo accounts — password <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">demo1234</code>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {demoAccounts.map(([role, mail, hint]) => (
            <button
              key={mail}
              type="button"
              title={hint}
              onClick={() => {
                setEmail(mail);
                setPassword("demo1234");
              }}
              className={`rounded-xl border px-3 py-2 text-left text-[12.5px] font-medium transition-colors ${
                email === mail
                  ? "border-primary-500 bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-200"
                  : "border-line bg-surface text-muted hover:border-primary-300 hover:text-text"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[12px] text-muted">Pick a role to pre-fill, then sign in.</p>
      </div>
    </div>
  );
}
