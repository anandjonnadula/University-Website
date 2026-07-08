import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, titleCase } from "@/lib/format";
import { createPosting, updatePlacementStatus } from "@/lib/actions/staff";
import { ActionForm, QuickAction, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Stat, StatusBadge, Textarea } from "@/components/ui";

export const dynamic = "force-dynamic";

const NEXT_STAGE: Record<string, string[]> = {
  applied: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["accepted", "rejected"],
};

export default async function PlacementAdminPage() {
  await requireSession("PLACEMENT_OFFICER");
  const [companies, postings, applications] = await Promise.all([
    db.company.findMany({ orderBy: { name: "asc" } }),
    db.jobPosting.findMany({ include: { company: true, _count: { select: { applications: true } } }, orderBy: { deadline: "asc" } }),
    db.placementApplication.findMany({
      include: { student: { include: { user: true } }, posting: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const offers = applications.filter((a) => ["offered", "accepted"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Drives & pipeline" sub="Postings, applications and stage management" />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Partner companies" value={companies.length} icon="building" />
        <Stat label="Open postings" value={postings.filter((p) => p.status === "open").length} icon="briefcase" />
        <Stat label="Applications" value={applications.length} icon="inbox" />
        <Stat label="Offers made" value={offers} icon="award" tone="success" />
      </div>

      <Card>
        <CardHeader title="Publish a new posting" sub="Students meeting the CGPA bar are notified automatically" />
        <div className="p-6">
          <ActionForm action={createPosting} className="grid gap-4 sm:grid-cols-3">
            <Field label="Company">
              <Select name="companyId" required defaultValue="">
                <option value="" disabled>Select…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Role title">
              <Input name="title" required placeholder="e.g. SDE-1" />
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue="job">
                <option value="job">Full-time</option>
                <option value="internship">Internship</option>
              </Select>
            </Field>
            <Field label="CTC (LPA)">
              <Input name="ctcLakhs" type="number" step="0.1" min={0.5} required placeholder="e.g. 12" />
            </Field>
            <Field label="Min CGPA">
              <Input name="minCgpa" type="number" step="0.1" min={0} max={10} defaultValue={6.5} required />
            </Field>
            <Field label="Deadline">
              <Input name="deadline" type="date" required />
            </Field>
            <Field label="Location">
              <Input name="location" required placeholder="e.g. Bengaluru" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea name="description" rows={2} required placeholder="Role, rounds, expectations…" />
              </Field>
            </div>
            <div className="sm:col-span-3">
              <SubmitButton>Publish & notify students</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card>
        <CardHeader title="Application pipeline" sub="Advance candidates stage by stage — every move notifies the student" />
        {applications.length === 0 ? (
          <EmptyState icon="inbox" title="No applications yet" />
        ) : (
          <ul className="divide-y divide-line">
            {applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {a.student.user.name} <span className="font-normal text-muted">· {a.student.rollNo}</span>
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {a.posting.title} @ {a.posting.company.name} · ₹{a.posting.ctcLakhs} LPA
                  </p>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex gap-2">
                  {(NEXT_STAGE[a.status] ?? []).map((next) => (
                    <QuickAction
                      key={next}
                      action={updatePlacementStatus}
                      fields={{ id: a.id, status: next }}
                      label={`→ ${titleCase(next)}`}
                      variant={next === "rejected" ? "secondary" : "primary"}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="All postings" />
        <ul className="divide-y divide-line">
          {postings.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{p.title} <span className="text-muted">@ {p.company.name}</span></p>
                <p className="text-[12.5px] text-muted">
                  ₹{p.ctcLakhs} LPA · min CGPA {p.minCgpa.toFixed(1)} · closes {fmtDate(p.deadline)} · {p._count.applications} applicants
                </p>
              </div>
              <Badge tone={p.deadline < new Date() ? "neutral" : "success"}>{p.deadline < new Date() ? "Closed" : "Open"}</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
