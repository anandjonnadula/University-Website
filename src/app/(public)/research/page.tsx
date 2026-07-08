import type { Metadata } from "next";
import { Card, Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Research",
  description: "Research centres, sponsored projects and publications at Aurora University — quantum materials, AI systems, EV mobility and more.",
};

const centres = [
  { icon: "sparkles", name: "Centre for Trustworthy AI", head: "Dr. Neha Gupta", blurb: "Robustness, interpretability and evaluation of ML systems; 64×H100 GPU cluster; industry consortium with three product companies." },
  { icon: "flask", name: "Quantum Materials Lab", head: "Dr. Karthik Nair", blurb: "12-qubit superconducting testbed with cloud access for undergraduates; collaboration with TIFR and two national labs." },
  { icon: "chart", name: "Systems & Security Group", head: "Prof. Vikram Rao", blurb: "Operating systems, distributed databases and campus-scale SDN testbeds; 3 patents granted this year." },
  { icon: "building", name: "EV Mobility Centre", head: "Prof. Anil Joshi", blurb: "Powertrain design and battery analytics with OEM partners; student-built Formula EV team races nationally." },
];

const numbers = [
  ["₹48 crore", "Sponsored research funding"],
  ["612", "Publications this year"],
  ["21", "Patents filed"],
  ["94", "PhD scholars in residence"],
];

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Research</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Research that leaves the lab</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Four flagship centres, undergraduate research from the second year, and an open-access-first publication policy.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {numbers.map(([v, l]) => (
          <Card key={l} className="p-6">
            <p className="font-display text-3xl font-semibold tracking-tight text-primary-700 dark:text-primary-400">{v}</p>
            <p className="mt-1.5 text-[13.5px] text-muted">{l}</p>
          </Card>
        ))}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {centres.map((c) => (
          <Card key={c.name} className="p-7">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              <Icon name={c.icon} className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">{c.name}</h2>
            <p className="mt-1 text-[13px] font-medium text-primary-700 dark:text-primary-400">Lead: {c.head}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">{c.blurb}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-12 p-8">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Undergraduate research, by design</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["Year 2 — Apprentice", "Join a lab as a research apprentice; every centre reserves seats for second-years."],
            ["Year 3 — Contributor", "Own a workstream on a sponsored project; travel grants for your first conference."],
            ["Year 4 — Author", "Capstone thesis with publication support — 38 undergraduate first-author papers last year."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-line bg-bg p-5">
              <p className="font-semibold text-primary-700 dark:text-primary-400">{t}</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
