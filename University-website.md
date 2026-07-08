# University Management System — Master Blueprint

> **Single Source of Truth.** This document is simultaneously the Software Requirements Specification (SRS), Product Requirements Document (PRD), Technical Design Document (TDD), Architecture Guide, API Specification, Database Design Document, Security Guide, Deployment Guide, Testing Guide, and Development Reference. A development team should be able to build the entire platform from this document without making major assumptions.

---

## 0. Document Control & How to Read This

**Codename:** `UniSite` (working name; the deployed product is white-labelled per tenant).
**Status:** Approved for build.
**Audience:** Product, engineering, QA, security, SRE, design, and data teams.

### 0.1 How this document is organized

The document moves from the general to the specific: vision and architecture first (Sections 1–3), then the cross-cutting foundations every module reuses (Section 5), then the canonical data model (Section 6), then each functional module specified in full (Section 7), then the horizontal platforms — AI, security, analytics, notifications, integrations (Sections 8–12), then engineering practice — DevOps, observability, testing (Sections 13–16), then compliance, mobile, accessibility, design system, roadmap, and governance (Sections 17–26).

### 0.2 Module specification template (applied to every module in Section 7)

Every functional module is specified with the following fixed structure so nothing is left conceptual:

1. **Purpose** — the problem the module solves and its business value.
2. **Bounded context & service** — which microservice owns it and the data it is the source of truth for.
3. **Roles & permissions** — the permission matrix (which role may do what).
4. **Primary workflows** — step-by-step happy path and key alternate/error paths.
5. **Frontend pages/screens** — routes, components, states (loading/empty/error/success).
6. **Backend APIs** — REST/GraphQL/gRPC/event contracts with methods, paths, request/response, status codes.
7. **Database entities** — tables/collections, key fields, relationships, indexes.
8. **Business logic & rules** — the deterministic rules the module enforces.
9. **Validation rules** — field- and cross-field-level validation.
10. **Error handling** — domain error codes and user-facing behaviour.
11. **Notifications** — events emitted and channels used.
12. **Audit logs** — what is recorded for accountability.
13. **Security requirements** — module-specific controls beyond the platform baseline.
14. **AI functionality** — where AI augments the module and its guardrails.
15. **Dependencies** — other modules/services this one relies on or emits to.

### 0.3 Conventions

- **MUST / SHOULD / MAY** follow RFC 2119.
- All IDs are UUID v7 (time-ordered) unless stated. Money is stored as integer minor units plus ISO-4217 currency code. Timestamps are UTC ISO-8601 with timezone; the UI localizes.
- Every table carries `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, and soft-delete `deleted_at`.
- API paths are prefixed `/api/v1`. Internal service calls use gRPC; browser clients use REST + a GraphQL gateway.

---

## 1. Project Overview & Vision

### 1.1 Summary

UnivOS is a multi-tenant, cloud-native, AI-powered platform that digitizes the complete lifecycle of a university community — from prospective applicant, to enrolled student, to graduate, to engaged alumni — unifying academics, administration, finance, campus services, research, and AI-driven decision support into one scalable system. Each tenant (university/campus group) operates on logically isolated data with its own branding, configuration, and optional bring-your-own-key encryption.

### 1.2 Goals

- Replace fragmented, paper-driven processes with a single auditable digital ecosystem.
- Provide role-specific dashboards with least-privilege access for every stakeholder.
- Embed AI where it demonstrably reduces effort or improves outcomes, always with human-in-the-loop for consequential decisions.
- Meet enterprise expectations for security, privacy, availability, accessibility, and compliance (WCAG 2.1 AA; GDPR/DPDP/FERPA; NAAC/NBA/NIRF/AISHE).
- Be mobile-first, offline-tolerant, and usable on low-bandwidth campus networks.

### 1.3 Non-goals (initial release)

- UnivOS is not a general-purpose LMS authoring tool; it integrates external LMS content via LTI 1.3/SCORM/xAPI rather than reimplementing a full courseware editor.
- It does not replace statutory accounting ERPs where a tenant mandates one; instead it integrates via connectors.
- On-device model training is out of scope; only inference and lightweight personalization run at the edge.

### 1.4 Personas (stakeholders)

Student, Parent/Guardian, Faculty, Head of Department (HOD), Principal/Dean, Management/Trustee, Admission Officer, Accounts/Finance Officer, Hostel Warden, Librarian, Placement Officer, Examination Controller, Research Officer, HR Officer, Transport Officer, Health/Counseling Staff, Security/Gate Staff, Alumni, Guest/Public Visitor, Tenant Admin, and Super Admin (platform operator). Section 4 defines each role's capabilities; Section 5.2 defines the permission model that enforces them.

### 1.5 Brand & theming baseline

Primary accent `#E67E6A` (coral), neutral overlay `#00000066`, White as base surface, Black used very minimally for text/icons. The product ships light and dark themes with a persisted user-level toggle and respects the OS `prefers-color-scheme`. Full design tokens are in Section 22.

---

## 2. Architecture

### 2.1 Architectural principles

- **Clean Architecture + Domain-Driven Design (DDD).** Each service is layered: domain (entities, value objects, domain services), application (use cases/commands/queries), interface (controllers, resolvers, consumers), and infrastructure (repositories, gateways). Domain code has zero framework dependencies.
- **SOLID** throughout; dependencies point inward via interfaces.
- **Microservices by bounded context**, not by technical layer. A service owns its data; no service reads another service's database directly. Cross-service data is obtained via API or replicated through events (CQRS read models).
- **Event-driven where it decouples** (Kafka as the backbone). Synchronous request/response only where a caller genuinely needs an immediate answer.
- **Multi-tenancy is a first-class concern** enforced at every layer (Section 5.1).
- **API-first.** Contracts (OpenAPI 3.1, GraphQL SDL, Protobuf, AsyncAPI for events) are authored before implementation and are the source of truth for codegen and tests.

### 2.2 C4 model

**Level 1 — System context.** UnivOS sits between end users (web/PWA/native), external identity/document providers (DigiLocker, Aadhaar eKYC, SSO), payment networks (UPI/cards), messaging providers (email/SMS/WhatsApp/push), government portals (AISHE/NSP/UGC), and third-party academic services (proctoring, plagiarism, LMS content).

**Level 2 — Containers.**

- **Edge/CDN** (Cloudflare) → **WAF** → **API Gateway** (Kong/APISIX) → **BFF/GraphQL Gateway** (Apollo) for browser clients.
- **Web app** (Next.js) and **PWA**; **native wrappers** (Capacitor) for app stores.
- **Domain microservices** (Section 2.4) behind the gateway, communicating via gRPC (sync) and Kafka (async).
- **Data stores:** PostgreSQL (per-service schemas), MongoDB (document-heavy modules), Redis (cache/sessions/locks), Elasticsearch/OpenSearch (search), ClickHouse (analytics), TimescaleDB (IoT telemetry), Vector DB (pgvector/Weaviate for RAG/embeddings), MinIO/S3 (objects).
- **Async workers** (Celery/BullMQ) for background jobs; **schedulers** for cron workloads.
- **AI platform:** model gateway, RAG service, feature store, model registry, guardrail service.
- **Observability stack:** OpenTelemetry collector → Prometheus/Grafana (metrics), Loki (logs), Tempo/Jaeger (traces), Sentry (errors).

**Level 3 — Components.** Each service internally follows the Clean Architecture layering above. Component diagrams are auto-generated from code annotations (Section 19).

**Level 4 — Code.** Enforced by module boundaries, linters, and architecture tests (e.g., dependency-direction assertions in CI).

### 2.3 Communication patterns

- **Command/Query (sync):** REST for external clients, gRPC internally.
- **Events (async):** Kafka topics per bounded context using the outbox pattern to guarantee at-least-once delivery. Consumers are idempotent (dedupe by event ID). Schemas are versioned in a schema registry (Avro/Protobuf) with backward-compatibility checks in CI.
- **Sagas:** Long-running cross-service processes (e.g., admission→fee→enrollment→hostel allocation) are orchestrated as sagas with compensating actions; state is persisted so a crash resumes safely.
- **Realtime:** WebSockets/Socket.IO via a dedicated gateway for notifications, chat, live bus tracking, and dashboards; MQTT ingress for IoT.

### 2.4 Service catalogue (bounded contexts)

`identity` (auth, users, roles, tenants, sessions), `admissions`, `academics` (programs, courses, curriculum, enrollment, timetable), `attendance`, `examinations`, `finance` (fees, payments, ledger, payroll interface), `hostel`, `transport`, `library`, `placement`, `research`, `events`, `grievance` (complaints/anti-ragging/lost-found), `hr`, `inventory`, `communication` (messaging/forums/notifications), `health`, `catering` (mess/cafeteria), `visitor`, `facility` (bookings/IoT/signage), `alumni`, `compliance` (accreditation/statutory), `analytics`, `ai-platform`, `notification`, `file` (uploads/AV/signing), `audit`, `search`, and `tenant-admin`. Each is independently deployable and scalable.

### 2.5 Reference request flow (example)

A student marks attendance via QR: PWA → CDN → WAF → Gateway (JWT verify, rate limit, tenant resolve) → `attendance` service (validates session, geofence, liveness) → writes record (Postgres) + emits `attendance.recorded` (Kafka) → `notification` consumer alerts parent on absence patterns; `analytics` consumer updates ClickHouse; `academics` read model updates the student's percentage. Response returns in <300 ms p95; downstream effects are async.

---

## 3. Technology Stack (with rationale)

**Frontend:** TypeScript, React 18, Next.js (App Router, SSR/ISR for the public site and SEO), Tailwind CSS with a design-token layer, TanStack Query for server state, Zustand for local UI state, React Hook Form + Zod for forms/validation, Radix UI primitives for accessible components, i18next for localization, Workbox for PWA/offline. Rationale: SSR gives fast, SEO-friendly public pages; the same component library powers authenticated dashboards.

**Backend:** Python **FastAPI** for most domain services (async, typed, OpenAPI-native) and ML-adjacent services; **NestJS (Node/TypeScript)** for the BFF/gateway, realtime, and notification services (shares types with the frontend); **Go** for high-throughput/low-latency services (attendance ingestion, IoT/MQTT, bus telemetry). Rationale: use the right runtime per workload while standardizing contracts.

**Async & messaging:** Apache Kafka (event backbone), RabbitMQ (task queues where simple routing suffices), Celery/BullMQ (workers), MQTT broker (IoT).

**Databases:** PostgreSQL 16 (primary OLTP, one schema per service; Row-Level Security enabled), MongoDB (flexible documents: forms, CMS content, question banks), Redis (cache, sessions, distributed locks, rate limits), Elasticsearch/OpenSearch (full-text/faceted search), ClickHouse (OLAP/analytics), TimescaleDB (time-series IoT), Vector DB via **pgvector** (default) with Weaviate/Pinecone option for large-scale RAG.

**AI/ML:** Pluggable **model gateway** abstracting providers (OpenAI/Anthropic/self-hosted Llama via vLLM); LangChain/LlamaIndex for orchestration; Hugging Face Transformers; Whisper for speech-to-text; Tesseract + layout models for OCR; scikit-learn/XGBoost for tabular predictions (dropout, demand); PyTorch/TensorFlow for deep models; MLflow for tracking/registry; Feast for the feature store.

**Auth:** OpenID Connect/OAuth 2.1 (Authorization Code + PKCE), JWT access tokens (short-lived) + rotating refresh tokens, MFA (TOTP/WebAuthn/FIDO2), SAML for enterprise SSO, Google/Microsoft social login. Keycloak (or Ory) as the identity provider; the `identity` service wraps it with tenant-aware logic.

**Cloud/DevOps:** Kubernetes (EKS/AKS/GKE) via Helm; Terraform + Terragrunt for IaC; ArgoCD (GitOps) for CD; GitHub Actions for CI; Istio/Linkerd service mesh (mTLS, retries, traffic shifting); Cloudflare CDN/WAF; MinIO/S3 storage; HashiCorp Vault for secrets. Observability: OpenTelemetry, Prometheus, Grafana, Loki, Tempo, Sentry, optional Datadog.

**Third-party SDKs:** Stripe/Razorpay (payments), Twilio/MSG91 (SMS/WhatsApp), SendGrid/SES (email), Firebase (push/FCM), Mapbox/Google Maps (geo), plus the integrations in Section 12.

**Rationale for polyglot persistence:** each data store is chosen for its access pattern (OLTP vs. search vs. analytics vs. time-series vs. vectors); services never share a database, so the store can evolve per context.

---

## 4. User Roles & Permission Model

UnivOS uses **RBAC with ABAC overlays** (Section 5.2). Roles bundle permissions; ABAC policies further constrain by attributes (tenant, department, ownership, program, time, device posture). Permissions are expressed as `resource:action` (e.g., `attendance:mark`, `fee:refund:approve`). A permission is granted only if RBAC allows it **and** every applicable ABAC policy passes. All roles are scoped to a tenant except Super Admin.

### 4.1 Role catalogue and core capabilities

**Student** — Apply/track admission; pay fees and view receipts; view timetable, attendance, internal marks and grades; register/add-drop courses and electives; download hall tickets and results; access placement, hostel, transport, and library portals; raise and track complaints; apply for scholarships and leave; book mentor/counseling/office-hours; view digital ID; manage notification preferences; use the AI study planner and campus assistant. Scope: own records only.

**Parent/Guardian** — Linked to one or more students (verified relationship). View attendance, fee status, academic performance, leave status, transport location (consent-based), and receive notifications; pay fees; raise complaints; book counseling sessions. Scope: linked students only, read-mostly.

**Faculty** — Take attendance; author/publish course materials and OER; create assignments/quizzes/rubrics; grade and manage the gradebook; view student analytics for taught sections; apply leave; supervise research; book office hours; participate in forums; self-appraisal (ACR). Scope: assigned sections/courses.

**HOD** — All faculty capabilities plus: manage department faculty, allocate subjects, approve timetables and leave, view department dashboards/budgets, review research output, approve grade moderation within department. Scope: own department.

**Principal/Dean** — University-wide read analytics (admissions, revenue, exams, placement, attendance), department comparison, faculty performance, strategic KPIs; approve cross-department policies; escalated approvals. Scope: whole tenant, read plus approval workflows.

**Management/Trustee** — Full administrative/business control: policy configuration, multi-campus oversight, vendor/partner management, financial governance, feature enablement (within tenant), strategic dashboards. Scope: whole tenant.

**Admission Officer** — Review applications, verify documents (AI-assisted), generate merit/waitlists, handle quotas/reservations, schedule counseling, administer entrance tests, confirm seat allocation. Scope: admissions data.

**Accounts/Finance Officer** — Fee configuration and collection, scholarship disbursement, refunds, fines, reconciliation, vendor payouts, TDS/GST, donation receipts, financial reports. Scope: finance data; segregation-of-duties enforced (maker/checker).

**Hostel Warden** — Room/bed allocation, hostel attendance and night roll-call, visitor and outpass management, complaint tracking, mess management, leave approval, duty roster, anti-ragging reports. Scope: assigned hostel(s).

**Librarian** — Catalogue and circulation (issue/return/renew), fines, digital library, acquisitions, stock audit, inter-library loans, reservations, book-bank. Scope: library data.

**Placement Officer** — Company onboarding, job/internship postings, eligibility rules, drive scheduling, resume/offer tracking, aptitude/coding tests, analytics. Scope: placement data.

**Examination Controller** — Exam scheduling, seating/invigilator allocation, hall tickets, result processing and moderation, revaluation, backlog, question-bank governance, certificate issuance. Scope: examination data; strict segregation and encryption.

**Research Officer** — Manage grants, projects, publications, patents, IRB/ethics workflow, reimbursements, open-access repository, analytics. Scope: research data.

**HR Officer** — Employee records, recruitment/onboarding/offboarding, leave, payroll interface, appraisals, training, grievances, asset assignment. Scope: HR data; PII-restricted.

**Transport Officer** — Routes/stops, vehicle and driver management, pass issuance, maintenance/fuel logs, live tracking oversight, alerts. Scope: transport data.

**Health/Counseling Staff** — Clinic appointments, consent-based medical records, counseling sessions with confidential notes, mental-health workflows, pharmacy stock. Scope: health data; highest confidentiality tier.

**Security/Gate Staff** — Visitor passes, gate entry/exit and vehicle logs, badge printing, watch-list and lockdown triggers. Scope: visitor/gate data.

**Alumni** — Directory profile, alumni job board, mentorship, reunion/event registration, donations, success stories, transcript/degree reissue requests. Scope: own profile + public directory (read-mostly).

**Guest/Public Visitor** — Browse public site, register for public events, book campus tours, submit enquiries. No authenticated data.

**Tenant Admin** — Per-tenant configuration: branding, role/permission assignment, module enablement, academic structure setup, integrations, data retention, audit review, imports/exports. Scope: own tenant.

