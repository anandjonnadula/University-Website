import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, pct } from "@/lib/format";
import { markAttendance } from "@/lib/actions/student";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, Input, PageHeader, Progress, StatusBadge, Table, Td } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const { student } = await getSessionStudent();
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id, status: "registered" },
    include: { section: { include: { course: true } } },
  });
  const records = await db.attendanceRecord.findMany({
    where: { studentId: student.id },
    include: { session: { include: { section: { include: { course: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const perCourse = enrollments.map((e) => {
    const recs = records.filter((r) => r.session.sectionId === e.sectionId);
    const present = recs.filter((r) => r.status === "present" || r.status === "late").length;
    return { course: e.section.course, present, total: recs.length, pct: pct(present, recs.length) };
  });
  const overallPresent = records.filter((r) => r.status === "present" || r.status === "late").length;
  const overall = pct(overallPresent, records.length);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" sub={`Overall ${overall}% this term — minimum 75% required for exam eligibility`} />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-[13px] font-medium text-muted">Overall attendance</p>
              <p className={`font-display text-2xl font-semibold ${overall >= 75 ? "text-success" : "text-danger"}`}>{overall}%</p>
            </div>
            <Progress value={overall} tone={overall >= 75 ? "success" : "danger"} />
            <p className="text-[12.5px] text-muted">
              {overall >= 75
                ? `You're ${(overall - 75).toFixed(1)} points above the threshold.`
                : `You need to attend consistently to get back above 75%.`}
            </p>
          </div>
          <div className="w-full max-w-xs rounded-2xl bg-surface-2 p-5 sm:w-72">
            <p className="flex items-center gap-2 text-[13px] font-semibold">
              <Icon name="qr" className="size-4 text-primary-600" /> Mark attendance
            </p>
            <p className="mt-1 text-[12px] text-muted">Enter the live session code shown in class.</p>
            <ActionForm action={markAttendance} className="mt-3 flex gap-2">
              <Input name="code" placeholder="e.g. CS7X2K" className="uppercase" required />
              <SubmitButton size="md">Mark</SubmitButton>
            </ActionForm>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {perCourse.map((c) => (
          <Card key={c.course.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-bold text-primary-700 dark:text-primary-400">{c.course.code}</p>
                <p className="mt-0.5 text-[14px] font-semibold leading-snug">{c.course.title}</p>
              </div>
              <Badge tone={c.pct >= 80 ? "success" : c.pct >= 75 ? "warning" : "danger"}>{c.pct}%</Badge>
            </div>
            <div className="mt-3">
              <Progress value={c.pct} tone={c.pct >= 80 ? "success" : c.pct >= 75 ? "warning" : "danger"} />
            </div>
            <p className="mt-2 text-[12.5px] text-muted">{c.present} of {c.total} classes attended</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Recent sessions" sub="Latest 15 attendance records" />
        <Table head={["Date", "Course", "Status", "Marked by"]}>
          {records.slice(0, 15).map((r) => (
            <tr key={r.id} className="hover:bg-surface-2">
              <Td className="whitespace-nowrap text-muted">{fmtDate(r.session.date)}</Td>
              <Td>
                <span className="font-medium">{r.session.section.course.code}</span>{" "}
                <span className="text-muted">{r.session.section.course.title}</span>
              </Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td className="text-muted">{r.markedBy === "self" ? "Self (QR)" : "Faculty"}{r.overrideReason ? ` · ${r.overrideReason}` : ""}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
