import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionFaculty } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, pct } from "@/lib/format";
import {
  openAttendanceSession,
  closeAttendanceSession,
  createAssignment,
  gradeSubmission,
  addMaterial,
} from "@/lib/actions/faculty";
import { ActionForm, QuickAction, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, StatusBadge, Table, Td, Textarea } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  ["attendance", "Attendance"],
  ["assignments", "Assignments & grading"],
  ["materials", "Materials"],
  ["roster", "Roster"],
] as const;

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sectionId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await getSessionFaculty();
  const { sectionId } = await params;
  const { tab = "attendance" } = await searchParams;

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: {
      course: true,
      enrollments: { where: { status: "registered" }, include: { student: { include: { user: true } } } },
      sessions: { orderBy: { date: "desc" }, include: { records: true } },
      assignments: {
        orderBy: { dueAt: "desc" },
        include: { submissions: { include: { student: { include: { user: true } } } } },
      },
      materials: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!section || section.facultyId !== profile.id) notFound();

  const openSession = section.sessions.find((s) => s.status === "open");
  const roster = section.enrollments;

  // per-student attendance for roster tab
  const attByStudent = new Map<string, { present: number; total: number }>();
  for (const s of section.sessions) {
    for (const r of s.records) {
      const c = attByStudent.get(r.studentId) ?? { present: 0, total: 0 };
      c.total++;
      if (r.status === "present" || r.status === "late") c.present++;
      attByStudent.set(r.studentId, c);
    }
  }

  return (
    <div className="space-y-6">
      <nav className="text-[13px] text-muted" aria-label="Breadcrumb">
        <Link href="/portal/teach" className="hover:text-primary-700 dark:hover:text-primary-300">← My sections</Link>
      </nav>
      <PageHeader
        title={`${section.course.code} — ${section.course.title}`}
        sub={`${roster.length} students · ${section.room} · ${section.course.credits} credits`}
        action={openSession && <Badge tone="success">Live session · code {openSession.code}</Badge>}
      />

      <div className="flex flex-wrap gap-2 border-b border-line pb-px">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`/portal/teach/${sectionId}?tab=${key}`}
            className={`rounded-t-xl border-b-2 px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
              tab === key
                ? "border-primary-600 text-primary-700 dark:text-primary-300"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "attendance" && (
        <div className="space-y-6">
          <Card className="p-6">
            {openSession ? (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex-1">
                  <p className="flex items-center gap-2 font-semibold text-success">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-success" />
                    </span>
                    Session open — students can mark now
                  </p>
                  <p className="mt-2 text-[13.5px] text-muted">
                    Share the code below. {openSession.records.length} of {roster.length} marked so far.
                    Closing the session marks the rest absent and alerts guardians.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-dashed border-primary-400 bg-primary-50 px-8 py-4 text-center dark:bg-primary-950">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary-700 dark:text-primary-400">Session code</p>
                  <p className="font-display text-3xl font-bold tracking-widest text-primary-800 dark:text-primary-200">{openSession.code}</p>
                </div>
                <QuickAction action={closeAttendanceSession} fields={{ sessionId: openSession.id }} label="Close session" variant="danger" size="md" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <Icon name="qr" className="size-5 text-primary-600" /> Start an attendance session
                  </p>
                  <p className="mt-1 text-[13.5px] text-muted">Generates a rotating code students enter from their portal.</p>
                </div>
                <QuickAction action={openAttendanceSession} fields={{ sectionId }} label="Open session" variant="primary" size="md" />
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Past sessions" sub={`${section.sessions.length} sessions this term`} />
            {section.sessions.length === 0 ? (
              <EmptyState icon="calendar" title="No sessions yet" />
            ) : (
              <Table head={["Date", "Code", "Present", "Absent", "Status"]}>
                {section.sessions.slice(0, 12).map((s) => {
                  const present = s.records.filter((r) => r.status === "present" || r.status === "late").length;
                  return (
                    <tr key={s.id} className="hover:bg-surface-2">
                      <Td className="whitespace-nowrap">{fmtDate(s.date)}</Td>
                      <Td className="font-mono text-[12.5px]">{s.code}</Td>
                      <Td className="text-success">{present}</Td>
                      <Td className="text-danger">{s.records.length - present}</Td>
                      <Td><StatusBadge status={s.status} /></Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </Card>
        </div>
      )}

      {tab === "assignments" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Create assignment</h2>
            <ActionForm action={createAssignment} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="sectionId" value={sectionId} />
              <Field label="Title">
                <Input name="title" required placeholder="e.g. Transactions Lab" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Due date">
                  <Input name="dueAt" type="datetime-local" required />
                </Field>
                <Field label="Max marks">
                  <Input name="maxMarks" type="number" min={1} max={100} defaultValue={20} required />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description">
                  <Textarea name="description" rows={2} required placeholder="What should students do?" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <SubmitButton>Publish to {roster.length} students</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          {section.assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader
                title={a.title}
                sub={`Due ${fmtDateTime(a.dueAt)} · ${a.maxMarks} marks · ${a.submissions.length}/${roster.length} submitted`}
                action={<Badge tone={a.dueAt < new Date() ? "neutral" : "warning"}>{a.dueAt < new Date() ? "Closed" : "Open"}</Badge>}
              />
              {a.submissions.length === 0 ? (
                <EmptyState icon="inbox" title="No submissions yet" />
              ) : (
                <ul className="divide-y divide-line">
                  {a.submissions.map((sub) => (
                    <li key={sub.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{sub.student.user.name} <span className="font-normal text-muted">· {sub.student.rollNo}</span></p>
                          <p className="mt-1 text-[13px] text-muted">Submitted {fmtDateTime(sub.submittedAt)}</p>
                          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] leading-relaxed">{sub.contentText}</p>
                        </div>
                        <div className="w-full sm:w-64">
                          {sub.marks !== null ? (
                            <div className="rounded-xl bg-success-soft px-4 py-3 text-[13px] dark:bg-success/15">
                              <p className="font-bold text-success dark:text-emerald-300">Graded: {sub.marks}/{a.maxMarks}</p>
                              {sub.feedback && <p className="mt-1 text-muted">{sub.feedback}</p>}
                            </div>
                          ) : (
                            <ActionForm action={gradeSubmission} className="space-y-2">
                              <input type="hidden" name="submissionId" value={sub.id} />
                              <Input name="marks" type="number" min={0} max={a.maxMarks} placeholder={`Marks / ${a.maxMarks}`} required />
                              <Input name="feedback" placeholder="Feedback (optional)" />
                              <SubmitButton size="sm" className="w-full">Save grade</SubmitButton>
                            </ActionForm>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "materials" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Publish material</h2>
            <ActionForm action={addMaterial} className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
              <input type="hidden" name="sectionId" value={sectionId} />
              <Field label="Title">
                <Input name="title" required placeholder="e.g. Week 4 slides" />
              </Field>
              <Field label="Type">
                <Select name="kind" defaultValue="notes">
                  <option value="notes">Notes</option>
                  <option value="slides">Slides</option>
                  <option value="video">Video</option>
                  <option value="link">Link</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description / link">
                  <Textarea name="body" rows={2} required placeholder="What's in it, or paste a link" />
                </Field>
              </div>
              <div>
                <SubmitButton>Publish</SubmitButton>
              </div>
            </ActionForm>
          </Card>
          <Card>
            <CardHeader title="Published materials" />
            {section.materials.length === 0 ? (
              <EmptyState icon="book" title="Nothing published yet" />
            ) : (
              <ul className="divide-y divide-line">
                {section.materials.map((m) => (
                  <li key={m.id} className="flex items-start gap-4 px-5 py-3.5">
                    <Badge tone="brand">{m.kind}</Badge>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{m.title}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{m.body}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[12px] text-muted">{fmtDate(m.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === "roster" && (
        <Card>
          <CardHeader title="Roster & attendance summary" sub="Students below 75% are flagged" />
          <Table head={["Student", "Roll no", "Attendance", "Status"]}>
            {roster.map((e) => {
              const c = attByStudent.get(e.studentId) ?? { present: 0, total: 0 };
              const p = pct(c.present, c.total);
              return (
                <tr key={e.id} className="hover:bg-surface-2">
                  <Td className="font-medium">{e.student.user.name}</Td>
                  <Td className="font-mono text-[12.5px] text-muted">{e.student.rollNo}</Td>
                  <Td>{c.total ? `${p}% (${c.present}/${c.total})` : "—"}</Td>
                  <Td>
                    {c.total === 0 ? <Badge tone="neutral">No data</Badge> : p >= 75 ? <Badge tone="success">On track</Badge> : <Badge tone="danger">At risk</Badge>}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </div>
  );
}
