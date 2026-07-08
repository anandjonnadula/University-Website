import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, titleCase } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatusBadge, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "submitted", "under_review", "shortlisted", "offered", "accepted", "enrolled", "waitlisted", "rejected"];

export default async function AdmissionsQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireSession("ADMISSION_OFFICER", "ADMIN");
  const { status = "all" } = await searchParams;
  const applications = await db.application.findMany({
    where: status === "all" ? undefined : { status },
    include: { program: true },
    orderBy: [{ compositeScore: "desc" }],
  });
  const counts = await db.application.groupBy({ by: ["status"], _count: true });
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Application queue"
        sub="Ranked by composite score (40% qualifying + 60% entrance) — the AI pre-screen orders the queue, you decide"
      />

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/portal/admissions" : `/portal/admissions?status=${s}`}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              status === s ? "bg-primary-600 text-white" : "border border-line bg-surface text-muted hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            }`}
          >
            {titleCase(s)} {s !== "all" && <span className="opacity-70">({countOf(s)})</span>}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader title={`${applications.length} applications`} sub="Click a row to review and decide" />
        {applications.length === 0 ? (
          <EmptyState icon="inbox" title="No applications in this bucket" />
        ) : (
          <Table head={["Ref", "Applicant", "Program", "Score", "Category", "Applied", "Status"]}>
            {applications.map((a) => (
              <tr key={a.id} className="relative hover:bg-surface-2">
                <Td className="font-mono text-[12.5px]">
                  <Link href={`/portal/admissions/${a.id}`} className="font-semibold text-primary-700 hover:underline dark:text-primary-300">
                    {a.refNo}
                  </Link>
                </Td>
                <Td className="font-medium">{a.applicantName}</Td>
                <Td className="text-muted">{a.program.name}</Td>
                <Td>
                  <Badge tone={a.compositeScore && a.compositeScore >= 85 ? "success" : a.compositeScore && a.compositeScore >= 75 ? "info" : "neutral"}>
                    {a.compositeScore?.toFixed(1) ?? "—"}
                  </Badge>
                </Td>
                <Td className="text-muted">{a.category}</Td>
                <Td className="whitespace-nowrap text-muted">{fmtDate(a.createdAt)}</Td>
                <Td><StatusBadge status={a.status} /></Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