**Super Admin (platform operator)** — Cross-tenant onboarding/offboarding, platform feature flags, global audit, backup/restore, incident tooling, billing. Cross-tenant access is break-glass, time-boxed, MFA-gated, and fully audited; Super Admin cannot read tenant PII without an approved, logged break-glass grant.

### 4.2 Permission matrix (illustrative excerpt)

The full matrix is generated from code and published in the admin console. Excerpt (`✓` = allowed subject to ABAC scope):

| Permission            | Student   | Faculty | HOD | Accounts | Exam Ctrl | Tenant Admin |
| --------------------- | --------- | ------- | --- | -------- | --------- | ------------ |
| `attendance:mark`     | self (QR) | ✓       | ✓   | –        | –         | ✓            |
| `attendance:override` | –         | ✓       | ✓   | –        | –         | ✓            |
| `grade:enter`         | –         | ✓       | ✓   | –        | –         | –            |
| `grade:moderate`      | –         | –       | ✓   | –        | ✓         | –            |
| `fee:pay`             | ✓         | –       | –   | ✓        | –         | –            |
| `fee:refund:approve`  | –         | –       | –   | checker  | –         | ✓            |
| `result:publish`      | –         | –       | –   | –        | ✓         | –            |
| `role:assign`         | –         | –       | –   | –        | –         | ✓            |

### 4.3 Delegation & impersonation

Roles support time-boxed **delegation** (e.g., HOD delegates approvals during leave) and support-driven **impersonation** ("view as user") that is consent- or policy-gated, read-only by default, banner-flagged in the UI, and fully audited.

---

## 5. Cross-Cutting Foundations

These platform capabilities are implemented once and reused by every module. Module specs in Section 7 reference them rather than restating them.

### 5.1 Multi-tenancy

- **Isolation model:** shared database, **schema-per-service** with **`tenant_id` on every row** and PostgreSQL **Row-Level Security (RLS)** policies that filter by the `tenant_id` claim in the request context. Large or regulated tenants may be promoted to a **dedicated database/cluster** without code changes (tenancy resolved via a routing map).
- **Tenant resolution:** derived from the authenticated token (primary) and validated against host/subdomain (`tenant.univos.app`) or custom domain. The gateway injects a signed tenant context propagated via headers/gRPC metadata; services reject requests lacking it.
- **Isolation guarantees:** every query passes through a repository layer that sets the RLS session variable; automated tests attempt cross-tenant access and must fail (Section 16). Object storage uses per-tenant prefixes and scoped credentials. Caches key on `tenant_id`. Search indices and analytics tables are partitioned by tenant.
- **Per-tenant configuration:** branding/theme, enabled modules, academic calendar and grading scheme, fee heads, notification templates, integrations, data-residency region, and BYOK encryption key.
- **Noisy-neighbour control:** per-tenant rate limits/quotas at the gateway and per-tenant worker concurrency caps.

### 5.2 Authentication & Authorization

- **AuthN:** OIDC/OAuth 2.1 Authorization Code + PKCE; short-lived JWT access tokens (10 min) signed with rotating asymmetric keys (JWKS); rotating refresh tokens (device-bound, revocable) stored httpOnly/SameSite=strict; session registry in Redis for instant revocation. MFA via TOTP and WebAuthn/FIDO2; step-up auth required for sensitive actions (refunds, result publish, role changes). Enterprise SSO via SAML/OIDC; SCIM for user provisioning.
- **AuthZ:** central policy engine (OPA/Cedar) evaluates `RBAC ∧ ABAC`. RBAC resolves the user's roles→permissions; ABAC policies constrain by attributes (tenant, department, section ownership, program, record ownership, time window, IP/geo, device posture, data-classification). Policies are versioned, testable, and hot-reloadable.
- **Token contents:** `sub`, `tenant_id`, `roles`, `perms` (compact), `amr` (auth methods), `dpop`/device binding, `sid` (session). No PII in tokens.
- **Machine-to-machine:** OAuth client credentials + mTLS via the mesh; partner apps use OAuth with per-scope consent.

### 5.3 API conventions & error model

- **REST:** resource-oriented, plural nouns, `/api/v1/...`; standard verbs; pagination via cursor (`?cursor=&limit=`) with `next`/`prev`; filtering/sorting via documented query params; partial responses via `fields=`. Idempotency via `Idempotency-Key` header on all POST that create money-moving or externally-visible effects.
- **GraphQL:** read-optimized gateway for dashboards; persisted queries only in production; depth/complexity limits; per-field authorization.
- **Standard envelope (errors):**
    ```json
    {
        "error": {
            "code": "FEE.PAYMENT_DECLINED",
            "message": "Card was declined.",
            "details": [{ "field": "card", "issue": "declined" }],
            "traceId": "...",
            "docs": "https://..."
        }
    }
    ```
- **Status codes:** 200/201/204 success; 400 validation; 401 auth; 403 authz; 404 not found; 409 conflict/idempotency; 422 business-rule violation; 429 rate limit; 5xx server. Every error carries a machine `code` (namespaced `MODULE.REASON`), a `traceId` for correlation, and never leaks internals/PII.
- **Versioning & deprecation:** additive changes are non-breaking; breaking changes bump the major version; deprecations announced via `Deprecation`/`Sunset` headers and the developer portal with ≥6-month runway.

### 5.4 Validation strategy

Three layers: (1) **client-side** with Zod schemas for instant UX feedback; (2) **API boundary** schema validation (Pydantic/Zod) rejecting malformed input with 400; (3) **domain invariants** enforced in domain services returning 422 with business codes. Shared validation contracts are generated from the OpenAPI/JSON-Schema so client and server never drift.

### 5.5 Eventing & background work

- **Outbox pattern:** state change + event are written in one transaction; a relay publishes to Kafka. Consumers are idempotent and use dead-letter queues with retry/backoff and alerting.
- **Event naming:** `context.entity.action` (e.g., `admissions.application.submitted`). Schemas registered and compatibility-checked.
- **Schedulers:** cron workloads (fee reminders, backups, report generation, IoT rollups) run as leader-elected jobs with locks to prevent duplicate execution.

### 5.6 File & document handling (`file` service)

Uploads go through pre-signed URLs to object storage; the service enforces MIME + magic-byte checks, size limits, and antivirus scanning (ClamAV) before marking a file "clean". Documents are encrypted at rest (AES-256, per-tenant key), served only via short-lived signed URLs, and support versioning, OCR extraction (Section 8), watermarking, and retention/legal-hold. Malware or DLP-flagged content is quarantined and the uploader notified.

### 5.7 Notifications framework (shared; see Section 11)

A single `notification` service consumes domain events and renders templated, localized messages across email, SMS, push, in-app, and WhatsApp, honoring per-user channel preferences, quiet hours, priority lanes, digest bundling, and delivery/read receipts.

### 5.8 Audit & activity logging (`audit` service)

Every state-changing action emits an immutable audit event: `who` (user, role, impersonator), `what` (action, entity, before/after diff for sensitive fields), `when`, `where` (IP/geo/device), `why` (reason for overrides), and `traceId`. Audit logs are append-only (hash-chained for tamper evidence), tenant-scoped, queryable in the admin console, retained per policy, and exportable for regulators. Reads of highly sensitive data (medical, exam papers) are also logged.

### 5.9 Search (`search` service)

Elasticsearch/OpenSearch powers global and module search with per-tenant indices, role-filtered results (a user only sees what they may access), typo tolerance, faceting, and synonyms. Indexing is event-driven from domain changes. Vector search (pgvector) powers semantic/RAG features (Section 8).

### 5.10 Caching

Multi-tier: CDN for public/static; HTTP cache headers/ETags for cacheable reads; Redis for hot objects, computed dashboards, and session data; per-service in-process LRU for reference data. All cache keys include `tenant_id` and a version salt for safe invalidation; writes publish invalidation events.

### 5.11 Internationalization & localization

All user-facing strings come from i18n catalogues (ICU message format) with English plus at least one Indian regional language at launch and a framework for more. Locale drives dates, numbers, currency, RTL support, and notification templates. Content translation (course/announcements) can be AI-assisted with human review.

### 5.12 Feature flags & configuration

LaunchDarkly/Unleash-style flags enable per-tenant, per-role, and gradual rollouts, plus kill-switches. Non-secret config is centralized and hot-reloadable; secrets live only in Vault and are never in flags or env files committed to source.

### 5.13 UI state conventions

Every data-bound screen defines four explicit states — **loading** (skeletons), **empty** (guidance + primary action), **error** (retry + support/trace reference), and **success** — plus optimistic updates where safe and inline validation. These states are assumed for every page listed in Section 7 unless a module specifies otherwise.

---

## 6. Canonical Data Model

Data is owned per bounded context; this section is the logical model. Cross-context references use the owning service's ID (no cross-schema foreign keys); consistency is maintained via events and read models. Common columns (`id uuidv7`, `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`) are implied on every table. Money = `amount_minor bigint` + `currency char(3)`.

### 6.1 Identity & people (`identity`)

- **users**(id, tenant_id, email UNIQUE-per-tenant, phone, password_hash (Argon2id), status[active|invited|suspended|locked], locale, timezone, mfa_enabled, last_login_at). Indexes: (tenant_id,email), (tenant_id,phone).
- **roles**(id, name, description, is_system) and **permissions**(id, key). **role_permissions**(role_id, permission_id). **user_roles**(user_id, role_id, scope_json[dept/section/hostel], valid_from, valid_to).
- **abac_policies**(id, name, effect, target_json, condition_rego, version, enabled).
- **sessions**(id, user_id, device_id, ip, user_agent, refresh_token_hash, expires_at, revoked_at).
- **person_profiles**(user_id, first_name, last_name, dob(encrypted), gender, photo_file_id, address_json, emergency_contact_json).
- **guardianships**(id, guardian_user_id, student_id, relationship, verified_at, consent_scope_json).
- **tenants**(id, name, subdomain, custom_domain, region, theme_json, byok_key_ref, enabled_modules_json, status).

### 6.2 Academic structure (`academics`)

- **schools/faculties**(id, name) → **departments**(id, school_id, name, code, hod_user_id).
- **programs**(id, department_id, name, level[UG|PG|PhD|Diploma], duration_terms, grading_scheme_id, accreditation_json).
- **courses**(id, program_id/department_id, code, title, credits, type[core|elective|lab], syllabus_doc_id, prerequisites_json).
- **curriculum_versions**(id, program_id, effective_year, course_map_json) for regulation/curriculum history.
- **academic_years**(id, name, start, end) and **terms/semesters**(id, academic_year_id, name, no, start, end, status).
- **sections**(id, course_id, term_id, faculty_user_id, room_id, capacity, schedule_json).
- **enrollments**(id, student_id, section_id, term_id, status[registered|dropped|completed], grade_id). Unique(student_id, section_id).
- **grading_schemes**(id, name, scale_json[grade→points→range]).
- **timetable_slots**(id, section_id, day_of_week, start, end, room_id, recurrence).
- **electives_choices**(id, student_id, term_id, ranked_course_ids_json, allocated_course_id).

### 6.3 Students & lifecycle

- **students**(id, user_id, admission_id, program_id, current_term_id, roll_no UNIQUE, registration_no, batch_year, status[enrolled|on_leave|suspended|graduated|withdrawn], mentor_user_id, category, quota, hostel_resident bool, transport_opt bool).
- **student_documents**(id, student_id, type, file_id, verified_by, verified_at, status).
- **id_cards**(id, student_id, qr_token, nfc_uid, valid_to, status).
- **transcripts**(id, student_id, term_id, gpa, cgpa, generated_pdf_id, blockchain_ref).

### 6.4 Admissions (`admissions`)

- **applications**(id, applicant_user_id, program_id, cycle_id, status[draft|submitted|under_review|shortlisted|offered|accepted|rejected|waitlisted|enrolled], score_json, quota, payment_id).
- **application_documents**(id, application_id, type, file_id, ocr_json, verification_status, ai_confidence).
- **admission_cycles**(id, program_id, open_at, close_at, seats, quota_matrix_json).
- **merit_lists**(id, cycle_id, generated_at, rank_rows_json, published bool).
- **offers**(id, application_id, seat_id, deadline, status). **counseling_slots**(id, cycle_id, datetime, capacity, booked_by_json).
- **entrance_tests**(id, cycle_id, config_json) and **entrance_attempts**(id, test_id, applicant_id, proctor_session_id, score).

### 6.5 Attendance (`attendance`)

- **attendance_sessions**(id, section_id, faculty_user_id, date, method[qr|rfid|face|gps|biometric|beacon|manual], geofence_json, qr_token, opens_at, closes_at).
- **attendance_records**(id, session_id, student_id, status[present|absent|late|excused], captured_method, lat, lng, liveness_score, device_id, marked_by, override_reason). Unique(session_id, student_id). Index(student_id, date).
- **attendance_summaries**(student_id, section_id, term_id, present, total, pct) — read model.

### 6.6 Examinations (`examinations`)

- **exams**(id, term_id, type[internal|end_term|backlog|revaluation], schedule_json, status).
- **exam_schedules**(id, exam_id, course_id, date, start, duration, mode[offline|cbt|online|takehome]).
- **question_banks**(id, course_id, encrypted_blob_ref) and **questions**(id, bank_id, type, difficulty, marks, encrypted_content).
- **seating_plans**(id, exam_schedule_id, room_id, seat_map_json) and **invigilators**(id, exam_schedule_id, faculty_user_id).
- **hall_tickets**(id, student_id, exam_id, qr_token, eligibility_ok, pdf_id).
- **submissions**(id, exam_schedule_id, student_id, file_ids_json, cbt_responses_json, proctor_flags_json, submitted_at).
- **evaluations**(id, submission_id, evaluator_user_id, rubric_id, marks_json, remarks, status). **results**(id, student_id, course_id, term_id, marks, grade, credit, status[provisional|moderated|published|withheld], published_at).
- **revaluation_requests**(id, result_id, student_id, type, fee_payment_id, status, delta).
- **certificates**(id, student_id, type[degree|provisional|transcript|migration], pdf_id, blockchain_ref, revoked bool).

### 6.7 Finance (`finance`)

- **fee_structures**(id, program_id, term_id, heads_json[head→amount], due_date, late_fee_rule_json).
- **fee_invoices**(id, student_id, term_id, line_items_json, gross, discount, net, status[pending|partial|paid|overdue|waived], due_date).
- **payments**(id, invoice_id/entity_ref, gateway, gateway_ref, method[upi|card|netbanking|cash|dd], amount, status[initiated|success|failed|refunded], idempotency_key).
- **refunds**(id, payment_id, amount, reason, maker_id, checker_id, status).
- **scholarships**(id, student_id, scheme, source[govt|institute|donor], amount, status, sanction_doc_id) and **concessions**(id, student_id, type, amount, approver_id).
- **ledger_entries**(id, account_id, debit, credit, ref_type, ref_id, posted_at) — double-entry. **accounts**(id, code, name, type).
- **payouts**(id, vendor_id, amount, status), **donations**(id, donor_ref, amount, campaign_id, receipt_80g_id).
- **payroll_runs**(id, period, status) linked to HR (Section 6.13).

### 6.8 Hostel (`hostel`)

- **hostels**(id, name, gender, warden_user_id, capacity), **rooms**(id, hostel_id, number, type, capacity), **beds**(id, room_id, label, status).
- **allocations**(id, student_id, bed_id, from, to, status). **mess_bills**(id, student_id, month, amount). **outpasses**(id, student_id, type, out_at, expected_in, actual_in, approved_by, status).
- **hostel_visitors**(id, student_id, visitor_name, relation, in_at, out_at). **roll_calls**(id, hostel_id, date, taken_by, present_json).

### 6.9 Transport (`transport`)

- **vehicles**(id, reg_no, capacity, fitness_expiry, permit_expiry, insurance_expiry), **drivers**(id, user_id, license_no, license_expiry).
- **routes**(id, name, stops_json[stop→lat/lng/eta]), **route_assignments**(id, route_id, vehicle_id, driver_id, term_id).
- **transport_passes**(id, student_id, route_id, stop_id, term_id, fee_payment_id, status).
- **vehicle_telemetry**(vehicle_id, ts, lat, lng, speed) — TimescaleDB. **boarding_logs**(id, student_id, vehicle_id, stop_id, event[board|alight], ts).

### 6.10 Library (`library`)

- **catalog_items**(id, type[book|ebook|journal], title, authors_json, isbn, copies_total, tags_json, embedding vector). **copies**(id, item_id, barcode, status[available|issued|lost|reserved]).
- **loans**(id, copy_id, borrower_user_id, issued_at, due_at, returned_at, renewals, fine_amount). **reservations**(id, item_id, user_id, queue_pos, status). **library_fines**(id, loan_id, amount, paid bool).

### 6.11 Placement (`placement`)

