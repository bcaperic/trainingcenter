#!/bin/bash

BUILD_DIR="/tmp/training-hub-build"

if [ ! -d "$BUILD_DIR/docker" ]; then
  echo "No running stack found at $BUILD_DIR. Run './scripts/local-up.sh' first."
  exit 1
fi

cd "$BUILD_DIR/docker"
docker compose --env-file .env.docker logs -f "${@:-api web postgres}"
