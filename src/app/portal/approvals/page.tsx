import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { decideLeave } from "@/lib/actions/faculty";
import { QuickAction } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireSession("HOD", "PRINCIPAL", "ADMIN");
  const [pending, decided] = await Promise.all([
    db.leaveRequest.findMany({ where: { status: "pending" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    db.leaveRequest.findMany({ where: { status: { not: "pending" } }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Approvals" sub="Leave requests awaiting your decision — approvals are audited" />

      <Card>
        <CardHeader title="Pending" action={<Badge tone={pending.length ? "warning" : "success"}>{pending.length} waiting</Badge>} />
        {pending.length === 0 ? (
          <EmptyState icon="check" title="Queue is clear" hint="New requests will appear here and in your notifications." />
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {l.user.name} <span className="font-normal capitalize text-muted">· {l.type} leave</span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · {l.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <QuickAction action={decideLeave} fields={{ id: l.id, decision: "approved" }} label="Approve" variant="primary" />
                  <QuickAction action={decideLeave} fields={{ id: l.id, decision: "rejected" }} label="Reject" variant="secondary" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Recently decided" />
        {decided.length === 0 ? (
          <EmptyState icon="inbox" title="No history yet" />
        ) : (
          <ul className="divide-y divide-line">
            {decided.map((l) => (
              <li key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">{l.user.name} · <span className="capitalize">{l.type}</span></p>
                  <p className="text-[12.5px] text-muted">{fmtDate(l.fromDate)} → {fmtDate(l.toDate)} · decided by {l.decidedBy}</p>
                </div>
                <StatusBadge status={l.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
