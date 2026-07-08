import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Avatar, Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Departments & Faculty",
  description: "Six schools and departments at Aurora University, and the faculty who teach and research in them.",
};

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await db.department.findMany({
    include: {
      programs: true,
      faculty: { include: { user: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Schools & Departments</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Departments</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Six departments, one campus — with shared labs, cross-listed electives and joint research centres.
      </p>

      <div className="mt-12 space-y-8">
        {departments.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <div className="grid gap-8 p-7 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-primary-700 dark:text-primary-400">{d.code}</p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{d.name}</h2>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{d.about}</p>
                <p className="mt-4 text-[13.5px]">
                  <span className="text-muted">Head of Department:</span> <span className="font-semibold">{d.hodName}</span>
                </p>
                {d.programs.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {d.programs.map((p) => (
                      <Link
                        key={p.id}
                        href={`/programs/${p.slug}`}
                        className="rounded-full border border-line bg-bg px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        {p.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {d.faculty.length > 0 && (
                <div className="rounded-2xl bg-surface-2 p-5">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Featured faculty</p>
                  <ul className="mt-3 space-y-3">
                    {d.faculty.slice(0, 3).map((f) => (
                      <li key={f.id} className="flex items-start gap-3">
                        <Avatar name={f.user.name} size="sm" />
                        <div className="min-w-0">
                          <p className="text-[13.5px] font-semibold">{f.user.name}</p>
                          <p className="text-[12px] text-muted">{f.designation} · {f.interests.split(",")[0]}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link href="/faculty" className="mt-4 inline-block text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                    All faculty →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
