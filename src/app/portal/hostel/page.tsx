import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/format";
import { requestOutpass } from "@/lib/actions/student";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, EmptyState, Field, Input, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function HostelPage() {
  const { student } = await getSessionStudent();
  const [allocation, outpasses] = await Promise.all([
    db.hostelAllocation.findFirst({
      where: { studentId: student.id, status: "active" },
      include: { room: { include: { hostel: true } } },
    }),
    db.outpass.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!allocation) {
    return (
      <div>
        <PageHeader title="Hostel" />
        <Card>
          <EmptyState
            icon="building"
            title="You're a day scholar"
            hint="No hostel allocation on record. To apply for hostel accommodation, contact the warden's office or raise a request."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Hostel" sub="Your allocation, outpasses and hostel rules" />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Your room</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon name="building" className="size-7" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold">{allocation.room.number}</p>
                <p className="text-[13px] text-muted">{allocation.room.hostel.name}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-2.5 text-[13.5px]">
              {[
                ["Room type", `${allocation.room.capacity}-sharing`],
                ["In-time", "9:30 PM daily"],
                ["Mess", "Included · ₹45,000/semester"],
                ["Warden", "Rajesh Kumar · ext. 2100"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-line pb-2 last:border-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="p-6">
            <p className="flex items-center gap-2 text-[14px] font-semibold">
              <Icon name="send" className="size-4 text-primary-600" /> Request an outpass
            </p>
            <p className="mt-1 text-[12.5px] text-muted">Needed for overnight or out-of-town travel. The warden decides within hours.</p>
            <ActionForm action={requestOutpass} className="mt-4 space-y-3">
              <Field label="Reason">
                <Textarea name="reason" rows={2} required placeholder="Where and why?" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Out at">
                  <Input name="outAt" type="datetime-local" required />
                </Field>
                <Field label="Back by">
                  <Input name="expectedInAt" type="datetime-local" required />
                </Field>
              </div>
              <SubmitButton className="w-full">Submit request</SubmitButton>
            </ActionForm>
          </Card>
        </div>

        <Card>
          <CardHeader title="Outpass history" sub="Requests and decisions" />
          {outpasses.length === 0 ? (
            <EmptyState icon="inbox" title="No outpasses yet" />
          ) : (
            <ul className="divide-y divide-line">
              {outpasses.map((o) => (
                <li key={o.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium">{o.reason}</p>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {fmtDateTime(o.outAt)} → {fmtDateTime(o.expectedInAt)}
                    </p>
                    {o.decidedBy && <p className="mt-0.5 text-[12px] text-muted">Decided by {o.decidedBy}</p>}
                  </div>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
