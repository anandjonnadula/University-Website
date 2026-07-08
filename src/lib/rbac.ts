export const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  PARENT: "Parent / Guardian",
  FACULTY: "Faculty",
  HOD: "Head of Department",
  PRINCIPAL: "Principal",
  ADMISSION_OFFICER: "Admission Officer",
  ACCOUNTS: "Accounts Officer",
  EXAM_CONTROLLER: "Examination Controller",
  LIBRARIAN: "Librarian",
  WARDEN: "Hostel Warden",
  PLACEMENT_OFFICER: "Placement Officer",
  ADMIN: "Tenant Administrator",
};

export type NavItem = { href: string; label: string; icon: string };

/** Role-aware portal navigation (icon = key into the icon set). */
export function navForRole(role: string): NavItem[] {
  const dashboard = { href: "/portal", label: "Dashboard", icon: "home" };
  const notifications = { href: "/portal/notifications", label: "Notifications", icon: "bell" };
  const assistant = { href: "/portal/assistant", label: "AI Assistant", icon: "sparkles" };

  switch (role) {
    case "STUDENT":
      return [
        dashboard,
        { href: "/portal/timetable", label: "Timetable", icon: "calendar" },
        { href: "/portal/courses", label: "My Courses", icon: "book" },
        { href: "/portal/attendance", label: "Attendance", icon: "check" },
        { href: "/portal/results", label: "Results & Exams", icon: "award" },
        { href: "/portal/fees", label: "Fees & Payments", icon: "card" },
        { href: "/portal/library", label: "Library", icon: "library" },
        { href: "/portal/hostel", label: "Hostel", icon: "building" },
        { href: "/portal/placements", label: "Placements", icon: "briefcase" },
        { href: "/portal/requests", label: "Requests", icon: "inbox" },
        { href: "/portal/id-card", label: "Digital ID", icon: "id" },
        assistant,
        notifications,
      ];
    case "PARENT":
      return [dashboard, assistant, notifications];
    case "FACULTY":
      return [
        dashboard,
        { href: "/portal/teach", label: "My Sections", icon: "book" },
        { href: "/portal/requests", label: "Leave & Requests", icon: "inbox" },
        assistant,
        notifications,
      ];
    case "HOD":
      return [
        dashboard,
        { href: "/portal/teach", label: "My Sections", icon: "book" },
        { href: "/portal/approvals", label: "Approvals", icon: "check" },
        { href: "/portal/requests", label: "Leave & Requests", icon: "inbox" },
        assistant,
        notifications,
      ];
    case "PRINCIPAL":
      return [
        dashboard,
        { href: "/portal/analytics", label: "Analytics", icon: "chart" },
        { href: "/portal/audit", label: "Audit Trail", icon: "shield" },
        assistant,
        notifications,
      ];
    case "ADMISSION_OFFICER":
      return [
        dashboard,
        { href: "/portal/admissions", label: "Applications", icon: "inbox" },
        { href: "/portal/leads", label: "Enquiries", icon: "mail" },
        assistant,
        notifications,
      ];
    case "ACCOUNTS":
      return [
        dashboard,
        { href: "/portal/finance", label: "Fees & Invoices", icon: "card" },
        assistant,
        notifications,
      ];
    case "EXAM_CONTROLLER":
      return [
        dashboard,
        { href: "/portal/exams", label: "Exams & Schedules", icon: "calendar" },
        { href: "/portal/exams/results", label: "Result Processing", icon: "award" },
        assistant,
        notifications,
      ];
    case "LIBRARIAN":
      return [
        dashboard,
        { href: "/portal/library-admin", label: "Catalogue & Circulation", icon: "library" },
        assistant,
        notifications,
      ];
    case "WARDEN":
      return [
        dashboard,
        { href: "/portal/hostel-admin", label: "Hostels & Outpasses", icon: "building" },
        assistant,
        notifications,
      ];
    case "PLACEMENT_OFFICER":
      return [
        dashboard,
        { href: "/portal/placement-admin", label: "Drives & Pipeline", icon: "briefcase" },
        assistant,
        notifications,
      ];
    case "ADMIN":
      return [
        dashboard,
        { href: "/portal/analytics", label: "Analytics", icon: "chart" },
        { href: "/portal/admin/users", label: "Users & Roles", icon: "users" },
        { href: "/portal/admin/cms", label: "Website CMS", icon: "globe" },
        { href: "/portal/audit", label: "Audit Trail", icon: "shield" },
        { href: "/portal/leads", label: "Enquiries", icon: "mail" },
        assistant,
        notifications,
      ];
    default:
      return [dashboard, notifications];
  }
}
