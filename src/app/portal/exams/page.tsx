import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtTimeMin } from "@/lib/format";
import { scheduleExam } from "@/lib/actions/staff";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, Field, Input, PageHeader, Select, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  await requireSession("EXAM_CONTROLLER");
  const [exams, courses] = await Promise.all([
    db.exam.findMany({
      include: { schedules: { include: { course: true }, orderBy: { date: "asc" } } },
      orderBy: { name: "asc" },
    }),
    db.course.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Exams & schedules" sub="Timetabling for internal and end-semester examinations" />

      {exams.map((exam) => (
        <Card key={exam.id}>
          <CardHeader
            title={exam.name}
            sub={`${exam.termName} · ${exam.type.replace("_", " ")}`}
            action={<Badge tone={exam.status === "scheduled" ? "info" : "success"}>{exam.status}</Badge>}
          />
          {exam.schedules.length === 0 ? (
            <EmptyState icon="calendar" title="No papers scheduled yet" />
          ) : (
            <Table head={["Date", "Course", "Time", "Duration", "Venue"]}>
              {exam.schedules.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2">
                  <Td className="whitespace-nowrap font-medium">{fmtDate(s.date)}</Td>
                  <Td>
                    <span className="font-medium">{s.course.code}</span> <span className="text-muted">{s.course.title}</span>
                  </Td>
                  <Td>{fmtTimeMin(s.startMin)}</Td>
                  <Td>{s.durationMin} min</Td>
                  <Td className="text-muted">{s.room}</Td>
                </tr>
              ))}
            </Table>
          )}
          {exam.status === "scheduled" && (
            <div className="border-t border-line p-5">
              <p className="text-[13px] font-semibold">Add a paper to this exam</p>
              <ActionForm action={scheduleExam} className="mt-3 grid gap-3 sm:grid-cols-5">
                <input type="hidden" name="examId" value={exam.id} />
                <Field label="Course">
                  <Select name="courseId" required defaultValue="">
                    <option value="" disabled>Select…</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input name="date" type="date" required />
                </Field>
                <Field label="Start hour (24h)">
                  <Input name="hour" type="number" min={8} max={18} defaultValue={10} required />
                </Field>
                <Field label="Duration (min)">
                  <Input name="durationMin" type="number" min={30} max={360} defaultValue={180} required />
                </Field>
                <Field label="Venue">
                  <Input name="room" placeholder="Exam Hall 1" required />
                </Field>
                <div className="sm:col-span-5">
                  <SubmitButton size="sm">Schedule paper</SubmitButton>
                </div>
              </ActionForm>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
