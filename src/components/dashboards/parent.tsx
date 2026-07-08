import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { fmtDate, gpa, inr, pct } from "@/lib/format";
import { Card, CardHeader, EmptyState, Progress, Stat, StatusBadge } from "@/components/ui";

export async function ParentDashboard({ session }: { session: Session }) {
  const links = await db.guardianship.findMany({
    where: { guardianId: session.sub },
    include: { student: { include: { user: true, program: true } } },
  });

  if (!links.length) {
    return <EmptyState icon="users" title="No linked students" hint="Contact the university office to link your ward's account." />;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome, {session.name}</h1>
        <p className="mt-1 text-sm text-muted">A consent-scoped view of your ward's academics and fees.</p>
      </div>

      {await Promise.all(
        links.map(async ({ student, relationship }) => {
          const [records, results, invoices, outpasses] = await Promise.all([
            db.attendanceRecord.findMany({ where: { studentId: student.id } }),
            db.result.findMany({ where: { studentId: student.id, status: "published" } }),
            db.invoice.findMany({ where: { studentId: student.id } }),
            db.outpass.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 3 }),
          ]);
          const present = records.filter((r) => r.status === "present" || r.status === "late").length;
          const att = pct(present, records.length);
          const due = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
          const cgpa = gpa(results);

          return (
            <section key={student.id} className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-display text-xl font-semibold tracking-tight">{student.user.name}</h2>
                <span className="text-[13px] text-muted">
                  {student.rollNo} · {student.program.name} · Semester {student.semester} · your {relationship.toLowerCase() === "father" ? "child" : "ward"}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Attendance"
                  value={`${att}%`}
                  icon="check"
                  tone={att >= 75 ? "success" : "danger"}
                  hint={
                    <div className="space-y-1.5">
                      <Progress value={att} tone={att >= 75 ? "success" : "danger"} />
                      <span>{att >= 75 ? "Comfortably above the 75% requirement" : "Below the 75% requirement — please follow up"}</span>
                    </div>
                  }
                />
                <Stat label="CGPA" value={cgpa.toFixed(2)} icon="award" hint={`${results.length} published results`} />
                <Stat label="Fees outstanding" value={inr(due)} icon="card" tone={due > 0 ? "warning" : "success"} hint={due > 0 ? "Payable from the student's portal or the accounts office" : "Fully paid"} />
              </div>
              <Card>
                <CardHeader title="Recent hostel outpasses" sub="Consent-based visibility" />
                {outpasses.length === 0 ? (
                  <EmptyState icon="building" title="No outpasses" hint="Outpass requests will appear here." />
                ) : (
                  <ul className="divide-y divide-line">
                    {outpasses.map((o) => (
                      <li key={o.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium">{o.reason}</p>
                          <p className="text-[12.5px] text-muted">
                            {fmtDate(o.outAt)} → {fmtDate(o.expectedInAt)}
                          </p>
                        </div>
                        <StatusBadge status={o.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          );
        })
      )}
    </div>
  );
}
