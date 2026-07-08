import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { inr, pct, titleCase } from "@/lib/format";
import { Card, CardHeader, PageHeader, Stat } from "@/components/ui";
import { BarChart, Donut, HBarList } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireSession("PRINCIPAL", "ADMIN");

  const [students, applications, invoices, records, complaints, placementApps, programs] = await Promise.all([
    db.student.findMany({ include: { program: true } }),
    db.application.findMany({ include: { program: true } }),
    db.invoice.findMany(),
    db.attendanceRecord.findMany(),
    db.complaint.findMany(),
    db.placementApplication.findMany(),
    db.program.findMany(),
  ]);

  const collected = invoices.reduce((s, i) => s + i.paidMinor, 0);
  const outstanding = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
  const present = records.filter((r) => r.status === "present" || r.status === "late").length;
  const attendance = pct(present, records.length);
  const openGrievances = complaints.filter((c) => ["open", "in_progress"].includes(c.status)).length;

  // applications per program (top 6)
  const appsByProgram = new Map<string, number>();
  for (const a of applications) appsByProgram.set(a.program.slug, (appsByProgram.get(a.program.slug) ?? 0) + 1);
  const appBars = programs
    .map((p) => ({ label: p.slug.replace("btech-", "").replace("-", " ").toUpperCase().slice(0, 8), value: appsByProgram.get(p.slug) ?? 0, tooltip: `${p.name}: ${appsByProgram.get(p.slug) ?? 0} applications` }))
    .filter((b) => b.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // admission funnel
  const funnelOrder = ["submitted", "under_review", "shortlisted", "offered", "accepted", "enrolled"];
  const funnel = funnelOrder.map((s) => ({ label: titleCase(s), value: applications.filter((a) => a.status === s).length }));

  // students per program
  const studentsByProgram = new Map<string, number>();
  for (const s of students) studentsByProgram.set(s.program.name, (studentsByProgram.get(s.program.name) ?? 0) + 1);

  // placement pipeline
  const stages = ["applied", "shortlisted", "interview", "offered", "accepted"];
  const pipeline = stages.map((s) => ({ label: titleCase(s), value: placementApps.filter((a) => a.status === s).length }));

  return (
    <div className="space-y-6">
      <PageHeader title="Institution analytics" sub="Live KPIs across admissions, finance, academics and placements" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Enrolled students" value={students.length} icon="users" />
        <Stat label="Avg attendance" value={`${attendance}%`} icon="check" tone={attendance >= 75 ? "success" : "warning"} />
        <Stat label="Fees collected" value={inr(collected)} icon="card" tone="success" hint={`${inr(outstanding)} outstanding`} />
        <Stat label="Open grievances" value={openGrievances} icon="warn" tone={openGrievances ? "warning" : "success"} hint="48-hour SLA" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Applications by program" sub={`${applications.length} total — 2026–27 cycle`} />
          <div className="p-6">
            <BarChart data={appBars} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Admission funnel" sub="Submitted → enrolled conversion" />
          <div className="p-6">
            <HBarList data={funnel} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Students by program" />
          <div className="p-6">
            <Donut
              data={[...studentsByProgram.entries()].map(([label, value]) => ({ label: label.replace("B.Tech ", "").replace("Bachelor of ", ""), value }))}
              centerValue={String(students.length)}
              centerLabel="students"
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Placement pipeline" sub="Current season, all drives" />
          <div className="p-6">
            <HBarList data={pipeline} />
          </div>
        </Card>
      </div>
    </div>
  );
}
