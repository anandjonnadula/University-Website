import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Events",
  description: "Seminars, festivals, sports and convocation — upcoming events at Aurora University, open for registration.",
};

export const dynamic = "force-dynamic";

const kindTone: Record<string, string> = { seminar: "info", cultural: "brand", sports: "success", convocation: "warning", workshop: "info" };

export default async function EventsPage() {
  const events = await db.campusEvent.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Campus life</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Events</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Most events are open to the public — register free with just your name and email.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {events.map((e) => {
          const seatsLeft = e.capacity - e._count.registrations;
          return (
            <Link key={e.id} href={`/events/${e.slug}`} className="group">
              <Card className="flex h-full flex-col p-6 transition-all group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:shadow-pop">
                <div className="flex items-center justify-between gap-3">
                  <Badge tone={kindTone[e.kind] ?? "neutral"}>{e.kind}</Badge>
                  <span className="text-[12.5px] font-semibold text-muted">
                    {seatsLeft > 0 ? `${seatsLeft.toLocaleString("en-IN")} seats left` : "Fully booked"}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-[21px] font-semibold leading-tight tracking-tight group-hover:text-primary-700 dark:group-hover:text-primary-300">
                  {e.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">{e.description}</p>
                <div className="mt-auto flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-4 text-[13px] text-muted">
                  <span className="flex items-center gap-1.5"><Icon name="calendar" className="size-3.5" />{fmtDate(e.startsAt)}</span>
                  <span className="flex items-center gap-1.5"><Icon name="pin" className="size-3.5" />{e.location}</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
