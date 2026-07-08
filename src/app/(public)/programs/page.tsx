import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { inr } from "@/lib/format";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Programs",
  description: "Undergraduate and postgraduate programs at Aurora University — engineering, management, sciences and humanities.",
};

export const dynamic = "force-dynamic";

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  const programs = await db.program.findMany({
    where: level ? { level } : undefined,
    include: { department: true },
    orderBy: [{ level: "asc" }, { name: "asc" }],
  });

  const filters = [
    { key: undefined, label: "All programs" },
    { key: "UG", label: "Undergraduate" },
    { key: "PG", label: "Postgraduate" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Academics</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Programs</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Eight flagship programs across four schools — each with industry internships, research immersion and outcome-first curricula.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.key ? `/programs?level=${f.key}` : "/programs"}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
              level === f.key || (!level && !f.key)
                ? "bg-primary-600 text-white"
                : "border border-line bg-surface text-muted hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {programs.map((p, i) => (
          <Link key={p.id} href={`/programs/${p.slug}`} className="group animate-rise" style={{ animationDelay: `${i * 50}ms` }}>
            <Card className="flex h-full flex-col p-6 transition-all group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:shadow-pop">
              <div className="flex items-center justify-between">
                <Badge tone="brand">{p.level === "UG" ? "Undergraduate" : "Postgraduate"}</Badge>
                <span className="text-[12.5px] text-muted">{p.department.code}</span>
              </div>
              <h2 className="mt-4 font-display text-[22px] font-semibold leading-tight tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-300">
                {p.name}
              </h2>
              <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{p.about}</p>
              <div className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-4 text-[13px]">
                <div>
                  <p className="text-muted">Duration</p>
                  <p className="mt-0.5 font-semibold">{p.durationTerms / 2} years</p>
                </div>
                <div>
                  <p className="text-muted">Seats</p>
                  <p className="mt-0.5 font-semibold">{p.seats}</p>
                </div>
                <div>
                  <p className="text-muted">Fee / semester</p>
                  <p className="mt-0.5 font-semibold">{inr(p.feePerTermMinor)}</p>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                Program details <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
