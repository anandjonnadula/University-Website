# University Management System

> **Aurora University** demo tenant · Built end-to-end from the [`University-website.md`](./University-website.md) master blueprint (SRS/PRD/TDD in one document).

This website digitizes the complete lifecycle of a university community — prospective applicant → enrolled student → graduate — unifying the public website, admissions, academics, attendance, examinations, finance, hostel, library, placements, grievances and AI-driven assistance into **one working full-stack application** with role-based portals for 12 user roles.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Prisma ORM · SQLite · JWT (jose) · React 19 Server Components + Server Actions

---

## ✨ Highlights

- **Public university website** — SEO-optimized (metadata, OpenGraph, JSON-LD), program catalogue, departments, faculty, news, events with live registration, placements, research, contact and online admission application. Light/dark themes on the blueprint's coral `#E67E6A` design-token system.
- **12 role-based portals** behind one login — Student, Parent, Faculty, HOD, Principal, Admission Officer, Accounts, Exam Controller, Librarian, Warden, Placement Officer, Tenant Admin — each with its own navigation, dashboard and permitted actions.
- **Real workflows, not mockups** — every button works: attendance sessions with rotating codes, assignment grading, fee payments, result publication, admission offer→enroll saga, book circulation with auto-fines, outpass approvals, placement pipelines, CMS publishing.
- **AI campus assistant (RAG-style, grounded)** — answers from a verified knowledge base *plus the signed-in student's own records only* (attendance, CGPA, dues, timetable, books). Cites sources; refuses instead of hallucinating.
- **Enterprise cross-cutting concerns** — append-only audit trail on every state change, in-app notification service with guardian alerts, namespaced business error codes (`ATT.ALREADY_MARKED`, `ADMISSION.CYCLE_CLOSED`, …), ownership-scoped authorization, and the blueprint's four UI states (loading / empty / error / success) throughout.
- **Accessible, validated data-viz** — custom SVG charts whose light- and dark-mode palettes were computationally validated for lightness, chroma, contrast and colorblind (CVD) separation.

---

## 🚀 Getting started

**Prerequisites:** Node.js 18.18+ (tested on Node 25).

```bash
git clone <this-repo>
cd <repo>
npm install
cp .env.example .env   # local SQLite path + session secret (no external keys needed)
npm run setup     # prisma db push + seed (creates prisma/dev.db with rich demo data)
npm run dev       # → http://localhost:3000
```

