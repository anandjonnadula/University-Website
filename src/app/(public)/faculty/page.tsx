import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Avatar, Badge, Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Faculty",
  description: "Meet the professors and researchers of Aurora University.",
};

export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  const faculty = await db.facultyProfile.findMany({
    include: { user: true, department: true },
    orderBy: { designation: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <Eyebrow>People</Eyebrow>
      <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Faculty</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        800 teacher-researchers across six departments; here are some of the people you'll learn from.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {faculty.map((f) => (
          <Card key={f.id} className="flex flex-col p-6">
            <div className="flex items-center gap-4">
              <Avatar name={f.user.name} size="lg" />
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">{f.user.name}</h2>
                <p className="mt-0.5 text-[13px] font-medium text-primary-700 dark:text-primary-400">{f.designation}</p>
              </div>
            </div>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{f.bio}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {f.interests.split(",").map((i) => (
                <Badge key={i} tone="neutral">{i.trim()}</Badge>
              ))}
            </div>
            <p className="mt-auto border-t border-line pt-3 text-[12.5px] text-muted">{f.department.name}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