- **companies**(id, name, sector, contact_json, status). **job_postings**(id, company_id, title, ctc, eligibility_json[cgpa/branch/backlog], type[job|internship], deadline, status).
- **applications_placement**(id, posting_id, student_id, resume_id, status[applied|shortlisted|interview|offered|rejected|accepted]).
- **drives**(id, company_id, dates_json, rounds_json). **offers_placement**(id, student_id, company_id, ctc, role, letter_id, status). **skill_profiles**(student_id, skills_json, assessments_json).

### 6.12 Research (`research`)

- **projects**(id, pi_user_id, title, funding_source, budget, status), **grants**(id, project_id, agency, amount, sanction_id, utilization_json), **publications**(id, authors_json, title, venue, year, doi, citations), **patents**(id, title, status, applicants_json), **ethics_reviews**(id, project_id, status, committee_notes_id).

### 6.13 HR & payroll (`hr`)

- **employees**(id, user_id, emp_no, department_id, designation, join_date, employment_type, ctc_json, status). **leave_requests**(id, employee_id, type, from, to, days, status, approver_id, balance_after). **leave_balances**(employee_id, type, balance).
- **payslips**(id, employee_id, payroll_run_id, earnings_json, deductions_json, net, pdf_id). **appraisals**(id, employee_id, cycle, self_json, reviewer_json, rating). **recruitments**(id, position, stage, candidate_json).

### 6.14 Campus services & governance

- **inventory_assets**(id, category, tag, location, status, warranty_expiry, depreciation_json), **purchase_orders**(id, vendor_id, items_json, status, total), **vendors**(id, name, gst, contact_json, risk_rating).
- **events**(id, title, type, start, end, mode, capacity, tracks_json, budget_json, status), **event_registrations**(id, event_id, attendee_ref, ticket_qr, checked_in bool), **event_feedback**(id, event_id, rating, comments).
- **complaints**(id, category, subcategory, raised_by, anonymous bool, assignee_id, priority, sla_due, status, sentiment, resolution_notes), **anti_ragging_reports**(id, ... , confidential), **lost_found_items**(id, kind[lost|found], description, image_id, location, status, claim_json).
- **bookings**(id, resource_type[hall|lab|ground|equipment], resource_id, requester_id, from, to, status). **facility_resources**(id, type, name, capacity).
- **visitors**(id, name, purpose, host_user_id, pass_qr, photo_id, in_at, out_at, watchlist_hit), **vehicle_entries**(id, plate, in_at, out_at, image_id).
- **health_appointments**(id, patient_ref, clinician_id, slot, status), **medical_records**(id, patient_ref, encrypted_blob, consent_ref), **counseling_sessions**(id, counselor_id, student_id, notes_encrypted, confidential bool), **mentorships**(id, mentor_user_id, mentee_student_id, goals_json, status).
- **mess_menus**(id, date, meals_json), **meal_bookings**(id, student_id, meal, date, coupon_qr).
- **iot_devices**(id, type, location, status), **iot_telemetry**(device_id, ts, metric, value) — TimescaleDB. **signage_screens**(id, location, playlist_id).
- **accreditation_records**(id, framework[NAAC|NBA|NIRF|AISHE], metric_key, value, evidence_file_id, period), **statutory_returns**(id, type, period, due, status).
- **alumni_profiles**(id, user_id, batch, program, employer, location, mentorship_opt, verified), **donation_campaigns**(id, title, goal, raised), **success_stories**(id, alumni_id, content, published).

### 6.15 Platform tables

- **notifications**(id, user_id, template_key, channels_json, payload_json, status, read_at). **notification_prefs**(user_id, channel, category, enabled, quiet_hours_json).
- **audit_events**(id, actor_id, impersonator_id, action, entity_type, entity_id, diff_json, ip, geo, trace_id, prev_hash, hash). Append-only.
- **files**(id, key, mime, size, checksum, av_status, encryption_key_ref, owner_ref, retention_until, legal_hold).
- **feature_flags**(key, tenant_id, role_scope, enabled, rollout_pct). **jobs**(id, type, payload, status, attempts, run_at). **outbox**(id, aggregate, event_type, payload, published_at).

### 6.16 Referential integrity & indexing rules

Within a service, foreign keys are enforced in Postgres. Across services, only ID references are stored and validated via events/read models. Every foreign key and every column used in `WHERE`/`ORDER BY`/tenant filtering is indexed; composite indexes lead with `tenant_id`. High-cardinality search moves to Elasticsearch; analytics aggregates to ClickHouse via CDC (Debezium).

---

## 7. Functional Modules (Full Specifications)

Each module follows the 15-point template from Section 0.2. Where a control is provided by a foundation in Section 5 (auth, tenancy, audit, notifications, files, search, caching, i18n, error model, UI states), the module inherits it and only notes deviations.

### 7.A Public University Website & CMS

**Purpose.** The public, SEO-optimized web presence and top-of-funnel for admissions: marketing pages, program catalogue, news/events, and the entry point to authenticated portals. Content is tenant-editable via a headless CMS.

**Bounded context/service.** Served by Next.js (SSR/ISR) reading from a `cms` collection (MongoDB) exposed through the BFF; no OLTP writes beyond enquiries/registrations.

**Roles & permissions.** Guest: read + submit enquiry/event registration/tour booking. Tenant Admin/Content Editor: `cms:page:edit`, `cms:publish`, `media:upload`. Everyone else: read.

**Primary workflows.**

1. _Browse & apply:_ Guest lands on SEO page → explores Programs/Departments/Faculty → clicks **Apply Now** → routed to Admissions (7.B) registration.
2. _Content publishing:_ Editor drafts a page in the CMS → preview → submit for approval → approver publishes → ISR revalidation refreshes the static page and sitemap.
3. _Enquiry:_ Guest submits contact form (captcha) → creates a lead → routed to Admission Officer + auto-acknowledgement email.

**Frontend pages.** `/` Home, `/about`, `/programs`, `/programs/[slug]`, `/departments`, `/departments/[slug]`, `/faculty`, `/placements`, `/research`, `/gallery`, `/events`, `/events/[slug]`, `/news`, `/contact`, `/apply`, `/login`, `/accessibility`, `/tour-booking`, `/downloads` (brochures), `/virtual-tour` (3D/360). All responsive, WCAG 2.1 AA, with structured data (JSON-LD), OpenGraph, dynamic sitemap/robots, and multilingual routing.

**Backend APIs.** `GET /api/v1/cms/pages/{slug}`, `GET /api/v1/cms/navigation`, `POST /api/v1/leads` (enquiry), `POST /api/v1/events/{id}/register`, `POST /api/v1/tours` (booking), `GET /api/v1/programs` (public projection). Editor APIs: `POST/PUT /api/v1/cms/pages`, `POST /api/v1/cms/pages/{id}/publish`, `POST /api/v1/media`.

**Database entities.** `cms_pages`, `cms_blocks`, `media_assets`, `leads`, plus public projections of `programs`, `departments`, `events`.

**Business logic & rules.** Draft→review→publish state machine; scheduled publish/unpublish; canonical URLs; redirect management; only "clean" media (AV-scanned) may be published.

**Validation.** Required SEO fields (title ≤60 chars, meta description ≤160), valid slugs (unique), image alt-text mandatory (accessibility), form fields validated (email/phone formats), captcha token required.

**Error handling.** 404 pages return a branded not-found with search; publish conflicts (stale version) → 409 with diff; media too large/failed AV → 422 `CMS.MEDIA_REJECTED`.

**Notifications.** Enquiry acknowledgement to guest; lead alert to admissions; publish notification to subscribers/newsletter (opt-in).

**Audit.** Page create/edit/publish/unpublish, media uploads, lead creation.

**Security.** Public endpoints are unauthenticated but rate-limited and captcha-protected; editor endpoints require `cms:*` + step-up for publish; strict CSP; no PII indexed for SEO.

**AI functionality.** RAG-powered site assistant (answers program/fee/deadline questions from published content only), AI draft-generation and SEO suggestions for editors (human-approved), auto alt-text suggestions, and AI translation drafts.

**Dependencies.** Admissions (Apply), Events, Programs/Academics (catalogue), Notification, File.

---

### 7.B Online Admissions

**Purpose.** End-to-end applicant journey from registration to enrolled student, including document verification, entrance tests, merit lists, offers, fee payment, and conversion into a `student` record.

**Bounded context/service.** `admissions` (source of truth for applications, offers, cycles). Orchestrates a **saga** across `finance` (application/admission fee), `identity` (applicant→student user), `academics` (enrollment), and optionally `hostel`/`transport`.

**Roles & permissions.** Applicant (Guest→registered): create/submit/track application, upload docs, pay, book counseling, accept/decline offer. Admission Officer: `admission:review`, `admission:verify_doc`, `admission:shortlist`, `admission:merit:generate`, `admission:offer`, `admission:quota:manage`. Principal/Management: read analytics, approve policy/quota. Accounts: reconcile admission fees.

**Primary workflows.**

1. _Apply:_ Register (email/phone OTP verify) → complete profile → select program(s)/cycle → upload documents (DigiLocker fetch or manual) → Aadhaar eKYC (optional) → pay application fee → **submit** (status `submitted`).
2. _Verify & score:_ AI document verification runs (OCR + tamper/consistency checks) producing confidence scores → Officer reviews low-confidence/flagged docs (human-in-the-loop) → mark verified → entrance test score imported or proctored test taken → composite score computed.
3. _Merit & offer:_ Officer generates a **merit list** applying quota matrix and tie-break rules → publishes → **offers** issued with acceptance deadline → applicant accepts → pays admission fee → seat confirmed.
4. _Convert:_ On confirmation, saga creates the `student` record, `identity` student account, initial `enrollment`, generates roll number, and triggers ID card, hostel/transport options, and welcome onboarding.
5. _Waitlist:_ Declined/expired offers cascade to the next waitlisted applicant automatically.

**Frontend pages.** Applicant portal: Dashboard (status tracker), Registration/OTP, Application Form (multi-step, autosave), Document Upload (with DigiLocker), Payment, Entrance Test, Offer & Acceptance, Counseling Slot Booking. Officer console: Application Queue (filters by status/program/flag), Application Detail (docs, OCR, scores, decision), Merit List Builder, Quota Configuration, Waitlist Manager, Analytics.

**Backend APIs.** `POST /applications` (draft), `PUT /applications/{id}`, `POST /applications/{id}/documents`, `POST /applications/{id}/submit`, `GET /applications/{id}`, `POST /applications/{id}/verify` (officer), `POST /cycles/{id}/merit-list`, `POST /cycles/{id}/merit-list/publish`, `POST /applications/{id}/offer`, `POST /offers/{id}/accept`, `POST /counseling/slots/{id}/book`, `GET /admissions/analytics`. Webhooks: payment success/failure; DigiLocker fetch callback.

**Database entities.** `applications`, `application_documents`, `admission_cycles`, `merit_lists`, `offers`, `counseling_slots`, `entrance_tests`, `entrance_attempts` (Section 6.4); emits to `students` on conversion.

**Business logic & rules.** Eligibility rules per program (qualifying exam, min marks, category); quota matrix allocation (SC/ST/OBC/EWS/PWD/Sports) with reserved-seat spillover rules; deterministic tie-breakers (e.g., aggregate → subject marks → age); offer deadlines auto-expire; one active accepted offer per applicant per cycle; fee payment required before seat lock.

**Validation.** Unique applicant per cycle+program; document type/format/size; Aadhaar/PAN format + checksum; entrance score within valid range; deadline not passed; quota category matches submitted proof.

**Error handling.** `ADMISSION.CYCLE_CLOSED`, `ADMISSION.DUPLICATE_APPLICATION`, `ADMISSION.DOC_UNVERIFIED`, `ADMISSION.OFFER_EXPIRED`, `ADMISSION.SEAT_UNAVAILABLE`, payment failures surfaced with retry.

**Notifications.** Registration OTP, submission receipt, document-verification results, shortlist/merit publication, offer issued (with deadline reminders), payment confirmation, admission confirmed + onboarding. Parents notified on confirmation if linked.

**Audit.** Every status transition, document verification decision (with officer + AI confidence), merit generation parameters, offer/acceptance, quota overrides (reason required).

**Security.** PII/Aadhaar tokenized (Section 9); proctored entrance tests; document access via signed URLs; officer decisions require justification; merit generation parameters immutable once published (new list = new version).

**AI functionality.** OCR + AI document verification with tamper/forgery and cross-field consistency detection and confidence scoring (human review below threshold); AI admission-guidance chatbot; predictive yield/seat-conversion modeling for planning; anti-cheating proctoring (Section 8) for online entrance tests; duplicate/fraud detection across applications.

**Dependencies.** Identity, Finance, Academics, File, Notification, DigiLocker/Aadhaar/entrance-board integrations, Proctoring, AI platform.

---

### 7.C Student ERP

**Purpose.** The student's unified home for academics and campus life: profile, timetable, attendance, marks/grades, registration, certificates, and links to every service.

**Bounded context/service.** Aggregates read models from `academics`, `attendance`, `examinations`, `finance`, etc., via the BFF; owns student-centric preferences and the AI study planner.

**Roles & permissions.** Student: read own data, register/add-drop, select electives, download documents, manage preferences, raise requests. Parent: read linked student (consent-scoped). Faculty/HOD: read for advising within scope.

**Primary workflows.**

1. _Course registration/add-drop:_ Student opens registration window → sees eligible courses (prereqs, credit limits) → selects → system checks conflicts/capacity/prereqs → confirms → enrollment created; add-drop allowed until deadline with audit.
2. _Elective selection:_ Ranked preferences → allocation algorithm (capacity + rank + CGPA tie-break) → allocation published.
3. _View & download:_ Timetable, attendance %, internal marks, semester results, transcript, certificates (bonafide, fee receipts) generated on demand as signed PDFs.
4. _Wellness & planning:_ Student uses AI study planner (from timetable + deadlines + performance) and optional wellness check-in.

**Frontend pages.** Dashboard (attendance %, upcoming classes/deadlines, dues, announcements), Profile, Academic History, Timetable, Attendance detail, Marks & Grades, CGPA calculator, Course Registration/Add-Drop, Elective Selection, Certificates & Transcript, Digital ID (QR/NFC), Notifications center, Requests (leave/bonafide/scholarship), Settings/Preferences.

**Backend APIs.** `GET /me/dashboard`, `GET /me/timetable`, `GET /me/attendance`, `GET /me/results`, `GET /me/transcript`, `POST /me/registrations`, `DELETE /me/registrations/{id}` (drop), `POST /me/electives`, `POST /me/documents/bonafide`, `GET /me/id-card`, `POST /me/wellness-checkin`, `GET/PUT /me/preferences`.

**Database entities.** Reads `students`, `enrollments`, `attendance_summaries`, `results`, `transcripts`, `timetable_slots`; owns `student_preferences`, `wellness_checkins`, `study_plans`.

**Business logic & rules.** Registration constrained by min/max credits, prerequisites, time conflicts, section capacity, outstanding-dues hold (configurable), and academic standing; certificate generation blocked if dues/holds unless policy permits.

**Validation.** Registration window open; credit limits; prerequisite satisfaction; no timetable clash; add-drop before deadline.

**Error handling.** `ERP.REG_WINDOW_CLOSED`, `ERP.PREREQ_NOT_MET`, `ERP.CREDIT_LIMIT_EXCEEDED`, `ERP.TIMETABLE_CONFLICT`, `ERP.HOLD_ACTIVE`.

**Notifications.** Registration confirmations, add-drop deadlines, low-attendance warnings, new marks/results, fee due reminders, timetable changes.

**Audit.** Registration/add-drop, elective allocation, certificate generation, profile changes.

**Security.** Strict ownership ABAC (students can only read self; parents only linked+consented); certificates are signed and verifiable; digital ID QR is a rotating signed token to prevent cloning.

**AI functionality.** Personal AI study planner; adaptive learning-path suggestions; early-warning nudges for at-risk courses (explainable); learning-style assessment; wellness sentiment (consented). All advisory, never blocking.

**Dependencies.** Academics, Attendance, Examinations, Finance, Library/Placement/Hostel/Transport (portal links), AI platform, File, Notification.

---

### 7.D Faculty ERP & Teaching

**Purpose.** Faculty workspace for teaching delivery, assessment, analytics, research supervision, and administrative self-service.

**Bounded context/service.** `academics` (teaching/assessment) with links to `attendance`, `examinations`, `research`, `hr`.

**Roles & permissions.** Faculty: manage own sections (materials, assignments, quizzes, grades), take attendance, view section analytics, apply leave, self-appraisal. HOD: department oversight + approvals. Read-only for Principal within scope.

**Primary workflows.**

1. _Course delivery:_ Faculty uploads lesson plans/materials/OER to a section → students access via Student ERP → optional LTI content embed.
2. _Assessment:_ Create assignment/quiz with rubric → students submit → auto/manual grading → gradebook updates → internal marks flow to Examinations.
3. _Attendance:_ Open a session (QR/face/manual) → students mark → faculty reviews/overrides → summary updates (7.E).
4. _Analytics & advising:_ View at-risk students (AI early-warning) → record advising notes.

