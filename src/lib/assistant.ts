import { db } from "./db";
import type { Session } from "./auth";
import { fmtDate, fmtTimeMin, inr, DAY_NAMES, gpa, pct } from "./format";

/* Grounded campus assistant (blueprint 7.R):
   - retrieves from the published knowledge base (keyword scoring ≈ RAG-lite)
   - answers personal questions from the signed-in student's own records only
   - refuses when nothing relevant is retrieved (no hallucination) */

const STOP = new Set(["the", "a", "an", "is", "are", "was", "were", "i", "my", "me", "how", "what", "when", "where", "can", "do", "does", "of", "for", "to", "in", "on", "at", "and", "or", "it", "this", "that", "about", "tell", "much", "many", "with", "you", "your", "we", "us"]);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s%]/g, " ").split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

export type AssistantReply = { answer: string; sources: string[] };

async function personalAnswer(q: string, session: Session): Promise<AssistantReply | null> {
  if (session.role !== "STUDENT") return null;
  const student = await db.student.findUnique({ where: { userId: session.sub }, include: { program: true } });
  if (!student) return null;
  const ql = q.toLowerCase();

  if (/attendance|absent|present|shortage/.test(ql)) {
    const records = await db.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: { session: { include: { section: { include: { course: true } } } } },
    });
    if (!records.length) return { answer: "I don't see any attendance records for you yet this term.", sources: ["Your attendance records"] };
    const byCourse = new Map<string, { present: number; total: number }>();
    for (const r of records) {
      const key = r.session.section.course.code;
      const c = byCourse.get(key) ?? { present: 0, total: 0 };
      c.total++;
      if (r.status === "present" || r.status === "late") c.present++;
      byCourse.set(key, c);
    }
    const overallP = records.filter((r) => r.status === "present" || r.status === "late").length;
    const lines = [...byCourse.entries()].map(([code, c]) => `• ${code}: ${pct(c.present, c.total)}% (${c.present}/${c.total} classes)`);
    const risky = [...byCourse.entries()].filter(([, c]) => pct(c.present, c.total) < 75).map(([code]) => code);
    return {
      answer: `Your overall attendance this term is ${pct(overallP, records.length)}%.\n${lines.join("\n")}\n${risky.length ? `⚠ ${risky.join(", ")} ${risky.length > 1 ? "are" : "is"} below the 75% exam-eligibility threshold — consider meeting your mentor.` : "You're above the 75% eligibility threshold in every course. Keep it up!"}`,
      sources: ["Your attendance records", "Attendance policy"],
    };
  }

  if (/fee|due|invoice|pay|balance|owe/.test(ql)) {
    const invoices = await db.invoice.findMany({ where: { studentId: student.id }, orderBy: { dueDate: "desc" } });
    const open = invoices.filter((i) => i.paidMinor < i.netMinor);
    if (!open.length) return { answer: "You have no outstanding fees — every invoice is fully paid. 🎉", sources: ["Your fee ledger"] };
    const lines = open.map((i) => `• ${i.number} (${i.termLabel}): ${inr(i.netMinor - i.paidMinor)} outstanding, due ${fmtDate(i.dueDate)}${i.status === "overdue" ? " — OVERDUE" : ""}`);
    return {
      answer: `You have ${open.length} invoice${open.length > 1 ? "s" : ""} with a balance:\n${lines.join("\n")}\nYou can pay from the Fees section via UPI, card or net-banking.`,
      sources: ["Your fee ledger", "Fee payment"],
    };
  }

  if (/timetable|class(es)? (today|tomorrow)|schedule today|next class/.test(ql) || /timetable/.test(ql)) {
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id, status: "registered" },
      include: { section: { include: { course: true, slots: true } } },
    });
    const targetDay = /tomorrow/.test(ql) ? (new Date().getDay() + 1) % 7 : new Date().getDay();
    const slots = enrollments
      .flatMap((e) => e.section.slots.map((s) => ({ ...s, course: e.section.course })))
      .filter((s) => s.dayOfWeek === targetDay)
      .sort((a, b) => a.startMin - b.startMin);
    const dayWord = /tomorrow/.test(ql) ? "tomorrow" : "today";
    if (!slots.length) return { answer: `No classes ${dayWord} (${DAY_NAMES[targetDay]}). Check the Timetable page for the full week.`, sources: ["Your timetable"] };
    return {
      answer: `Your classes ${dayWord} (${DAY_NAMES[targetDay]}):\n${slots.map((s) => `• ${fmtTimeMin(s.startMin)}–${fmtTimeMin(s.endMin)} — ${s.course.code} ${s.course.title} (${s.room})`).join("\n")}`,
      sources: ["Your timetable"],
    };
  }

  if (/cgpa|gpa|result|grade|marks/.test(ql)) {
    const results = await db.result.findMany({ where: { studentId: student.id, status: "published" }, include: { course: true } });
    if (!results.length) return { answer: "No published results yet. Results appear here as soon as the Examination Cell publishes them.", sources: ["Your results"] };
    const cg = gpa(results);
    const best = [...results].sort((a, b) => b.gradePoints - a.gradePoints)[0];
    return {
      answer: `Your CGPA from ${results.length} published course results is ${cg.toFixed(2)}. Strongest showing: ${best.course.code} (${best.grade}). The full grade card is on the Results page.`,
      sources: ["Your results", "Examination and grading"],
    };
  }

  if (/book|library.*(due|fine)|overdue/.test(ql)) {
    const loans = await db.loan.findMany({ where: { borrowerId: session.sub, returnedAt: null }, include: { item: true } });
    if (!loans.length) return { answer: "You have no books checked out right now.", sources: ["Your library account"] };
    const now = Date.now();
    const lines = loans.map((l) => {
      const overdue = l.dueAt.getTime() < now;
      return `• “${l.item.title}” — due ${fmtDate(l.dueAt)}${overdue ? ` (overdue, fine accruing at ₹5/day)` : ""}`;
    });
    return { answer: `You have ${loans.length} book${loans.length > 1 ? "s" : ""} on loan:\n${lines.join("\n")}`, sources: ["Your library account", "Library services"] };
  }

  return null;
}

export async function answerQuestion(q: string, session: Session | null): Promise<AssistantReply> {
  const query = q.trim().slice(0, 400);
  if (!query) return { answer: "Ask me anything about admissions, fees, hostels, placements, the library — or your own attendance, results and dues.", sources: [] };

  if (session) {
    const personal = await personalAnswer(query, session);
    if (personal) return personal;
  }

  const qTokens = tokens(query);
  const chunks = await db.knowledgeChunk.findMany();
  const scored = chunks
    .map((c) => {
      const hay = tokens(c.title + " " + c.tags).concat(tokens(c.content));
      const titleTokens = new Set(tokens(c.title + " " + c.tags));
      let score = 0;
      for (const t of qTokens) {
        if (titleTokens.has(t)) score += 3;
        else if (hay.includes(t)) score += 1;
      }
      return { c, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      answer:
        "I couldn't find that in the university's published knowledge base, and I only answer from verified content — I'd rather say so than guess. Try rephrasing, or reach the team directly: info@aurora.edu / +91 80 4567 8900.",
      sources: [],
    };
  }

  const top = scored.slice(0, 2);
  const answer = top.map((s) => s.c.content).join("\n\n");
  return { answer, sources: top.map((s) => s.c.title) };
}
