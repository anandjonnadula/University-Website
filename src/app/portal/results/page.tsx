import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtTimeMin, gpa } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Stat, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const gradeTone = (g: string) => (["O", "A+"].includes(g) ? "success" : g === "F" ? "danger" : ["A", "B+"].includes(g) ? "info" : "warning");

export default async function ResultsPage() {
  const { student } = await getSessionStudent();
  const [results, exams] = await Promise.all([
    db.result.findMany({
      where: { studentId: student.id, status: "published" },
      include: { course: true },
      orderBy: { termName: "asc" },
    }),
    db.exam.findMany({
      where: { status: "scheduled" },
      include: { schedules: { include: { course: true }, orderBy: { date: "asc" } } },
    }),
  ]);

  const terms = [...new Set(results.map((r) => r.termName))];
  const cgpa = gpa(results);
  const totalCredits = results.reduce((s, r) => s + r.credits, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Results & exams" sub="Published grades, term GPA and upcoming exam schedules" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="CGPA" value={cgpa.toFixed(2)} icon="award" hint="Credit-weighted, published results only" />
        <Stat label="Credits earned" value={totalCredits} icon="check" />
        <Stat label="Courses completed" value={results.length} icon="book" />
      </div>

      {exams.some((e) => e.schedules.length) && (
        <Card>
          <CardHeader title="Upcoming exam schedule" sub="Hall tickets are issued automatically if you meet the 75% attendance requirement" />
          <Table head={["Date", "Course", "Time", "Duration", "Venue"]}>
            {exams.flatMap((e) =>
              e.schedules.map((s) => (
                <tr key={s.id} className="hover:bg-surface-2">
                  <Td className="whitespace-nowrap font-medium">{fmtDate(s.date)}</Td>
                  <Td>
                    <span className="font-medium">{s.course.code}</span> <span className="text-muted">{s.course.title}</span>
                  </Td>
                  <Td className="whitespace-nowrap">{fmtTimeMin(s.startMin)}</Td>
                  <Td>{s.durationMin} min</Td>
                  <Td className="text-muted">{s.room}</Td>
                </tr>
              ))
            )}
          </Table>
        </Card>
      )}

      {terms.length === 0 ? (
        <Card>
          <EmptyState icon="award" title="No published results yet" hint="Results appear here once the Examination Cell publishes them." />
        </Card>
      ) : (
        terms.map((term) => {
          const termResults = results.filter((r) => r.termName === term);
          const termGpa = gpa(termResults);
          return (
            <Card key={term}>
              <CardHeader
                title={term}
                sub={`${termResults.length} courses · ${termResults.reduce((s, r) => s + r.credits, 0)} credits`}
                action={<Badge tone="brand">SGPA {termGpa.toFixed(2)}</Badge>}
              />
              <Table head={["Course", "Credits", "Marks", "Grade", "Grade points"]}>
                {termResults.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2">
                    <Td>
                      <span className="font-medium">{r.course.code}</span> <span className="text-muted">{r.course.title}</span>
                    </Td>
                    <Td>{r.credits}</Td>
                    <Td>{r.marks}/{r.maxMarks}</Td>
                    <Td><Badge tone={gradeTone(r.grade)}>{r.grade}</Badge></Td>
                    <Td>{r.gradePoints.toFixed(1)}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          );
        })
      )}
    </div>
  );
}
