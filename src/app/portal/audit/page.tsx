import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const actionTone = (a: string) =>
  a.includes("reject") || a.includes("suspend") ? "danger"
  : a.includes("approve") || a.includes("publish") || a.includes("enroll") ? "success"
  : a.includes("payment") || a.includes("pay") ? "warning"
  : "info";

export default async function AuditPage() {
  await requireSession("ADMIN", "PRINCIPAL");
  const events = await db.auditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 80 });

  return (
    <div>
      <PageHeader
        title="Audit trail"
        sub="Append-only record of every state-changing action — who, what, when (blueprint §5.8)"
      />
      <Card>
        <CardHeader title={`Last ${events.length} events`} />
        {events.length === 0 ? (
          <EmptyState icon="shield" title="No events recorded yet" />
        ) : (
          <ul className="divide-y divide-line">
            {events.map((e) => {
              let note = "";
              try { note = JSON.parse(e.meta).note ?? ""; } catch {}
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Badge tone={actionTone(e.action)}>{e.action}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px]">
                      <span className="font-semibold">{e.actorName}</span>
                      <span className="text-muted"> → {e.entityType} · {e.entityId}</span>
                    </p>
                    {note && <p className="text-[12.5px] text-muted">{note}</p>}
                  </div>
                  <span className="shrink-0 text-[12px] tabular-nums text-muted">{fmtDateTime(e.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
