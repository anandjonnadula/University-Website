import type { Metadata } from "next";
import { submitEnquiry } from "@/lib/actions/public";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, Eyebrow, Field, Input, Select, Textarea } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Aurora University — admissions enquiries, campus visits, scholarships and general questions.",
};

const contacts = [
  { icon: "pin", title: "Visit", lines: ["Knowledge Corridor, Devanahalli", "Bengaluru 562110, Karnataka"] },
  { icon: "mail", title: "Write", lines: ["info@aurora.edu", "admissions@aurora.edu"] },
  { icon: "clock", title: "Hours", lines: ["Mon–Sat, 9:00 AM – 5:30 PM", "Helpline: +91 80 4567 8900"] },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>Contact</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Talk to a human</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Enquiries go straight to the right desk — admissions replies within one working day.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          {contacts.map((c) => (
            <Card key={c.title} className="flex items-start gap-4 p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon name={c.icon} className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">{c.title}</h2>
                {c.lines.map((l) => (
                  <p key={l} className="mt-0.5 text-[14px] text-muted">{l}</p>
                ))}
              </div>
            </Card>
          ))}
          <Card className="p-6">
            <h2 className="font-semibold">Prefer instant answers?</h2>
            <p className="mt-1 text-[14px] text-muted">
              The <span className="font-medium text-primary-700 dark:text-primary-300">Ask Aurora</span> assistant (bottom-right) answers
              questions about admissions, fees, hostels and more — grounded in official information only.
            </p>
          </Card>
        </div>

        <Card className="p-7">
          <h2 className="font-display text-xl font-semibold tracking-tight">Send an enquiry</h2>
          <ActionForm action={submitEnquiry} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input name="name" required placeholder="Your name" autoComplete="name" />
              </Field>
              <Field label="Email">
                <Input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone (optional)">
                <Input name="phone" placeholder="+91 …" autoComplete="tel" />
              </Field>
              <Field label="Topic">
                <Select name="topic" defaultValue="Admissions">
                  {["Admissions", "Scholarships", "Campus Visit", "Placements", "Fees", "General"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Message">
              <Textarea name="message" required placeholder="How can we help?" rows={5} />
            </Field>
            <SubmitButton size="lg">Send enquiry</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </div>
  );
}
