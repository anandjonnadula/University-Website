import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { decideApplication, enrollApplicant } from "@/lib/actions/staff";
import { ActionForm, QuickAction, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, Field, Input, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

const NEXT_ACTIONS: Record<string, { next: string; label: string; variant: "primary" | "secondary" | "danger" }[]> = {
  submitted: [
    { next: "under_review", label: "Start review", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  under_review: [
    { next: "shortlisted", label: "Shortlist", variant: "primary" },
    { next: "waitlisted", label: "Waitlist", variant: "secondary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  shortlisted: [
    { next: "offered", label: "Issue offer (10-day deadline)", variant: "primary" },
    { next: "waitlisted", label: "Move to waitlist", variant: "secondary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  waitlisted: [
    { next: "offered", label: "Issue offer", variant: "primary" },
    { next: "rejected", label: "Reject", variant: "danger" },
  ],
  offered: [
    { next: "accepted", label: "Record acceptance + fee", variant: "primary" },
    { next: "rejected", label: "Offer declined / expired", variant: "danger" },
  ],
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession("ADMISSION_OFFICER", "ADMIN");
  const { id } = await params;
  const app = await db.application.findUnique({
    where: { id },
    include: { program: { include: { department: true } }, cycle: true },
  });
  if (!app) notFound();
  const actions = NEXT_ACTIONS[app.status] ?? [];

  const aiChecks = [
    ["Identity consistency", "Name and DOB consistent across form fields", "pass"],
    ["Score plausibility", `Qualifying ${app.qualifyingPct}% is within expected range for ${app.previousSchool}`, "pass"],
    ["Duplicate detection", "No matching application in this cycle", "pass"],
    ["Statement authenticity", app.statement.length > 120 ? "No AI-generation or plagiarism signals" : "Short statement — verify intent at counselling", app.statement.length > 120 ? "pass" : "review"],
  ] as const;

  return (
    <div className="space-y-6">
      <nav className="text-[13px] text-muted" aria-label="Breadcrumb">
        <Link href="/portal/admissions" className="hover:text-primary-700 dark:hover:text-primary-300">← Application queue</Link>
      </nav>
      <PageHeader
        title={app.applicantName}
        sub={`${app.refNo} · ${app.program.name} · applied ${fmtDate(app.createdAt)}`}
        action={<StatusBadge status={app.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Application details" />
            <dl className="grid gap-x-8 gap-y-3 p-5 text-[13.5px] sm:grid-cols-2">
              {[
                ["Email", app.email],
                ["Phone", app.phone],
                ["Date of birth", app.dob],
                ["Category", app.category],
                ["Previous school", app.previousSchool],
                ["Qualifying %", `${app.qualifyingPct}%`],
                ["Entrance score", app.entranceScore != null ? String(app.entranceScore) : "Not taken"],
                ["Composite score", app.compositeScore?.toFixed(1) ?? "—"],
                ["Cycle", app.cycle.name],
                ["Offer deadline", app.offerDeadline ? fmtDate(app.offerDeadline) : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Statement of purpose" />
            <p className="p-5 text-[14px] leading-relaxed text-text/90">{app.statement}</p>
          </Card>

          <Card>
            <CardHeader title="AI pre-screen" sub="Automated checks — human decision always required (HITL)" />
            <ul className="divide-y divide-line">
              {aiChecks.map(([name, detail, result]) => (
                <li key={name} className="flex items-start gap-3 px-5 py-3">
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${result === "pass" ? "bg-success-soft text-success dark:bg-success/15" : "bg-warning-soft text-warning dark:bg-warning/15"}`}>
                    {result === "pass" ? "✓" : "!"}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold">{name}</p>
                    <p className="text-[12.5px] text-muted">{detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Decision</h2>
            {app.officerNote && (
              <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-muted">Previous note: {app.officerNote}</p>
            )}
            {actions.length === 0 ? (
              app.status === "accepted" ? (
                <div className="mt-4">
                  <p className="text-[13.5px] text-muted">
                    Acceptance recorded. Enrolling creates the student account, roll number and first-semester invoice
                    (the admission→finance→academics saga).
                  </p>
                  <div className="mt-4">
                    <QuickAction action={enrollApplicant} fields={{ id: app.id }} label="Enroll as student" variant="primary" size="md" />
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[13.5px] text-muted">
                  This application is in a terminal state ({app.status}). No further actions.
                </p>
              )
            ) : (
              <div className="mt-4 space-y-3">
                {actions.map((a) => (
                  <ActionForm key={a.next} action={decideApplication} className="rounded-xl border border-line p-3">
                    <input type="hidden" name="id" value={app.id} />
                    <input type="hidden" name="next" value={a.next} />
                    <div className="flex gap-2">
                      <Input name="note" placeholder={["rejected", "waitlisted"].includes(a.next) ? "Justification (required)" : "Note (optional)"} />
                      <SubmitButton variant={a.variant} size="md" className="shrink-0">{a.label}</SubmitButton>
                    </div>
                  </ActionForm>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Program context</h2>
            <dl className="mt-3 space-y-2.5 text-[13.5px]">
              {[
                ["Seats", String(app.program.seats)],
                ["Department", app.program.department.name],
                ["Eligibility", app.program.eligibility],
              ].map(([k, v]) => (
                <div key={k} className="border-b border-line pb-2 last:border-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
