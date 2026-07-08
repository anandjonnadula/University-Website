"use server";

import { db } from "../db";
import { recordAudit, notifyUser } from "../platform";

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Contact-page enquiry → lead routed to admissions (blueprint 7.A workflow 3). */
export async function submitEnquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const topic = String(formData.get("topic") ?? "General");
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) return { error: "Please tell us your name." };
  if (!emailRe.test(email)) return { error: "That email address doesn't look right." };
  if (message.length < 10) return { error: "Please add a few more details to your message." };

  const lead = await db.lead.create({ data: { name, email, phone, topic, message } });
  await recordAudit(null, "lead.create", "Lead", lead.id, `Enquiry from ${name} (${topic})`);
  const officer = await db.user.findFirst({ where: { role: "ADMISSION_OFFICER" } });
  if (officer) await notifyUser(officer.id, "New enquiry received", `${name}: “${message.slice(0, 80)}…”`, "admissions", "/portal/leads");
  return { ok: true, message: "Thank you! Our team will reach out within one working day." };
}

/** Public event registration. */
export async function registerForEvent(_prev: FormState, formData: FormData): Promise<FormState> {
  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2) return { error: "Please enter your name." };
  if (!emailRe.test(email)) return { error: "Please enter a valid email." };

  const event = await db.campusEvent.findUnique({ where: { id: eventId }, include: { _count: { select: { registrations: true } } } });
  if (!event) return { error: "This event no longer exists." };
  if (event._count.registrations >= event.capacity) return { error: "Sorry, this event is fully booked." };

  const existing = await db.eventRegistration.findUnique({ where: { eventId_email: { eventId, email } } });
  if (existing) return { error: "You're already registered for this event with that email." };

  await db.eventRegistration.create({ data: { eventId, name, email } });
  await recordAudit(null, "event.register", "CampusEvent", event.slug, `${name} registered`);
  return { ok: true, message: `You're in! A confirmation has been sent to ${email}.` };
}

/** Online admission application (blueprint 7.B, simplified single-step submit). */
export async function submitApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const applicantName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const dob = String(formData.get("dob") ?? "");
  const programId = String(formData.get("programId") ?? "");
  const previousSchool = String(formData.get("previousSchool") ?? "").trim();
  const qualifyingPct = Number(formData.get("qualifyingPct"));
  const entranceRaw = String(formData.get("entranceScore") ?? "").trim();
  const category = String(formData.get("category") ?? "General");
  const statement = String(formData.get("statement") ?? "").trim();

  if (applicantName.length < 3) return { error: "Please enter your full name." };
  if (!emailRe.test(email)) return { error: "Please enter a valid email address." };
  if (!/^[+\d][\d\s-]{7,}$/.test(phone)) return { error: "Please enter a valid phone number." };
  if (!dob) return { error: "Please enter your date of birth." };
  if (!programId) return { error: "Please choose a program." };
  if (!Number.isFinite(qualifyingPct) || qualifyingPct < 35 || qualifyingPct > 100)
    return { error: "Qualifying percentage must be between 35 and 100." };
  const entranceScore = entranceRaw ? Number(entranceRaw) : null;
  if (entranceScore !== null && (!Number.isFinite(entranceScore) || entranceScore < 0 || entranceScore > 100))
    return { error: "Entrance score must be between 0 and 100." };
  if (statement.length < 40) return { error: "Your statement of purpose needs at least 40 characters." };

  const cycle = await db.admissionCycle.findFirst({ where: { isCurrent: true } });
  if (!cycle || cycle.closesAt < new Date()) return { error: "Admissions are currently closed for this cycle. [ADMISSION.CYCLE_CLOSED]" };

  const dup = await db.application.findFirst({ where: { email, programId, cycleId: cycle.id } });
  if (dup) return { error: `You already have an application (${dup.refNo}) for this program. [ADMISSION.DUPLICATE_APPLICATION]` };

  const count = await db.application.count();
  const composite = entranceScore !== null ? Math.round((qualifyingPct * 0.4 + entranceScore * 0.6) * 10) / 10 : qualifyingPct;
  const app = await db.application.create({
    data: {
      refNo: `APP-2026-${4200 + count}`,
      cycleId: cycle.id,
      programId,
      applicantName,
      email,
      phone,
      dob,
      previousSchool,
      qualifyingPct,
      entranceScore,
      category,
      statement,
      compositeScore: composite,
    },
  });
  await recordAudit(null, "admission.apply", "Application", app.refNo, `Application submitted by ${applicantName}`);
  const officer = await db.user.findFirst({ where: { role: "ADMISSION_OFFICER" } });
  if (officer) await notifyUser(officer.id, "New application received", `${applicantName} applied — ${app.refNo}`, "admissions", "/portal/admissions");
  return { ok: true, message: `Application submitted! Your reference number is ${app.refNo}. We've emailed a receipt to ${email}.` };
}
