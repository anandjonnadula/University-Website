import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, gpa, relDays } from "@/lib/format";
import { applyToPosting } from "@/lib/actions/student";
import { QuickAction } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function StudentPlacementsPage() {
  const { student } = await getSessionStudent();
  const [postings, myApps, results] = await Promise.all([
    db.jobPosting.findMany({
      where: { status: "open", deadline: { gte: new Date() } },
      include: { company: true },
      orderBy: { deadline: "asc" },
    }),
    db.placementApplication.findMany({
      where: { studentId: student.id },
      include: { posting: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.result.findMany({ where: { studentId: student.id, status: "published" } }),
  ]);
  const cgpa = gpa(results);
  const appliedIds = new Set(myApps.map((a) => a.postingId));

  return (
    <div className="space-y-6">
      <PageHeader title="Placements" sub="Live drives, eligibility checks and your application pipeline" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your CGPA" value={cgpa.toFixed(2)} icon="award" hint="Used for eligibility checks" />
        <Stat label="Open postings" value={postings.length} icon="briefcase" />
        <Stat label="My applications" value={myApps.length} icon="inbox" />
      </div>

      {myApps.length > 0 && (
        <Card>
          <CardHeader title="My applications" />
          <ul className="divide-y divide-line">
            {myApps.map((a) => (
              <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{a.posting.title}</p>
                  <p className="text-[12.5px] text-muted">{a.posting.company.name} · {a.posting.ctcLakhs} LPA · {a.posting.location}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="Open drives" sub="Apply before the deadline — eligibility is enforced automatically" />
        {postings.length === 0 ? (
          <EmptyState icon="briefcase" title="No open postings" hint="New drives are announced by the placement cell — you'll be notified." />
        ) : (
          <ul className="divide-y divide-line">
            {postings.map((p) => {
              const eligible = cgpa >= p.minCgpa;
              const applied = appliedIds.has(p.id);
              return (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-semibold">{p.title}</p>
                        <Badge tone={p.type === "internship" ? "info" : "brand"}>{p.type}</Badge>
                      </div>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {p.company.name} · {p.company.sector} · {p.location}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted">{p.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-muted">
                        <span className="font-semibold text-text">₹{p.ctcLakhs} LPA</span>
                        <span>Min CGPA {p.minCgpa.toFixed(1)}</span>
                        <span className="flex items-center gap-1"><Icon name="clock" className="size-3.5" />Closes {fmtDate(p.deadline)} ({relDays(p.deadline)})</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {applied ? (
                        <Badge tone="success">Applied ✓</Badge>
                      ) : eligible ? (
                        <QuickAction action={applyToPosting} fields={{ postingId: p.id }} label="Apply now" variant="primary" size="md" />
                      ) : (
                        <Badge tone="danger">CGPA below {p.minCgpa.toFixed(1)}</Badge>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
