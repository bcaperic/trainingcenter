#!/bin/bash
set -e

BUILD_DIR="/tmp/training-hub-build"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo "  Training Hub — Full Reset"
echo "============================================"
echo ""

# Step 1: Stop + wipe volumes
if [ -d "$BUILD_DIR/docker" ]; then
  echo ">>> Stopping containers and wiping volumes..."
  cd "$BUILD_DIR/docker"
  docker compose --env-file .env.docker down -v 2>/dev/null || true
fi

# Step 2: Rebuild and start (delegates to local-up.sh)
"$SCRIPT_DIR/local-up.sh"

# Step 3: Seed database
echo ""
echo ">>> Seeding database..."
docker exec th-api npx ts-node prisma/seed.ts 2>&1
echo ">>> Seed complete."
echo ""
echo "============================================"
echo "  Reset finished — stack is running with seed data."
echo "============================================"
