"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { requireSession } from "../auth";
import { recordAudit, notifyUser } from "../platform";
import type { FormState } from "./public";

/* ================= Admissions (7.B) ================= */

const ADMISSION_TRANSITIONS: Record<string, string[]> = {
  submitted: ["under_review", "rejected"],
  under_review: ["shortlisted", "waitlisted", "rejected"],
  shortlisted: ["offered", "waitlisted", "rejected"],
  waitlisted: ["offered", "rejected"],
  offered: ["accepted", "rejected"],
  accepted: ["enrolled"],
};

export async function decideApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ADMISSION_OFFICER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const next = String(formData.get("next") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  const app = await db.application.findUnique({ where: { id }, include: { program: true } });
  if (!app) return { error: "Application not found." };
  const allowed = ADMISSION_TRANSITIONS[app.status] ?? [];
  if (!allowed.includes(next)) return { error: `Cannot move ${app.status} → ${next}.` };
  if (["rejected", "waitlisted"].includes(next) && note.length < 4) return { error: "A justification note is required for this decision." };

  await db.application.update({
    where: { id },
    data: { status: next, officerNote: note || app.officerNote, offerDeadline: next === "offered" ? new Date(Date.now() + 10 * 86400_000) : app.offerDeadline },
  });
  await recordAudit(session, `admission.${next}`, "Application", app.refNo, note || `${app.applicantName} → ${next}`);
  revalidatePath("/portal/admissions");
  return { ok: true, message: `${app.applicantName} moved to ${next.replace("_", " ")}.` };
}

/** Convert an accepted application into a student + user account (7.B saga step). */
export async function enrollApplicant(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ADMISSION_OFFICER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const app = await db.application.findUnique({ where: { id }, include: { program: { include: { department: true } } } });
  if (!app) return { error: "Application not found." };
  if (app.status !== "accepted") return { error: "Only accepted applications can be enrolled." };

  const existingUser = await db.user.findUnique({ where: { email: app.email } });
  if (existingUser) return { error: "A user with this email already exists." };

  const count = await db.student.count({ where: { batchYear: 2026 } });
  const rollNo = `AU26${app.program.department.code.slice(0, 2)}${String(count + 1).padStart(3, "0")}`;
  const user = await db.user.create({
    data: { email: app.email, name: app.applicantName, role: "STUDENT", passwordHash: bcrypt.hashSync("welcome123", 10), phone: app.phone },
  });
  const student = await db.student.create({
    data: { userId: user.id, programId: app.programId, rollNo, batchYear: 2026, semester: 1, category: app.category },
  });
  // first-semester invoice (fee owned by Finance — blueprint §27)
  const invCount = await db.invoice.count();
  await db.invoice.create({
    data: {
      number: `INV-${2700 + invCount}`,
      studentId: student.id,
      termLabel: "Monsoon 2026",
      netMinor: app.program.feePerTermMinor,
      dueDate: new Date(Date.now() + 21 * 86400_000),
      lineItems: JSON.stringify([{ head: "Semester fee", amountMinor: app.program.feePerTermMinor }]),
    },
  });
  await db.application.update({ where: { id }, data: { status: "enrolled" } });
  await notifyUser(user.id, "Welcome to Aurora University!", `You are enrolled in ${app.program.name}. Roll no ${rollNo}. Your first-semester invoice is ready.`, "admissions", "/portal/fees");
  await recordAudit(session, "admission.enroll", "Application", app.refNo, `Enrolled as ${rollNo} (temp password issued)`);
  revalidatePath("/portal/admissions");
  return { ok: true, message: `${app.applicantName} enrolled as ${rollNo}. Temporary password: welcome123` };
}

export async function updateLeadStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ADMISSION_OFFICER", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "contacted");
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return { error: "Lead not found." };
  await db.lead.update({ where: { id }, data: { status } });
  await recordAudit(session, "lead.update", "Lead", lead.name, `→ ${status}`);
  revalidatePath("/portal/leads");
  return { ok: true, message: "Lead updated." };
}

/* ================= Examinations (7.F) ================= */

