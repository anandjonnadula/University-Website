import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import { Card } from "@/components/ui";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Portal Login",
  description: "Sign in to the Aurora University portal — students, parents, faculty and staff.",
};

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/portal");

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          One portal.
          <br />
          Every role.
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          Timetables, attendance, fees, exams, hostels, placements and the AI assistant — the whole campus in one
          sign-in, tailored to who you are.
        </p>
        <ul className="mt-8 space-y-3">
          {[
            "Students see courses, dues, results and their digital ID",
            "Parents track attendance and fees for linked wards",
            "Faculty run attendance, assignments and grading",
            "Staff consoles for admissions, exams, finance and more",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-[14.5px]">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success-soft text-success dark:bg-success/15">
                <Icon name="check" className="size-3" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <Card className="p-7 sm:p-9">
        <h2 className="font-display text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-1 text-[13.5px] text-muted">Use your university credentials.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </Card>
    </div>
  );
}
