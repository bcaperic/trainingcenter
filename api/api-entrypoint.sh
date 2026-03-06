#!/bin/sh
set -e

echo ">>> Running Prisma db push (schema sync)..."
npx prisma db push --accept-data-loss 2>&1

echo ">>> Starting NestJS API..."
exec node dist/main
