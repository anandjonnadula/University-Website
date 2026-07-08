import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { raiseComplaint, requestLeave } from "@/lib/actions/student";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const session = await requireSession();
  const [leaves, complaints] = await Promise.all([
    db.leaveRequest.findMany({ where: { userId: session.sub }, orderBy: { createdAt: "desc" } }),
    db.complaint.findMany({ where: { raisedById: session.sub }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Requests & grievances" sub="Leave applications and complaint tracking with a 48-hour resolution SLA" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Apply for leave</h2>
          <ActionForm action={requestLeave} className="mt-4 space-y-3">
            <Field label="Type">
              <Select name="type" defaultValue="casual">
                <option value="casual">Casual</option>
                <option value="medical">Medical</option>
                <option value="duty">On duty (event / conference)</option>
                <option value="academic">Academic</option>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Input name="fromDate" type="date" required />
              </Field>
              <Field label="To">
                <Input name="toDate" type="date" required />
              </Field>
            </div>
            <Field label="Reason">
              <Textarea name="reason" rows={2} required placeholder="Brief reason for leave" />
            </Field>
            <SubmitButton>Submit leave request</SubmitButton>
          </ActionForm>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Raise a complaint</h2>
          <p className="mt-1 text-[12.5px] text-muted">Anonymous complaints are supported. Anti-ragging reports are treated with the highest priority.</p>
          <ActionForm action={raiseComplaint} className="mt-4 space-y-3">
            <Field label="Category">
              <Select name="category" defaultValue="Infrastructure">
                {["Infrastructure", "Hostel", "Academics", "Cafeteria", "Transport", "Safety / Anti-ragging", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input name="title" required placeholder="Short summary" />
            </Field>
            <Field label="Description">
              <Textarea name="description" rows={3} required placeholder="What happened, where, and since when?" />
            </Field>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" name="anonymous" className="size-4 rounded accent-[#d15c46]" />
              Submit anonymously
            </label>
            <SubmitButton>File complaint</SubmitButton>
          </ActionForm>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My leave requests" />
          {leaves.length === 0 ? (
            <EmptyState icon="calendar" title="No leave requests" />
          ) : (
            <ul className="divide-y divide-line">
              {leaves.map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium capitalize">{l.type} leave</p>
                    <p className="text-[12.5px] text-muted">
                      {fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · {l.reason}
                    </p>
                    {l.decidedBy && <p className="text-[12px] text-muted">Decided by {l.decidedBy}</p>}
                  </div>
                  <StatusBadge status={l.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="My complaints" />
          {complaints.length === 0 ? (
            <EmptyState icon="inbox" title="No complaints filed" />
          ) : (
            <ul className="divide-y divide-line">
              {complaints.map((c) => (
                <li key={c.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">
                        <span className="font-mono text-[12px] text-muted">{c.refNo}</span> · {c.title}
                      </p>
                      <p className="text-[12.5px] text-muted">{c.category} · filed {fmtDate(c.createdAt)}{c.anonymous ? " · anonymous" : ""}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                  {c.resolution && (
                    <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-[12.5px] text-success dark:bg-success/15 dark:text-emerald-300">
                      Resolution: {c.resolution}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
