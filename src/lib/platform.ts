import { db } from "./db";
import type { Session } from "./auth";

/** Immutable audit trail entry (blueprint §5.8). */
export async function recordAudit(
  actor: Session | null,
  action: string,
  entityType: string,
  entityId: string,
  note?: string
) {
  await db.auditEvent.create({
    data: {
      actorId: actor?.sub ?? null,
      actorName: actor?.name ?? "Guest",
      action,
      entityType,
      entityId,
      meta: JSON.stringify({ note: note ?? "" }),
    },
  });
}

/** In-app notification (blueprint §11 — single notification service). */
export async function notifyUser(
  userId: string,
  title: string,
  body: string,
  category: string,
  link?: string
) {
  await db.notification.create({ data: { userId, title, body, category, link } });
}

/** Notify guardians of a student. */
export async function notifyGuardians(
  studentId: string,
  title: string,
  body: string,
  category: string
) {
  const links = await db.guardianship.findMany({ where: { studentId } });
  for (const g of links) {
    await notifyUser(g.guardianId, title, body, category, "/portal");
  }
}
