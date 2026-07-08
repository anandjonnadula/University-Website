import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { markNotificationsRead } from "@/lib/actions/student";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const catTone: Record<string, string> = {
  finance: "warning", academics: "info", library: "brand", placement: "success",
  exams: "info", hostel: "brand", hr: "neutral", admissions: "info", grievance: "danger",
};

export default async function NotificationsPage() {
  const session = await requireSession();
  const notifications = await db.notification.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        sub={unread ? `${unread} unread` : "You're all caught up"}
        action={
          unread > 0 && (
            <form action={markNotificationsRead}>
              <button className="rounded-xl border border-line bg-surface px-4 py-2 text-[13px] font-medium transition-colors hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                Mark all as read
              </button>
            </form>
          )
        }
      />
      <Card>
        {notifications.length === 0 ? (
          <EmptyState icon="bell" title="Nothing here yet" hint="Fee reminders, grades, approvals and alerts land here." />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link ?? "#"}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2 ${n.readAt ? "" : "bg-primary-50/40 dark:bg-primary-950/30"}`}
                >
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.readAt ? "bg-line" : "bg-primary-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold">{n.title}</p>
                      <Badge tone={catTone[n.category] ?? "neutral"}>{n.category}</Badge>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-muted">{fmtDateTime(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
