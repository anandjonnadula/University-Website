import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, inr } from "@/lib/format";
import { issueBook, returnBook } from "@/lib/actions/staff";
import { ActionForm, QuickAction, SubmitButton } from "@/components/action-form";
import { Badge, Card, CardHeader, EmptyState, Field, Input, PageHeader, Stat, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LibraryAdminPage() {
  await requireSession("LIBRARIAN");
  const [items, activeLoans] = await Promise.all([
    db.libraryItem.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] }),
    db.loan.findMany({
      where: { returnedAt: null },
      include: { item: true, borrower: true },
      orderBy: { dueAt: "asc" },
    }),
  ]);
  const overdue = activeLoans.filter((l) => l.dueAt < new Date());

  return (
    <div className="space-y-6">
      <PageHeader title="Catalogue & circulation" sub="Issue, return and track the central collection" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Titles in catalogue" value={items.length} icon="library" />
        <Stat label="Active loans" value={activeLoans.length} icon="users" tone="info" />
        <Stat label="Overdue" value={overdue.length} icon="warn" tone={overdue.length ? "danger" : "success"} />
      </div>

      <Card>
        <CardHeader title="Issue a book" sub="Limit: students 4 books / 14 days · faculty 10 books / 30 days" />
        <div className="p-6">
          <ActionForm action={issueBook} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <Field label="ISBN">
              <Input name="isbn" required placeholder="e.g. 978810000002" />
            </Field>
            <Field label="Borrower email">
              <Input name="email" type="email" required placeholder="student@aurora.edu" />
            </Field>
            <div className="self-end">
              <SubmitButton>Issue</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </Card>

      <Card>
        <CardHeader title="Active loans" sub="Returns compute overdue fines automatically (₹5/day)" />
        {activeLoans.length === 0 ? (
          <EmptyState icon="book" title="Nothing on loan" />
        ) : (
          <Table head={["Title", "Borrower", "Issued", "Due", "Fine", ""]}>
            {activeLoans.map((l) => {
              const days = Math.max(0, Math.floor((Date.now() - l.dueAt.getTime()) / 86400_000));
              return (
                <tr key={l.id} className="hover:bg-surface-2">
                  <Td className="font-medium">{l.item.title}</Td>
                  <Td>
                    <p>{l.borrower.name}</p>
                    <p className="text-[12px] text-muted">{l.borrower.email}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(l.issuedAt)}</Td>
                  <Td className="whitespace-nowrap">
                    {fmtDate(l.dueAt)} {days > 0 && <Badge tone="danger">{days}d late</Badge>}
                  </Td>
                  <Td className="tabular-nums">{days > 0 ? inr(days * 500) : "—"}</Td>
                  <Td>
                    <QuickAction action={returnBook} fields={{ loanId: l.id }} label="Return" variant="secondary" />
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Catalogue" sub={`${items.reduce((s, i) => s + i.copiesTotal, 0)} physical copies`} />
        <Table head={["Title", "Authors", "Category", "ISBN", "Available"]}>
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-surface-2">
              <Td className="font-medium">{c.title}</Td>
              <Td className="text-muted">{c.authors}</Td>
              <Td className="text-muted">{c.category}</Td>
              <Td className="font-mono text-[12px] text-muted">{c.isbn}</Td>
              <Td>
                <Badge tone={c.copiesAvailable ? "success" : "danger"}>{c.copiesAvailable}/{c.copiesTotal}</Badge>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
