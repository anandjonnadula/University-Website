import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, inr } from "@/lib/format";
import { recordOfflinePayment } from "@/lib/actions/staff";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, Field, Input, PageHeader, Select, Stat, StatusBadge, Table, Td } from "@/components/ui";
import { Donut } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireSession("ACCOUNTS", "ADMIN");
  const invoices = await db.invoice.findMany({
    include: { student: { include: { user: true, program: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  const collected = invoices.reduce((s, i) => s + i.paidMinor, 0);
  const outstanding = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const byStatus = (s: string) => invoices.filter((i) => i.status === s).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Fees & invoices" sub="Collection console — record offline payments, chase overdues" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Collected" value={inr(collected)} icon="check" tone="success" />
        <Stat label="Outstanding" value={inr(outstanding)} icon="clock" tone="warning" />
        <Stat label="Overdue invoices" value={overdue.length} icon="warn" tone={overdue.length ? "danger" : "success"} />
        <Stat label="Collection rate" value={`${Math.round((collected / Math.max(collected + outstanding, 1)) * 100)}%`} icon="chart" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader title="Invoice status mix" />
          <div className="p-6">
            <Donut
              data={[
                { label: "Paid", value: byStatus("paid") },
                { label: "Partial", value: byStatus("partial") },
                { label: "Pending", value: byStatus("pending") },
                { label: "Overdue", value: byStatus("overdue") },
              ]}
              centerValue={String(invoices.length)}
              centerLabel="invoices"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Record an offline payment" sub="Cash / DD / counter payments — the student is notified instantly" />
          <div className="p-6">
            <ActionForm action={recordOfflinePayment} className="grid gap-4 sm:grid-cols-3">
              <Field label="Invoice number">
                <Input name="invoiceNumber" placeholder="INV-2601" required />
              </Field>
              <Field label="Amount (₹)">
                <Input name="amount" type="number" min={1} required placeholder="e.g. 62500" />
              </Field>
              <Field label="Method">
                <Select name="method" defaultValue="cash">
                  <option value="cash">Cash</option>
                  <option value="dd">Demand draft</option>
                  <option value="netbanking">Bank transfer</option>
                </Select>
              </Field>
              <div className="sm:col-span-3">
                <SubmitButton>Record payment</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="All invoices" sub="Sorted with unpaid and overdue first" />
        <Table head={["Invoice", "Student", "Term", "Net", "Paid", "Due date", "Status"]}>
          {invoices.map((i) => (
            <tr key={i.id} className="hover:bg-surface-2">
              <Td className="font-mono text-[12.5px] font-semibold">{i.number}</Td>
              <Td>
                <p className="font-medium">{i.student.user.name}</p>
                <p className="text-[12px] text-muted">{i.student.rollNo}</p>
              </Td>
              <Td className="text-muted">{i.termLabel}</Td>
              <Td className="tabular-nums">{inr(i.netMinor)}</Td>
              <Td className="tabular-nums text-success">{inr(i.paidMinor)}</Td>
              <Td className="whitespace-nowrap text-muted">{fmtDate(i.dueDate)}</Td>
              <Td><StatusBadge status={i.status} /></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