**Frontend pages.** Dashboard, My Sections, Course Materials/OER authoring, Assignments, Quiz Builder, Gradebook, Attendance, Student Analytics, Research Supervision, Leave, Self-Appraisal (ACR), Office-hours calendar, Meeting scheduler.

**Backend APIs.** `GET /faculty/sections`, `POST /sections/{id}/materials`, `POST /sections/{id}/assignments`, `POST /assignments/{id}/grade`, `POST /sections/{id}/quizzes`, `GET /sections/{id}/gradebook`, `GET /sections/{id}/analytics`, `POST /faculty/leave`, `POST /faculty/appraisal`.

**Database entities.** `sections`, `assignments`, `submissions`, `quizzes`, `gradebook_entries`, `materials`, `lesson_plans`, plus `leave_requests`/`appraisals` (HR).

**Business logic & rules.** Grade entry only for assigned sections and open assessment windows; rubric-based scoring; grade changes after publication require HOD approval; internal marks aggregation rules configurable per program.

**Validation.** Marks within max; submission deadlines; only enrolled students gradable; material file types/size; plagiarism check before acceptance where enabled.

**Error handling.** `FAC.NOT_ASSIGNED`, `FAC.WINDOW_CLOSED`, `FAC.MARKS_OUT_OF_RANGE`, `FAC.GRADE_LOCKED`.

**Notifications.** New material/assignment to students, submission received, grade published, deadline reminders, leave decisions.

**Audit.** Grade entries/changes (with before/after), material publish, attendance overrides, appraisal submissions.

**Security.** Section-scoped ABAC; grade change trail; question banks and unpublished assessments encrypted.

**AI functionality.** AI grading assistant (code/SQL/essay with rubric, human-reviewed), AI question/quiz generation from syllabus, plagiarism/AI-authorship signals, auto-summarized student analytics, OER drafting assistance.

**Dependencies.** Academics, Attendance, Examinations, Research, HR, AI platform, File, Notification.

---

### 7.E Attendance Management

**Purpose.** Accurate, fraud-resistant, multi-modal attendance capture with parent alerts, defaulter analytics, and manual override with accountability.

**Bounded context/service.** `attendance` (Go for high-throughput capture).

**Roles & permissions.** Student: mark self via QR/face/geo within an open session. Faculty/HOD: open sessions, override, view reports. Parent: view linked student summaries. Warden: hostel roll-call.

**Primary workflows.**

1. _Capture:_ Faculty opens a time-boxed session (generates rotating signed QR + geofence) → student scans/marks via face+liveness or GPS+selfie or RFID/beacon → record validated (session open, within geofence, liveness pass, no duplicate) → stored → summary updated.
2. _Proxy prevention:_ Multi-face detection, liveness, device binding, rotating QR (expires in seconds), and geofence reject proxies; suspicious marks flagged for faculty review.
3. _Override:_ Faculty manually sets status with a mandatory reason (audited).
4. _Alerts & analytics:_ Absence/patterns trigger parent SMS/app alerts; defaulter heatmaps and chronic-absentee detection surface for advising.

**Frontend pages.** Faculty: Session control (open/close, live roster, flagged marks), Reports (daily/monthly/semester, heatmap). Student: Mark Attendance (QR scanner/face), My Attendance. Parent: Attendance dashboard. Warden: Roll-call.

**Backend APIs.** `POST /attendance/sessions` (open), `POST /attendance/sessions/{id}/close`, `POST /attendance/sessions/{id}/mark` (student), `PUT /attendance/records/{id}` (override), `GET /attendance/reports`, `GET /me/attendance`. High-throughput mark endpoint is idempotent per (session, student).

**Database entities.** `attendance_sessions`, `attendance_records`, `attendance_summaries` (Section 6.5).

**Business logic & rules.** A record is valid only if the session is open, the timestamp is within window, geofence/liveness pass, and no prior record exists. Percentage = present/total per section/term; configurable thresholds (e.g., <75% → exam-eligibility hold feeding Examinations). Late = within grace window.

**Validation.** Session open; one mark per student/session; geofence radius; liveness score ≥ threshold; RFID/biometric IDs registered to the student; override reason mandatory.

**Error handling.** `ATT.SESSION_CLOSED`, `ATT.ALREADY_MARKED`, `ATT.OUT_OF_GEOFENCE`, `ATT.LIVENESS_FAILED`, `ATT.PROXY_SUSPECTED`.

**Notifications.** Parent alert on absence; low-attendance warning to student+parent; eligibility-risk warning before exams.

**Audit.** Session open/close, every override (who/why), flagged-mark decisions, biometric enrollment.

**Security.** Face/biometric templates stored as encrypted, non-reversible embeddings (not raw images) with explicit consent; geolocation used only during marking; rotating signed QR prevents replay.

**AI functionality.** Face recognition + liveness/anti-spoof, multi-face proxy detection, classroom-camera smart attendance (opt-in), attendance/dropout-risk prediction feeding the early-warning system, anomaly detection on marking patterns.

**Dependencies.** Academics (sections/roster), Examinations (eligibility holds), Notification, Identity, Hostel (roll-call), IoT (cameras/beacons), AI platform.

---

### 7.F Examinations

**Purpose.** Secure, auditable examination lifecycle: scheduling, eligibility, hall tickets, seating/invigilation, question banks, CBT/online/offline exams, evaluation, moderation, results, revaluation, backlog, and certificate issuance with verifiable authenticity.

**Bounded context/service.** `examinations` (highest security tier; encrypted question banks; strict segregation of duties).

**Roles & permissions.** Examination Controller: full lifecycle. Faculty: paper setting (encrypted), evaluation, invigilation. HOD: moderation approval. Student: view schedule, download hall ticket, sit exam, view results, request revaluation. Principal/Management: statistics only.

**Primary workflows.**

1. _Schedule & eligibility:_ Controller builds exam timetable → system checks eligibility (attendance %, dues, registration) → eligible students get hall tickets (signed PDF + QR).
2. _Seating & invigilation:_ Auto-generate seating plans (spread across rooms/courses to reduce malpractice) and invigilator allocation.
3. _Paper & delivery:_ Setters submit questions to an encrypted bank; papers generated (optionally AI-assisted, human-approved) and released to authorized printers/CBT engine at scheduled time only. CBT/online exams run with proctoring (tab-switch, copy-paste, multi-face, gaze) and randomized question order.
4. _Evaluation & moderation:_ Submissions evaluated against rubrics (double-blind where configured) → results provisional → HOD/controller moderation (grade normalization) → publish (status `published`).
5. _Post-result:_ Students request revaluation/challenge (fee-gated) → re-evaluation → delta applied → backlog exams scheduled → certificates/degrees generated with blockchain verification + revocation registry.

**Frontend pages.** Controller: Exam Scheduler, Eligibility Report, Seating/Invigilation Planner, Question-Bank Governance, Result Processing & Moderation, Revaluation Queue, Certificate Issuance. Faculty: Paper Setting, Evaluation Console, Invigilation. Student: Exam Schedule, Hall Ticket, CBT Exam Player, Results, Revaluation Request, Certificate Download & Verify.

**Backend APIs.** `POST /exams`, `POST /exams/{id}/schedules`, `GET /exams/{id}/eligibility`, `POST /exams/{id}/hall-tickets`, `POST /exams/{id}/seating`, `POST /question-banks/{id}/questions`, `POST /exam-schedules/{id}/submissions`, `POST /submissions/{id}/evaluate`, `POST /results/moderate`, `POST /results/publish`, `POST /revaluations`, `POST /certificates`, `GET /certificates/{id}/verify` (public verification).

**Database entities.** `exams`, `exam_schedules`, `question_banks`, `questions`, `seating_plans`, `invigilators`, `hall_tickets`, `submissions`, `evaluations`, `results`, `revaluation_requests`, `certificates` (Section 6.6).

**Business logic & rules.** Hall ticket issued only if eligible; question bank access role-restricted and time-gated; results are provisional until moderated then immutable (corrections create a new versioned result with audit); revaluation requires paid fee; degree issuance requires all credits cleared; certificate hash anchored on-chain for tamper-evident verification.

**Validation.** Eligibility criteria; marks within max; rubric completeness; unique seat per student; submission before deadline; revaluation window open; certificate prerequisites satisfied.

**Error handling.** `EXAM.NOT_ELIGIBLE`, `EXAM.BANK_LOCKED`, `EXAM.SUBMISSION_CLOSED`, `EXAM.PROCTOR_VIOLATION`, `EXAM.RESULT_LOCKED`, `EXAM.REVAL_WINDOW_CLOSED`.

**Notifications.** Timetable/hall-ticket availability, exam reminders, proctoring warnings during exam, result publication, revaluation outcome, certificate ready.

**Audit.** Paper access, result entry/moderation/publication (before/after), proctoring flags, revaluation deltas, certificate issuance/revocation. Reads of question banks are logged.

**Security.** End-to-end encryption of papers/banks; strict segregation (setter ≠ evaluator ≠ moderator where possible); time-locked release; proctoring; blockchain anchoring; signed verifiable certificates; anti-tampering hash-chained audit.

**AI functionality.** AI question-paper generation from syllabus/blueprint (difficulty balancing, human-approved); AI auto-grading for code/SQL/objective and rubric-assisted essay grading (human oversight); AI proctoring (gaze/multi-face/tab-switch/audio anomaly); AI plagiarism/collusion and academic-integrity scoring across submissions; AI transcript summarization.

**Dependencies.** Academics (registration/credits), Attendance (eligibility), Finance (revaluation/exam fees), Proctoring integration, File, Notification, Blockchain verification, AI platform.

---

### 7.G Fee & Finance (Student-Facing Fees)

**Purpose.** Configure and collect all student fees (tuition, hostel, transport, fines, exam, misc.), handle scholarships/concessions, EMIs, refunds, receipts, reminders, and reconciliation with full financial integrity.

**Bounded context/service.** `finance` (double-entry ledger; maker/checker; PCI-conscious — no raw card data stored).

**Roles & permissions.** Student/Parent: view invoices, pay, download receipts, set up EMI/AutoPay. Accounts Officer: configure fee heads, apply concessions, process refunds (maker), reconcile, generate reports. Finance Approver: approve refunds/waivers (checker). Management: financial dashboards.

**Primary workflows.**

1. _Invoice generation:_ Fee structure per program/term generates invoices → dues visible to student/parent → reminders scheduled.
2. _Payment:_ Student pays via gateway (UPI/card/netbanking) with idempotency key → gateway webhook confirms → invoice marked paid → double-entry ledger posted → signed receipt issued.
3. _EMI/AutoPay:_ Student sets UPI AutoPay/mandate → scheduled auto-debits → failure retries + notification.
4. _Scholarship/concession:_ Eligibility checked (AI-assisted for govt schemes) → sanctioned → applied to invoice/disbursed → audited.
5. _Refund/waiver:_ Officer initiates (maker) → approver authorizes (checker) → gateway refund → ledger reversal → receipt.
6. _Reconciliation:_ Bank/gateway settlement files matched to payments; exceptions flagged.

**Frontend pages.** Student: Fees Dashboard (dues, history), Pay Now, Receipts, EMI/AutoPay setup, Scholarships. Accounts: Fee Structure Config, Collections, Concessions/Waivers, Refunds (maker/checker), Reconciliation, Reports (TDS/GST/80G), Demand-letter generator.

**Backend APIs.** `GET /me/invoices`, `POST /payments` (with `Idempotency-Key`), `POST /payments/webhook` (gateway), `GET /me/receipts/{id}`, `POST /me/autopay`, `POST /fee-structures`, `POST /invoices/generate`, `POST /scholarships`, `POST /refunds` (maker), `POST /refunds/{id}/approve` (checker), `GET /finance/reconciliation`, `GET /finance/reports`.

**Database entities.** `fee_structures`, `fee_invoices`, `payments`, `refunds`, `scholarships`, `concessions`, `ledger_entries`, `accounts`, `donations` (Section 6.7).

**Business logic & rules.** Idempotent payments (no double charge); every money movement posts balanced double-entry ledger rows; late-fee rules auto-applied after due date; refunds require maker≠checker; partial payments allowed if configured; holds placed on defaulters feed ERP/Exams; GST/TDS computed per configured rules; 80G donation receipts numbered sequentially.

**Validation.** Amount > 0 and ≤ outstanding; currency match; gateway signature verified on webhook; refund ≤ paid amount; approver ≠ maker; mandate validity for AutoPay.

**Error handling.** `FEE.PAYMENT_DECLINED`, `FEE.DUPLICATE_PAYMENT`, `FEE.WEBHOOK_SIGNATURE_INVALID`, `FEE.REFUND_EXCEEDS_PAID`, `FEE.APPROVAL_REQUIRED`, `FEE.MANDATE_INVALID`.

**Notifications.** Invoice generated, due reminders (escalating), payment success/failure, receipt ready, EMI due/failed, scholarship sanctioned, refund processed.

**Audit.** Fee config changes, every payment/refund/waiver/concession (maker+checker), reconciliation adjustments, ledger postings. Immutable ledger.

**Security.** PCI-conscious tokenized payments (no PAN stored); webhook signature verification + idempotency; segregation of duties; ledger append-only; bank/PII tokenized; signed receipts.

**AI functionality.** AI scholarship-eligibility checking and govt-scheme matching; AI fee-default risk prediction and optimal reminder timing; anomaly detection on transactions/reconciliation; AI fee assistant chatbot.

**Dependencies.** Identity, Academics (program/term), Hostel/Transport/Examinations (fee heads), Payment gateways, Accounting/HRMS integrations, Notification, Audit, AI platform.

---

### 7.H Hostel Management

**Purpose.** Manage residential life: room/bed allocation, attendance/roll-call, outpasses, visitors, mess, maintenance, and safety.

**Bounded context/service.** `hostel`.

**Roles & permissions.** Student: request accommodation, view allocation, apply outpass/leave, raise maintenance, view mess bill. Warden: allocate rooms, roll-call, approve outpass/leave, manage visitors/mess/maintenance, anti-ragging reports. Parent: view outpass/leave status and alerts. Accounts: mess/hostel fee integration.

**Primary workflows.**

1. _Allocation:_ Student applies (preferences) → warden/auto-allocator assigns bed (AI roommate-compatibility optional) → fee invoice raised → allocation active.
2. _Outpass/leave:_ Student requests → warden approves → gate log records out/in → parent notified; overdue returns escalate.
3. _Roll-call:_ Warden runs night roll-call → absentees flagged → escalation.
4. _Maintenance/visitor/mess:_ Requests tracked with SLA; visitor entries logged; mess billing generated monthly.

**Frontend pages.** Student: Accommodation, My Room, Outpass/Leave, Maintenance, Mess Bill. Warden: Allocation board, Roll-call, Outpass queue, Visitors, Maintenance, Mess, Duty roster, Anti-ragging.

**Backend APIs.** `POST /hostel/applications`, `POST /hostel/allocations`, `POST /hostel/outpasses`, `POST /hostel/outpasses/{id}/approve`, `POST /hostel/rollcalls`, `POST /hostel/maintenance`, `POST /hostel/visitors`, `GET /hostel/mess-bills`.

**Database entities.** `hostels`, `rooms`, `beds`, `allocations`, `outpasses`, `hostel_visitors`, `roll_calls`, `mess_bills`, `maintenance_requests` (Section 6.8).

**Business logic & rules.** Gender-appropriate allocation; capacity enforcement; one active bed per student; outpass overlaps rejected; overdue return triggers alert + warden action; mess bill = days present × rate (or fixed) per policy.

**Validation.** Bed available; student has no active allocation; outpass times valid and within curfew policy; maintenance category valid.

**Error handling.** `HOSTEL.BED_UNAVAILABLE`, `HOSTEL.ALREADY_ALLOCATED`, `HOSTEL.OUTPASS_OVERLAP`, `HOSTEL.CURFEW_VIOLATION`.

**Notifications.** Allocation confirmed, outpass approved/overdue, roll-call absence to parent, maintenance updates, mess-bill due.

**Audit.** Allocations, outpass approvals, roll-call results, visitor logs, anti-ragging reports (confidential access logged).

**Security.** Anti-ragging reports confidential (restricted role + audited reads); visitor watch-list checks; emergency lockdown trigger integration with Visitor/Gate module.

**AI functionality.** AI roommate-compatibility scoring; demand forecasting for mess/inventory; absence-pattern and safety-risk detection; sentiment on complaints.

**Dependencies.** Identity, Finance (mess/hostel fees), Visitor/Gate, Complaint/Anti-ragging, Notification, Inventory (mess supplies), AI platform.

---

### 7.I Transportation

**Purpose.** Manage routes, vehicles, drivers, passes, live GPS tracking, safety (SOS, speed alerts), and maintenance/compliance.

**Bounded context/service.** `transport` (Go + MQTT for telemetry; TimescaleDB for tracks).

**Roles & permissions.** Student/Parent: view route/pass, live bus location (consent), ETA, SOS. Transport Officer: routes/vehicles/drivers/passes, maintenance, alerts. Driver: attendance, SOS.

