"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { getSession, getSessionStudent } from "../auth";
import { recordAudit, notifyUser } from "../platform";
import type { FormState } from "./public";

/** Pay (fully or partially) an invoice — simulated gateway, idempotent per submit. */
export async function payInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, student } = await getSessionStudent();
  const invoiceId = String(formData.get("invoiceId") ?? "");
  const method = String(formData.get("method") ?? "upi");
  const amountRupees = Number(formData.get("amount"));

  const invoice = await db.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.studentId !== student.id) return { error: "Invoice not found." };
  const due = invoice.netMinor - invoice.paidMinor;
  if (due <= 0) return { error: "This invoice is already fully paid." };
  const amountMinor = Math.round(amountRupees * 100);
  if (!Number.isFinite(amountMinor) || amountMinor < 100) return { error: "Enter a valid amount (min ₹1)." };
  if (amountMinor > due) return { error: `Amount exceeds outstanding balance of ₹${Math.round(due / 100).toLocaleString("en-IN")}.` };

  const paid = invoice.paidMinor + amountMinor;
  const reference = `TXN${Date.now().toString().slice(-8)}`;
  await db.$transaction([
    db.payment.create({ data: { invoiceId, amountMinor, method, reference } }),
    db.invoice.update({ where: { id: invoiceId }, data: { paidMinor: paid, status: paid >= invoice.netMinor ? "paid" : "partial" } }),
  ]);
  await recordAudit(session, "payment.online", "Invoice", invoice.number, `Paid ₹${(amountMinor / 100).toLocaleString("en-IN")} via ${method.toUpperCase()}`);
  await notifyUser(session.sub, "Payment successful", `₹${(amountMinor / 100).toLocaleString("en-IN")} received against ${invoice.number} (ref ${reference}).`, "finance", "/portal/fees");
  revalidatePath("/portal/fees");
  return { ok: true, message: `Payment of ₹${(amountMinor / 100).toLocaleString("en-IN")} successful — reference ${reference}.` };
}

/** Mark own attendance with a session code (blueprint 7.E self-mark via QR/code). */
export async function markAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, student } = await getSessionStudent();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Enter the session code shown by your faculty." };

  const att = await db.attendanceSession.findFirst({
    where: { code, status: "open" },
    include: { section: { include: { course: true } } },
  });
  if (!att) return { error: "No open session with that code. [ATT.SESSION_CLOSED]" };

  const enrolled = await db.enrollment.findUnique({ where: { studentId_sectionId: { studentId: student.id, sectionId: att.sectionId } } });
  if (!enrolled) return { error: "You are not enrolled in this section." };

  const existing = await db.attendanceRecord.findUnique({ where: { sessionId_studentId: { sessionId: att.id, studentId: student.id } } });
  if (existing) return { error: "Attendance already marked for this session. [ATT.ALREADY_MARKED]" };

  await db.attendanceRecord.create({ data: { sessionId: att.id, studentId: student.id, status: "present", markedBy: "self" } });
  revalidatePath("/portal/attendance");
  return { ok: true, message: `Present marked for ${att.section.course.code} — ${att.section.course.title}.` };
}

/** Submit assignment work. */
export async function submitAssignment(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, student } = await getSessionStudent();
  const assignmentId = String(formData.get("assignmentId") ?? "");
  const contentText = String(formData.get("content") ?? "").trim();
  if (contentText.length < 10) return { error: "Please describe or paste your submission (min 10 characters)." };

  const assignment = await db.assignment.findUnique({ where: { id: assignmentId }, include: { section: { include: { course: true } } } });
  if (!assignment) return { error: "Assignment not found." };
  const enrolled = await db.enrollment.findUnique({ where: { studentId_sectionId: { studentId: student.id, sectionId: assignment.sectionId } } });
  if (!enrolled) return { error: "You are not enrolled in this section." };
  if (assignment.dueAt < new Date()) return { error: "The deadline has passed. [FAC.WINDOW_CLOSED]" };

  await db.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    create: { assignmentId, studentId: student.id, contentText },
    update: { contentText, submittedAt: new Date() },
  });
  await recordAudit(session, "assignment.submit", "Assignment", assignment.title, assignment.section.course.code);
  revalidatePath("/portal/courses");
  return { ok: true, message: `Submitted to “${assignment.title}”.` };
}

