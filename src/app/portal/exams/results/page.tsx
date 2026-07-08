import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { moderateResults, publishResults } from "@/lib/actions/staff";
import { QuickAction } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ResultProcessingPage() {
  await requireSession("EXAM_CONTROLLER");
  const results = await db.result.findMany({ include: { course: true } });

  // group by (course, term)
  const groups = new Map<string, { course: (typeof results)[number]["course"]; termName: string; provisional: number; moderated: number; published: number; total: number; avg: number }>();
  for (const r of results) {
    const key = `${r.courseId}|${r.termName}`;
    const g = groups.get(key) ?? { course: r.course, termName: r.termName, provisional: 0, moderated: 0, published: 0, total: 0, avg: 0 };
    g.total++;
    g.avg += r.marks;
    if (r.status === "provisional") g.provisional++;
    else if (r.status === "moderated") g.moderated++;
    else g.published++;
    groups.set(key, g);
  }
  const rows = [...groups.values()].map((g) => ({ ...g, avg: Math.round(g.avg / g.total) }))
    .sort((a, b) => (a.published === a.total ? 1 : 0) - (b.published === b.total ? 1 : 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Result processing"
        sub="Provisional → moderated → published. Publication is irreversible, notifies every student, and is audit-logged."
      />
      <Card>
        <CardHeader title="Course result batches" sub="Grade normalization happens at moderation (blueprint 7.F workflow 4)" />
        {rows.length === 0 ? (
          <EmptyState icon="award" title="No results in the pipeline" />
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((g) => {
              const done = g.published === g.total;
              return (
                <li key={`${g.course.id}-${g.termName}`} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-semibold">
                      {g.course.code} — {g.course.title}
                      <span className="ml-2 font-normal text-muted">· {g.termName}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[12px]">
                      <Badge tone="warning">{g.provisional} provisional</Badge>
                      <Badge tone="info">{g.moderated} moderated</Badge>
                      <Badge tone="success">{g.published} published</Badge>
                      <Badge tone="neutral">class avg {g.avg}/100</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {g.provisional > 0 && (
                      <QuickAction
                        action={moderateResults}
                        fields={{ courseId: g.course.id, termName: g.termName }}
                        label={`Moderate ${g.provisional}`}
                        variant="secondary"
                        size="md"
                      />
                    )}
                    {!done && g.provisional === 0 && g.moderated > 0 && (
                      <QuickAction
                        action={publishResults}
                        fields={{ courseId: g.course.id, termName: g.termName }}
                        label={`Publish ${g.moderated}`}
                        variant="primary"
                        size="md"
                      />
                    )}
                    {done && <Badge tone="success">✓ Fully published</Badge>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
