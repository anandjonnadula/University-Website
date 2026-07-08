import { requireSession } from "@/lib/auth";
import { AssistantChat } from "@/components/assistant-chat";
import { Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await requireSession();
  const personal = session.role === "STUDENT";

  return (
    <div>
      <PageHeader
        title="Aurora Assistant"
        sub="Grounded in published university content — plus your own records, never anyone else's"
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card className="overflow-hidden">
          <AssistantChat personal={personal} />
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold">
              <Icon name="shield" className="size-4 text-primary-600" /> How it stays safe
            </p>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
              <li>• Answers only from the verified knowledge base and your own records (ABAC-scoped).</li>
              <li>• If nothing relevant is found, it says so instead of guessing.</li>
              <li>• Every answer cites its sources.</li>
              <li>• Consequential actions (payments, approvals) always stay with humans.</li>
            </ul>
          </Card>
          <Card className="p-5">
            <p className="text-[13.5px] font-semibold">It can answer</p>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-muted">
              <li>• Policies — attendance, grading, hostel, library</li>
              <li>• Admissions, scholarships and fee procedures</li>
              <li>• Placement statistics and campus services</li>
              {personal && <li>• Your attendance, CGPA, dues, books and today's classes</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