/** Request a hostel outpass. */
export async function requestOutpass(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, student } = await getSessionStudent();
  const reason = String(formData.get("reason") ?? "").trim();
  const outAt = new Date(String(formData.get("outAt") ?? ""));
  const expectedInAt = new Date(String(formData.get("expectedInAt") ?? ""));
  if (reason.length < 8) return { error: "Please give a clear reason (min 8 characters)." };
  if (isNaN(outAt.getTime()) || isNaN(expectedInAt.getTime())) return { error: "Choose valid out and return times." };
  if (expectedInAt <= outAt) return { error: "Return time must be after the out time." };
  if (outAt < new Date(Date.now() - 3600_000)) return { error: "Out time can't be in the past." };

  await db.outpass.create({ data: { studentId: student.id, reason, outAt, expectedInAt } });
  const warden = await db.user.findFirst({ where: { role: "WARDEN" } });
  if (warden) await notifyUser(warden.id, "New outpass request", `${session.name}: ${reason.slice(0, 70)}`, "hostel", "/portal/hostel-admin");
  await recordAudit(session, "outpass.request", "Outpass", student.rollNo, reason.slice(0, 60));
  revalidatePath("/portal/hostel");
  return { ok: true, message: "Outpass requested — you'll be notified once the warden decides." };
}

/** Apply to a job posting (eligibility-checked, blueprint 7.K). */
export async function applyToPosting(_prev: FormState, formData: FormData): Promise<FormState> {
  const { session, student } = await getSessionStudent();
  const postingId = String(formData.get("postingId") ?? "");
  const posting = await db.jobPosting.findUnique({ where: { id: postingId }, include: { company: true } });
  if (!posting || posting.status !== "open") return { error: "This posting is closed." };
  if (posting.deadline < new Date()) return { error: "The application deadline has passed." };

  // CGPA eligibility from published results
  const results = await db.result.findMany({ where: { studentId: student.id, status: "published" } });
  const cr = results.reduce((s, r) => s + r.credits, 0);
  const cgpa = cr ? results.reduce((s, r) => s + r.gradePoints * r.credits, 0) / cr : 0;
  if (cgpa < posting.minCgpa) return { error: `This role needs CGPA ≥ ${posting.minCgpa.toFixed(1)}; your current CGPA is ${cgpa.toFixed(2)}.` };

  const dup = await db.placementApplication.findUnique({ where: { postingId_studentId: { postingId, studentId: student.id } } });
  if (dup) return { error: "You've already applied to this posting." };

  await db.placementApplication.create({ data: { postingId, studentId: student.id } });
  await recordAudit(session, "placement.apply", "JobPosting", posting.title, posting.company.name);
  const officer = await db.user.findFirst({ where: { role: "PLACEMENT_OFFICER" } });
  if (officer) await notifyUser(officer.id, "New placement application", `${session.name} → ${posting.title} @ ${posting.company.name}`, "placement", "/portal/placement-admin");
  revalidatePath("/portal/placements");
  return { ok: true, message: `Applied to ${posting.title} at ${posting.company.name}. Good luck!` };
}

/** Raise a complaint / grievance (blueprint 7.N). */
export async function raiseComplaint(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in." };
  const category = String(formData.get("category") ?? "General");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const anonymous = formData.get("anonymous") === "on";
  if (title.length < 6) return { error: "Give your complaint a short title (min 6 characters)." };
  if (description.length < 20) return { error: "Describe the issue in a bit more detail (min 20 characters)." };

  const count = await db.complaint.count();
  const c = await db.complaint.create({
    data: { refNo: `GRV-${600 + count}`, category, title, description, anonymous, raisedById: session.sub, priority: category === "Safety / Anti-ragging" ? "high" : "medium" },
  });
  await recordAudit(session, "complaint.raise", "Complaint", c.refNo, anonymous ? "(anonymous)" : title);
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (admin) await notifyUser(admin.id, "New grievance filed", `${c.refNo} · ${category}: ${title}`, "grievance", "/portal/audit");
  revalidatePath("/portal/requests");
  return { ok: true, message: `Complaint ${c.refNo} filed. SLA: we aim to resolve within 48 hours.` };
}

/** Apply for leave (students and staff both use this). */
export async function requestLeave(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Please sign in." };
  const type = String(formData.get("type") ?? "casual");
  const fromDate = new Date(String(formData.get("fromDate") ?? ""));
  const toDate = new Date(String(formData.get("toDate") ?? ""));
  const reason = String(formData.get("reason") ?? "").trim();
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return { error: "Pick valid dates." };
  if (toDate < fromDate) return { error: "End date must be on or after the start date." };
  if (reason.length < 8) return { error: "Please give a reason (min 8 characters)." };

  await db.leaveRequest.create({ data: { userId: session.sub, type, fromDate, toDate, reason } });
  const approver = await db.user.findFirst({ where: { role: session.role === "STUDENT" ? "FACULTY" : "HOD" } });
  if (approver) await notifyUser(approver.id, "New leave request", `${session.name} (${type}) — ${reason.slice(0, 60)}`, "hr", "/portal/approvals");
  await recordAudit(session, "leave.request", "LeaveRequest", session.name, `${type} leave`);
  revalidatePath("/portal/requests");
  return { ok: true, message: "Leave request submitted for approval." };
}

export async function markNotificationsRead() {
  const session = await getSession();
  if (!session) return;
  await db.notification.updateMany({ where: { userId: session.sub, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/portal/notifications");
}
