# Write-up — NGO Monthly Report Management

Short deliverable: approach, use of AI tooling, and what would change in production.  
Project overview, setup, API samples, screenshots, and demo: see **[README.md](README.md)**.

---

## Approach & architectural decisions

- **Thin HTTP layer:** Express controllers call services; Prisma stays in repositories. Validation is shared between REST and the CSV worker.
- **Async CSV:** Upload only writes the file, creates `import_jobs`, and **enqueues BullMQ**. A **separate worker** parses rows, validates, **upserts** `reports`, and updates job progress/errors so the client can poll without blocking the API.
- **Idempotency:** Unique `(ngo_id, month)` + Prisma `upsert` so re-submits and CSV duplicates **update** one row per NGO-month; dashboard aggregates stay consistent.
- **Frontend:** Next.js App Router; submissions on **`/`** (grid + `display: contents` for aligned panels); dashboard filters persisted in **`sessionStorage`** when navigating away and back.

---

## Where AI tools were used (if applicable)

Cursor / AI assistants helped with **scaffolding**, **BullMQ + Prisma wiring patterns**, **UI layout tweaks**, **README / docs structure**, and incremental refactors. Requirements and behavior follow the **take-home PDF**; business logic, validation rules, and data model were reviewed by hand.

---

## What we’d improve for production or with more time

- **AuthN/AuthZ** (org-scoped NGOs), structured **logging + metrics**, **rate limits** on upload.
- **Object storage** for CSVs, **TTL/retention** on jobs and temp files, **idempotent upload** keys if needed.
- **OpenAPI** spec, **integration tests** (API + worker), **retries** for transient DB errors on bulk rows.
- **Observability:** dashboards, alerts, dead-letter handling for failed jobs.
