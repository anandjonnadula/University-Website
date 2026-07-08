import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Icon } from "@/components/icons";
import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

const stats = [
  { value: "14th", label: "NIRF Engineering rank" },
  { value: "94%", label: "Placement rate 2025–26" },
  { value: "₹52 LPA", label: "Highest offer" },
  { value: "12,400+", label: "Students on campus" },
];

const pillars = [
  { icon: "flask", title: "Research that ships", text: "21 patents filed this year, ₹48 crore in sponsored research, and undergraduate access to a 12-qubit quantum testbed." },
  { icon: "briefcase", title: "Careers by design", text: "138 recruiters, a dedicated placement cell, aptitude training and mock interviews from your very first year." },
  { icon: "sparkles", title: "AI-native campus", text: "One portal for attendance, fees, exams and hostels — with an AI assistant that knows your timetable." },
  { icon: "users", title: "Community that lifts", text: "45+ clubs, a ₹12-crore first-generation scholarship fund and mentorship from 30,000 alumni worldwide." },
];

export default async function HomePage() {
  const [programs, news, events] = await Promise.all([
    db.program.findMany({ include: { department: true }, orderBy: { name: "asc" }, take: 4 }),
    db.newsPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3 }),
    db.campusEvent.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 3 }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    name: "Aurora University",
    url: "https://aurora.univos.app",
    address: { "@type": "PostalAddress", addressLocality: "Bengaluru", postalCode: "562110", addressCountry: "IN" },
    telephone: "+91 80 4567 8900",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-32 right-[-10%] size-[520px] rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/30" />
          <div className="absolute bottom-[-30%] left-[-5%] size-[420px] rounded-full bg-primary-100/60 blur-3xl dark:bg-primary-950/50" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div>
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-[12.5px] font-semibold text-primary-800 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary-600" />
              </span>
              Admissions 2026–27 are open · Apply by Aug 6
            </p>
            <h1 className="animate-rise-1 mt-6 font-display text-[44px] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Learn boldly.
              <br />
              Build <span className="text-primary-600 dark:text-primary-400">what matters.</span>
            </h1>
            <p className="animate-rise-2 mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
              Aurora University is a NAAC A++ multidisciplinary campus in Bengaluru where 12,000 students, 800 faculty
              and one AI-powered platform turn curiosity into careers.
            </p>
            <div className="animate-rise-3 mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/apply" size="lg">
                Start your application <Icon name="arrow" className="size-4" />
              </ButtonLink>
              <ButtonLink href="/programs" variant="secondary" size="lg">
                Explore programs
              </ButtonLink>
            </div>
          </div>

          {/* Stats card cluster */}
          <div className="animate-rise-2 grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <Card key={s.label} className={`p-6 ${i === 1 ? "translate-y-6" : i === 2 ? "-translate-y-2" : i === 3 ? "translate-y-4" : ""}`}>
                <p className="font-display text-3xl font-semibold tracking-tight text-primary-700 dark:text-primary-400">{s.value}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pillars ---------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <Eyebrow>Why Aurora</Eyebrow>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-lg font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              An education that compounds
            </h2>
            <p className="max-w-md text-[15px] text-muted">
              Everything on one campus is designed to stack — coursework feeds research, research feeds careers.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div key={p.title} className="group rounded-2xl border border-line bg-bg p-6 transition-all hover:-translate-y-1 hover:border-primary-300 hover:shadow-card">
                <span className="grid size-11 place-items-center rounded-xl bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-950 dark:text-primary-300">
                  <Icon name={p.icon} className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Programs ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <Eyebrow>Programs</Eyebrow>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Find your path</h2>
          <Link href="/programs" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 dark:text-primary-300">
            All {await db.program.count()} programs
            <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {programs.map((p) => (
            <Link key={p.id} href={`/programs/${p.slug}`} className="group">
              <Card className="flex h-full flex-col p-6 transition-all group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:shadow-pop">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone="brand">{p.level === "UG" ? "Undergraduate" : p.level === "PG" ? "Postgraduate" : p.level}</Badge>
                  <span className="text-[12.5px] text-muted">{p.durationTerms / 2} years</span>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {p.name}
                </h3>
                <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{p.about}</p>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-primary-700 dark:text-primary-300">
                  {p.department.name}
                  <Icon name="arrow" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- News + Events ---------- */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Eyebrow>Newsroom</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight">The latest from campus</h2>
            <div className="mt-8 space-y-5">
              {news.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`} className="group flex gap-5 rounded-2xl border border-line bg-bg p-5 transition-all hover:border-primary-300 hover:shadow-card">
                  <div className="hidden w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-800 sm:flex dark:bg-primary-950 dark:text-primary-300">
                    <span className="font-display text-xl font-bold">{new Date(n.publishedAt).getDate()}</span>
                    <span className="text-[11px] font-semibold uppercase">{new Date(n.publishedAt).toLocaleString("en", { month: "short" })}</span>
                  </div>
                  <div className="min-w-0">
                    <Badge tone="neutral">{n.tag}</Badge>
                    <h3 className="mt-2 font-semibold leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-300">{n.title}</h3>
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted">{n.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Happening soon</Eyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Events</h2>
            <div className="mt-8 space-y-4">
              {events.map((e) => (
                <Link key={e.id} href={`/events/${e.slug}`} className="group block rounded-2xl border border-line bg-bg p-5 transition-all hover:border-primary-300 hover:shadow-card">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                    {fmtDate(e.startsAt)} · {e.kind}
                  </p>
                  <h3 className="mt-1.5 font-semibold group-hover:text-primary-700 dark:group-hover:text-primary-300">{e.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                    <Icon name="pin" className="size-3.5" /> {e.location}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-primary-700 px-8 py-16 text-center text-white sm:px-16 dark:bg-primary-800">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-black/10 blur-2xl" />
          </div>
          <h2 className="relative font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your seat for 2026 is waiting.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-[15px] text-white/85">
            Applications close August 6. It takes about ten minutes — and our admissions team reads every statement of purpose.
          </p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/apply" className="rounded-xl bg-white px-7 py-3 text-[15px] font-semibold text-primary-800 shadow-sm transition-transform hover:scale-[1.03]">
              Apply now
            </Link>
            <Link href="/contact" className="rounded-xl border border-white/40 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10">
              Talk to admissions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
