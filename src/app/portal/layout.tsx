import Link from "next/link";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { navForRole, ROLE_LABELS } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { PortalNavLinks, MobileSidebar } from "@/components/portal-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui";
import { Icon } from "@/components/icons";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const nav = navForRole(session.role);
  const unread = await db.notification.count({ where: { userId: session.sub, readAt: null } });

  const sidebarInner = (
    <>
      <PortalNavLinks items={nav} unread={unread} />
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={session.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{session.name}</p>
            <p className="truncate text-[11.5px] text-muted">{ROLE_LABELS[session.role] ?? session.role}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Icon name="logout" className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-600 text-white">
            <Icon name="grad" className="size-5" />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold leading-tight">Aurora</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">UnivOS Portal</p>
          </div>
        </div>
        {sidebarInner}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
          <MobileSidebar>{sidebarInner}</MobileSidebar>
          <p className="hidden text-[13px] text-muted sm:block">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text sm:flex"
            >
              <Icon name="globe" className="size-4" /> Public site
            </Link>
            <Link
              href="/portal/notifications"
              aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
              className="relative grid size-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Icon name="bell" className="size-[18px]" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-primary-600 px-1 text-[9.5px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
