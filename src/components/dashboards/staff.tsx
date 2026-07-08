import Link from "next/link";
import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/rbac";
import { inr, titleCase } from "@/lib/format";
import { Card, CardHeader, Stat } from "@/components/ui";
import { Donut, HBarList } from "@/components/charts";

type Tile = { label: string; value: string | number; icon: string; tone?: string; hint?: React.ReactNode };

export async function StaffDashboard({ session }: { session: Session }) {
  let tiles: Tile[] = [];
  let panelTitle = "Overview";
  let panel: React.ReactNode = null;
  let cta: { href: string; label: string } | null = null;

  switch (session.role) {
    case "ADMISSION_OFFICER": {
      const apps = await db.application.findMany();
      const byStatus = new Map<string, number>();
      for (const a of apps) byStatus.set(a.status, (byStatus.get(a.status) ?? 0) + 1);
      const newLeads = await db.lead.count({ where: { status: "new" } });
      tiles = [
        { label: "Total applications", value: apps.length, icon: "inbox" },
        { label: "Awaiting review", value: (byStatus.get("submitted") ?? 0) + (byStatus.get("under_review") ?? 0), icon: "clock", tone: "warning" },
        { label: "Offers out", value: byStatus.get("offered") ?? 0, icon: "send", tone: "info" },
        { label: "New enquiries", value: newLeads, icon: "mail" },
      ];
      panelTitle = "Application funnel — 2026–27 cycle";
      const order = ["submitted", "under_review", "shortlisted", "offered", "accepted", "enrolled", "waitlisted", "rejected"];
      panel = (
        <HBarList
          data={order.filter((s) => byStatus.get(s)).map((s) => ({ label: titleCase(s), value: byStatus.get(s)! }))}
          format={(v) => `${v}`}
        />
      );
      cta = { href: "/portal/admissions", label: "Open application queue →" };
      break;
    }
    case "ACCOUNTS": {
      const invoices = await db.invoice.findMany();
      const collected = invoices.reduce((s, i) => s + i.paidMinor, 0);
      const outstanding = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
      const overdue = invoices.filter((i) => i.status === "overdue");
      tiles = [
        { label: "Collected this term", value: inr(collected), icon: "card", tone: "success" },
        { label: "Outstanding", value: inr(outstanding), icon: "clock", tone: "warning" },
        { label: "Overdue invoices", value: overdue.length, icon: "warn", tone: "danger" },
        { label: "Total invoices", value: invoices.length, icon: "inbox" },
      ];
      panelTitle = "Collection status";
      panel = (
        <Donut
          data={[
            { label: "Paid", value: invoices.filter((i) => i.status === "paid").length },
            { label: "Partial", value: invoices.filter((i) => i.status === "partial").length },
            { label: "Pending", value: invoices.filter((i) => i.status === "pending").length },
            { label: "Overdue", value: overdue.length },
          ]}
          centerValue={`${Math.round((collected / Math.max(collected + outstanding, 1)) * 100)}%`}
          centerLabel="collected"
        />
      );
      cta = { href: "/portal/finance", label: "Open fee console →" };
      break;
    }
    case "EXAM_CONTROLLER": {
      const [provisional, moderated, published, exams] = await Promise.all([
        db.result.count({ where: { status: "provisional" } }),
        db.result.count({ where: { status: "moderated" } }),
        db.result.count({ where: { status: "published" } }),
        db.exam.count({ where: { status: "scheduled" } }),
      ]);
      tiles = [
        { label: "Provisional results", value: provisional, icon: "clock", tone: "warning" },
        { label: "Moderated, unpublished", value: moderated, icon: "check", tone: "info" },
        { label: "Published results", value: published, icon: "award", tone: "success" },
        { label: "Upcoming exams", value: exams, icon: "calendar" },
      ];
      panelTitle = "Result pipeline";
      panel = (
        <HBarList
          data={[
            { label: "Provisional", value: provisional },
            { label: "Moderated", value: moderated },
            { label: "Published", value: published },
          ]}
        />
      );
      cta = { href: "/portal/exams/results", label: "Process results →" };
      break;
    }
    case "LIBRARIAN": {
      const [items, activeLoans, overdueLoans] = await Promise.all([
        db.libraryItem.findMany(),
        db.loan.count({ where: { returnedAt: null } }),
        db.loan.findMany({ where: { returnedAt: null, dueAt: { lt: new Date() } }, include: { item: true, borrower: true } }),
      ]);
      const copies = items.reduce((s, i) => s + i.copiesTotal, 0);
      tiles = [
        { label: "Catalogue titles", value: items.length, icon: "library" },
        { label: "Total copies", value: copies, icon: "book" },
        { label: "Books on loan", value: activeLoans, icon: "users", tone: "info" },
        { label: "Overdue", value: overdueLoans.length, icon: "warn", tone: overdueLoans.length ? "danger" : "success" },
      ];
      panelTitle = "Overdue loans needing follow-up";
      panel = overdueLoans.length ? (
        <ul className="space-y-3">
          {overdueLoans.slice(0, 6).map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-4 text-[13.5px]">
              <span className="min-w-0 truncate">“{l.item.title}” — {l.borrower.name}</span>
              <span className="shrink-0 font-semibold text-danger">
                {Math.floor((Date.now() - l.dueAt.getTime()) / 86400000)}d late
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No overdue loans. The shelves thank you.</p>
      );
      cta = { href: "/portal/library-admin", label: "Open circulation desk →" };
      break;
    }
    case "WARDEN": {
      const [hostels, allocations, pendingOutpasses] = await Promise.all([
        db.hostel.findMany({ include: { rooms: { include: { allocations: { where: { status: "active" } } } } } }),
        db.hostelAllocation.count({ where: { status: "active" } }),
        db.outpass.count({ where: { status: "pending" } }),
      ]);
      const capacity = hostels.reduce((s, h) => s + h.capacity, 0);
      tiles = [
        { label: "Residents", value: allocations, icon: "users" },
        { label: "Capacity", value: capacity, icon: "building" },
        { label: "Occupancy", value: `${Math.round((allocations / Math.max(capacity, 1)) * 100)}%`, icon: "chart", tone: "info" },
        { label: "Pending outpasses", value: pendingOutpasses, icon: "clock", tone: pendingOutpasses ? "warning" : "success" },
      ];
      panelTitle = "Occupancy by hostel";
      panel = (
        <HBarList
          data={hostels.map((h) => ({
            label: h.name,
            value: h.rooms.reduce((s, r) => s + r.allocations.length, 0),
          }))}
          format={(v) => `${v} residents`}
        />
      );
      cta = { href: "/portal/hostel-admin", label: "Review outpasses →" };
      break;
    }
    case "PLACEMENT_OFFICER": {
      const [postings, apps, companies] = await Promise.all([
        db.jobPosting.findMany({ where: { status: "open" } }),
        db.placementApplication.findMany(),
        db.company.count(),
      ]);
      const byStage = new Map<string, number>();
      for (const a of apps) byStage.set(a.status, (byStage.get(a.status) ?? 0) + 1);
      tiles = [
        { label: "Open postings", value: postings.length, icon: "briefcase" },
        { label: "Partner companies", value: companies, icon: "building" },
        { label: "Applications", value: apps.length, icon: "inbox" },
        { label: "Offers made", value: byStage.get("offered") ?? 0, icon: "award", tone: "success" },
      ];
      panelTitle = "Pipeline by stage";
      panel = (
        <HBarList
          data={["applied", "shortlisted", "interview", "offered", "accepted"].map((s) => ({ label: titleCase(s), value: byStage.get(s) ?? 0 }))}
        />
      );
      cta = { href: "/portal/placement-admin", label: "Manage drives →" };
      break;
    }
    default: {
      // PRINCIPAL and ADMIN get the executive snapshot
      const [students, faculty, apps, invoices, complaints] = await Promise.all([
        db.student.count(),
        db.facultyProfile.count(),
        db.application.count(),
        db.invoice.findMany(),
        db.complaint.count({ where: { status: { in: ["open", "in_progress"] } } }),
      ]);
      const collected = invoices.reduce((s, i) => s + i.paidMinor, 0);
      const outstanding = invoices.reduce((s, i) => s + (i.netMinor - i.paidMinor), 0);
      tiles = [
        { label: "Enrolled students", value: students, icon: "users" },
        { label: "Faculty", value: faculty, icon: "grad" },
        { label: "Fees collected", value: inr(collected), icon: "card", tone: "success" },
        { label: "Open grievances", value: complaints, icon: "warn", tone: complaints ? "warning" : "success" },
      ];
      panelTitle = "Institution snapshot";
      panel = (
        <HBarList
          data={[
            { label: "Applications (2026–27)", value: apps },
            { label: "Students enrolled", value: students },
            { label: "Fee collection %", value: Math.round((collected / Math.max(collected + outstanding, 1)) * 100) },
          ]}
        />
      );
      cta = { href: "/portal/analytics", label: "Full analytics →" };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome, {session.name}</h1>
        <p className="mt-1 text-sm text-muted">{ROLE_LABELS[session.role]} console · Aurora University</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Stat key={t.label} label={t.label} value={t.value} icon={t.icon} tone={t.tone ?? "brand"} hint={t.hint} />
        ))}
      </div>
      <Card>
        <CardHeader
          title={panelTitle}
          action={cta && <Link href={cta.href} className="text-[13px] font-semibold text-primary-700 dark:text-primary-300">{cta.label}</Link>}
        />
        <div className="p-6">{panel}</div>
      </Card>
    </div>
  );
}
