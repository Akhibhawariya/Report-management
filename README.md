# NGO Monthly Report Management

Web app for NGOs to submit monthly impact reports (single entry or CSV bulk) and for admins to view month-level aggregates. Built for the **SDE II Take Home Assignment** requirements: async CSV processing, job polling, partial failures, and **idempotent** NGO + month reporting.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router), React 18, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL, Prisma ORM |
| Jobs | BullMQ + Redis |
| Language | **JavaScript** (no TypeScript) |

## Architecture (brief)

- **API** exposes CRUD-style reporting endpoints; CSV uploads **only** persist the file, create an `ImportJob` row, and enqueue BullMQ work—no row-by-row processing on the HTTP thread.
- **Worker** pulls jobs, parses CSV, validates each row, **upserts** into `reports`, updates job counters/errors in Postgres every few rows so `GET /job-status/:job_id` stays fresh for polling clients.
- **Idempotency**: composite unique key `(ngo_id, month)` with Prisma `upsert` so duplicates update in place and aggregates never double-count NGOs for a month.
- **Frontend** (Next.js App Router): **`/`** — single report form and CSV upload in a **two-column** layout; import status appears **full width** below after upload. **`/bulk-upload`** redirects to **`/`** (legacy path). **`/dashboard`** — month filter, optional NGO substring filter, paginated table; filter state is **restored from `sessionStorage`** when you leave and return. **Nav:** Submissions → `/`, Dashboard → `/dashboard`.

## Database design

- **`reports`**: one row per NGO per calendar month (`month` stored as `YYYY-MM` text). Metrics: `people_helped`, `events_conducted`, `funds_utilized` (`Decimal(18,2)` in **Indian Rupees (INR)** in the UI and CSV). Unique `(ngo_id, month)`.
- **`import_jobs`**: tracks CSV imports—`status`, `total_rows`, `processed_rows`, `success_count`, `failure_count`, JSON `errors` (row number + message), optional `file_path` until cleaned up.

## Async CSV processing flow

1. Client `POST /reports/upload` (multipart field **`file`**) → API streams file to disk under `UPLOADS_DIR`, inserts `ImportJob` (`pending`), enqueues BullMQ job named with the job UUID.
2. Worker marks job `processing`, parses CSV with headers, sets `total_rows`.
3. For each data row: normalize columns → validate → `upsert` report or append structured error; periodically patch progress + capped error list (polling UX + bounded payload).
4. On completion: status `completed`, file deleted from disk; catastrophic parse/read failures mark job `failed`.

## Folder structure

```
backend/src/
  config/          # env, db, redis connection factory
  controllers/     # thin HTTP handlers
  middleware/      # uploads, errors
  queues/          # BullMQ queue wiring
  repositories/    # Prisma data access
  routes/          # Express routers
  services/        # orchestration (reports, CSV scheduling)
  validations/     # shared payload rules
  workers/         # CSV import consumer
  utils/           # small helpers
frontend/
  app/             # routes: / (single + CSV), /bulk-upload → /, /dashboard
  components/      # reusable UI (Nav, panels, forms, etc.)
  hooks/           # polling hook for job status
  services/api/    # fetch wrappers
  utils/           # date + number/currency format helpers
```

## Prerequisites

- Node.js **18+**
- PostgreSQL **14+**
- Redis **6+**

## Local setup (without Docker)

### 1. Database & Redis

Create a database (e.g. `report_mgmt`) and run Redis. If Redis is installed locally it usually listens on `redis://localhost:6379`. If you use Docker Compose for Redis only, the compose file publishes Redis on **`localhost:6380`** by default so it does not conflict with a local Redis on 6379 (set `REDIS_URL` accordingly).

### 2. Backend

```bash
cd backend
cp ../.env.example .env   # copy repo-root template; set DATABASE_URL + REDIS_URL for your setup
# If you use Docker Compose for Postgres/Redis only, defaults in .env.example use host ports 5433 (Postgres) and 6380 (Redis).
npm install
npx prisma migrate dev    # or: npm run prisma:migrate:dev
npm run dev               # API on http://localhost:4000
```

In a **second terminal**, run the worker:

```bash
cd backend
npm run worker:dev
```

### 3. Frontend

```bash
cd frontend
echo 'NEXT_PUBLIC_API_URL=http://localhost:4000' > .env.local
npm install
npm run dev               # http://localhost:3000
```

### 4. Smoke checks

- Health: `curl -s http://localhost:4000/health`
- Open the UI: home page (single report + CSV upload/job status), Dashboard for aggregates and tables.

## Docker Compose

From the repo root:

```bash
docker compose up --build
```

