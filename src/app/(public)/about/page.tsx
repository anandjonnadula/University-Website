import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description: "Aurora University — a NAAC A++ multidisciplinary university in Bengaluru, est. 1998. Our mission, milestones and leadership.",
};

const milestones = [
  ["1998", "Founded as Aurora Institute of Technology with 240 students and three engineering programs."],
  ["2006", "University status conferred; School of Management and Physical Sciences established."],
  ["2013", "First NAAC A accreditation; research park opens with 14 industry labs."],
  ["2019", "NAAC A++ re-accreditation; crossed 10,000 students and 25,000 alumni."],
  ["2024", "Quantum lab, 64×H100 GPU cluster and the UnivOS digital campus platform go live."],
  ["2026", "Ranked 14th in NIRF Engineering; ₹12-crore first-generation scholarship endowed."],
];

const values = [
  { icon: "flask", title: "Rigor", text: "We hold ourselves to evidence, peer review and honest measurement — in labs and in classrooms." },
  { icon: "users", title: "Access", text: "Talent is everywhere; opportunity isn't. Scholarships and mentoring keep the door open." },
  { icon: "sparkles", title: "Invention", text: "Students build real things for real people — startups, patents, open source, public policy." },
  { icon: "shield", title: "Integrity", text: "Transparent governance, auditable processes, zero tolerance for ragging and discrimination." },
];

const leadership = [
  ["Dr. Meera Krishnan", "Vice-Chancellor", "Former Director, National Institute of Advanced Studies; quantum physicist; Padma Shri (2021)."],
  ["Prof. Vikram Rao", "Dean, Engineering", "Systems and security researcher; 60+ publications; leads the UnivOS digital campus initiative."],
  ["Prof. Ritu Kapoor", "Dean, Management", "Ex-McKinsey partner; built the case-method MBA and the fintech specialization."],
  ["Priya Raman", "Registrar", "Two decades of university administration; architect of Aurora's paperless governance."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="max-w-3xl">
        <Eyebrow>About Aurora</Eyebrow>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Twenty-eight years of turning curiosity into consequence.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">
          Aurora University is a multidisciplinary, research-intensive university on a 220-acre campus in Bengaluru's
          Knowledge Corridor. We enroll 12,400 students across engineering, management, sciences and humanities, taught
          by 800 faculty — 92% of whom hold doctorates. Our mission is simple to say and hard to do:{" "}
          <em className="font-medium text-text">education that compounds for every student, regardless of where they start.</em>
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((v) => (
          <Card key={v.title} className="p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Icon name={v.icon} className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">{v.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{v.text}</p>
          </Card>
        ))}
      </div>

      <div className="mt-20 grid gap-14 lg:grid-cols-2">
        <div>
          <Eyebrow>Milestones</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight">The story so far</h2>
          <ol className="mt-8 space-y-0 border-l-2 border-primary-200 dark:border-primary-900">
            {milestones.map(([year, text]) => (
              <li key={year} className="relative pb-8 pl-8 last:pb-0">
                <span className="absolute -left-[9px] top-1 size-4 rounded-full border-4 border-bg bg-primary-600" />
                <p className="font-display text-lg font-bold text-primary-700 dark:text-primary-400">{year}</p>
                <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <Eyebrow>Leadership</Eyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight">Who steers the ship</h2>
          <div className="mt-8 space-y-4">
            {leadership.map(([name, role, bio]) => (
              <Card key={name} className="p-5">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-100 font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                    {name.replace(/^(Dr|Prof)\.?\s+/, "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <h3 className="font-semibold">{name}</h3>
                    <p className="text-[13px] font-medium text-primary-700 dark:text-primary-400">{role}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 rounded-3xl border border-line bg-surface p-8 sm:p-12">
        <div className="grid gap-8 text-center sm:grid-cols-4">
          {[
            ["220 acres", "Green campus, 40% solar-powered"],
            ["800 faculty", "92% with doctorates"],
            ["30,000+", "Alumni in 42 countries"],
            ["₹48 crore", "Sponsored research this year"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-display text-3xl font-semibold text-primary-700 dark:text-primary-400">{v}</p>
              <p className="mt-2 text-[13.5px] text-muted">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
