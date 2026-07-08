import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtTimeMin } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { seriesColor } from "@/components/charts";

export const dynamic = "force-dynamic";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function TimetablePage() {
  const { student } = await getSessionStudent();
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id, status: "registered" },
    include: { section: { include: { course: true, slots: true, faculty: { include: { user: true } } } } },
  });

  const courseIndex = new Map<string, number>();
  enrollments.forEach((e, i) => courseIndex.set(e.section.course.code, i));

  const byDay = DAYS.map((_, di) =>
    enrollments
      .flatMap((e) =>
        e.section.slots
          .filter((s) => s.dayOfWeek === di + 1)
          .map((s) => ({ ...s, course: e.section.course, faculty: e.section.faculty.user.name }))
      )
      .sort((a, b) => a.startMin - b.startMin)
  );

  const today = new Date().getDay();

  return (
    <div>
      <PageHeader title="Weekly timetable" sub={`${enrollments.length} registered courses · Monsoon 2026`} />
      <div className="grid gap-4 lg:grid-cols-5">
        {DAYS.map((day, di) => (
          <Card key={day} className={`p-4 ${today === di + 1 ? "ring-2 ring-primary-500/60" : ""}`}>
            <p className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider text-muted">
              {day}
              {today === di + 1 && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">Today</span>}
            </p>
            <div className="mt-3 space-y-2.5">
              {byDay[di].length === 0 && <p className="py-6 text-center text-[12.5px] text-muted">No classes</p>}
              {byDay[di].map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-line bg-bg p-3"
                  style={{ borderLeft: `3px solid ${seriesColor(courseIndex.get(s.course.code) ?? 0)}` }}
                >
                  <p className="text-[11.5px] font-bold text-muted">
                    {fmtTimeMin(s.startMin)} – {fmtTimeMin(s.endMin)}
                  </p>
                  <p className="mt-1 text-[13px] font-semibold leading-snug">{s.course.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{s.course.code} · {s.room}</p>
                  <p className="text-[11.5px] text-muted">{s.faculty}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