**Primary workflows.**

1. _Pass issuance:_ Student selects route/stop → fee invoice → pass issued (QR).
2. _Live tracking:_ Vehicle GPS streams via MQTT → real-time location + stop-wise ETA to parents/students; boarding/alighting logged (RFID/QR).
3. _Safety & compliance:_ SOS button broadcasts to officer + emergency contacts; speed-limit breaches alert parents/officer; fitness/permit/insurance expiry alerts.
4. _Route optimization:_ AI suggests optimal routes/stops from demand and traffic.

**Frontend pages.** Student/Parent: Live Map, My Pass, ETA, SOS. Officer: Routes, Vehicles, Drivers, Passes, Maintenance/Fuel, Live Fleet, Alerts. Driver (mobile): Attendance, SOS, Route.

**Backend APIs.** `POST /transport/passes`, `GET /transport/vehicles/{id}/location` (+ WebSocket stream), `GET /transport/routes/{id}/eta`, `POST /transport/telemetry` (MQTT bridge), `POST /transport/sos`, `POST /transport/boarding`, `GET /transport/alerts`.

**Database entities.** `vehicles`, `drivers`, `routes`, `route_assignments`, `transport_passes`, `vehicle_telemetry`, `boarding_logs` (Section 6.9).

**Business logic & rules.** Pass valid only for assigned route/term with paid fee; ETA computed from live position + route model; SOS creates a high-priority incident; expiry alerts fire N days before fitness/permit/insurance lapse; background location only with consent and only during service hours.

**Validation.** Route/stop capacity; valid license/fitness before assignment; pass fee paid; telemetry from registered device.

**Error handling.** `TRANSPORT.ROUTE_FULL`, `TRANSPORT.FEE_UNPAID`, `TRANSPORT.VEHICLE_UNFIT`, `TRANSPORT.LICENSE_EXPIRED`.

**Notifications.** Pass issued, bus approaching stop (ETA), SOS, speed alert, expiry reminders, route changes.

**Audit.** Route/vehicle/driver changes, pass issuance, SOS incidents, alert acknowledgements.

**Security.** Location data consent-gated and retention-limited; SOS is priority lane; driver/vehicle documents access-controlled.

**AI functionality.** AI route optimization; predictive maintenance from telemetry; ETA prediction; anomaly detection (harsh braking/route deviation).

**Dependencies.** Identity, Finance (transport fees), Notification, IoT/MQTT, Maps, Health (ambulance link), AI platform.

---

### 7.J Library Management

**Purpose.** Manage physical and digital collections, circulation, fines, reservations, digital access, and reading analytics/recommendations.

**Bounded context/service.** `library` (with vector embeddings for semantic search/recommendations).

**Roles & permissions.** Student/Faculty: search, reserve, borrow/return, access e-resources, view history. Librarian: catalogue, circulation, fines, acquisitions, stock audit, ILL.

**Primary workflows.**

1. _Circulation:_ Member borrows a copy (barcode/QR) → due date set → return/renew → overdue fines auto-calculated (integrated to Finance).
2. _Reservation & availability:_ Reserve unavailable item → queued → notified when available.
3. _Digital library:_ Access e-books/journals with remote auth (Shibboleth/OpenAthens); DRM-respecting reader; AI summarizer for long readings.
4. _Acquisitions/audit:_ Librarian manages purchase requests, stock audit, inter-library loans.

**Frontend pages.** Member: Catalogue Search, Item Detail, My Loans/Reservations, Digital Reader, Recommendations, Fines. Librarian: Circulation Desk, Catalogue Management, Acquisitions, Fines, Stock Audit, ILL, Reports.

**Backend APIs.** `GET /library/search`, `POST /library/loans` (issue), `POST /library/loans/{id}/return`, `POST /library/loans/{id}/renew`, `POST /library/reservations`, `GET /me/library`, `POST /library/catalog`, `POST /library/audit`.

**Database entities.** `catalog_items`, `copies`, `loans`, `reservations`, `library_fines` (Section 6.10).

**Business logic & rules.** Borrow limits by role; renewals capped; fine = overdue days × rate; reservations FIFO; lost item → replacement charge; book-bank items for eligible students.

**Validation.** Copy available; member under borrow limit; no blocking fines above threshold; renewal allowed (no reservation queue).

**Error handling.** `LIB.LIMIT_REACHED`, `LIB.COPY_UNAVAILABLE`, `LIB.FINE_BLOCK`, `LIB.RENEW_NOT_ALLOWED`.

**Notifications.** Due/overdue reminders, reservation available, fine incurred, new arrivals matching interests.

**Audit.** Issue/return/renew, catalogue edits, fine waivers, audit adjustments.

**Security.** Remote e-resource access via federated auth; reading history private to member; DRM compliance.

**AI functionality.** Semantic/vector search, personalized recommendations, AI summarizer of long readings, plagiarism/citation reports, demand forecasting for acquisitions.

**Dependencies.** Identity, Finance (fines), Search/Vector, Notification, Digital-resource providers, AI platform.

---

### 7.K Placement Portal

**Purpose.** Connect students with recruiters: profiles/resumes, company/job management, eligibility, drives, assessments, interviews, and offer tracking with analytics.

**Bounded context/service.** `placement`.

**Roles & permissions.** Student: build profile/resume, apply, take tests, track offers, mock interviews. Placement Officer: onboard companies, post jobs, set eligibility, schedule drives, manage offers, analytics. Company (external, scoped): post jobs, view shortlisted profiles (consent), schedule interviews. Alumni: referrals.

**Primary workflows.**

1. _Profile & apply:_ Student completes skill profile + resume → officer approves company & posting → eligible students apply → shortlisting (auto by eligibility + AI match).
2. _Assess & interview:_ Aptitude/coding tests (proctored) → interview scheduling → feedback → offers.
3. _Offer tracking:_ Offers recorded, accepted/declined; placement stats updated.
4. _Prep:_ AI resume review, mock interviews, skill-gap recommendations.

**Frontend pages.** Student: Profile/Resume Builder, Job Board, Applications, Tests, Interviews, Offers, Mock Interview. Officer: Companies, Postings, Eligibility Rules, Drives, Shortlists, Offers, Analytics. Company portal: Post Job, Shortlist, Schedule.

**Backend APIs.** `POST /placement/profile`, `POST /placement/postings`, `POST /placement/postings/{id}/apply`, `POST /placement/postings/{id}/shortlist`, `POST /placement/tests`, `POST /placement/interviews`, `POST /placement/offers`, `GET /placement/analytics`.

**Database entities.** `companies`, `job_postings`, `applications_placement`, `drives`, `offers_placement`, `skill_profiles` (Section 6.11).

**Business logic & rules.** Eligibility gate (CGPA/branch/backlog/max-offers policy — e.g., students with an accepted offer above a CTC threshold barred from further drives per policy); consent required before sharing profile with a company; one accepted offer rules configurable.

**Validation.** Eligibility satisfied; resume present; deadline open; consent recorded; company verified.

**Error handling.** `PLACE.NOT_ELIGIBLE`, `PLACE.CONSENT_REQUIRED`, `PLACE.ALREADY_PLACED`, `PLACE.DEADLINE_PASSED`.

**Notifications.** New matching jobs, shortlist, test/interview schedule, offer, placement policy alerts.

**Audit.** Company onboarding, eligibility overrides, profile sharing consent, offer records.

**Security.** External company access strictly scoped and time-boxed; student data shared only with consent; proctored assessments.

**AI functionality.** AI resume review/scoring, student–job matching, skill-gap and course recommendations, mock-interview evaluation, career counseling, higher-studies guidance.

**Dependencies.** Identity, Academics (CGPA/branch), Examinations (backlog), Proctoring, Notification, Alumni (referrals), AI platform, LinkedIn/GitHub (consented).

---

### 7.L Research Portal

**Purpose.** Manage the research lifecycle: projects, grants, publications, patents, ethics/IRB, reimbursements, open-access repository, and analytics.

**Roles & permissions.** Faculty/PI: create projects, submit publications/patents, request ethics review and reimbursements. Research Officer: grant administration, ethics workflow, analytics. HOD/Principal: department research dashboards.

**Workflows.** (1) Project & grant: PI registers project → grant sanction recorded → budget tracked with utilization. (2) Ethics: submit protocol → IRB review → approve/revise → decision recorded. (3) Output: publications/patents added (DOI/citations auto-fetched via integrations), open-access deposit. (4) Reimbursement: conference/travel claim → approval → Finance payout.

**Frontend pages.** Projects, Grants & Budget, Publications, Patents, Ethics Review, Reimbursements, Repository, Analytics (H-index, citations, funding).

**APIs.** `POST /research/projects`, `POST /research/grants`, `POST /research/publications`, `POST /research/ethics-reviews`, `POST /research/reimbursements`, `GET /research/analytics`.

**Entities.** `projects`, `grants`, `publications`, `patents`, `ethics_reviews` (Section 6.12).

**Business rules & validation.** Grant utilization ≤ sanctioned; ethics approval required before human-subject research; publication requires valid DOI/venue; reimbursement ≤ approved budget.

**Errors.** `RESEARCH.BUDGET_EXCEEDED`, `RESEARCH.ETHICS_REQUIRED`, `RESEARCH.DUPLICATE_DOI`.

**Notifications.** Ethics decisions, grant milestones, reimbursement status, citation milestones.

**Audit.** Grant sanctions/utilization, ethics decisions, reimbursement approvals.

**Security.** Confidential unpublished/IP data restricted; reimbursement maker/checker.

**AI.** AI plagiarism/self-check (Turnitin-style), citation-graph analysis, funding-opportunity matching, research-output analytics, publication summarization.

**Dependencies.** Finance (payouts), File, Notification, Plagiarism/DOI integrations (Turnitin, Crossref), AI platform.

---

### 7.M Event Management

**Purpose.** Plan and run events (academic/cultural/hybrid) with registration, ticketing, certificates, budgets, sponsors, volunteers, and feedback.

**Roles & permissions.** Organizer (staff/faculty/club): create/manage events. Attendee (student/alumni/guest): register, check-in, feedback, certificate. Finance: budget/sponsor tracking.

**Workflows.** (1) Create event (single/multi-track/multi-day, online/offline/hybrid, capacity, budget) → publish → registration (QR ticket) → check-in (QR scan) → feedback → auto-certificate → post-event report (budget vs actual). (2) Sponsorship/volunteer management alongside.

**Frontend pages.** Event Builder, Public/Portal Listing, Registration, Ticket, Check-in Scanner, Feedback, Certificates, Sponsors, Volunteers, Reports.

**APIs.** `POST /events`, `POST /events/{id}/register`, `POST /events/{id}/checkin`, `POST /events/{id}/feedback`, `POST /events/{id}/certificates`, `GET /events/{id}/report`.

**Entities.** `events`, `event_registrations`, `event_feedback` (Section 6.14).

**Rules & validation.** Capacity enforced; registration window; unique ticket QR; check-in once; certificate only for attendees.

**Errors.** `EVENT.FULL`, `EVENT.REG_CLOSED`, `EVENT.ALREADY_CHECKED_IN`.

**Notifications.** Registration confirmation, reminders, live-stream link, certificate ready, feedback request.

**Audit.** Event create/edit/publish, budget entries, check-ins.

**Security.** Public registration rate-limited/captcha; live-stream access controlled; sponsor financials restricted.

**AI.** Attendance/turnout prediction, sentiment analysis of feedback, auto event-report drafting, schedule/agenda optimization.

**Dependencies.** Finance (budget/sponsors), File (certificates), Notification, Live-stream (Zoom/Meet/WebRTC), Facility Booking.

---

### 7.N Grievance & Safety (Complaints, Anti-Ragging, Lost & Found)

**Purpose.** Unified intake and resolution of complaints across categories (academic/hostel/transport/technical), anti-ragging and whistle-blower channels, and lost-and-found — all with SLA tracking, escalation, and anonymity where required.

**Roles & permissions.** Anyone (incl. anonymous): raise complaint/report. Assignee (dept staff): resolve within SLA. Grievance Officer/Anti-Ragging Committee: manage escalations and confidential cases. Management: oversight dashboards.

**Workflows.** (1) Complaint: raise (optionally anonymous) → auto-categorized (AI) and assigned → SLA timer → resolution/escalation → feedback → close. (2) Anti-ragging: confidential report → committee → affidavit/action workflow → statutory reporting. (3) Lost & Found: report lost/found with image+location → AI auto-match → claim verification → return.

**Frontend pages.** Raise Complaint, My Complaints (status/SLA), Anonymous/Whistle-blower form, Anti-Ragging report, Assignee queue, Escalation board, Lost & Found board + chat, Analytics/heatmap.

**APIs.** `POST /complaints`, `GET /complaints/{id}`, `POST /complaints/{id}/assign`, `POST /complaints/{id}/resolve`, `POST /complaints/{id}/escalate`, `POST /lost-found`, `POST /lost-found/{id}/claim`, `POST /anti-ragging/reports`.

**Entities.** `complaints`, `anti_ragging_reports`, `lost_found_items` (Section 6.14).

**Rules & validation.** SLA per category; auto-escalation on breach; anonymity preserves reporter identity (not stored/linked) while allowing status via token; compensation/refund triggers for eligible categories.

**Errors.** `GRIEVANCE.SLA_BREACH`, `GRIEVANCE.INVALID_CATEGORY`, `LOSTFOUND.CLAIM_UNVERIFIED`.

**Notifications.** Acknowledgement, assignment, status updates, SLA-breach escalation, resolution, lost-found match.

**Audit.** All transitions; confidential anti-ragging access logged; anonymity boundaries enforced and audited.

**Security.** Anonymous channel does not persist identity; anti-ragging data highest confidentiality; whistle-blower protection.

**AI.** Auto-categorization/routing, sentiment/priority scoring, lost-found image matching (vision), duplicate detection, resolution-time prediction.

**Dependencies.** Identity, Notification, Finance (compensation), Hostel/Transport/Academics (routing), AI platform.

---

### 7.O HR & Payroll

**Purpose.** Manage employees end-to-end: records, recruitment, onboarding/offboarding, leave, appraisals, training, grievances, and payroll interface.

**Roles & permissions.** HR Officer: full HR data (PII-restricted). Employee (faculty/staff): self-service (profile, leave, payslips, tax declarations, appraisal). HOD/Manager: team approvals. Finance: payroll postings.

**Workflows.** (1) Recruitment→onboarding: requisition → candidate pipeline → offer → onboarding checklist → asset assignment + accounts created. (2) Leave: request → approval (balance-checked) → calendar update. (3) Payroll: run computes earnings/deductions/tax → payslips → Finance ledger + bank file (or HRMS integration). (4) Appraisal: self → reviewer → rating.

**Frontend pages.** Employee: Profile, Leave, Payslips, Tax Declaration, Appraisal, Training. HR: Directory, Recruitment, Onboarding, Payroll, Leave admin, Appraisal cycles, Grievances.

**APIs.** `POST /hr/employees`, `POST /hr/leave`, `POST /hr/leave/{id}/approve`, `POST /hr/payroll/runs`, `GET /me/payslips`, `POST /hr/appraisals`, `POST /hr/recruitment`.

**Entities.** `employees`, `leave_requests`, `leave_balances`, `payslips`, `payroll_runs`, `appraisals`, `recruitments` (Section 6.13).

**Rules & validation.** Leave ≤ balance and non-overlapping; payroll idempotent per period; tax per configured slabs; offboarding revokes access + reclaims assets.

**Errors.** `HR.INSUFFICIENT_LEAVE`, `HR.PAYROLL_ALREADY_RUN`, `HR.APPROVAL_REQUIRED`.

**Notifications.** Leave decisions, payslip published, appraisal windows, onboarding tasks.

**Audit.** Salary changes, leave approvals, payroll runs, access provisioning/deprovisioning.

**Security.** Salary/PII field-level encrypted and role-restricted; payroll maker/checker; offboarding triggers immediate access revocation across services.

**AI.** Resume screening for recruitment, attrition-risk prediction, leave-pattern anomaly, payroll anomaly detection.

**Dependencies.** Identity (provisioning), Finance (payroll ledger), Inventory (asset assignment), HRMS integrations (Keka/greytHR), Notification.

---

### 7.P Inventory & Asset Management

**Purpose.** Track institutional assets and consumables: lab equipment, furniture, IT, purchase orders, vendors, warranties, depreciation, and issue/return.

**Roles & permissions.** Store/Asset Manager: manage assets, POs, vendors, audits. Department staff: request/issue assets. Finance: PO approval/payments.

**Workflows.** Requisition → PO to vendor (approval) → goods receipt → asset tagged → assigned/issued (to employee/student/lab) → maintenance/warranty tracked → depreciation computed → disposal.

**Frontend pages.** Asset Register, Requisitions, Purchase Orders, Vendors, Warranty/AMC, Stock Alerts, Issue/Return, Depreciation, Reports.