export async function moderateResults(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("EXAM_CONTROLLER");
  const courseId = String(formData.get("courseId") ?? "");
  const termName = String(formData.get("termName") ?? "");
  const updated = await db.result.updateMany({ where: { courseId, termName, status: "provisional" }, data: { status: "moderated" } });
  if (!updated.count) return { error: "No provisional results to moderate for this course." };
  const course = await db.course.findUnique({ where: { id: courseId } });
  await recordAudit(session, "result.moderate", "Result", course?.code ?? courseId, `${updated.count} results moderated (${termName})`);
  revalidatePath("/portal/exams/results");
  return { ok: true, message: `${updated.count} results moderated for ${course?.code}.` };
}

export async function publishResults(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("EXAM_CONTROLLER");
  const courseId = String(formData.get("courseId") ?? "");
  const termName = String(formData.get("termName") ?? "");
  const pending = await db.result.count({ where: { courseId, termName, status: "provisional" } });
  if (pending > 0) return { error: `${pending} results are still provisional — moderate them first. [EXAM.RESULT_LOCKED]` };
  const rows = await db.result.findMany({ where: { courseId, termName, status: "moderated" }, include: { student: true } });
  if (!rows.length) return { error: "Nothing to publish for this course." };
  await db.result.updateMany({ where: { courseId, termName, status: "moderated" }, data: { status: "published" } });
  const course = await db.course.findUnique({ where: { id: courseId } });
  for (const r of rows) {
    await notifyUser(r.student.userId, "Result published", `Your ${course?.code} (${termName}) result is out — grade ${r.grade}.`, "exams", "/portal/results");
  }
  await recordAudit(session, "result.publish", "Result", course?.code ?? courseId, `${rows.length} results published (${termName})`);
  revalidatePath("/portal/exams/results");
  return { ok: true, message: `Published ${rows.length} results for ${course?.code} and notified students.` };
}

