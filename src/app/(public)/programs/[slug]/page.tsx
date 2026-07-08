import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { inr } from "@/lib/format";
import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await db.program.findUnique({ where: { slug } });
  return { title: p?.name ?? "Program", description: p?.about.slice(0, 155) };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await db.program.findUnique({
    where: { slug },
    include: { department: true, courses: { orderBy: [{ semester: "asc" }, { code: "asc" }] } },
  });
  if (!program) notFound();
  const outcomes: string[] = JSON.parse(program.outcomes);
  const bySem = new Map<number, typeof program.courses>();
  for (const c of program.courses) {
    bySem.set(c.semester, [...(bySem.get(c.semester) ?? []), c]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-[13px] text-muted" aria-label="Breadcrumb">
        <Link href="/programs" className="hover:text-primary-700 dark:hover:text-primary-300">Programs</Link>
        <span>/</span>
        <span className="text-text">{program.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{program.level === "UG" ? "Undergraduate" : "Postgraduate"}</Badge>
            <Badge tone="neutral">{program.department.name}</Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{program.name}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{program.about}</p>

          <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">What you'll be able to do</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {outcomes.map((o) => (
              <li key={o} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4 text-[14px]">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success dark:bg-success/15">
                  <Icon name="check" className="size-3" />
                </span>
                {o}
              </li>
            ))}
          </ul>

          {bySem.size > 0 && (
            <>
              <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight">Sample curriculum</h2>
              <div className="mt-5 space-y-6">
                {[...bySem.entries()].map(([sem, courses]) => (
                  <div key={sem}>
                    <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted">Semester {sem}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {courses.map((c) => (
                        <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
                          <p className="text-[12px] font-bold text-primary-700 dark:text-primary-400">{c.code} · {c.credits} credits</p>
                          <p className="mt-1 text-[14px] font-medium">{c.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside>
          <Card className="sticky top-24 p-6">
            <h2 className="font-semibold">At a glance</h2>
            <dl className="mt-4 space-y-3 text-[14px]">
              {[
                ["Duration", `${program.durationTerms / 2} years · ${program.durationTerms} semesters`],
                ["Total credits", String(program.totalCredits)],
                ["Seats", String(program.seats)],
                ["Fee per semester", inr(program.feePerTermMinor)],
                ["Department", program.department.name],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line pb-3 last:border-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 rounded-xl bg-surface-2 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Eligibility</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed">{program.eligibility}</p>
            </div>
            <ButtonLink href="/apply" className="mt-5 w-full" size="lg">
              Apply for this program <Icon name="arrow" className="size-4" />
            </ButtonLink>
            <p className="mt-3 text-center text-[12.5px] text-muted">Applications close Aug 6, 2026</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
