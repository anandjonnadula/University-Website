"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { getSessionFaculty, requireSession } from "../auth";
import { recordAudit, notifyUser, notifyGuardians } from "../platform";
import type { FormState } from "./public";

async function ownedSection(sectionId: string) {
  const { session, profile } = await getSessionFaculty();
  const section = await db.section.findUnique({ where: { id: sectionId }, include: { course: true } });
  if (!section || section.facultyId !== profile.id) throw new Error("FAC.NOT_ASSIGNED");
  return { session, profile, section };
}

/** Open a time-boxed attendance session with a join code. */
export async function openAttendanceSession(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const sectionId = String(formData.get("sectionId") ?? "");
    const { session, section } = await ownedSection(sectionId);
    const existing = await db.attendanceSession.findFirst({ where: { sectionId, status: "open" } });
    if (existing) return { error: `A session is already open (code ${existing.code}). Close it first.` };
    const code = `${section.course.code.slice(0, 2)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await db.attendanceSession.create({ data: { sectionId, date: new Date(), method: "qr", code } });
    await recordAudit(session, "attendance.session.open", "Section", section.course.code, `Code ${code}`);
    revalidatePath("/portal/teach");
    return { ok: true, message: `Session open — share code ${code} with the class.` };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

/** Close session; unmarked students become absent; guardians of absentees are alerted. */
export async function closeAttendanceSession(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const sessionId = String(formData.get("sessionId") ?? "");
    const att = await db.attendanceSession.findUnique({ where: { id: sessionId }, include: { section: { include: { course: true } } } });
    if (!att) return { error: "Session not found." };
    const { session } = await ownedSection(att.sectionId);

    const roster = await db.enrollment.findMany({ where: { sectionId: att.sectionId, status: "registered" } });
    const marked = await db.attendanceRecord.findMany({ where: { sessionId } });
    const markedIds = new Set(marked.map((m) => m.studentId));
    let absent = 0;
    for (const e of roster) {
      if (!markedIds.has(e.studentId)) {
        await db.attendanceRecord.create({ data: { sessionId, studentId: e.studentId, status: "absent", markedBy: "faculty" } });
        await notifyGuardians(e.studentId, "Absence recorded", `Your ward was marked absent in ${att.section.course.code} today.`, "academics");
        absent++;
      }
    }
    await db.attendanceSession.update({ where: { id: sessionId }, data: { status: "closed" } });
    await recordAudit(session, "attendance.session.close", "Section", att.section.course.code, `${markedIds.size} present, ${absent} absent`);
    revalidatePath("/portal/teach");
    return { ok: true, message: `Session closed — ${markedIds.size} present, ${absent} marked absent.` };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

/** Faculty override of a record (mandatory reason, audited — blueprint 7.E). */
export async function overrideAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const status = String(formData.get("status") ?? "present");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 4) return { error: "An override reason is mandatory." };
  try {
    const att = await db.attendanceSession.findUnique({ where: { id: sessionId } });
    if (!att) return { error: "Session not found." };
    const { session } = await ownedSection(att.sectionId);
    await db.attendanceRecord.upsert({
      where: { sessionId_studentId: { sessionId, studentId } },
      create: { sessionId, studentId, status, markedBy: "faculty", overrideReason: reason },
      update: { status, markedBy: "faculty", overrideReason: reason },
    });
    await recordAudit(session, "attendance.override", "AttendanceRecord", studentId, `→ ${status}: ${reason}`);
    revalidatePath("/portal/teach");
    return { ok: true, message: "Record updated with audit trail." };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

export async function createAssignment(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const sectionId = String(formData.get("sectionId") ?? "");
    const { session, section } = await ownedSection(sectionId);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dueAt = new Date(String(formData.get("dueAt") ?? ""));
    const maxMarks = Number(formData.get("maxMarks"));
    if (title.length < 4) return { error: "Title is too short." };
    if (description.length < 10) return { error: "Add a fuller description for students." };
    if (isNaN(dueAt.getTime()) || dueAt < new Date()) return { error: "Due date must be in the future." };
    if (!Number.isInteger(maxMarks) || maxMarks < 1 || maxMarks > 100) return { error: "Max marks must be 1–100." };

    await db.assignment.create({ data: { sectionId, title, description, dueAt, maxMarks } });
    const roster = await db.enrollment.findMany({ where: { sectionId }, include: { student: true } });
    for (const e of roster) {
      await notifyUser(e.student.userId, `New assignment in ${section.course.code}`, `“${title}” — due ${dueAt.toLocaleDateString("en-IN")}.`, "academics", "/portal/courses");
    }
    await recordAudit(session, "assignment.create", "Section", section.course.code, title);
    revalidatePath("/portal/teach");
    return { ok: true, message: `Assignment published to ${roster.length} students.` };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

export async function gradeSubmission(_prev: FormState, formData: FormData): Promise<FormState> {
  const submissionId = String(formData.get("submissionId") ?? "");
  const marks = Number(formData.get("marks"));
  const feedback = String(formData.get("feedback") ?? "").trim();
  const sub = await db.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: { include: { section: { include: { course: true } } } }, student: true },
  });
  if (!sub) return { error: "Submission not found." };
  try {
    const { session } = await ownedSection(sub.assignment.sectionId);
    if (!Number.isFinite(marks) || marks < 0 || marks > sub.assignment.maxMarks)
      return { error: `Marks must be between 0 and ${sub.assignment.maxMarks}. [FAC.MARKS_OUT_OF_RANGE]` };
    await db.assignmentSubmission.update({ where: { id: submissionId }, data: { marks: Math.round(marks), feedback } });
    await notifyUser(sub.student.userId, `Graded: ${sub.assignment.title}`, `You scored ${Math.round(marks)}/${sub.assignment.maxMarks} in ${sub.assignment.section.course.code}.`, "academics", "/portal/courses");
    await recordAudit(session, "grade.enter", "AssignmentSubmission", sub.id, `${marks}/${sub.assignment.maxMarks}`);
    revalidatePath("/portal/teach");
    return { ok: true, message: "Grade saved and the student notified." };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

export async function addMaterial(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const sectionId = String(formData.get("sectionId") ?? "");
    const { session, section } = await ownedSection(sectionId);
    const title = String(formData.get("title") ?? "").trim();
    const kind = String(formData.get("kind") ?? "notes");
    const body = String(formData.get("body") ?? "").trim();
    if (title.length < 4) return { error: "Title is too short." };
    if (body.length < 10) return { error: "Add a description or link for the material." };
    await db.material.create({ data: { sectionId, title, kind, body } });
    await recordAudit(session, "material.publish", "Section", section.course.code, title);
    revalidatePath("/portal/teach");
    return { ok: true, message: "Material published to the section." };
  } catch {
    return { error: "You are not assigned to this section. [FAC.NOT_ASSIGNED]" };
  }
}

/** HOD decides a leave request. */
export async function decideLeave(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession("HOD", "PRINCIPAL", "ADMIN");
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!["approved", "rejected"].includes(decision)) return { error: "Invalid decision." };
  const req = await db.leaveRequest.findUnique({ where: { id }, include: { user: true } });
  if (!req || req.status !== "pending") return { error: "Request not found or already decided." };
  await db.leaveRequest.update({ where: { id }, data: { status: decision, decidedBy: session.name } });
  await notifyUser(req.userId, `Leave ${decision}`, `Your ${req.type} leave (${req.fromDate.toLocaleDateString("en-IN")} → ${req.toDate.toLocaleDateString("en-IN")}) was ${decision} by ${session.name}.`, "hr", "/portal/requests");
  await recordAudit(session, `leave.${decision}`, "LeaveRequest", req.user.name, req.reason.slice(0, 50));
  revalidatePath("/portal/approvals");
  return { ok: true, message: `Leave ${decision}.` };
}
