#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="/tmp/training-hub-build"

echo "============================================"
echo "  Training Hub — Local Stack Starting"
echo "============================================"
echo ""

# ─── Step 1: Copy project to fast local filesystem ───
echo ">>> Copying project to $BUILD_DIR (bypasses Google Drive I/O)..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Stream via tar — much faster than cp -R on Google Drive (single sequential read)
cd "$PROJECT_DIR"
tar cf - \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.env' \
  . | (cd "$BUILD_DIR" && tar xf -)

echo ">>> Copy complete."
echo ""

# ─── Step 2: Build & start ───
cd "$BUILD_DIR/docker"
export $(grep -v '^#' .env.docker | xargs)

echo ">>> Building and starting containers..."
docker compose --env-file .env.docker up --build -d

echo ""
echo "============================================"
echo "  Waiting for services to be ready..."
echo "============================================"

# Wait for API to be ready (up to 120s)
echo -n "Waiting for API"
for i in $(seq 1 60); do
  if curl -sf http://localhost:3000/api/auth/me > /dev/null 2>&1 || curl -sf http://localhost:3000/api > /dev/null 2>&1; then
    echo " Ready!"
    break
  fi
  # Accept 401 as "API is up" (auth required)
  STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/api/auth/me 2>/dev/null || echo "000")
  if [ "$STATUS" = "401" ]; then
    echo " Ready!"
    break
  fi
  if [ "$i" = "60" ]; then
    echo ""
    echo "WARNING: API did not respond within 120s. Check logs with './scripts/local-logs.sh'"
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "============================================"
echo "  Training Hub is running!"
echo "============================================"
echo ""
echo "  Web (frontend):  http://localhost:8080"
echo "  API (backend):   http://localhost:3000/api"
echo "  MinIO Console:   http://localhost:9001"
echo "    user: minioadmin / pass: minioadmin"
echo "  PostgreSQL:      localhost:5432"
echo "    db: training_hub / user: postgres / pass: postgres"
echo ""
echo "  Login credentials:"
echo "    eric.yoon@bccard-ap.com / admin123  (ADMIN)"
echo "    admin.park@company.com  / admin123 (ADMIN)"
echo "    felix@company.com       / admin123 (INSTRUCTOR)"
echo "    nguyen.a@company.com    / admin123 (TRAINEE)"
echo ""
echo "  Run './scripts/local-logs.sh' to view logs"
echo "  Run './scripts/local-down.sh' to stop"
echo "============================================"
