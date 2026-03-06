# Training Hub — Claude Instructions

## Project Structure

```
training-hub/
├── api/              # NestJS backend (Prisma + PostgreSQL)
├── src/              # Vite React frontend
├── docker/           # Docker Compose + nginx config + env
├── scripts/          # One-command local scripts
└── CLAUDE.md         # This file
```

## Tech Stack

- **Frontend**: Vite + React Router 7 + Tailwind + shadcn/ui
- **Backend**: NestJS 10 + Prisma + PostgreSQL
- **Auth**: JWT access (15m) + refresh (7d) tokens
- **Storage**: MinIO (S3-compatible, bucket: `traininghub`)

## Local Test Trigger Phrases

| User says | Claude runs | What it does |
|-----------|-------------|--------------|
| **"로컬 테스트 준비해"** | `./scripts/local-up.sh` | Build & start full stack (postgres, minio, api, web). Runs migrations only — no seed. |
| **"로컬 테스트 내려"** | `./scripts/local-down.sh` | Stop all containers (data preserved). |
| **"로컬 테스트 초기화"** | `./scripts/local-reset.sh` | Wipe volumes + rebuild + seed (full fresh start). |
| **"로컬 테스트 로그"** | `./scripts/local-logs.sh` | Tail logs from all services. |
| **"로컬 테스트 상태"** | `./scripts/healthcheck.sh` | Check all services are reachable and healthy. |

## Script Details

### `local-up.sh` — Start Stack
- Copies project to `/tmp/training-hub-build/` (bypasses Google Drive I/O).
- Runs `docker compose up --build -d`.
- Entrypoint runs `prisma db push` (schema sync only, **no seed**).
- Waits for API to respond (HTTP 401 = ready).
- **Expected output**: "Training Hub is running!" with all URLs.

### `local-reset.sh` — Full Reset with Seed
- Stops containers + wipes volumes (`docker compose down -v`).
- Calls `local-up.sh` to rebuild.
- Seeds database via `docker exec th-api npx ts-node prisma/seed.ts`.
- **Use this for first-time setup or when you need clean seed data.**

### `healthcheck.sh` — Service Health
- Checks: Web (8080), API (3000), PostgreSQL, MinIO, MinIO bucket.
- **Expected output**: 5 `[PASS]` lines, 0 `[FAIL]`.

### `smoke-test.sh` — API Functional Test
- Logs in with admin credentials.
- Calls `/auth/me`, `/programs`, `/dashboard/admin`.
- Tests MinIO upload/download.
- **Requires seed data** — run `local-reset.sh` first if tests fail.

## Local URLs (after `local-up.sh`)

| Service | URL |
|---------|-----|
| Web (frontend) | http://localhost:8080 |
| API (backend) | http://localhost:3000/api |
| MinIO Console | http://localhost:9001 (minioadmin / minioadmin) |
| PostgreSQL | localhost:5432 (training_hub / postgres / postgres) |

## Login Credentials (seed data — after `local-reset.sh`)

| Email | Password | Role |
|-------|----------|------|
| eric.yoon@bccard-ap.com | admin123 | ADMIN |
| admin.park@company.com | admin123 | ADMIN |
| felix@company.com | admin123 | INSTRUCTOR |
| nguyen.a@company.com | admin123 | TRAINEE |

## Environment Variables (`docker/.env.docker`)

All config lives in `docker/.env.docker`. The compose file references variables via `${VAR}` — no hardcoded defaults in compose.

| Variable | Default (dev) | Description |
|----------|---------------|-------------|
| `POSTGRES_DB` | `training_hub` | Database name |
| `POSTGRES_USER` | `postgres` | DB user |
| `POSTGRES_PASSWORD` | `postgres` | DB password |
| `DATABASE_URL` | `postgresql://...@postgres:5432/training_hub` | Prisma connection string |
| `JWT_SECRET` | `training-hub-jwt-secret-dev` | Access token signing key |
| `JWT_REFRESH_SECRET` | `training-hub-refresh-secret-dev` | Refresh token signing key |
| `JWT_EXPIRATION` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRATION` | `7d` | Refresh token TTL |
| `MINIO_ROOT_USER` | `minioadmin` | MinIO admin user |
| `MINIO_ROOT_PASSWORD` | `minioadmin` | MinIO admin password |
| `MINIO_BUCKET` | `traininghub` | Auto-created S3 bucket |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed CORS origin |

## Development Mode (without Docker)

```bash
# 1. Start only Postgres (existing docker-compose in api/)
cd api && docker compose up -d

# 2. Migrate + seed
cd api && npx prisma db push && npx tsx prisma/seed.ts

# 3. Start backend
cd api && npm run start:dev

# 4. Start frontend (separate terminal)
npm run dev
```

- Frontend dev: http://localhost:5173 (Vite proxy -> api:3000)
- API dev: http://localhost:3000/api

## Report Metrics (GET /api/programs/:id/reports/weekly)

**Purpose**: Weekly summary per trainee for Admin/Instructor review.

**Query Params**: `weekId` (optional), `teamId` (optional). Omitting returns all.

**Per-trainee row**:
| Metric | Formula |
|--------|---------|
| `attendanceRate` | `(PRESENT + LATE) / totalSessions × 100` — rounded to 2 decimals |
| `completionRate` | `(PASS + REVIEWED) / totalMissions × 100` — rounded to 2 decimals |
| `pendingCount` | Submissions with status `SUBMITTED` (awaiting instructor review) |

**Summary** (aggregated across all returned trainees):
| Metric | Formula |
|--------|---------|
| `avgAttendanceRate` | Mean of all trainees' `attendanceRate` |
| `avgCompletionRate` | Mean of all trainees' `completionRate` |
| `totalPendingReviews` | Sum of all trainees' `pendingCount` |

**CSV Export**: UTF-8 with BOM. Columns: Name, Email, Team, Attendance %, Attended, Total Sessions, Completion %, Completed, Total Tests, Pending Reviews.

## Constraints

- **No MongoDB** — PostgreSQL only
- **No hardcoded auth bypass** — login requires real credentials
- **No mock data fallback** — API errors show error state, not fake data
- **Prisma migrations** — all schema changes via Prisma
- **RBAC** — ADMIN, INSTRUCTOR, TRAINEE via ProgramMembership
- **No seed on restart** — `local-up.sh` is safe; `local-reset.sh` seeds
