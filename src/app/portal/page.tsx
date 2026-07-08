import { requireSession } from "@/lib/auth";
import { StudentDashboard } from "@/components/dashboards/student";
import { FacultyDashboard } from "@/components/dashboards/faculty";
import { ParentDashboard } from "@/components/dashboards/parent";
import { StaffDashboard } from "@/components/dashboards/staff";

export const dynamic = "force-dynamic";

export default async function PortalHome() {
  const session = await requireSession();
  switch (session.role) {
    case "STUDENT":
      return <StudentDashboard session={session} />;
    case "FACULTY":
    case "HOD":
      return <FacultyDashboard session={session} />;
    case "PARENT":
      return <ParentDashboard session={session} />;
    default:
      return <StaffDashboard session={session} />;
  }
}
