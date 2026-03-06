#!/bin/bash
# Training Hub — Health Check
# Verifies all services are reachable and healthy.

PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  if [ "$result" = "ok" ]; then
    echo "  [PASS] $name"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $name — $result"
    FAIL=$((FAIL + 1))
  fi
}

echo "============================================"
echo "  Training Hub — Health Check"
echo "============================================"
echo ""

# ─── Web (nginx) ───
WEB_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:8080 2>/dev/null || echo "000")
if [ "$WEB_STATUS" = "200" ]; then
  check "Web (localhost:8080)" "ok"
else
  check "Web (localhost:8080)" "HTTP $WEB_STATUS"
fi

# ─── API ───
API_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:3000/api/auth/me 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ] || [ "$API_STATUS" = "401" ]; then
  check "API (localhost:3000/api)" "ok"
else
  check "API (localhost:3000/api)" "HTTP $API_STATUS"
fi

# ─── PostgreSQL ───
PG_READY=$(docker exec th-postgres pg_isready -U postgres 2>/dev/null)
if echo "$PG_READY" | grep -q "accepting connections"; then
  check "PostgreSQL (th-postgres)" "ok"
else
  check "PostgreSQL (th-postgres)" "not ready"
fi

# ─── MinIO ───
MINIO_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:9000/minio/health/live 2>/dev/null || echo "000")
if [ "$MINIO_STATUS" = "200" ]; then
  check "MinIO (localhost:9000)" "ok"
else
  check "MinIO (localhost:9000)" "HTTP $MINIO_STATUS"
fi

# ─── MinIO bucket ───
BUCKET_CHECK=$(docker exec th-minio mc ls local/traininghub 2>/dev/null && echo "exists" || echo "missing")
if [ "$BUCKET_CHECK" = "exists" ]; then
  check "MinIO bucket (traininghub)" "ok"
else
  # Try via minio-init container's mc alias
  BUCKET_HTTP=$(curl -o /dev/null -s -w "%{http_code}" http://localhost:9000/traininghub/ 2>/dev/null || echo "000")
  if [ "$BUCKET_HTTP" = "200" ] || [ "$BUCKET_HTTP" = "404" ]; then
    check "MinIO bucket (traininghub)" "ok"
  else
    check "MinIO bucket (traininghub)" "$BUCKET_CHECK"
  fi
fi

echo ""
echo "  Result: $PASS passed, $FAIL failed"
echo "============================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
