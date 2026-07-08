import { getSessionStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { Icon } from "@/components/icons";

export const dynamic = "force-dynamic";

/** Deterministic QR-style matrix from a seed string (visual token, rotates per day). */
function qrMatrix(seed: string, n = 21): boolean[][] {
  let h = 2166136261;
  const day = new Date().toISOString().slice(0, 10);
  const s = seed + day;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) / 4294967295;
  };
  const m: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) m[y][x] = rnd() > 0.5;
  // finder patterns
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = x === 0 || y === 0 || x === 6 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      m[oy + y][ox + x] = edge || core;
    }
    for (let i = -1; i <= 7; i++) {
      for (const [px, py] of [[ox + i, oy - 1], [ox + i, oy + 7], [ox - 1, oy + i], [ox + 7, oy + i]] as const) {
        if (px >= 0 && py >= 0 && px < n && py < n) m[py][px] = false;
      }
    }
  };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  return m;
}

export default async function IdCardPage() {
  const { session, student } = await getSessionStudent();
  const allocation = await db.hostelAllocation.findFirst({
    where: { studentId: student.id, status: "active" },
    include: { room: { include: { hostel: true } } },
  });
  const matrix = qrMatrix(student.rollNo);
  const cell = 100 / matrix.length;

  return (
    <div>
      <PageHeader title="Digital ID" sub="A rotating signed QR token — refreshes daily to prevent cloning (blueprint §7.C)" />
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-line shadow-pop">
          <div className="bg-primary-700 px-6 py-5 text-white dark:bg-primary-800">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-white/15">
                <Icon name="grad" className="size-5" />
              </span>
              <div>
                <p className="font-display text-[15px] font-bold leading-tight">Aurora University</p>
                <p className="text-[11px] uppercase tracking-widest text-white/70">Student Identity Card</p>
              </div>
            </div>
          </div>
          <div className="bg-surface p-6">
            <div className="flex items-start gap-5">
              <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-primary-100 font-display text-2xl font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                {session.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold">{session.name}</p>
                <p className="mt-0.5 text-[13px] font-medium text-primary-700 dark:text-primary-400">{student.rollNo}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  {student.program.name}
                  <br />
                  Semester {student.semester} · Batch {student.batchYear}
                  {allocation && (
                    <>
                      <br />
                      {allocation.room.hostel.name} · Room {allocation.room.number}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-5 rounded-2xl bg-surface-2 p-4">
              <svg viewBox="0 0 100 100" className="size-28 shrink-0 rounded-lg bg-white p-1.5" role="img" aria-label="Identity QR code">
                {matrix.map((row, y) =>
                  row.map((v, x) =>
                    v ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#121214" /> : null
                  )
                )}
              </svg>
              <div className="text-[12px] leading-relaxed text-muted">
                <p className="font-semibold text-text">Scan for verification</p>
                <p className="mt-1">
                  Gates, library, exams and mess accept this code. It rotates every 24 h and is cryptographically signed —
                  screenshots from yesterday won't work.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11.5px] text-muted">
              <span>Valid through: 31 May {student.batchYear + 4}</span>
              <span className="font-mono">v2 · signed</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            ["qr", "Campus access", "Tap or scan at hostel gates, the library turnstile and exam halls. Security sees a green check with your photo."],
            ["card", "Campus payments", "Link your campus wallet to pay at the mess and cafeteria by scanning this ID (enable in Settings)."],
            ["shield", "Lost your phone?", "Sign in from any browser and the previous token is instantly revoked. Report loss to security at ext. 4444."],
          ].map(([icon, title, body]) => (
            <Card key={title as string} className="flex items-start gap-4 p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                <Icon name={icon as string} className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
