import Link from "next/link";
import { getSessionFaculty } from "@/lib/auth";
import { db } from "@/lib/db";
import { DAY_NAMES, fmtTimeMin } from "@/lib/format";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function TeachPage() {
  const { profile } = await getSessionFaculty();
  const sections = await db.section.findMany({
    where: { facultyId: profile.id },
    include: {
      course: true,
      slots: true,
      enrollments: { where: { status: "registered" } },
      sessions: { where: { status: "open" } },
      assignments: { include: { submissions: true } },
    },
  });

  return (
    <div>
      <PageHeader title="My sections" sub={`${sections.length} sections · Monsoon 2026`} />
      <div className="grid gap-5 md:grid-cols-2">
        {sections.map((sec) => {
          const ungraded = sec.assignments.flatMap((a) => a.submissions).filter((s) => s.marks === null).length;
          return (
            <Link key={sec.id} href={`/portal/teach/${sec.id}`} className="group">
              <Card className="h-full p-6 transition-all group-hover:-translate-y-0.5 group-hover:border-primary-300 group-hover:shadow-pop">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-primary-700 dark:text-primary-400">{sec.course.code}</p>
                    <h2 className="mt-0.5 font-display text-lg font-semibold leading-tight">{sec.course.title}</h2>
                  </div>
                  {sec.sessions.length > 0 && <Badge tone="success">Session live</Badge>}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5"><Icon name="users" className="size-4" />{sec.enrollments.length} students</span>
                  <span className="flex items-center gap-1.5"><Icon name="pin" className="size-4" />{sec.room}</span>
                  <span className="flex items-center gap-1.5"><Icon name="inbox" className="size-4" />{ungraded} to grade</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sec.slots.map((s) => (
                    <span key={s.id} className="rounded-full bg-surface-2 px-3 py-1 text-[12px] font-medium text-muted">
                      {DAY_NAMES[s.dayOfWeek]} {fmtTimeMin(s.startMin)}
                    </span>
                  ))}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
