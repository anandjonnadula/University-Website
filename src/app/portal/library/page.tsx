import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, inr, relDays } from "@/lib/format";
import { Badge, Card, CardHeader, EmptyState, PageHeader, Table, Td } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await requireSession();
  const [loans, catalogue] = await Promise.all([
    db.loan.findMany({ where: { borrowerId: session.sub }, include: { item: true }, orderBy: { issuedAt: "desc" } }),
    db.libraryItem.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] }),
  ]);
  const active = loans.filter((l) => !l.returnedAt);
  const fines = loans.reduce((s, l) => s + l.fineMinor, 0) + active.reduce((s, l) => (l.dueAt < new Date() ? s + Math.floor((Date.now() - l.dueAt.getTime()) / 86400_000) * 500 : s), 0);
  const categories = [...new Set(catalogue.map((c) => c.category))];

  return (
    <div className="space-y-6">
      <PageHeader title="Library" sub="Your loans and the searchable central catalogue" />

      <Card>
        <CardHeader title="My loans" sub={`${active.length} active · fines accrued ${inr(fines)} · borrow limit 4 books / 14 days`} />
        {active.length === 0 ? (
          <EmptyState icon="library" title="No books checked out" hint="Visit the circulation desk with your digital ID to borrow." />
        ) : (
          <Table head={["Title", "Issued", "Due", "Status"]}>
            {active.map((l) => {
              const overdue = l.dueAt < new Date();
              return (
                <tr key={l.id} className="hover:bg-surface-2">
                  <Td>
                    <p className="font-medium">{l.item.title}</p>
                    <p className="text-[12.5px] text-muted">{l.item.authors}</p>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{fmtDate(l.issuedAt)}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(l.dueAt)}</Td>
                  <Td>
                    {overdue ? <Badge tone="danger">Overdue · {relDays(l.dueAt)}</Badge> : <Badge tone="success">Due {relDays(l.dueAt)}</Badge>}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader title={cat} sub={`${catalogue.filter((c) => c.category === cat).length} titles`} />
          <Table head={["Title", "Authors", "ISBN", "Availability"]}>
            {catalogue
              .filter((c) => c.category === cat)
              .map((c) => (
                <tr key={c.id} className="hover:bg-surface-2">
                  <Td className="font-medium">{c.title}</Td>
                  <Td className="text-muted">{c.authors}</Td>
                  <Td className="font-mono text-[12px] text-muted">{c.isbn}</Td>
                  <Td>
                    <Badge tone={c.copiesAvailable > 0 ? "success" : "danger"}>
                      {c.copiesAvailable > 0 ? `${c.copiesAvailable} of ${c.copiesTotal} available` : "All copies issued"}
                    </Badge>
                  </Td>
                </tr>
              ))}
          </Table>
        </Card>
      ))}
    </div>
  );
}
