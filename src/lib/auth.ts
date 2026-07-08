import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET ?? "univos-dev-secret");
export const SESSION_COOKIE = "univos_session";

export type Session = {
  sub: string;
  email: string;
  name: string;
  role: string;
};

export async function createSessionToken(payload: Session) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

/** Session from cookie (cached per request). */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

/** Require a logged-in user; optionally restrict to roles. Redirects otherwise. */
export async function requireSession(...roles: string[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (roles.length && !roles.includes(session.role)) redirect("/portal");
  return session;
}

/** Full student record for the logged-in student. */
export const getSessionStudent = cache(async () => {
  const session = await requireSession("STUDENT");
  const student = await db.student.findUnique({
    where: { userId: session.sub },
    include: { program: { include: { department: true } }, user: true },
  });
  if (!student) redirect("/login");
  return { session, student };
});

/** Faculty profile for logged-in faculty/HOD. */
export const getSessionFaculty = cache(async () => {
  const session = await requireSession("FACULTY", "HOD");
  const profile = await db.facultyProfile.findUnique({
    where: { userId: session.sub },
    include: { department: true, user: true },
  });
  if (!profile) redirect("/login");
  return { session, profile };
});