**APIs.** `POST /inventory/assets`, `POST /inventory/purchase-orders`, `POST /inventory/issues`, `POST /inventory/returns`, `GET /inventory/depreciation`, `GET /inventory/alerts`.

**Entities.** `inventory_assets`, `purchase_orders`, `vendors` (Section 6.14).

**Rules & validation.** Stock thresholds trigger reorder alerts; PO totals within budget and approved; asset uniquely tagged; depreciation per method (SLM/WDV).

**Errors.** `INV.STOCK_LOW`, `INV.PO_OVER_BUDGET`, `INV.ASSET_ALREADY_ISSUED`.

**Notifications.** Low-stock, warranty/AMC expiry, PO approvals, overdue returns.

**Audit.** Asset movements, PO approvals, disposals.

**Security.** Vendor/financial data restricted; PO maker/checker.

**AI.** Demand forecasting, predictive maintenance, vendor-risk scoring, anomaly detection on procurement.

**Dependencies.** Finance (POs/payments), HR (asset assignment), Hostel/Labs, Notification.

---

### 7.Q Finance & Accounting (Institutional)

**Purpose.** Institution-wide financial management beyond student fees: income/expenses, budgets, project/grant accounting, multi-currency, forecasting, and statutory reports — all on the double-entry ledger.

**Roles & permissions.** Finance Officer/Controller: budgets, expenses, reports. Management: dashboards/approvals. Auditor: read-only + audit trail.

**Workflows.** Budget setup → expense/income capture (with approvals) → ledger postings → reconciliation → period close → reports/forecasts. Grant and capex tracked as project accounts with variance analysis.

**Frontend pages.** Budgets, Income, Expenses, Ledger, Project/Grant Accounting, Cash-flow, Reports, Forecasting, Audit.

**APIs.** `POST /finance/budgets`, `POST /finance/expenses`, `POST /finance/expenses/{id}/approve`, `GET /finance/ledger`, `GET /finance/reports`, `GET /finance/forecast`.

**Entities.** `accounts`, `ledger_entries`, budgets, expenses, plus links to `payouts`, `donations` (Section 6.7).

**Rules & validation.** Balanced double-entry; expense ≤ budget or flagged; period-close locks postings; multi-currency at recorded FX; approvals per amount thresholds.

**Errors.** `FIN.UNBALANCED_ENTRY`, `FIN.BUDGET_EXCEEDED`, `FIN.PERIOD_LOCKED`.

**Notifications.** Budget breaches, approval requests, period-close, anomaly alerts.

**Audit.** All postings, budget changes, approvals, period closes (immutable ledger).

**Security.** Segregation of duties; auditor read-only; sensitive reports restricted.

**AI.** Financial forecasting, cash-flow projection, variance/anomaly detection, spend classification.

**Dependencies.** Fee/Finance (student), HR (payroll), Inventory (POs), Analytics, Accounting-system integrations.

---

### 7.R AI Assistant & Campus Knowledge

**Purpose.** Conversational, multi-channel assistant answering questions and performing actions across the platform, grounded in tenant data via RAG, with role-aware permissions.

**Roles & permissions.** Every authenticated role gets an assistant scoped to what they may access; guests get a public-content assistant. Actions the assistant performs are executed under the user's own permissions.

**Workflows.** User asks (text/voice/WhatsApp/Telegram/phone) → intent + retrieval over permitted knowledge (policies, FAQs, their own records) → grounded answer with citations → optional action (e.g., "pay my fee", "book counseling") routed through the real API with confirmation. Consequential actions require explicit confirmation and honor all module rules.

**Frontend pages.** In-app chat widget (all portals), voice input, WhatsApp/Telegram bots, IVR phone bot for parents.

**APIs.** `POST /assistant/chat`, `POST /assistant/voice`, `POST /assistant/action` (guarded), webhook endpoints for WhatsApp/Telegram/IVR.

**Entities.** `assistant_sessions`, `assistant_messages`, retrieval indices (vector DB); no new source-of-truth data.

**Rules & validation.** Retrieval and actions strictly filtered by the caller's permissions/tenant; answers cite sources; low-confidence → defers to human/handoff; no action without confirmation.

**Errors.** `AI.LOW_CONFIDENCE`, `AI.ACTION_NOT_PERMITTED`, `AI.OUT_OF_SCOPE`.

**Notifications.** Handoff to human support; action confirmations.

**Audit.** Every assistant-initiated action logged as if performed directly by the user; prompts/responses retained per privacy policy (redacted PII).

**Security.** Prompt-injection and jailbreak defenses (Section 8.6); grounding-only responses; per-tenant data isolation in retrieval; PII redaction; guardrail service pre/post filters.

**AI.** RAG over the tenant knowledge base, function-calling for actions, multilingual + voice (Whisper), sentiment-aware wellness nudges, personalized reminders, smart-notification prioritization.

**Dependencies.** AI platform, Search/Vector, every module's APIs (for grounded actions), Notification, messaging integrations.

---

### 7.S Alumni Portal

**Purpose.** Engage graduates: directory, job board, mentorship, reunions/events, donations/fundraising, success stories, and transcript/degree reissue.

**Roles & permissions.** Alumni: manage profile, post/apply to alumni jobs, mentor, register for events, donate, request documents. Alumni Relations Officer: verify alumni, manage chapters/campaigns/newsletters. Students: access mentorship/referrals (consented).

**Workflows.** Alumni self-register (verified against graduation records) → profile → opt into mentorship/directory → engage (jobs/events/donations) → request official documents (routes to Examinations for reissue).

**Frontend pages.** Directory, Profile, Job Board, Mentorship, Events/Reunions, Donations, Success Stories, Document Requests, Chapters.

**APIs.** `POST /alumni/profile`, `GET /alumni/directory`, `POST /alumni/jobs`, `POST /alumni/mentorship`, `POST /alumni/donations`, `POST /alumni/document-requests`.

**Entities.** `alumni_profiles`, `donation_campaigns`, `success_stories`, plus reuse of `events`, `job_postings` (Section 6.14).

**Rules & validation.** Verification against alumni record before full access; directory visibility per privacy settings; donations issue 80G receipts via Finance.

**Errors.** `ALUMNI.NOT_VERIFIED`, `ALUMNI.PRIVACY_RESTRICTED`.

**Notifications.** Verification, reunion invites, campaign updates, mentorship requests, document-request status.

**Audit.** Verification, donations, document reissue requests.

**Security.** Alumni read-mostly access; directory consent-based; document reissue identity-verified.

**AI.** Alumni–student mentor matching, referral matching, donor-propensity insights, engagement recommendations.

**Dependencies.** Examinations (documents), Finance (donations), Events, Placement (referrals), Notification, AI platform.

---

### 7.T Calendar & Scheduling

**Purpose.** Unified academic calendar, personal timetables, holidays, exam/event calendars, resource/room booking with conflict detection, and external calendar sync.

**Roles & permissions.** All roles: view relevant calendars, manage personal to-dos. Admin/HOD: manage academic calendar/holidays. Faculty/staff: book rooms/resources.

**Workflows.** Admin defines academic year/terms/holidays → personal timetables derived from enrollments/teaching load → users book rooms/labs/equipment with real-time conflict detection → optional sync to Google/Outlook/Apple.

**Frontend pages.** Academic Calendar, My Timetable, Exam/Event Calendar, Room/Resource Booking, To-do & Reminders, Sync settings.

**APIs.** `GET /calendar/academic`, `GET /me/timetable`, `POST /bookings`, `GET /bookings/availability`, `POST /calendar/sync`, `POST /me/todos`.

**Entities.** `academic_years`, `terms`, holidays, `bookings`, `facility_resources`, `timetable_slots` (Sections 6.2/6.14).

**Rules & validation.** No double-booking of a resource/timeslot; booking within allowed hours/roles; sync via OAuth to external providers.

**Errors.** `CAL.RESOURCE_CONFLICT`, `CAL.OUTSIDE_HOURS`.

**Notifications.** Booking confirmations/reminders, calendar changes, holiday updates.

**Audit.** Calendar edits, bookings, cancellations.

**Security.** External sync tokens stored encrypted; personal calendars private.

**AI.** AI timetable generator (constraint solver: rooms/faculty/clashes), smart meeting-slot suggestions, conflict resolution.

**Dependencies.** Academics, Facility Booking, Examinations, Events, external calendar providers.

---

### 7.U Communication & Collaboration

**Purpose.** In-app messaging, targeted announcements, course forums, polls/surveys, video calling, circulars, and meeting minutes — with translation support.

**Roles & permissions.** All authenticated users: 1:1/group chat, forums for enrolled courses, polls. Staff/faculty: targeted announcements/circulars, MoM. Admin: audience management.

**Workflows.** Send message/announcement (audience-targeted by role/dept/section) → recipients notified per preferences → forums threaded per course → polls/surveys collected → video calls (Jitsi/WebRTC) with recording (consent) → MoM captured (AI-assisted).

**Frontend pages.** Inbox/Chat, Announcements, Course Forums, Polls/Surveys, Video Call, Circulars, MoM.

**APIs.** `POST /messages`, `POST /announcements`, `POST /forums/{id}/posts`, `POST /polls`, `POST /calls`, `POST /mom`.

**Entities.** `forums_and_messages`, announcements, polls, calls, mom (reuse Section 6 platform + communication tables).

**Rules & validation.** Audience targeting enforces visibility; forum access = enrollment; moderation for abusive content; announcement approval for wide audiences.

**Errors.** `COMM.NOT_A_MEMBER`, `COMM.MODERATION_BLOCKED`.

**Notifications.** New messages/announcements per user preference and digest settings.

**Audit.** Announcements, moderation actions, call recordings consent.

**Security.** Content moderation, abuse reporting, E2E option for sensitive chats; recordings access-controlled.

**AI.** AI meeting minutes/summaries, translation for regional languages, toxicity/code-of-conduct detection, smart digest bundling.

**Dependencies.** Notification, Academics (forums), Identity, Video provider, AI platform.

---

### 7.V Health & Wellness

**Purpose.** Campus clinic appointments, consent-based medical records, ambulance/emergency, counseling, mental-health self-assessment, pharmacy stock, and insurance claims.

**Roles & permissions.** Student/Employee: book appointments, self-assessments, view own records, insurance claims. Health Staff/Clinician: appointments, records (treating-relationship gated). Counselor: confidential counseling notes.

**Workflows.** Book clinic/counselor slot → visit → clinician records diagnosis/prescription (encrypted, consent-based) → pharmacy dispenses (stock updated) → follow-up. Emergency: ambulance request → transport/health dispatch → emergency contacts alerted. Mental-health self-assessment → risk-tiered guidance → optional counselor referral.

**Frontend pages.** Appointments, My Health Records (consent), Counseling, Self-Assessment, Pharmacy, Ambulance/Emergency, Insurance Claims, First-aid map.

**APIs.** `POST /health/appointments`, `POST /health/records` (clinician), `POST /health/counseling`, `POST /health/self-assessment`, `POST /health/ambulance`, `POST /health/insurance-claims`.

**Entities.** `health_appointments`, `medical_records` (encrypted), `counseling_sessions` (encrypted), pharmacy stock (Section 6.14).

**Rules & validation.** Records accessible only to patient + treating clinician (break-glass for emergencies, audited); explicit consent for any sharing; counseling notes confidential.

**Errors.** `HEALTH.CONSENT_REQUIRED`, `HEALTH.NO_TREATING_RELATION`, `HEALTH.SLOT_UNAVAILABLE`.

**Notifications.** Appointment reminders, prescription ready, follow-up, emergency alerts to contacts.

**Audit.** All record access (reads logged), consent grants/revocations, break-glass events.

**Security.** Highest confidentiality tier; field-level encryption; minimized retention; strict access + audit; no AI training on medical data.

**AI.** Mental-health sentiment/self-assessment triage (strict consent + ethics + human escalation for risk), symptom-based triage guidance (non-diagnostic), pharmacy demand forecasting. Consequential risk always escalates to humans.

**Dependencies.** Identity, Transport (ambulance), Counseling/Mentorship, Notification, Insurance integrations, AI platform.

---

### 7.W Cafeteria / Mess

**Purpose.** Daily menus, meal booking/coupons, special diets, QR meal access, feedback, vendor billing, and food-waste analytics.

**Roles & permissions.** Student/Staff: view menu, book meals, QR access, feedback, allergen info. Mess Manager/Vendor: menu, billing, stock, analytics.

**Workflows.** Manager publishes menu → users book meals/coupons → QR-based access at counter → consumption logged → feedback → vendor billing + waste analytics.

**Frontend pages.** Menu, Meal Booking, My Coupons/QR, Feedback, Allergen Info, Manager: Menu/Billing/Analytics.

**APIs.** `GET /mess/menu`, `POST /mess/bookings`, `POST /mess/access` (QR), `POST /mess/feedback`, `GET /mess/analytics`.

**Entities.** `mess_menus`, `meal_bookings` (Section 6.14).

**Rules & validation.** Booking cutoff times; one coupon per meal; allergen disclosure mandatory; billing = bookings/consumption.

**Errors.** `MESS.CUTOFF_PASSED`, `MESS.ALREADY_BOOKED`.

**Notifications.** Menu published, booking reminders, special-diet confirmations.

**Audit.** Menu changes, billing, waste entries.

**Security.** QR access tokens rotating; vendor financials restricted.

**AI.** Demand forecasting (reduce waste), diet/allergen recommendations, feedback sentiment.

**Dependencies.** Finance (billing), Hostel (residents), Inventory (supplies), Notification, AI platform.

---

### 7.X Visitor & Gate Management

**Purpose.** Secure campus access: pre-approved visitor passes, gate entry/exit and vehicle logs, badge printing, watch-list alerts, and emergency lockdown.

**Roles & permissions.** Host (staff/student): pre-approve visitors. Security/Gate Staff: verify, log entry/exit, print badges, trigger alerts. Management: lockdown, oversight.

**Workflows.** Host pre-approves visitor (details + purpose) → visitor arrives → gate verifies (photo capture, watch-list check) → badge printed → entry logged → exit logged. Emergency: lockdown broadcasts + gates restrict.

**Frontend pages.** Pre-approval, Gate Console (check-in/out, capture, watch-list), Vehicle Log, Badge print, Lockdown control, Reports.

**APIs.** `POST /visitors/preapprove`, `POST /visitors/{id}/checkin`, `POST /visitors/{id}/checkout`, `POST /gate/vehicles`, `POST /gate/lockdown`, `GET /gate/logs`.

**Entities.** `visitors`, `vehicle_entries` (Section 6.14).

**Rules & validation.** Watch-list block on hit; pass validity window; host verification; lockdown authorized roles only.

**Errors.** `GATE.WATCHLIST_HIT`, `GATE.PASS_EXPIRED`, `GATE.UNAUTHORIZED_LOCKDOWN`.

**Notifications.** Host notified on visitor arrival; security alert on watch-list hit; campus broadcast on lockdown.

**Audit.** All entries/exits, watch-list hits, lockdown triggers.

**Security.** Photo/biometric capture consent + retention limits; watch-list restricted; lockdown step-up auth.

**AI.** Face-match against watch-list, plate recognition (ANPR), anomaly detection on entry patterns.

**Dependencies.** Identity, Hostel (visitors), Notification, IoT (cameras/barriers), AI platform.

---

### 7.Y Facility & Resource Booking

**Purpose.** Book shared facilities (auditoriums, halls, grounds, gym, AV equipment) with approval workflows, usage analytics, damage reporting, and energy tracking.

**Roles & permissions.** Staff/faculty/clubs: request bookings. Facility Manager: approve, manage resources, damage/energy.

**Workflows.** Request slot → conflict check → approval (if required) → confirmed → usage → damage/loss report → analytics/energy per event.

**Frontend pages.** Resource Catalogue, Booking Request, Approvals, Calendar, Damage Report, Usage/Energy Analytics.

**APIs.** `POST /facility/bookings`, `POST /facility/bookings/{id}/approve`, `GET /facility/availability`, `POST /facility/damage`, `GET /facility/analytics`.

**Entities.** `bookings`, `facility_resources` (Section 6.14).

**Rules & validation.** No overlaps; approval thresholds; capacity limits; cancellation windows.

**Errors.** `FAC.CONFLICT`, `FAC.APPROVAL_REQUIRED`.

**Notifications.** Booking status, reminders, damage acknowledgements.

**Audit.** Bookings, approvals, damage reports.

**Security.** Role-scoped booking; energy/IoT data read-controlled.

**AI.** Utilization optimization, energy-usage insights, demand prediction.

**Dependencies.** Calendar, Events, IoT (energy), Notification, Inventory (equipment).

---

### 7.Z Accreditation & Compliance

**Purpose.** Collect and generate data for NBA/NAAC/NIRF/AISHE, mandatory disclosures, self-study reports (SSR), audit-ready reports, and a statutory-returns calendar.

