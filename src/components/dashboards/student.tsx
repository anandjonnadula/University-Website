import Link from "next/link";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { fmtDate, fmtTimeMin, gpa, inr, pct, relDays } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, Progress, Stat } from "@/components/ui";
import { Icon } from "@/components/icons";

export async function StudentDashboard({ session }: { session: Session }) {
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: { program: true },
  });
  if (!student) return null;

  const [records, results, invoices, loans, enrollments, notifications] = await Promise.all([
    db.attendanceRecord.findMany({ where: { studentId: student.id } }),
    db.result.findMany({ where: { studentId: student.id, status: "published" } }),
    db.invoice.findMany({ where: { studentId: student.id } }),
    db.loan.findMany({ where: { borrowerId: session.sub, returnedAt: null }, include: { item: true } }),
    db.enrollment.findMany({
      where: { studentId: student.id, status: "registered" },
      include: { section: { include: { course: true, slots: true, assignments: { where: { dueAt: { gte: new Date() } } } } } },
    }),
    db.notification.findMany({ where: { userId: session.sub }, orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const present = records.filter((r) => r.status === "present" || r.status === "late").length;
  const attendancePct = pct(present, records.length);
  const cgpa = gpa(results);
  const due = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);

  const today = new Date().getDay();
  const todaySlots = enrollments
    .flatMap((e) => e.section.slots.map((s) => ({ ...s, course: e.section.course })))
    .filter((s) => s.dayOfWeek === today)
    .sort((a, b) => a.startMin - b.startMin);

  const deadlines = enrollments
    .flatMap((e) => e.section.assignments.map((a) => ({ ...a, course: e.section.course })))
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Hey {session.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          {student.rollNo} · {student.program.name} · Semester {student.semester}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Attendance"
          value={`${attendancePct}%`}
          icon="check"
          tone={attendancePct >= 75 ? "success" : "danger"}
          hint={
            <div className="space-y-1.5">
              <Progress value={attendancePct} tone={attendancePct >= 75 ? "success" : "danger"} />
              <span>{attendancePct >= 75 ? "Above the 75% threshold" : "Below 75% — exam eligibility at risk"}</span>
            </div>
          }
        />
        <Stat label="CGPA" value={cgpa.toFixed(2)} icon="award" hint={`${results.length} published course results`} />
        <Stat
          label="Fees due"
          value={inr(due)}
          icon="card"
          tone={due > 0 ? "warning" : "success"}
          hint={due > 0 ? <Link href="/portal/fees" className="font-semibold text-primary-700 dark:text-primary-300">Pay now →</Link> : "All cleared 🎉"}
        />
        <Stat label="Library books" value={loans.length} icon="library" hint={loans.some((l) => l.dueAt < new Date()) ? "One or more overdue!" : "None overdue"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Today's classes"
            sub={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            action={<Link href="/portal/timetable" className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">Full timetable →</Link>}
          />
          {todaySlots.length === 0 ? (
            <EmptyState icon="calendar" title="No classes today" hint="Enjoy the free day — or get ahead on assignments." />
          ) : (
            <ul className="divide-y divide-line">
              {todaySlots.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-20 shrink-0 text-[13px] font-semibold text-primary-700 dark:text-primary-400">
                    {fmtTimeMin(s.startMin)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{s.course.title}</p>
                    <p className="text-[12.5px] text-muted">{s.course.code} · {s.room}</p>
                  </div>
                  <Badge tone="neutral">{fmtTimeMin(s.endMin)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming deadlines"
            action={<Link href="/portal/courses" className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">My courses →</Link>}
          />
          {deadlines.length === 0 ? (
            <EmptyState icon="check" title="Nothing due" hint="No open assignments right now." />
          ) : (
            <ul className="divide-y divide-line">
              {deadlines.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning dark:bg-warning/15">
                    <Icon name="clock" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{a.title}</p>
                    <p className="text-[12.5px] text-muted">{a.course.code} · {a.maxMarks} marks</p>
                  </div>
                  <span className="shrink-0 text-[12.5px] font-semibold text-warning">{relDays(a.dueAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent updates"
          action={<Link href="/portal/notifications" className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">All notifications →</Link>}
        />
        {notifications.length === 0 ? (
          <EmptyState icon="bell" title="No notifications yet" />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link href={n.link ?? "/portal/notifications"} className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.readAt ? "bg-line" : "bg-primary-500"}`} />
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">{n.body}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[12px] text-muted">{fmtDate(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