Production mode: `npm run build && npm start`.

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run setup` | Create the SQLite schema **and** load the Aurora demo tenant |
| `npm run db:seed` | Re-seed only (wipes and reloads all demo data) |

No external services, API keys or Docker required — the database is a local SQLite file and the payment gateway/AI assistant are self-contained simulations.

---

## 🔑 Demo accounts

Password for every account: **`demo1234`** (the login page has one-click role pickers).

| Role | Email | Try this |
|---|---|---|
| **Student** | `student@aurora.edu` | Dashboard KPIs, timetable, mark attendance with a live code, submit assignments, pay fees (simulated UPI/card), request an outpass, apply to placement drives, rotating digital ID, ask the assistant *"what's my attendance?"* |
| **Parent** | `parent@aurora.edu` | Consent-scoped view of the linked student: attendance, CGPA, dues, outpasses |
| **Faculty** | `faculty@aurora.edu` | Open/close attendance sessions (closing auto-marks absentees and alerts parents), create assignments, grade with feedback, publish materials |
| **HOD** | `hod@aurora.edu` | Everything Faculty can do + approve/reject leave requests |
| **Admission Officer** | `admissions@aurora.edu` | Ranked application queue → review (AI pre-screen) → shortlist → offer → accept → **Enroll** (creates the student account, roll number and first invoice) |
| **Exam Controller** | `exams@aurora.edu` | Schedule exam papers; moderate → publish results (irreversible, notifies every student) |
| **Accounts** | `accounts@aurora.edu` | Fee console, record offline payments, collection analytics |
| **Librarian** | `librarian@aurora.edu` | Issue/return books by ISBN + borrower email, automatic overdue fines (₹5/day) |
| **Warden** | `warden@aurora.edu` | Hostel occupancy, resident registry, approve/reject outpasses |
| **Placement Officer** | `placement@aurora.edu` | Publish postings (auto-notifies eligible students), advance candidates stage-by-stage |
| **Principal** | `principal@aurora.edu` | Institution analytics dashboards + audit trail (read) |
| **Admin** | `admin@aurora.edu` | Users & roles (suspend/reactivate), website CMS (publish news live to `/news`), audit trail, enquiry inbox |

**Flows that connect roles** (great for demos):
1. Submit an application on the public `/apply` page → it appears in the Admission Officer's queue → offer → accept → *Enroll* → the new student gets an account and an invoice.
2. As Faculty, open an attendance session → as Student, enter the code on the Attendance page → close the session as Faculty → the Parent receives absence alerts for absentees.
3. As Exam Controller, moderate + publish a course's results → the Student sees new grades and a notification instantly.
4. Send an enquiry from `/contact` → it lands in the Admissions *Enquiries* inbox with a notification.

---

## 🏗 Architecture

The blueprint specifies a multi-tenant, event-driven microservices platform (Kafka, Kubernetes, polyglot persistence). This repository implements it as a **modular monolith** — the honest right-size for a single-tenant demo — while preserving the blueprint's *domain boundaries* and rules:

- Each bounded context (admissions, academics, attendance, finance, library, hostel, placement, grievance…) has its own **domain action module** in `src/lib/actions/*` with validation, business rules and error codes.
- Money, notifications and audit each have a **single owner**: all modules emit through `src/lib/platform.ts` (audit + notification service), and all fees flow through the finance model — mirroring blueprint §27 traceability rules.
- **AuthN:** credential login → HS256 JWT in an httpOnly `SameSite` cookie; middleware guards `/portal/*`.
  **AuthZ:** RBAC (role → navigation + `requireSession(...roles)` on every page/action) with ABAC-style ownership scoping (students read only their own records; faculty manage only their own sections; parents see only linked wards).
- **AI assistant:** keyword-scored retrieval over a seeded knowledge base (RAG-lite) + intent handlers that query the signed-in student's records; every answer carries sources and the no-match path refuses gracefully.

```
src/
├── middleware.ts               # JWT guard for /portal/*
├── app/
│   ├── (public)/               # SEO public site: home, programs, departments, faculty,
│   │                           # placements, research, news, events, contact, apply, login
│   ├── portal/                 # authenticated shell (role-aware sidebar, notifications, theme)
│   │   ├── page.tsx            # dashboard dispatcher per role
│   │   ├── timetable|attendance|courses|results|fees|library|hostel|placements|
│   │   │   requests|id-card|notifications|assistant/        # student modules
│   │   ├── teach/[sectionId]/  # faculty workspace (attendance, grading, materials, roster)
│   │   ├── approvals/          # HOD leave approvals
│   │   ├── admissions/[id]/    # officer console (queue, detail, decisions, enroll saga)
│   │   ├── exams/(results)/    # controller console (schedules, moderate→publish)
│   │   ├── finance/ library-admin/ hostel-admin/ placement-admin/   # staff consoles
│   │   ├── analytics/ audit/ leads/ admin/users/ admin/cms/         # admin & principal
│   └── api/assistant/          # grounded assistant endpoint
├── lib/
│   ├── auth.ts rbac.ts         # sessions, role catalogue, role-aware navigation
│   ├── actions/                # auth · public · student · faculty · staff (server actions)
│   ├── assistant.ts            # retrieval + personal intents
│   ├── platform.ts             # audit trail + notification service
│   └── db.ts format.ts         # Prisma client, INR/date/grade helpers
├── components/                 # design system: ui primitives, icons, charts, forms,
│                               # dashboards, assistant chat, theme toggle, navigation
prisma/
├── schema.prisma               # canonical data model (~35 models, blueprint §6)
└── seed.ts                     # Aurora University demo tenant
```

### Data model (blueprint §6, adapted)

Identity (users, guardianships) · Academic structure (departments, programs, courses, terms, sections, timetable slots, faculty profiles) · Students & enrollments · Attendance (sessions + idempotent records) · Teaching (assignments, submissions, materials) · Examinations (exams, schedules, results with provisional→moderated→published lifecycle) · Finance (fee structures, invoices, payments) · Admissions (cycles, applications with status machine) · Library (items, loans) · Hostel (hostels, rooms, allocations, outpasses) · Placement (companies, postings, applications) · Grievances, leave requests · CMS (news, events, registrations, leads) · Platform (notifications, audit events, knowledge chunks).

### Design system

- Brand tokens from blueprint §22: coral `#E67E6A` ramp (50–950), neutral surfaces, semantic success/warning/danger/info — all flipping cleanly between light and dark (`prefers-color-scheme` + persisted toggle).
- Serif display (Fraunces) + Inter body; 4px spacing rhythm; skeleton-free but state-complete screens (loading/empty/error/success per blueprint §5.13).
- Chart series colors validated programmatically for both themes (lightness band, chroma floor, CVD ΔE separation, contrast).

---

## 🧭 Blueprint traceability

| Blueprint module | Where it lives | Status |
|---|---|---|
| 7.A Public website & CMS | `(public)/*`, `portal/admin/cms` | ✅ incl. SEO validation, lead routing |
| 7.B Online admissions | `/apply`, `portal/admissions` | ✅ full status machine + enroll saga |
| 7.C Student ERP | `portal/*` (student) | ✅ incl. digital ID, CGPA/SGPA |
| 7.D Faculty ERP | `portal/teach` | ✅ assignments, grading, materials |
| 7.E Attendance | `portal/attendance`, teach tab | ✅ codes, idempotency, overrides, parent alerts, 75% rule |
| 7.F Examinations | `portal/exams` | ✅ schedules, moderate→publish pipeline |
| 7.G Fee & finance | `portal/fees`, `portal/finance` | ✅ invoices, online + offline payments |
| 7.H Hostel | `portal/hostel(-admin)` | ✅ allocations, outpass workflow |
| 7.J Library | `portal/library(-admin)` | ✅ circulation, limits, auto-fines |
| 7.K Placement | `portal/placements`, `placement-admin` | ✅ eligibility-enforced pipeline |
| 7.N Grievance | `portal/requests` | ✅ incl. anonymous complaints, SLA |
| 7.R AI assistant | `/api/assistant`, `portal/assistant` | ✅ grounded, source-cited, personal intents |
| §5 foundations | `lib/*` | ✅ auth, RBAC, audit, notifications, error model, UI states |
| §22 design system | `globals.css`, `components/` | ✅ tokens, dark mode, validated palettes |

Deliberately out of scope for this build (heavy-infra items the blueprint assigns to later phases): Kafka/event bus, Kubernetes/IaC, multi-tenancy with RLS, biometric/face capture, payment-gateway and DigiLocker integrations, blockchain certificate anchoring. The seams for them exist (platform services, per-context action modules).

---

## 🔒 Security notes

- Passwords hashed with bcrypt; sessions are short-lived signed JWTs in httpOnly cookies; `/portal` is middleware-guarded.
- Every page and server action re-checks the role server-side (`requireSession`), and record ownership is enforced in queries — a faculty member opening someone else's section gets a 404, a student can only ever read/write their own rows.
- Every state-changing action writes an audit event (actor, action, entity, note, timestamp) viewable in the admin console.
- This is a demo: the session secret lives in `.env`, and the payment flow is simulated. Before real deployment: rotate secrets from a vault, add rate limiting + CSRF hardening, MFA, and a real gateway.

## 📄 License

Educational/portfolio project. The blueprint (`University-website.md`) and all names (Aurora University) are fictional.
