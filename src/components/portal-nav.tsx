"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/rbac";
import { Icon } from "./icons";

export function PortalNavLinks({ items, unread }: { items: NavItem[]; unread: number }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Portal">
      {items.map((item) => {
        const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon name={item.icon} className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.href === "/portal/notifications" && unread > 0 && (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10.5px] font-bold ${active ? "bg-white/25 text-white" : "bg-primary-600 text-white"}`}>
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile slide-over wrapper for the sidebar. */
export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden"
      >
        <Icon name="menu" className="size-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-overlay" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 animate-fade flex-col bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display font-bold">Aurora Portal</span>
              <button onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
                <Icon name="x" className="size-4" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
