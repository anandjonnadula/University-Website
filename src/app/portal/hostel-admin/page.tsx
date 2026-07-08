import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { decideOutpass } from "@/lib/actions/staff";
import { QuickAction } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Stat, StatusBadge, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HostelAdminPage() {
  await requireSession("WARDEN");
  const [hostels, pending, recent] = await Promise.all([
    db.hostel.findMany({
      include: { rooms: { include: { allocations: { where: { status: "active" }, include: { student: { include: { user: true } } } } } } },
    }),
    db.outpass.findMany({
      where: { status: "pending" },
      include: { student: { include: { user: true } } },
      orderBy: { outAt: "asc" },
    }),
    db.outpass.findMany({
      where: { status: { not: "pending" } },
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const residents = hostels.reduce((s, h) => s + h.rooms.reduce((x, r) => x + r.allocations.length, 0), 0);
  const capacity = hostels.reduce((s, h) => s + h.capacity, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Hostels & outpasses" sub="Occupancy, resident registry and outpass decisions" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Residents" value={residents} icon="users" />
        <Stat label="Occupancy" value={`${Math.round((residents / Math.max(capacity, 1)) * 100)}%`} icon="building" tone="info" hint={`${capacity} total beds`} />
        <Stat label="Pending outpasses" value={pending.length} icon="clock" tone={pending.length ? "warning" : "success"} />
      </div>

      <Card>
        <CardHeader title="Outpass requests" sub="Guardians get visibility of approved outpasses" />
        {pending.length === 0 ? (
          <EmptyState icon="check" title="No pending requests" />
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">
                    {o.student.user.name} <span className="font-normal text-muted">· {o.student.rollNo}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] text-muted">{o.reason}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    Out {fmtDateTime(o.outAt)} → back {fmtDateTime(o.expectedInAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <QuickAction action={decideOutpass} fields={{ id: o.id, decision: "approved" }} label="Approve" variant="primary" />
                  <QuickAction action={decideOutpass} fields={{ id: o.id, decision: "rejected" }} label="Reject" variant="secondary" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {hostels.map((h) => {
          const hostelResidents = h.rooms.flatMap((r) => r.allocations.map((a) => ({ ...a, room: r })));
          return (
            <Card key={h.id}>
              <CardHeader
                title={h.name}
                sub={`${hostelResidents.length} residents · ${h.capacity} beds`}
                action={<Badge tone="brand">{Math.round((hostelResidents.length / h.capacity) * 100)}% full</Badge>}
              />
              <Table head={["Resident", "Roll no", "Room"]}>
                {hostelResidents.slice(0, 10).map((a) => (
                  <tr key={a.id} className="hover:bg-surface-2">
                    <Td className="font-medium">{a.student.user.name}</Td>
                    <Td className="font-mono text-[12.5px] text-muted">{a.student.rollNo}</Td>
                    <Td>{a.room.number}</Td>
                  </tr>
                ))}
              </Table>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader title="Recent decisions" />
        <ul className="divide-y divide-line">
          {recent.map((o) => (
            <li key={o.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium">{o.student.user.name} · {o.reason}</p>
                <p className="text-[12px] text-muted">{fmtDateTime(o.outAt)}</p>
              </div>
              <StatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
