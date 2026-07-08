import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { updateLeadStatus } from "@/lib/actions/staff";
import { QuickAction } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requireSession("ADMISSION_OFFICER", "ADMIN");
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="Enquiries" sub="Leads from the public contact form — respond within one working day" />
      <Card>
        <CardHeader title={`${leads.length} enquiries`} action={<Badge tone="info">{leads.filter((l) => l.status === "new").length} new</Badge>} />
        {leads.length === 0 ? (
          <EmptyState icon="mail" title="No enquiries yet" />
        ) : (
          <ul className="divide-y divide-line">
            {leads.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold">{l.name}</p>
                      <Badge tone="brand">{l.topic}</Badge>
                      <StatusBadge status={l.status} />
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-muted">
                      {l.email}{l.phone ? ` · ${l.phone}` : ""} · {fmtDateTime(l.createdAt)}
                    </p>
                    <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px] leading-relaxed">{l.message}</p>
                  </div>
                  <div className="flex gap-2">
                    {l.status === "new" && <QuickAction action={updateLeadStatus} fields={{ id: l.id, status: "contacted" }} label="Mark contacted" variant="primary" />}
                    {l.status !== "closed" && <QuickAction action={updateLeadStatus} fields={{ id: l.id, status: "closed" }} label="Close" variant="secondary" />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