- API: `http://localhost:4000`
- Web: `http://localhost:3000` (browser calls API at `http://localhost:4000` via `NEXT_PUBLIC_API_URL`)
- Postgres **on the host** (default): `localhost:5433` → container `5432` (user/pass/db `postgres` / `postgres` / `report_mgmt`). Override: `POSTGRES_HOST_PORT=5432 docker compose up` if `5432` is free.
- Redis **on the host** (default): `localhost:6380` → container `6379` (avoids clashing with local Redis on `6379`). Override with `REDIS_HOST_PORT=6379 docker compose up` only if that port is free.

The **worker** runs as a separate Compose service sharing the `uploads` volume with the API.

## API reference & examples

Base URL: `http://localhost:4000` (adjust for deployment).

### `POST /report`

Single report (JSON). Duplicate NGO + month **updates** the existing row.

```bash
curl -s -X POST http://localhost:4000/report \
  -H 'Content-Type: application/json' \
  -d '{
    "ngoId": "NGO-100",
    "month": "2024-06",
    "peopleHelped": 120,
    "eventsConducted": 4,
    "fundsUtilized": 99500.25
  }'
```

Snake_case aliases (`ngo_id`, `people_helped`, …) are also accepted.

### `POST /reports/upload`

Multipart form **`file`** (CSV). Responds **202** with `jobId`.

```bash
curl -s -X POST http://localhost:4000/reports/upload \
  -F 'file=@./your-file.csv'
```

### `GET /job-status/:job_id`

```bash
curl -s http://localhost:4000/job-status/<jobId-from-upload>
```

Returns `status`, `totalRows`, `processedRows`, `successCount`, `failureCount`, and `errors[]` with `{ row, message }` for invalid rows.

### `GET /dashboard?month=YYYY-MM`

Optional query params:

- `ngoId` — case-insensitive **substring** match on NGO ID (filter applies to **totals and table**).
- `page` — page number (default `1`, min `1`).
- `pageSize` — rows per page (default `10`, max `50`).

```bash
curl -s 'http://localhost:4000/dashboard?month=2024-06&ngoId=ngo&page=1&pageSize=10'
```

Response includes:

- `month`, `filters: { ngoId }` (applied filter or `null`)
- `totalNgosReporting`, `totalPeopleHelped`, `totalEventsConducted`, `totalFundsUtilized` (INR sum, **for filtered set**)
- `reports[]` — paginated rows: `id`, `ngoId`, `month`, `peopleHelped`, `eventsConducted`, `fundsUtilized`, `updatedAt`
- `pagination`: `page`, `pageSize`, `totalCount`, `totalPages`

## CSV format

Header row required. Column names are matched case-insensitively; spaces become underscores. Supported headers:

`ngo_id`, `month`, `people_helped`, `events_conducted`, `funds_utilized` (amount in **INR**)

Use any CSV that follows the header row above; invalid rows are reported in the job’s `errors` array while valid rows still import.

## Deployment notes

**Backend + worker + Redis + Postgres**

- Example platforms: **Render** (web service + background worker), **Railway**, **Fly.io**.
- Run migrations on deploy: `npx prisma migrate deploy` (or `npm run prisma:migrate` from `backend/`).
- Start commands: API `node src/server.js`, worker `node src/workers/csvImportWorker.js`.
- Set `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGIN` (your frontend origin), `UPLOADS_DIR` (persistent disk path if needed).

**Frontend (Next.js)**

- Example: **Vercel**.
- Build env: `NEXT_PUBLIC_API_URL=https://your-api.example.com`
- Ensure API `CORS_ORIGIN` includes the deployed frontend URL.

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| `backend` | `npm run dev` | API with `--watch` |
| `backend` | `npm run start` | API (production) |
| `backend` | `npm run worker` | CSV worker |
| `backend` | `npm run worker:dev` | Worker with `--watch` |
| `backend` | `npm run prisma:migrate:dev` | Dev migrations (`prisma migrate dev`) |
| `backend` | `npm run prisma:migrate` | Deploy migrations (`prisma migrate deploy`) |
| `backend` | `npm run prisma:generate` | Regenerate Prisma Client |
| `frontend` | `npm run dev` | Next dev server |
| `frontend` | `npm run build` / `npm start` | Production |
| repo root | `docker compose up --build` | API + worker + web + Postgres + Redis |

## AI tooling

If helpful for reviewers: scaffolding, wiring BullMQ/Prisma patterns, and docs were assisted by Cursor / automated coding tools—implementation follows the PDF requirements above.

## What would improve with more time

- Structured logging + metrics, authenticated admin routes, retention/TTL for uploads and job rows, true object storage for CSVs, OpenAPI spec, integration tests, and automated retries specifically for transient DB failures on CSV rows.
