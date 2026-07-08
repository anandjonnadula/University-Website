import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { saveNewsPost } from "@/lib/actions/staff";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  await requireSession("ADMIN");
  const [posts, events, leads] = await Promise.all([
    db.newsPost.findMany({ orderBy: { publishedAt: "desc" } }),
    db.campusEvent.findMany({ include: { _count: { select: { registrations: true } } }, orderBy: { startsAt: "asc" } }),
    db.lead.count({ where: { status: "new" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website CMS"
        sub={`Publish to the public site instantly · ${leads} new enquiries waiting in Leads`}
      />

      <Card>
        <CardHeader title="Publish a news post" sub="SEO validation enforced: title ≤ 90 chars, excerpt 20–160 chars" />
        <div className="p-6">
          <ActionForm action={saveNewsPost} className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field label="Title">
              <Input name="title" required placeholder="Headline (8–90 characters)" />
            </Field>
            <Field label="Tag">
              <Select name="tag" defaultValue="Campus">
                {["Campus", "Research", "Placements", "Academics", "Community", "Sports"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Excerpt (becomes the meta description)">
                <Input name="excerpt" required placeholder="One-sentence summary (20–160 characters)" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Body" hint="Separate paragraphs with a blank line">
                <Textarea name="body" rows={5} required placeholder="The full story…" />
              </Field>
            </div>
            <div>
              <SubmitButton>Publish to public site</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card>
        <CardHeader title="Published news" sub={`${posts.length} posts live on /news`} />
        <ul className="divide-y divide-line">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Badge tone="neutral">{p.tag}</Badge>
              <div className="min-w-0 flex-1">
                <Link href={`/news/${p.slug}`} className="text-[14px] font-medium hover:text-primary-700 dark:hover:text-primary-300">
                  {p.title}
                </Link>
                <p className="text-[12px] text-muted">/news/{p.slug}</p>
              </div>
              <span className="text-[12.5px] text-muted">{fmtDate(p.publishedAt)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Events on the public site" sub="Registrations are captured from /events" />
        <ul className="divide-y divide-line">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Badge tone="brand">{e.kind}</Badge>
              <div className="min-w-0 flex-1">
                <Link href={`/events/${e.slug}`} className="text-[14px] font-medium hover:text-primary-700 dark:hover:text-primary-300">
                  {e.title}
                </Link>
                <p className="text-[12px] text-muted">{fmtDate(e.startsAt)} · {e.location}</p>
              </div>
              <span className="text-[12.5px] font-semibold">{e._count.registrations}/{e.capacity} registered</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
