# Training Hub

Full-stack training management platform (NestJS + React + PostgreSQL + MinIO).

## Quick Start

```bash
git clone https://github.com/Eric-yoon-ap/training-hub.git && cd training-hub
./scripts/local-reset.sh        # Build, start, migrate & seed (first time)
open http://localhost:8080       # Login with eric.yoon@bccard-ap.com / admin123
```

## Scripts

| Command | Description |
|---------|-------------|
| `./scripts/local-up.sh` | Build & start (no seed) |
| `./scripts/local-reset.sh` | Full reset with seed data |
| `./scripts/local-down.sh` | Stop all containers |
| `./scripts/local-logs.sh` | Tail service logs |
| `./scripts/healthcheck.sh` | Check all services are healthy |
| `./scripts/smoke-test.sh` | Run API functional tests |

## Test Accounts (after seed)

| Email | Password | Role |
|-------|----------|------|
| eric.yoon@bccard-ap.com | admin123 | Admin |
| admin.park@company.com | admin123 | Admin |
| felix@company.com | admin123 | Instructor |
| nguyen.a@company.com | admin123 | Trainee |

## Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API | http://localhost:3000/api |
| MinIO Console | http://localhost:9001 (minioadmin/minioadmin) |

## Tech Stack

- **Frontend**: Vite + React + React Router 7 + Tailwind CSS + shadcn/ui
- **Backend**: NestJS 10 + Prisma + PostgreSQL
- **Auth**: JWT (access 15m + refresh 7d)
- **Storage**: MinIO (S3-compatible)
  