import Link from "next/link";
import { PublicNav } from "@/components/public-nav";
import { AssistantWidget } from "@/components/assistant-chat";
import { Icon } from "@/components/icons";

const footerCols = [
  {
    title: "Study",
    links: [
      ["Programs", "/programs"],
      ["Departments", "/departments"],
      ["Admissions", "/apply"],
      ["Research", "/research"],
    ],
  },
  {
    title: "Campus",
    links: [
      ["News", "/news"],
      ["Events", "/events"],
      ["Placements", "/placements"],
      ["About Aurora", "/about"],
    ],
  },
  {
    title: "Quick links",
    links: [
      ["Student / Staff Portal", "/login"],
      ["Contact & Enquiries", "/contact"],
      ["Apply Now", "/apply"],
    ],
  },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5 font-display text-lg font-bold">
              <span className="grid size-9 place-items-center rounded-xl bg-primary-600 text-white">
                <Icon name="grad" className="size-5" />
              </span>
              Aurora University
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A NAAC A++ multidisciplinary university in Bengaluru. Learn boldly. Build what matters.
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <Icon name="pin" className="mt-0.5 size-4 shrink-0" />
              Knowledge Corridor, Devanahalli, Bengaluru 562110
            </p>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted">
              <Icon name="mail" className="size-4 shrink-0" />
              info@aurora.edu · +91 80 4567 8900
            </p>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-text/80 transition-colors hover:text-primary-700 dark:hover:text-primary-300">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12.5px] text-muted sm:px-6">
            <p>© 2026 Aurora University. Powered by UnivOS.</p>
            <p>NAAC A++ · NIRF #14 (Engineering) · Est. 1998</p>
          </div>
        </div>
      </footer>

      <AssistantWidget />
    </div>
  );
}