**Roles & permissions.** Compliance Officer/IQAC: manage frameworks, evidence, SSR. Management/Principal: dashboards, sign-off. Department staff: submit metric data/evidence.

**Workflows.** Configure framework metrics → departments submit data + evidence files → validation/aggregation → generate SSR/disclosure/returns → submit to portals (integrations) → track statutory-returns calendar with reminders.

**Frontend pages.** Framework Config, Metric Data Entry, Evidence Repository, SSR Builder, Disclosure Generator, Compliance Dashboard, Statutory Calendar.

**APIs.** `POST /compliance/metrics`, `POST /compliance/evidence`, `POST /compliance/ssr/generate`, `GET /compliance/dashboard`, `GET /compliance/returns`.

**Entities.** `accreditation_records`, `statutory_returns` (Section 6.14).

**Rules & validation.** Metric formulas per framework; evidence required per metric; deadlines tracked; data pulled from source modules (admissions, results, placement, research) to avoid manual re-entry.

**Errors.** `COMPLIANCE.EVIDENCE_MISSING`, `COMPLIANCE.METRIC_INVALID`.

**Notifications.** Data-submission requests, return due-dates, sign-off requests.

**Audit.** Metric submissions, evidence changes, report generation, submissions.

**Security.** Evidence integrity (hash), restricted sign-off, immutable submitted reports.

**AI.** Auto-populate metrics from platform data, gap analysis vs criteria, SSR narrative drafting (human-reviewed).

**Dependencies.** Admissions, Academics, Examinations, Placement, Research, Finance, Analytics, government portal integrations.

---

### 7.AA Digital Signage & IoT

**Purpose.** Drive classroom/lab displays and notice boards, and manage smart-campus IoT: lighting/AC control, energy and air-quality monitoring, occupancy, predictive maintenance, and camera-based attendance.

**Roles & permissions.** Facility/IT staff: manage devices, signage playlists, automations. Users: view public signage.

**Workflows.** Register IoT devices → ingest telemetry (MQTT→TimescaleDB) → dashboards + automations (e.g., turn off AC when unoccupied) → predictive-maintenance alerts. Signage: create playlists → schedule → push to screens (auto-syncs notices/announcements).

**Frontend pages.** Device Registry, Telemetry Dashboards, Automations, Signage Playlists/Scheduler, Energy/Air-quality/Occupancy, Maintenance Alerts.

**APIs.** `POST /iot/devices`, `POST /iot/telemetry` (MQTT bridge), `POST /iot/automations`, `POST /signage/playlists`, `GET /iot/telemetry/query`.

**Entities.** `iot_devices`, `iot_telemetry`, `signage_screens` (Section 6.14).

**Rules & validation.** Only registered devices ingest; automation guardrails (safe ranges); signage content approval.

**Errors.** `IOT.UNREGISTERED_DEVICE`, `IOT.AUTOMATION_UNSAFE`.

**Notifications.** Threshold breaches (air quality/energy), device offline, maintenance due.

**Audit.** Device/automation changes, signage publishes, control actions.

**Security.** Device auth (per-device certs/keys), network segmentation, command signing; telemetry access-controlled.

**AI.** Predictive maintenance, energy optimization, occupancy analytics, camera-based smart attendance (feeds 7.E).

**Dependencies.** Attendance, Facility, Communication (notices), Analytics, MQTT/TimescaleDB.

---

### 7.BB Mentorship & Counseling

**Purpose.** Structured mentor–mentee pairing, session scheduling, goal tracking, wellness check-ins, confidential notes, and outcome analytics.

**Roles & permissions.** Mentor (faculty/alumni): manage mentees, sessions, notes. Mentee (student): view mentor, book sessions, goals. Counselor: confidential sessions. Admin: pairing oversight/analytics.

**Workflows.** Pairing (manual or AI-matched) → schedule sessions → set/track goals → record notes (role-based confidentiality) → wellness check-ins → outcome analytics.

**Frontend pages.** My Mentor/Mentees, Session Scheduling, Goals, Notes, Wellness Check-ins, Analytics.

**APIs.** `POST /mentorship/pairs`, `POST /mentorship/sessions`, `POST /mentorship/goals`, `POST /mentorship/notes`, `GET /mentorship/analytics`.

**Entities.** `mentorships`, `counseling_sessions` (Section 6.14).

**Rules & validation.** One active mentor per mentee (configurable); confidential notes restricted; wellness escalation on risk.

**Errors.** `MENTOR.ALREADY_PAIRED`, `MENTOR.NOTE_RESTRICTED`.

**Notifications.** Pairing, session reminders, goal milestones, escalations.

**Audit.** Pairings, note access (logged), escalations.

**Security.** Confidential notes highest tier; wellness data consent-based.

**AI.** Mentor–mentee matching, goal-progress insights, wellness sentiment with human escalation.

**Dependencies.** Identity, Academics (performance signals), Health (escalation), Alumni (mentors), Notification, AI platform.

---

## 8. AI/ML Platform

The `ai-platform` service is the single, governed entry point for all AI capabilities. No module calls a model provider directly; all inference flows through the model gateway so that cost, safety, privacy, and observability are enforced centrally.

### 8.1 Capability catalogue (with owning module, technique, and human-in-the-loop)

| Capability                                  | Module                      | Technique                                        | Human oversight                     |
| ------------------------------------------- | --------------------------- | ------------------------------------------------ | ----------------------------------- |
| Timetable generation                        | Calendar/Academics          | Constraint solver (OR-Tools)                     | Admin approves                      |
| Attendance/proxy detection                  | Attendance                  | Face + liveness + anomaly                        | Faculty reviews flags               |
| Dropout / early-warning                     | Student ERP/Analytics       | Gradient-boosted tabular + explainability (SHAP) | Advisor acts                        |
| Document verification (OCR)                 | Admissions                  | OCR + forgery/consistency models                 | Officer reviews low-confidence      |
| Plagiarism / integrity                      | Exams/Research              | Similarity + AI-authorship signals               | Evaluator decides                   |
| Auto-grading (code/SQL/objective)           | Faculty/Exams               | Test harness + rubric LLM                        | Faculty finalizes                   |
| Question-paper generation                   | Exams                       | LLM from blueprint                               | Setter approves                     |
| Resume review / job matching                | Placement                   | Embeddings + ranking                             | Officer/student review              |
| Scholarship eligibility                     | Finance                     | Rules + LLM scheme matching                      | Officer sanctions                   |
| Route optimization / predictive maintenance | Transport/IoT               | Optimization + regression on telemetry           | Officer schedules                   |
| Demand forecasting (mess/inventory)         | Catering/Inventory          | Time-series (Prophet/LightGBM)                   | Manager orders                      |
| Campus assistant (RAG)                      | AI Assistant                | Retrieval + function calling                     | Confirms actions                    |
| Sentiment/wellness                          | Grievance/Health/Mentorship | Classification                                   | Escalates to humans                 |
| Notification prioritization                 | Notification                | Ranking to reduce fatigue                        | User preferences override           |
| Translation / summarization                 | Communication/Library       | LLM                                              | Editor reviews for official content |

### 8.2 Model gateway

A provider-agnostic gateway abstracts OpenAI/Anthropic/self-hosted (Llama via vLLM). Responsibilities: routing (choose model by task/cost/latency/data-sensitivity — sensitive data routes to self-hosted only), prompt templating/versioning, token budgeting and per-tenant cost caps, caching, rate limiting, ret/fallback across providers, and full request/response logging (PII-redacted) for observability and evals.

### 8.3 RAG architecture

