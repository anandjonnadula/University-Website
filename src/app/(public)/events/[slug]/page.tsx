import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { registerForEvent } from "@/lib/actions/public";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Badge, Card, Field, Input } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await db.campusEvent.findUnique({ where: { slug } });
  return { title: e?.title ?? "Event", description: e?.description.slice(0, 155) };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await db.campusEvent.findUnique({
    where: { slug },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) notFound();
  const seatsLeft = event.capacity - event._count.registrations;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <nav className="mb-6 text-[13px] text-muted" aria-label="Breadcrumb">
        <Link href="/events" className="hover:text-primary-700 dark:hover:text-primary-300">← All events</Link>
      </nav>
      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Badge tone="brand">{event.kind}</Badge>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">{event.title}</h1>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-muted">
            <span className="flex items-center gap-2"><Icon name="calendar" className="size-4" />{fmtDate(event.startsAt)} — {fmtDate(event.endsAt)}</span>
            <span className="flex items-center gap-2"><Icon name="clock" className="size-4" />{fmtDateTime(event.startsAt)}</span>
            <span className="flex items-center gap-2"><Icon name="pin" className="size-4" />{event.location}</span>
          </div>
          <p className="mt-6 text-[16px] leading-relaxed text-text/90">{event.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Capacity", event.capacity.toLocaleString("en-IN")],
              ["Registered", event._count.registrations.toLocaleString("en-IN")],
              ["Seats left", seatsLeft.toLocaleString("en-IN")],
            ].map(([k, v]) => (
              <Card key={k} className="p-5 text-center">
                <p className="font-display text-2xl font-semibold text-primary-700 dark:text-primary-400">{v}</p>
                <p className="mt-1 text-[12.5px] text-muted">{k}</p>
              </Card>
            ))}
          </div>
        </div>

        <aside>
          <Card className="sticky top-24 p-6">
            <h2 className="font-semibold">Register for this event</h2>
            <p className="mt-1 text-[13px] text-muted">Free — a confirmation is emailed instantly.</p>
            {seatsLeft > 0 ? (
              <ActionForm action={registerForEvent} className="mt-5 space-y-4">
                <input type="hidden" name="eventId" value={event.id} />
                <Field label="Full name">
                  <Input name="name" required placeholder="Your name" autoComplete="name" />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
                </Field>
                <SubmitButton className="w-full" size="lg">Reserve my seat</SubmitButton>
              </ActionForm>
            ) : (
              <p className="mt-5 rounded-xl bg-warning-soft px-4 py-3 text-[13.5px] font-medium text-warning dark:bg-warning/15">
                This event is fully booked. Follow the newsroom for the next edition.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
