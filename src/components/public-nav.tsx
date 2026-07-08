"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/departments", label: "Departments" },
  { href: "/placements", label: "Placements" },
  { href: "/research", label: "Research" },
  { href: "/news", label: "News" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? "border-line bg-surface/90 backdrop-blur-md shadow-card" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
            <Icon name="grad" className="size-5" />
          </span>
          Aurora<span className="font-normal text-muted">University</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                pathname.startsWith(l.href) ? "text-primary-700 dark:text-primary-300" : "text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-xl border border-line px-4 py-2 text-[13.5px] font-medium transition-colors hover:border-primary-400 hover:text-primary-700 sm:block dark:hover:text-primary-300"
          >
            Portal Login
          </Link>
          <Link
            href="/apply"
            className="rounded-xl bg-primary-600 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            Apply Now
          </Link>
          <button
            className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <Icon name={open ? "x" : "menu"} className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade border-t border-line bg-surface px-4 py-3 lg:hidden" aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-text">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-primary-700 dark:text-primary-300">
            Portal Login →
          </Link>
        </nav>
      )}
    </header>
  );
}
