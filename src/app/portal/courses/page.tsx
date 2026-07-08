import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, relDays } from "@/lib/format";
import { submitAssignment } from "@/lib/actions/student";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, PageHeader, Textarea } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const kindIcons: Record<string, string> = { notes: "book", slides: "chart", video: "globe", link: "arrow" };

export default async function CoursesPage() {
  const { student } = await getSessionStudent();
  const enrollments = await db.enrollment.findMany({
    where: { studentId: student.id, status: "registered" },
    include: {
      section: {
        include: {
          course: true,
          faculty: { include: { user: true } },
          materials: { orderBy: { createdAt: "desc" } },
          assignments: {
            orderBy: { dueAt: "asc" },
            include: { submissions: { where: { studentId: student.id } } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My courses"
        sub={`${enrollments.length} registered courses · ${enrollments.reduce((s, e) => s + e.section.course.credits, 0)} credits · Monsoon 2026`}
      />

      {enrollments.map((e) => {
        const sec = e.section;
        return (
          <Card key={e.id}>
            <CardHeader
              title={`${sec.course.code} — ${sec.course.title}`}
              sub={`${sec.course.credits} credits · ${sec.faculty.user.name} · ${sec.room}`}
              action={<Badge tone="brand">{sec.course.type}</Badge>}
            />
            <div className="grid gap-6 p-5 lg:grid-cols-2">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Assignments</p>
                {sec.assignments.length === 0 ? (
                  <p className="mt-3 text-[13px] text-muted">No assignments posted yet.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {sec.assignments.map((a) => {
                      const sub = a.submissions[0];
                      const overdue = a.dueAt < new Date();
                      return (
                        <div key={a.id} className="rounded-xl border border-line bg-bg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[14px] font-semibold">{a.title}</p>
                              <p className="mt-0.5 text-[12.5px] text-muted">
                                Due {fmtDate(a.dueAt)} ({relDays(a.dueAt)}) · {a.maxMarks} marks
                              </p>
                            </div>
                            {sub ? (
                              sub.marks !== null ? (
                                <Badge tone="success">{sub.marks}/{a.maxMarks}</Badge>
                              ) : (
                                <Badge tone="info">Submitted</Badge>
                              )
                            ) : overdue ? (
                              <Badge tone="danger">Missed</Badge>
                            ) : (
                              <Badge tone="warning">Open</Badge>
                            )}
                          </div>
                          <p className="mt-2 text-[13px] leading-relaxed text-muted">{a.description}</p>
                          {sub?.feedback && (
                            <p className="mt-2 rounded-lg bg-success-soft px-3 py-2 text-[12.5px] text-success dark:bg-success/15 dark:text-emerald-300">
                              Feedback: {sub.feedback}
                            </p>
                          )}
                          {!sub && !overdue && (
                            <ActionForm action={submitAssignment} className="mt-3">
                              <input type="hidden" name="assignmentId" value={a.id} />
                              <Textarea name="content" rows={3} placeholder="Paste your answer, link or notes for this submission…" required />
                              <SubmitButton size="sm" className="mt-2">Submit work</SubmitButton>
                            </ActionForm>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Materials</p>
                {sec.materials.length === 0 ? (
                  <p className="mt-3 text-[13px] text-muted">No materials shared yet.</p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {sec.materials.map((m) => (
                      <li key={m.id} className="flex items-start gap-3 rounded-xl border border-line bg-bg p-3.5">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                          <Icon name={kindIcons[m.kind] ?? "book"} className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold leading-snug">{m.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted">{m.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