export async function scheduleExam(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("EXAM_CONTROLLER");
  const examId = String(formData.get("examId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  const date = new Date(String(formData.get("date") ?? ""));
  const startMin = Number(formData.get("hour")) * 60;
  const durationMin = Number(formData.get("durationMin"));
  const room = String(formData.get("room") ?? "").trim();
  if (isNaN(date.getTime()) || date < new Date()) return { error: "Exam date must be in the future." };
  if (!room) return { error: "Enter an exam hall / room." };
  if (!Number.isFinite(durationMin) || durationMin < 30 || durationMin > 360) return { error: "Duration must be 30–360 minutes." };
  const clash = await db.examSchedule.findFirst({ where: { examId, courseId } });
  if (clash) return { error: "This course is already scheduled in this exam." };
  await db.examSchedule.create({ data: { examId, courseId, date, startMin, durationMin, room } });
  const course = await db.course.findUnique({ where: { id: courseId } });
  await recordAudit(session, "exam.schedule", "ExamSchedule", course?.code ?? courseId, `${date.toDateString()} @ ${room}`);
  revalidatePath("/portal/exams");
  return { ok: true, message: `${course?.code} scheduled.` };
}

/* ================= Finance (7.G) ================= */

export async function recordOfflinePayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ACCOUNTS", "ADMIN");
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim().toUpperCase();
  const amountRupees = Number(formData.get("amount"));
  const method = String(formData.get("method") ?? "cash");
  const invoice = await db.invoice.findUnique({ where: { number: invoiceNumber }, include: { student: { include: { user: true } } } });
  if (!invoice) return { error: `No invoice ${invoiceNumber} found.` };
  const due = invoice.netMinor - invoice.paidMinor;
  if (due <= 0) return { error: "Invoice already fully paid." };
  const amountMinor = Math.round(amountRupees * 100);
  if (!Number.isFinite(amountMinor) || amountMinor < 100 || amountMinor > due)
    return { error: `Enter an amount between ₹1 and ₹${Math.round(due / 100).toLocaleString("en-IN")}.` };
  const paid = invoice.paidMinor + amountMinor;
  await db.$transaction([
    db.payment.create({ data: { invoiceId: invoice.id, amountMinor, method, reference: `RCPT${Date.now().toString().slice(-8)}` } }),
    db.invoice.update({ where: { id: invoice.id }, data: { paidMinor: paid, status: paid >= invoice.netMinor ? "paid" : "partial" } }),
  ]);
  await notifyUser(invoice.student.userId, "Payment recorded", `₹${(amountMinor / 100).toLocaleString("en-IN")} received against ${invoice.number} (${method}).`, "finance", "/portal/fees");
  await recordAudit(session, "payment.record", "Invoice", invoice.number, `₹${(amountMinor / 100).toLocaleString("en-IN")} via ${method}`);
  revalidatePath("/portal/finance");
  return { ok: true, message: `Payment recorded against ${invoice.number} (${invoice.student.user.name}).` };
}

/* ================= Library (7.J) ================= */

export async function issueBook(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("LIBRARIAN");
  const isbn = String(formData.get("isbn") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const item = await db.libraryItem.findUnique({ where: { isbn } });
  if (!item) return { error: "No catalogue item with that ISBN." };
  if (item.copiesAvailable < 1) return { error: "No copies available — all issued." };
  const borrower = await db.user.findUnique({ where: { email } });
  if (!borrower) return { error: "No user with that email." };
  const activeLoans = await db.loan.count({ where: { borrowerId: borrower.id, returnedAt: null } });
  const limit = borrower.role === "STUDENT" ? 4 : 10;
  if (activeLoans >= limit) return { error: `${borrower.name} already has ${activeLoans} books (limit ${limit}).` };
  const days = borrower.role === "STUDENT" ? 14 : 30;
  await db.$transaction([
    db.loan.create({ data: { itemId: item.id, borrowerId: borrower.id, dueAt: new Date(Date.now() + days * 86400_000) } }),
    db.libraryItem.update({ where: { id: item.id }, data: { copiesAvailable: { decrement: 1 } } }),
  ]);
  await notifyUser(borrower.id, "Book issued", `“${item.title}” — due in ${days} days.`, "library", "/portal/library");
  await recordAudit(session, "loan.issue", "LibraryItem", item.title, `→ ${borrower.name}`);
  revalidatePath("/portal/library-admin");
  return { ok: true, message: `Issued “${item.title}” to ${borrower.name}.` };
}

export async function returnBook(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("LIBRARIAN");
  const loanId = String(formData.get("loanId") ?? "");
  const loan = await db.loan.findUnique({ where: { id: loanId }, include: { item: true, borrower: true } });
  if (!loan || loan.returnedAt) return { error: "Loan not found or already returned." };
  const overdueDays = Math.max(0, Math.floor((Date.now() - loan.dueAt.getTime()) / 86400_000));
  const fineMinor = overdueDays * 500;
  await db.$transaction([
    db.loan.update({ where: { id: loanId }, data: { returnedAt: new Date(), fineMinor } }),
    db.libraryItem.update({ where: { id: loan.itemId }, data: { copiesAvailable: { increment: 1 } } }),
  ]);
  await recordAudit(session, "loan.return", "LibraryItem", loan.item.title, fineMinor ? `Fine ₹${fineMinor / 100}` : "On time");
  revalidatePath("/portal/library-admin");
  return { ok: true, message: fineMinor ? `Returned with ₹${fineMinor / 100} fine (${overdueDays} days late).` : "Returned on time — no fine." };
}

/* ================= Hostel (7.H) ================= */

export async function decideOutpass(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("WARDEN");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["approved", "rejected"].includes(decision)) return { error: "Invalid decision." };
  const op = await db.outpass.findUnique({ where: { id }, include: { student: { include: { user: true } } } });
  if (!op || op.status !== "pending") return { error: "Outpass not found or already decided." };
  await db.outpass.update({ where: { id }, data: { status: decision, decidedBy: session.name } });
  await notifyUser(op.student.userId, `Outpass ${decision}`, `Your outpass (${op.reason.slice(0, 50)}) was ${decision} by the warden.`, "hostel", "/portal/hostel");
  await recordAudit(session, `outpass.${decision}`, "Outpass", op.student.user.name, op.reason.slice(0, 50));
  revalidatePath("/portal/hostel-admin");
  return { ok: true, message: `Outpass ${decision}.` };
}

/* ================= Placement (7.K) ================= */

const PLACEMENT_STAGES = ["applied", "shortlisted", "interview", "offered", "accepted", "rejected"];

export async function updatePlacementStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("PLACEMENT_OFFICER");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!PLACEMENT_STAGES.includes(status)) return { error: "Invalid stage." };
  const app = await db.placementApplication.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, posting: { include: { company: true } } },
  });
  if (!app) return { error: "Application not found." };
  await db.placementApplication.update({ where: { id }, data: { status } });
  await notifyUser(app.student.userId, `Placement update: ${app.posting.company.name}`, `Your application for ${app.posting.title} is now “${status}”.`, "placement", "/portal/placements");
  await recordAudit(session, "placement.stage", "PlacementApplication", `${app.student.user.name} → ${app.posting.company.name}`, status);
  revalidatePath("/portal/placement-admin");
  return { ok: true, message: `Moved to ${status}.` };
}

