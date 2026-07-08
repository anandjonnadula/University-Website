import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, inr } from "@/lib/format";
import { payInvoice } from "@/lib/actions/student";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, Field, Input, PageHeader, Select, Stat, StatusBadge, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function FeesPage() {
  const { student } = await getSessionStudent();
  const invoices = await db.invoice.findMany({
    where: { studentId: student.id },
    include: { payments: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  const outstanding = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
  const paidTotal = invoices.reduce((s, i) => s + i.paidMinor, 0);
  const openInvoices = invoices.filter((i) => i.paidMinor < i.netMinor);

  return (
    <div className="space-y-6">
      <PageHeader title="Fees & payments" sub="Invoices, head-wise breakup and online payment" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Outstanding" value={inr(outstanding)} icon="warn" tone={outstanding > 0 ? "warning" : "success"} />
        <Stat label="Paid to date" value={inr(paidTotal)} icon="check" tone="success" />
        <Stat label="Invoices" value={invoices.length} icon="card" />
      </div>

      {openInvoices.map((inv) => {
        const due = inv.netMinor - inv.paidMinor;
        const heads: { head: string; amountMinor: number }[] = JSON.parse(inv.lineItems);
        return (
          <Card key={inv.id}>
            <CardHeader
              title={`${inv.number} — ${inv.termLabel}`}
              sub={`Due ${fmtDate(inv.dueDate)}`}
              action={<StatusBadge status={inv.status} />}
            />
            <div className="grid gap-6 p-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Breakup</p>
                <dl className="mt-3 space-y-2">
                  {heads.map((h) => (
                    <div key={h.head} className="flex justify-between border-b border-line pb-2 text-[13.5px] last:border-0">
                      <dt className="text-muted">{h.head}</dt>
                      <dd className="font-medium tabular-nums">{inr(h.amountMinor)}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between pt-1 text-[14px] font-semibold">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{inr(inv.netMinor)}</dd>
                  </div>
                  {inv.paidMinor > 0 && (
                    <div className="flex justify-between text-[13.5px] text-success">
                      <dt>Paid</dt>
                      <dd className="tabular-nums">− {inr(inv.paidMinor)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between rounded-lg bg-warning-soft px-3 py-2 text-[14px] font-bold text-warning dark:bg-warning/15">
                    <dt>Balance</dt>
                    <dd className="tabular-nums">{inr(due)}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-2xl bg-surface-2 p-5">
                <p className="text-[13px] font-semibold">Pay online</p>
                <p className="mt-1 text-[12px] text-muted">Simulated gateway — instant receipt and notification.</p>
                <ActionForm action={payInvoice} className="mt-4 space-y-3">
                  <input type="hidden" name="invoiceId" value={inv.id} />
                  <Field label="Amount (₹)">
                    <Input name="amount" type="number" min={1} max={Math.round(due / 100)} defaultValue={Math.round(due / 100)} required />
                  </Field>
                  <Field label="Method">
                    <Select name="method" defaultValue="upi">
                      <option value="upi">UPI</option>
                      <option value="card">Credit / Debit card</option>
                      <option value="netbanking">Net banking</option>
                    </Select>
                  </Field>
                  <SubmitButton className="w-full">Pay {inr(due)}</SubmitButton>
                </ActionForm>
              </div>
            </div>
          </Card>
        );
      })}

      <Card>
        <CardHeader title="Payment history" sub="Every transaction against your account" />
        <Table head={["Date", "Invoice", "Method", "Reference", "Amount"]}>
          {invoices.flatMap((inv) =>
            inv.payments.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2">
                <Td className="whitespace-nowrap text-muted">{fmtDate(p.createdAt)}</Td>
                <Td className="font-medium">{inv.number}</Td>
                <Td className="uppercase">{p.method}</Td>
                <Td className="font-mono text-[12.5px] text-muted">{p.reference}</Td>
                <Td className="font-semibold tabular-nums">{inr(p.amountMinor)}</Td>
              </tr>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
