import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge, Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "News",
  description: "News and announcements from Aurora University.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const posts = await db.newsPost.findMany({ where: { published: true }, orderBy: { publishedAt: "desc" } });
  const [hero, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Newsroom</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">News</h1>

      {hero && (
        <Link href={`/news/${hero.slug}`} className="group mt-10 block">
          <Card className="grid gap-8 p-8 transition-all group-hover:border-primary-300 group-hover:shadow-pop lg:grid-cols-[1fr_320px] lg:p-10">
            <div>
              <div className="flex items-center gap-3">
                <Badge tone="brand">{hero.tag}</Badge>
                <span className="text-[13px] text-muted">{fmtDate(hero.publishedAt)}</span>
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-300">
                {hero.title}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{hero.excerpt}</p>
              <p className="mt-5 text-[13.5px] font-semibold text-primary-700 dark:text-primary-300">Read the story →</p>
            </div>
            <div className="hidden items-center justify-center rounded-2xl bg-primary-50 lg:flex dark:bg-primary-950">
              <span className="font-display text-7xl font-bold text-primary-300 dark:text-primary-800">AU</span>
            </div>
          </Card>
        </Link>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((n) => (
          <Link key={n.id} href={`/news/${n.slug}`} className="group">
            <Card className="flex h-full flex-col p-6 transition-all group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:shadow-card">
              <div className="flex items-center gap-3">
                <Badge tone="neutral">{n.tag}</Badge>
                <span className="text-[12.5px] text-muted">{fmtDate(n.publishedAt)}</span>
              </div>
              <h2 className="mt-3 font-semibold leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-300">{n.title}</h2>
              <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-muted">{n.excerpt}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