export async function createPosting(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("PLACEMENT_OFFICER");
  const companyId = String(formData.get("companyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "job");
  const ctcLakhs = Number(formData.get("ctcLakhs"));
  const minCgpa = Number(formData.get("minCgpa"));
  const deadline = new Date(String(formData.get("deadline") ?? ""));
  const location = String(formData.get("location") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (title.length < 4) return { error: "Role title is too short." };
  if (!Number.isFinite(ctcLakhs) || ctcLakhs <= 0) return { error: "Enter a valid CTC (in lakhs)." };
  if (!Number.isFinite(minCgpa) || minCgpa < 0 || minCgpa > 10) return { error: "Min CGPA must be 0–10." };
  if (isNaN(deadline.getTime()) || deadline < new Date()) return { error: "Deadline must be in the future." };
  if (description.length < 20) return { error: "Add a fuller description (min 20 characters)." };
  const posting = await db.jobPosting.create({ data: { companyId, title, type, ctcLakhs, minCgpa, deadline, location, description } });
  const students = await db.student.findMany({ include: { user: true } });
  const company = await db.company.findUnique({ where: { id: companyId } });
  for (const s of students.slice(0, 40)) {
    await notifyUser(s.user.id, "New placement drive", `${company?.name} is hiring: ${title} (${ctcLakhs} LPA).`, "placement", "/portal/placements");
  }
  await recordAudit(session, "posting.create", "JobPosting", title, company?.name ?? "");
  revalidatePath("/portal/placement-admin");
  return { ok: true, message: `Posting live — students notified.` };
}

/* ================= Admin (CMS + users) ================= */

export async function saveNewsPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ADMIN");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const tag = String(formData.get("tag") ?? "Campus").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length < 8 || title.length > 90) return { error: "Title must be 8–90 characters (SEO)." };
  if (excerpt.length < 20 || excerpt.length > 160) return { error: "Excerpt must be 20–160 characters (meta description)." };
  if (body.length < 60) return { error: "Body is too short to publish." };
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  if (id) {
    await db.newsPost.update({ where: { id }, data: { title, tag, excerpt, body } });
  } else {
    const dup = await db.newsPost.findUnique({ where: { slug } });
    if (dup) return { error: "A post with a very similar title already exists." };
    await db.newsPost.create({ data: { slug, title, tag, excerpt, body } });
  }
  await recordAudit(session, id ? "cms.update" : "cms.publish", "NewsPost", slug, title);
  revalidatePath("/news");
  revalidatePath("/portal/admin/cms");
  return { ok: true, message: id ? "Post updated." : "Post published to the public site." };
}

export async function toggleUserStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("ADMIN");
  const id = String(formData.get("id") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user) return { error: "User not found." };
  if (user.role === "ADMIN") return { error: "Administrators cannot be suspended from this console." };
  const status = user.status === "active" ? "suspended" : "active";
  await db.user.update({ where: { id }, data: { status } });
  await recordAudit(session, `user.${status}`, "User", user.email, `${user.name} ${status}`);
  revalidatePath("/portal/admin/users");
  return { ok: true, message: `${user.name} is now ${status}.` };
}