Sources (policies, FAQs, course content, published pages, and the requesting user's own permitted records) are chunked, embedded (per-tenant namespaces in pgvector/Weaviate), and retrieved with metadata filters that enforce tenant + permission scope. Retrieval-augmented answers always cite sources; if retrieval confidence is low, the assistant declines or hands off. Indices update via domain events. No cross-tenant retrieval is ever possible (namespace + ABAC filter).

### 8.4 MLOps

Experiment tracking and model registry via MLflow; feature store via Feast; training pipelines are reproducible (data + code + params versioned). Models are versioned and promoted through staging→production gates with offline eval metrics and a shadow/canary period. Data and concept **drift monitoring** triggers retraining. Every prediction records model version + inputs hash for auditability. A/B testing supports champion/challenger.

### 8.5 Responsible AI & governance

- **Human-in-the-loop for all consequential decisions** (admissions, grading, exam integrity, wellness risk, finance). AI never finalizes such outcomes.
- **Explainability** for predictions affecting individuals (SHAP/feature attributions surfaced to staff).
- **Fairness/bias testing** across protected attributes; models fail promotion if disparity exceeds thresholds; regular audits.
- **Confidence thresholds** with graceful fallback to humans.
- **Consent & purpose limitation:** wellness/medical AI requires explicit opt-in; medical/counseling data is never used for model training.
- **Model cards & datasheets** maintained per model.

### 8.6 AI safety guardrails

A guardrail service applies pre- and post-processing: prompt-injection/jailbreak detection, PII detection/redaction in prompts and responses, output moderation (toxicity, self-harm, unsafe content), grounding checks (reject ungrounded claims in RAG), and allowed-action policy enforcement for function-calling. Wellness/self-harm signals route to the crisis-support workflow and human staff rather than the model answering alone. Rate and cost anomaly detection prevents abuse.

---

## 9. Security

Security is defense-in-depth across identity, application, data, network, and operations. Baselines below apply to every module (modules add specifics in their §13).

### 9.1 Identity & access

JWT (short-lived) + rotating refresh tokens with server-side session revocation; MFA (TOTP/WebAuthn/FIDO2) with step-up for sensitive actions; RBAC + ABAC via central policy engine (Section 5.2); SSO (SAML/OIDC) + SCIM; hardware-key support; passwordless option. Passwords hashed with Argon2id; breached-password checks (HIBP) at set/reset; account lockout with progressive backoff.

### 9.2 Application security

Input validation at every boundary; parameterized queries/ORM (SQLi prevention); output encoding + strict CSP (XSS); CSRF protection (SameSite + tokens for state-changing forms); anti-automation (rate limiting, CAPTCHA, bot detection); secure headers (HSTS, X-Content-Type-Options, Referrer-Policy); SSRF protections on outbound fetches; file-upload AV + MIME/magic-byte checks + DLP; signed URLs for downloads. WAF in front of all APIs; per-tenant and per-user rate limits/quotas.

### 9.3 Data protection

TLS 1.2+ in transit; AES-256 at rest; field-level encryption for PII, medical, and financial data; tenant BYOK via Vault/KMS; tokenization of Aadhaar/PAN/bank accounts; data classification (public/internal/confidential/restricted) drives handling; secrets only in Vault (never in code/flags/env in repo); key rotation; encrypted backups.

### 9.4 Threat detection & response

Anomaly-based login risk scoring, impossible-travel and geofencing, device-posture checks; real-time alerting on suspicious admin/privileged actions; SIEM integration; immutable, hash-chained audit logs; honeytokens for exfiltration detection; automated response playbooks (session revoke, lock, isolate).

### 9.5 Multi-tenant security

Tenant isolation enforced by RLS + ABAC + scoped storage/caches (Section 5.1); automated cross-tenant access tests in CI; per-tenant encryption keys; Super Admin cross-tenant access is break-glass (time-boxed, MFA, approved, audited) and cannot read PII without an explicit logged grant.

### 9.6 Secure SDLC & supply chain

Threat modeling per epic; SAST/DAST/dependency scanning (Snyk, OWASP ZAP) and secret scanning in CI; SBOM generation and signing (Sigstore/cosign); image scanning; least-privilege service accounts; mesh mTLS; pinned/verified dependencies; penetration-test reports tracked in-repo with remediation SLAs; responsible-disclosure/bug-bounty program.

### 9.7 Privacy & compliance controls

Granular, revocable consent at registration; DSAR workflows (access/correction/erasure/portability) for GDPR/DPDP/FERPA; data-retention and legal-hold per entity; DPIA per feature; Data Processing Agreements and vendor risk assessment; right-to-erasure honored across services via an erasure event (with lawful-retention exceptions). Full detail in Section 17.

---

## 10. Analytics & Business Intelligence

**Purpose.** Turn platform data into operational and strategic insight with role-scoped, self-service analytics.

**Architecture.** OLTP changes stream via CDC (Debezium) into ClickHouse (star-schema marts) and a lakehouse for ad-hoc analysis; dbt manages transformations; a semantic layer defines metrics once. Dashboards render in-app (Recharts) and export to Power BI/Tableau. Row-level security mirrors application ABAC so a HOD sees only their department.

**Standard dashboards.** Admission trends & yield, fee collection & dues aging, attendance statistics & defaulters, department/academic performance, placement success rates & CTC distribution, faculty workload, hostel occupancy, library usage, transport utilization, student engagement, revenue/expense & cash-flow, research output, complaint heatmaps by building/route, diversity & inclusion (scholarships, first-gen, gender ratio, PWD support), energy/sustainability (paper saved, CO₂, kWh), and exam statistics.

**Capabilities.** Cohort/year-on-year comparison, drag-and-drop custom report builder, scheduled email reports (PDF/XLSX), drill-down from KPI to individual record (permission-checked), anomaly alerts on revenue/attendance/enrollment drops, and AI-generated narrative insights. All exports honor data classification and are audited.

**AI.** Predictive insights (enrollment, dropout, revenue, demand), natural-language query ("ask your data") grounded in the semantic layer, and automatic anomaly/root-cause hints.

**Dependencies.** Every module (as data sources), AI platform, Notification (scheduled reports/alerts).

---

## 11. Notification System

**Purpose.** One governed pipeline delivering the right message on the right channel at the right time without fatiguing users.

**Channels.** Email (SES/SendGrid), SMS (Twilio/MSG91), push (FCM/APNs), in-app, WhatsApp, and emergency broadcast; IVR for phone bots.

**Architecture.** Domain events → `notification` service → template resolution (ICU/i18n, per-tenant branding) → preference/quiet-hours/priority evaluation → channel adapters → delivery + receipts. Idempotent, retried with backoff, dead-lettered on repeated failure.

**Features.** User-defined channel + frequency preferences per category; quiet hours/DND; priority lanes that bypass DND only for safety/emergency; digest mode (bundle into daily summaries); AI smart-bundling and prioritization to reduce fatigue; delivery and read receipts; bounce/unsubscribe handling; template versioning and A/B testing; multi-language.

**Rules & validation.** Emergency/safety messages override quiet hours; unsubscribe honored except for legally-required transactional messages; per-tenant sender identities verified (SPF/DKIM/DMARC).

**Audit.** Sends, deliveries, failures, preference changes, emergency broadcasts.

**Security.** No sensitive content in SMS/push previews (deep-link instead); PII minimized in payloads; provider credentials in Vault.

**Dependencies.** All modules (event sources), AI platform (prioritization), Identity (preferences).

---

## 12. Third-Party Integrations

All external integrations run through an **anti-corruption layer** (adapter per provider) so vendor changes never leak into the domain, with retries, circuit breakers, webhook signature verification, and per-provider observability. Credentials live in Vault; each integration is feature-flagged per tenant.

**Payments:** Razorpay, Stripe, UPI/AutoPay (mandates), netbanking — tokenized, idempotent, webhook-verified.
**Identity/Docs:** DigiLocker (document fetch), Aadhaar eKYC, NSDL/PAN verification, e-Pramaan, government identity providers.
**Messaging:** SES/SendGrid (email), Twilio/MSG91 (SMS/WhatsApp), FCM/APNs (push), Zoom/Google Meet/Jitsi (video).
**Calendar:** Google/Outlook/Apple (OAuth sync).
**Maps:** Mapbox/Google Maps (transport tracking, ETA, geofencing).
**Government/Academic:** NSP & state scholarship portals, AICTE/UGC APIs, AISHE, NAAC/NBA/NIRF submissions.
**Learning/Integrity:** LTI 1.3, SCORM/xAPI (content), Turnitin/Ouriginal (plagiarism), proctoring (ProctorEdu, Mercer Mettl).
**HRMS/Payroll:** Keka, greytHR.
**Enterprise:** Okta/Azure AD SSO (SAML/OIDC), SCIM provisioning.
**IoT/Signage:** BenQ/Crestron and generic MQTT devices.
**Placement data:** LinkedIn/GitHub (student-consented).
**Storage/CDN:** S3/MinIO, Cloudflare.

Each integration documents: purpose, auth method, data exchanged, PII handling, failure behavior (degrade gracefully — e.g., SMS fallback if push fails), and rate limits. A **developer portal** publishes UnivOS's own public API + webhooks with OAuth 2.0 PKCE for partner apps and a marketplace for add-ons.

---

## 13. DevOps, Infrastructure & Release Engineering

**Source & branching.** Monorepo (or polyrepo per service) with trunk-based development, short-lived feature branches, mandatory PR review, and conventional commits. Architecture-boundary tests run in CI to prevent illegal cross-layer/service dependencies.

**CI (GitHub Actions).** On every PR: lint → typecheck → unit + integration tests (Testcontainers) → contract tests (Pact) → SAST/DAST/secret/dependency scan (Snyk, ZAP) → SBOM generation → build and sign container images → publish to registry. Merges blocked on green + coverage thresholds.

**CD (GitOps via ArgoCD).** Environments: dev → staging → prod (per region). Progressive delivery with blue-green or canary, automated rollback on SLO/error-budget breach, and database migrations gated (expand/contract pattern, backward-compatible, reversible). Feature flags decouple deploy from release.

**Infrastructure as Code.** Terraform + Terragrunt provision cloud resources; Helm charts deploy services to Kubernetes (EKS/AKS/GKE). Everything reproducible; no manual console changes (drift detection alerts). Secrets via Vault + External Secrets Operator.

**Runtime.** Kubernetes with HPA (CPU/memory/queue-depth) and cluster autoscaling; PodDisruptionBudgets; service mesh (Istio/Linkerd) for mTLS, retries, timeouts, and traffic shifting; per-tenant resource quotas; multi-AZ, multi-region active-passive (active-active for stateless tiers). Cloudflare CDN/WAF at the edge.

**Environments & data.** Ephemeral preview environments per PR; production data never used in lower environments (masked/synthetic data). Cost controls: right-sizing, spot for batch, carbon-aware batch scheduling.

**Release governance.** Blameless postmortems, change-management records, on-call rotations with runbooks (Section 19), and a status page for tenants.

---

## 14. Observability

**Telemetry.** OpenTelemetry instrumentation everywhere → collector → Prometheus (metrics), Loki (structured logs), Tempo/Jaeger (traces), Sentry (errors). Every request carries a `traceId` propagated across services and surfaced in API error envelopes.

**Signals.** RED (rate/errors/duration) per service and USE for resources; business KPIs as metrics (payments, enrollments, exam submissions); log correlation by `traceId`/`tenant_id`/`user_id` (PII-redacted).

**SLOs & alerting.** Defined SLOs with error budgets (e.g., API availability 99.9%, p95 latency < 300 ms); alerts route to on-call with runbook links; alert fatigue controlled via multi-window burn-rate alerts. Synthetic monitoring for critical journeys (login, pay fee, mark attendance, submit exam). Real-user monitoring (RUM) for frontend performance.

**Dashboards.** Per-service golden-signal dashboards, tenant-level health, AI cost/latency/quality, and capacity planning.

---

## 15. Testing & Quality Assurance

**Test pyramid.** Unit (PyTest/Jest, >80% on critical paths) → integration (Testcontainers, Newman) → contract (Pact between services) → end-to-end (Playwright/Cypress on key journeys) → performance (k6/Locust to the 100k-concurrent target) → chaos (Litmus) for resilience.

**Specialized suites.** Security (OWASP ZAP, Snyk, dependency + secret scanning), accessibility (axe-core gates in CI + manual screen-reader passes), visual regression (Percy/Chromatic), and **AI evals** (golden datasets, hallucination/grounding checks, bias tests, regression suites run on model/prompt changes).

**Multi-tenant safety tests.** Automated tests attempt cross-tenant reads/writes and MUST fail; RLS/ABAC policy tests; erasure/retention verification.

**Data management.** Synthetic and masked test data (PII never copied to lower environments); seeded fixtures per module; contract-first mocks generated from OpenAPI/AsyncAPI.

**Quality gates.** CI blocks merge on failing tests, coverage regressions, new critical vulnerabilities, accessibility violations, or broken API contracts. Definition of Done includes tests, docs, telemetry, and audit events for new features.

---

## 16. Compliance, Privacy & Data Governance

**Regulatory scope.** GDPR, India DPDP Act, FERPA, plus Indian higher-education mandates (UGC/AICTE, NAAC/NBA/NIRF, AISHE).

**Consent & rights.** Granular, revocable consent captured at registration and per sensitive feature (location, biometrics, health, marketing). DSAR self-service for access, correction, erasure, and portability with SLA tracking; erasure propagates via an `identity.erasure.requested` event honored by every service (subject to lawful-retention holds, which are recorded and justified).

**Data lifecycle.** Classification (public/internal/confidential/restricted) drives access, encryption, and retention. Per-entity retention schedules with automated archival/purge; legal-hold overrides purge. Data residency configurable per tenant (region-pinned storage/processing).

**Governance artifacts.** Records of Processing Activities (RoPA), DPIA per feature, Data Processing Agreements with vendors, breach-notification runbook (72-hour clock), and a designated Data Protection Officer workflow. Statutory reports (AISHE, NAAC SSR, NIRF) auto-generated from source data (Section 7.Z).

---

## 17. Accessibility & Inclusion

WCAG 2.1 AA conformance across all authenticated and public surfaces: semantic HTML, ARIA where needed, full keyboard navigation, visible focus, skip-to-content, screen-reader-tested forms with programmatic labels/errors, color-contrast-compliant themes, high-contrast and color-blind-safe palettes, reduced-motion support, and captioned/sign-language public video. Inclusion features: multi-language i18n (≥2 at launch, framework for more), differently-abled student support workflows (scribe/extra-time in Exams, accessible seating), and an affordable-data/low-bandwidth mode (lightweight assets, text-first fallbacks, SMS for critical alerts). Accessibility is enforced by axe-core CI gates plus periodic manual audits.

---

## 18. Mobile Strategy

Offline-first **PWA** (Workbox) with installable app, background sync, and cached read-only screens (timetable, attendance, results, ID card) that reconcile when connectivity returns. **Native wrappers** (Capacitor) publish to App Store/Play Store, adding biometric login (Face ID/fingerprint), push (FCM/APNs), in-app QR scanning (attendance/library/mess/events/gate), and consented background location for bus tracking. Voice-enabled AI assistant. Responsive, mobile-first layouts share the design system with the web app; performance budgets target low-end Android devices and 3G networks.

---

## 19. Documentation & Knowledge

Living C4 architecture diagrams auto-generated from code annotations; API reference auto-generated from OpenAPI/AsyncAPI/GraphQL SDL and published on the developer portal; per-service runbooks and SRE playbooks (on-call, incident response, rollback, DR drills); role-based user manuals and video walkthroughs; a tenant-admin configuration guide (onboarding, branding, modules, integrations, retention); and a developer onboarding handbook (local setup via Docker Compose/Tilt, coding conventions, review checklist, testing, release process). Documentation lives in-repo (docs-as-code) and is versioned with the software; a knowledge base feeds the RAG assistant.

---

## 20. Design System & UI/UX

**Design tokens.** A single token layer drives Tailwind and native styles, themed for light/dark with a persisted user toggle that defaults to `prefers-color-scheme`.

- **Brand accent:** `--color-primary: #E67E6A` (coral) with tints/shades `primary-50…900`; hover/active states derived programmatically.
- **Overlay/scrim:** `--color-overlay: #00000066` for modals/drawers.
- **Neutrals:** White as the base surface; Black used minimally for high-emphasis text/icons. Dark theme inverts to a near-black surface (`#121212`) with the same coral accent tuned for contrast.
- **Semantic:** success/warning/error/info tokens; all combinations meet WCAG AA contrast (verified in CI).
- **Type scale, spacing (4px base), radii, elevation, and motion** tokens are defined once and reused.

**Component library.** Accessible primitives (Radix) wrapped into a documented library (Storybook): buttons, inputs, selects, date/time pickers, tables (sortable/filterable/paginated with column config), cards, tabs, modals, drawers, toasts, badges, avatars, breadcrumbs, steppers, charts, empty/loading/error state components, file upload with progress, QR scanner, and data grids. Every component ships keyboard and screen-reader support and light/dark variants.

**Navigation & layout.** Role-aware app shell with left nav + top bar; global search (⌘K) with role-filtered results; responsive breakpoints mobile-first; consistent page templates (list, detail, form, dashboard). Persistent notification center and profile/theme menu.

**Interaction standards.** Every data screen implements the four states from Section 5.13 (loading skeletons, guided empty states, actionable error states with trace reference, success). Optimistic updates where safe; inline validation; autosave on long forms; undo for destructive actions; confirmation + step-up for consequential actions. Dashboards support drill-down, filters, saved views, and export.

**UX writing & i18n.** Concise, consistent microcopy sourced from i18n catalogues; RTL-ready; number/date/currency localized.

---

## 21. Non-Functional Requirements

**Performance.** p95 page load < 1.5 s; p95 API < 300 ms; support 100k concurrent active users; graceful degradation under load (queueing, backpressure, load-shedding of non-critical work).
**Availability.** 99.9% monthly uptime (99.95% during exam/admission windows); multi-AZ; health checks + self-healing; zero-downtime deploys.
**Scalability.** Horizontal autoscaling on CPU/memory/queue depth; stateless services; partitioned data stores; read replicas and CQRS read models for hot reads.
**Reliability.** Idempotent write APIs; outbox + at-least-once events with idempotent consumers; sagas with compensation; circuit breakers and retries with jitter.
**Security & privacy.** Per Sections 9 and 16.
**Maintainability/Extensibility.** Clean Architecture + DDD, documented contracts, high test coverage, feature flags, and a plugin/marketplace extension model.
**Accessibility & i18n.** Per Sections 17 and 5.11.
**Observability.** Per Section 14; SLOs with error budgets.
**Browser/device support.** Last 2 versions of Chrome, Edge, Firefox, Safari; iOS Safari 16+; Android Chrome 110+; low-end device performance budgets.
**Data retention & residency.** Configurable per entity/tenant; archival, legal-hold, and region pinning.
**Sustainability.** Power-efficient workloads, carbon-aware batch scheduling, and a sustainability dashboard (paper saved, CO₂ avoided, energy used).

### 21.1 Disaster Recovery & Business Continuity

RPO ≤ 15 min, RTO ≤ 1 hour. Daily encrypted backups (databases, object storage, secrets metadata) replicated cross-region with periodic **restore drills** (tested, not assumed). Point-in-time recovery for Postgres (WAL archiving). Multi-region active-passive with documented failover runbooks; DNS failover via the CDN. Chaos and DR game-days validate procedures quarterly. Backups are immutable/WORM to resist ransomware; access to restore is MFA-gated and audited.

---

## 22. Development Roadmap

Delivery is incremental; each phase ships production-ready, secured, tested, observable slices behind feature flags. Cross-cutting foundations (Section 5) are built in Phase 0 and reused throughout.

**Phase 0 — Platform foundations.** Multi-tenancy, identity/auth (RBAC+ABAC, MFA, SSO), API gateway/BFF, event backbone (Kafka/outbox), file service, notification framework, audit, observability, CI/CD, IaC, and the design system/component library.

**Phase 1 — Public & Admissions.** Public website/CMS with SEO, admissions (DigiLocker/Aadhaar eKYC, entrance/proctoring, merit/offers/payment), tenant onboarding and admin.

**Phase 2 — Core academics.** Student ERP, Faculty ERP, Academics (programs/courses/enrollment/timetable), HOD/Principal/Management dashboards, in-app messaging.

**Phase 3 — Assessment & money.** Attendance (multi-modal), Examinations (CBT/proctoring/results/certificates), Fee & Finance (payments/EMI/scholarships/refunds), scholarship engine.

**Phase 4 — Campus services.** Hostel, Library, Transportation, Grievance/Anti-ragging/Lost-Found, Visitor & Gate, Facility Booking, Calendar.

**Phase 5 — People & operations.** Placement, Alumni, HR & Payroll, Institutional Finance, Inventory, Health & Wellness, Cafeteria/Mess, Mentorship.

**Phase 6 — AI & intelligence.** AI assistant (RAG + actions), predictive analytics (dropout/demand/finance), recommendation engines, automation/workflows, guardrails, MLOps.

**Phase 7 — Reach & scale.** Mobile PWA + native wrappers, multi-region deployment hardening, advanced observability/DR drills.

**Phase 8 — Ecosystem.** Accreditation & compliance automation, Digital Signage & IoT, sustainability dashboard, public API + developer portal, and the add-on marketplace.

---

## 23. Risks & Mitigations

- **Scope creep** — single source-of-truth roadmap; features deferred to phases; flag-gated rollout.
- **Multi-tenant data leakage** — RLS + ABAC + scoped storage/caches; automated cross-tenant tests that must fail; per-tenant keys.
- **AI hallucination/harm in consequential flows** — human-in-the-loop, confidence thresholds, grounding + guardrails, explainability, bias audits.
- **Vendor/cloud/AI lock-in** — anti-corruption adapters, portable IaC, model gateway with self-hosted fallback.
- **Exam/admission integrity** — proctoring, encrypted time-locked banks, randomized papers, plagiarism/collusion detection, strict audit.
- **Privacy/regulatory non-compliance** — DPIA per feature, consent management, DSAR workflows, legal review per release.
- **Campus connectivity/power** — offline-first PWA, SMS fallback for critical alerts, edge caching.
- **Adoption resistance** — change management, per-department champions, training, video walkthroughs.
- **Payment/financial errors** — idempotency, double-entry ledger, maker/checker, reconciliation, anomaly detection.
- **Operational failures** — SLOs/error budgets, blameless postmortems, DR drills, chaos testing.

---

## 24. Success Metrics (KPIs)

- Admission processing time reduced ≥ 70%.
- On-time fee collection ≥ 95%.
- Mobile app student adoption ≥ 90% within 6 months of launch.
- Administrative paper usage reduced ≥ 80%.
- Placement rate improved ≥ 15% year-on-year.
- Grievance resolution time reduced to < 48 hours.
- Automated attendance ≥ 85% (proxy-resistant).
- Platform availability ≥ 99.9% overall and ≥ 99.95% during exam windows.
- AI assistant deflection of routine queries ≥ 60% with human-handoff satisfaction tracked.
- Zero cross-tenant data incidents; DSAR SLA met ≥ 99%.

---

## 25. Capstone Vision & Differentiators

UnivOS is a single digital ecosystem managing the complete university lifecycle — applicant → student → graduate → engaged alumni — unifying academics, administration, finance, campus services, research, and AI-driven decision support on a scalable, secure, multi-tenant platform. Portfolio-grade differentiators, all specified above and therefore buildable, include: digital student ID (QR/NFC), blockchain-verified degrees/certificates with a revocation registry, a RAG campus knowledge assistant with guarded actions, real-time IoT occupancy and a public 3D digital twin of the campus, explainable predictive student-success analytics, event-driven microservices, multi-tenant SaaS with isolated data, a student digital wallet (UPI AutoPay/campus card), research & grant management, a public API + developer portal and add-on marketplace, a sustainability tracker, an equity dashboard (scholarships, first-gen, gender ratio, PWD support), on-device/small-LLM inference for low-bandwidth campuses, and an open SDK for partner institutions. The scope demonstrates end-to-end expertise across React/Next.js, polyglot backends, SQL/NoSQL/vector databases, AI/GenAI and prompt engineering, cloud-native deployment, observability, security, and enterprise architecture.

---

## 26. Glossary

- **ABAC** — Attribute-Based Access Control; policies constrain actions by attributes (tenant, department, ownership, time, device).
- **BFF** — Backend-for-Frontend; a gateway tailoring APIs for client apps.
- **BYOK** — Bring-Your-Own-Key encryption per tenant.
- **CDC** — Change Data Capture, streaming DB changes to analytics.
- **CQRS** — Command Query Responsibility Segregation; separate write and read models.
- **DDD** — Domain-Driven Design; bounded contexts own their data.
- **DSAR** — Data Subject Access Request (access/correction/erasure/portability).
- **HITL** — Human-in-the-Loop; humans finalize consequential AI-assisted decisions.
- **Outbox pattern** — atomic state + event write ensuring reliable event publishing.
- **RAG** — Retrieval-Augmented Generation; grounding LLM answers in retrieved, permitted data.
- **RBAC** — Role-Based Access Control; roles bundle permissions.
- **RLS** — Row-Level Security; database-enforced tenant/row filtering.
- **RPO/RTO** — Recovery Point/Time Objective for disaster recovery.
- **Saga** — long-running distributed transaction with compensating actions.
- **SLO/Error budget** — reliability target and the allowable failure margin.

---

## 27. Traceability & Consistency Notes

- Every role in Section 4 maps to permissions used by the modules in Section 7; the permission model (Section 5.2) is the single enforcement mechanism.
- Every module in Section 7 references only data entities defined in Section 6 and cross-service data via events/read models (no direct cross-database access), consistent with Section 2.
- Shared concerns (auth, tenancy, files, notifications, audit, search, caching, i18n, errors, UI states) are defined once in Section 5 and inherited by all modules to avoid conflicting or duplicated requirements.
- All AI features in Section 7 are governed by Section 8 (model gateway, RAG isolation, guardrails, human-in-the-loop) — no module bypasses it.
- Fee heads owned by Hostel/Transport/Examinations are invoiced and collected only through Finance (Section 7.G/7.Q), keeping money movement on the single double-entry ledger.
- Notifications are emitted as events and rendered only by the Section 11 service; no module sends channel messages directly.

_End of blueprint._
