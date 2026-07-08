import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge, Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({ where: { slug } });
  return { title: post?.title ?? "News", description: post?.excerpt };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({ where: { slug } });
  if (!post || !post.published) notFound();
  const more = await db.newsPost.findMany({
    where: { published: true, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <nav className="mb-6 text-[13px] text-muted" aria-label="Breadcrumb">
        <Link href="/news" className="hover:text-primary-700 dark:hover:text-primary-300">← All news</Link>
      </nav>
      <div className="flex items-center gap-3">
        <Badge tone="brand">{post.tag}</Badge>
        <span className="text-[13px] text-muted">{fmtDate(post.publishedAt)}</span>
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight">{post.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{post.excerpt}</p>
      <div className="prose-univ mt-8 border-t border-line pt-8 text-[15.5px] text-text/90">
        {post.body.split("\n\n").map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {more.length > 0 && (
        <div className="mt-14 border-t border-line pt-8">
          <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted">More from the newsroom</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {more.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="group">
                <Card className="h-full p-4 transition-all group-hover:border-primary-300">
                  <p className="text-[11.5px] text-muted">{fmtDate(n.publishedAt)}</p>
                  <p className="mt-1.5 text-[13.5px] font-semibold leading-snug group-hover:text-primary-700 dark:group-hover:text-primary-300">
                    {n.title}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
