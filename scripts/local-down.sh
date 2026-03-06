#!/bin/bash
set -e

BUILD_DIR="/tmp/training-hub-build"

if [ ! -d "$BUILD_DIR/docker" ]; then
  echo "No running stack found at $BUILD_DIR. Nothing to stop."
  exit 0
fi

echo "Stopping Training Hub local stack..."
cd "$BUILD_DIR/docker"
docker compose --env-file .env.docker down

echo "All services stopped."
