import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, CardHeader, Eyebrow } from "@/components/ui";
import { HBarList } from "@/components/charts";

export const metadata: Metadata = {
  title: "Placements",
  description: "94% placement rate, ₹52 LPA top offer, 138 recruiters — placement outcomes and the companies that hire at Aurora University.",
};

export const dynamic = "force-dynamic";

const outcomes = [
  ["94%", "Students placed, 2025–26"],
  ["₹52 LPA", "Highest offer (Razorpay)"],
  ["₹8.6 LPA", "Median CTC, up 18% YoY"],
  ["138", "Recruiting companies"],
];

const sectorData = [
  { label: "Product & SaaS", value: 118 },
  { label: "IT Services", value: 104 },
  { label: "Fintech", value: 62 },
  { label: "Core Engineering", value: 58 },
  { label: "Consulting", value: 41 },
  { label: "Others", value: 29 },
];

export default async function PlacementsPage() {
  const companies = await db.company.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Careers</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Placements</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        A dedicated placement cell, structured preparation from year one, and recruiters who come back every season.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {outcomes.map(([v, l]) => (
          <Card key={l} className="p-6">
            <p className="font-display text-3xl font-semibold tracking-tight text-primary-700 dark:text-primary-400">{v}</p>
            <p className="mt-1.5 text-[13.5px] text-muted">{l}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader title="Offers by sector, 2025–26" sub="412 total offers across 138 recruiters" />
          <div className="p-6">
            <HBarList data={sectorData} format={(v) => `${v} offers`} />
          </div>
        </Card>
        <Card>
          <CardHeader title="How the cell prepares you" />
          <ul className="space-y-4 p-6 text-[14px] leading-relaxed">
            {[
              ["Semester 3–4", "Aptitude and communication bootcamps; coding practice tracks with weekly contests."],
              ["Semester 5", "Resume clinics, LinkedIn/GitHub reviews, and the first round of mock interviews with alumni."],
              ["Semester 6", "Paid internships with 138 partner companies — 80% convert to pre-placement offers."],
              ["Semester 7–8", "On-campus drives, off-campus referrals through the alumni network, and offer negotiation support."],
            ].map(([when, what]) => (
              <li key={when} className="flex gap-4">
                <span className="w-28 shrink-0 text-[12.5px] font-bold uppercase tracking-wide text-primary-700 dark:text-primary-400">{when}</span>
                <span className="text-muted">{what}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold tracking-tight">Recruiters on campus</h2>
      <p className="mt-2 text-[14px] text-muted">A sample of companies with live or recent drives.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {companies.map((c) => (
          <Card key={c.id} className="p-5">
            <p className="font-semibold">{c.name}</p>
            <p className="mt-1 text-[13px] text-muted">{c.sector}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
