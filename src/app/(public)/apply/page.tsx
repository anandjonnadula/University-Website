import type { Metadata } from "next";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { submitApplication } from "@/lib/actions/public";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Eyebrow, Field, Input, Select, Textarea } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Apply",
  description: "Apply online to Aurora University for the 2026–27 academic year. Ten minutes, no documents needed upfront.",
};

export const dynamic = "force-dynamic";

const steps = [
  ["1. Apply online", "This form — about ten minutes. No documents needed yet."],
  ["2. Review & shortlist", "Our AI-assisted screening flags your file for officer review within 5 working days."],
  ["3. Offer & acceptance", "Shortlisted applicants get an offer with a 10-day acceptance window."],
  ["4. Pay & enroll", "Pay the first-semester fee to confirm your seat — then welcome week!"],
];

export default async function ApplyPage() {
  const [programs, cycle] = await Promise.all([
    db.program.findMany({ orderBy: { name: "asc" } }),
    db.admissionCycle.findFirst({ where: { isCurrent: true } }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <Eyebrow>Admissions {cycle?.name.split(" ").pop()}</Eyebrow>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Apply to Aurora</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            One application, every program. {cycle && (
              <>The current cycle closes on <span className="font-semibold text-text">{fmtDate(cycle.closesAt)}</span>.</>
            )}
          </p>
          <ol className="mt-10 space-y-6">
            {steps.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary-100 text-[13px] font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                  {t[0]}
                </span>
                <div>
                  <p className="font-semibold">{t.slice(3)}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Card className="mt-10 flex items-start gap-3 p-5">
            <Icon name="shield" className="mt-0.5 size-5 shrink-0 text-primary-600" />
            <p className="text-[13px] leading-relaxed text-muted">
              Your data is used only for admission processing under our privacy policy. Application fee: ₹1,200
              (waived for EWS category) — payable after shortlisting, not now.
            </p>
          </Card>
        </div>

        <Card className="p-7 sm:p-8">
          <h2 className="font-display text-xl font-semibold tracking-tight">Application form</h2>
          <p className="mt-1 text-[13px] text-muted">Fields marked * are required.</p>
          <ActionForm action={submitApplication} className="mt-6 space-y-4" resetOnSuccess>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name *">
                <Input name="name" required placeholder="As on your marksheet" autoComplete="name" />
              </Field>
              <Field label="Date of birth *">
                <Input name="dob" type="date" required />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email *">
                <Input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
              </Field>
              <Field label="Phone *">
                <Input name="phone" required placeholder="+91 …" autoComplete="tel" />
              </Field>
            </div>
            <Field label="Program applying for *">
              <Select name="programId" required defaultValue="">
                <option value="" disabled>Choose a program…</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.level})</option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="School / previous institution *">
                <Input name="previousSchool" required placeholder="Name of school or college" />
              </Field>
              <Field label="Category">
                <Select name="category" defaultValue="General">
                  {["General", "OBC", "SC", "ST", "EWS", "PWD"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Qualifying exam percentage *" hint="10+2 or bachelor's aggregate (35–100)">
                <Input name="qualifyingPct" type="number" step="0.1" min={35} max={100} required placeholder="e.g. 87.5" />
              </Field>
              <Field label="Entrance score (optional)" hint="JEE/AUCET/CAT percentile, if taken">
                <Input name="entranceScore" type="number" step="0.1" min={0} max={100} placeholder="e.g. 91" />
              </Field>
            </div>
            <Field label="Statement of purpose *" hint="Why this program, and why Aurora? (min 40 characters)">
              <Textarea name="statement" required rows={5} placeholder="Tell us your story…" />
            </Field>
            <SubmitButton size="lg" className="w-full">
              Submit application <Icon name="arrow" className="size-4" />
            </SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
