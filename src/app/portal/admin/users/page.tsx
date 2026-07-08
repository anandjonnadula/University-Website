import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/rbac";
import { fmtDate } from "@/lib/format";
import { toggleUserStatus } from "@/lib/actions/staff";
import { QuickAction } from "@/components/action-form";
import { Avatar, Badge, Card, CardHeader, PageHeader, Stat, StatusBadge, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireSession("ADMIN");
  const users = await db.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  const byRole = new Map<string, number>();
  for (const u of users) byRole.set(u.role, (byRole.get(u.role) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Users & roles" sub="RBAC role assignment and account lifecycle — changes are audited" />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total users" value={users.length} icon="users" />
        <Stat label="Students" value={byRole.get("STUDENT") ?? 0} icon="grad" />
        <Stat label="Faculty & HODs" value={(byRole.get("FACULTY") ?? 0) + (byRole.get("HOD") ?? 0)} icon="book" />
        <Stat label="Suspended" value={users.filter((u) => u.status !== "active").length} icon="warn" tone="warning" />
      </div>

      <Card>
        <CardHeader title="Directory" sub="Suspending a user blocks sign-in immediately (session registry)" />
        <Table head={["User", "Role", "Joined", "Status", ""]}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-surface-2">
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[12px] text-muted">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td><Badge tone="brand">{ROLE_LABELS[u.role] ?? u.role}</Badge></Td>
              <Td className="whitespace-nowrap text-muted">{fmtDate(u.createdAt)}</Td>
              <Td><StatusBadge status={u.status} /></Td>
              <Td>
                {u.role !== "ADMIN" && (
                  <QuickAction
                    action={toggleUserStatus}
                    fields={{ id: u.id }}
                    label={u.status === "active" ? "Suspend" : "Reactivate"}
                    variant={u.status === "active" ? "secondary" : "primary"}
                  />
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
