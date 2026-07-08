import Link from "next/link";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { fmtTimeMin, pct } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, Stat } from "@/components/ui";

export async function FacultyDashboard({ session }: { session: Session }) {
  const profile = await db.facultyProfile.findUnique({
    where: { userId: session.sub },
    include: { department: true },
  });
  if (!profile) return null;

  const sections = await db.section.findMany({
    where: { facultyId: profile.id },
    include: {
      course: true,
      slots: true,
      enrollments: { where: { status: "registered" } },
      assignments: { include: { submissions: true } },
      sessions: { where: { status: "open" } },
    },
  });

  const totalStudents = sections.reduce((s, sec) => s + sec.enrollments.length, 0);
  const ungraded = sections.flatMap((s) => s.assignments).flatMap((a) => a.submissions).filter((s) => s.marks === null).length;
  const openSessions = sections.flatMap((s) => s.sessions);

  const today = new Date().getDay();
  const todaySlots = sections
    .flatMap((sec) => sec.slots.map((s) => ({ ...s, course: sec.course, sectionId: sec.id })))
    .filter((s) => s.dayOfWeek === today)
    .sort((a, b) => a.startMin - b.startMin);

  // attendance health per section
  const sectionHealth = await Promise.all(
    sections.map(async (sec) => {
      const recs = await db.attendanceRecord.findMany({ where: { session: { sectionId: sec.id } } });
      const present = recs.filter((r) => r.status === "present" || r.status === "late").length;
      return { sec, pct: pct(present, recs.length) };
    })
  );

  const pendingLeaves =
    session.role === "HOD"
      ? await db.leaveRequest.count({ where: { status: "pending" } })
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome, {session.name}</h1>
        <p className="mt-1 text-sm text-muted">{profile.designation} · {profile.department.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Sections this term" value={sections.length} icon="book" />
        <Stat label="Students taught" value={totalStudents} icon="users" />
        <Stat
          label="Ungraded submissions"
          value={ungraded}
          icon="inbox"
          tone={ungraded > 0 ? "warning" : "success"}
          hint={ungraded > 0 ? <Link href="/portal/teach" className="font-semibold text-primary-700 dark:text-primary-300">Grade now →</Link> : "All caught up"}
        />
        {session.role === "HOD" ? (
          <Stat
            label="Pending approvals"
            value={pendingLeaves}
            icon="check"
            tone={pendingLeaves > 0 ? "warning" : "success"}
            hint={pendingLeaves > 0 ? <Link href="/portal/approvals" className="font-semibold text-primary-700 dark:text-primary-300">Review →</Link> : "Queue clear"}
          />
        ) : (
          <Stat label="Open attendance sessions" value={openSessions.length} icon="qr" tone={openSessions.length ? "info" : "brand"} />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Today's teaching" sub={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />
          {todaySlots.length === 0 ? (
            <EmptyState icon="calendar" title="No classes scheduled today" />
          ) : (
            <ul className="divide-y divide-line">
              {todaySlots.map((s) => (
                <li key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-20 shrink-0 text-[13px] font-semibold text-primary-700 dark:text-primary-400">{fmtTimeMin(s.startMin)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{s.course.title}</p>
                    <p className="text-[12.5px] text-muted">{s.course.code} · {s.room}</p>
                  </div>
                  <Link href={`/portal/teach/${s.sectionId}`} className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Section attendance health" sub="Present % across all sessions this term" />
          {sectionHealth.length === 0 ? (
            <EmptyState icon="book" title="No sections assigned" />
          ) : (
            <ul className="divide-y divide-line">
              {sectionHealth.map(({ sec, pct: p }) => (
                <li key={sec.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{sec.course.code} — {sec.course.title}</p>
                    <p className="text-[12.5px] text-muted">{sec.enrollments.length} students · {sec.room}</p>
                  </div>
                  <Badge tone={p >= 80 ? "success" : p >= 70 ? "warning" : "danger"}>{p}%</Badge>
                  <Link href={`/portal/teach/${sec.id}`} className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                    Manage →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
