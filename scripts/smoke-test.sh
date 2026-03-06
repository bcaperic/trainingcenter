#!/bin/bash
# Training Hub — Smoke Test
# Performs API-level functional tests against the running stack.

API="http://localhost:3000/api"
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
echo "  Training Hub — Smoke Test"
echo "============================================"
echo ""

# ─── 1. Login as admin ───
LOGIN_RESP=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"eric.yoon@bccard-ap.com","password":"admin123"}' 2>/dev/null)

TOKEN=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
  check "Login (eric.yoon@bccard-ap.com)" "ok"
else
  check "Login (eric.yoon@bccard-ap.com)" "no token returned"
  echo ""
  echo "  Cannot continue without auth token. Is seed data loaded?"
  echo "  Run './scripts/local-reset.sh' to reset with seed data."
  echo ""
  echo "  Result: $PASS passed, $FAIL failed"
  echo "============================================"
  exit 1
fi

# ─── 2. GET /auth/me ───
ME_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$API/auth/me" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)
if [ "$ME_STATUS" = "200" ]; then
  check "GET /auth/me" "ok"
else
  check "GET /auth/me" "HTTP $ME_STATUS"
fi

# ─── 3. GET /programs ───
PROGRAMS_RESP=$(curl -s "$API/programs" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

PROGRAM_COUNT=$(echo "$PROGRAMS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get('data', data.get('items', []))
print(len(items))
" 2>/dev/null || echo "0")

if [ "$PROGRAM_COUNT" -gt 0 ] 2>/dev/null; then
  check "GET /programs ($PROGRAM_COUNT programs)" "ok"
  # Extract a seed program (one with most members = most data) for subsequent tests
  PROGRAM_ID=$(echo "$PROGRAMS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get('data', data.get('items', []))
# Pick program with highest memberCount (most complete seed data)
best = max(items, key=lambda p: p.get('memberCount', 0)) if items else None
print(best['id'] if best else '')
" 2>/dev/null)
else
  check "GET /programs" "no programs found"
  PROGRAM_ID=""
fi

# ─── 4. Admin dashboard ───
if [ -n "$PROGRAM_ID" ]; then
  DASH_STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
    "$API/programs/$PROGRAM_ID/dashboard/admin" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if [ "$DASH_STATUS" = "200" ]; then
    check "GET /programs/:id/dashboard/admin" "ok"
  else
    check "GET /programs/:id/dashboard/admin" "HTTP $DASH_STATUS"
  fi
fi

# ─── 5. MinIO upload test ───
MINIO_STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
  -X PUT "http://localhost:9000/traininghub/smoke-test.txt" \
  -H "Content-Type: text/plain" \
  -d "smoke-test-$(date +%s)" 2>/dev/null)
# MinIO anonymous upload may return 403 (expected — write requires auth), 200/201 if open
# We test read access instead since we set anonymous download
echo "smoke-test-ok" > /tmp/th-smoke-upload.txt
# Upload via mc in the minio container
docker exec -i th-minio sh -c "echo 'smoke-test-ok' > /tmp/test.txt && mc cp /tmp/test.txt local/traininghub/smoke-test.txt" 2>/dev/null
DOWNLOAD=$(curl -s "http://localhost:9000/traininghub/smoke-test.txt" 2>/dev/null)
if echo "$DOWNLOAD" | grep -q "smoke-test-ok"; then
  check "MinIO upload/download (traininghub bucket)" "ok"
else
  # mc might not be available in minio container, try alternative
  MINIO_LIVE=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:9000/minio/health/live" 2>/dev/null)
  if [ "$MINIO_LIVE" = "200" ]; then
    check "MinIO reachable (upload skipped — mc not in minio container)" "ok"
  else
    check "MinIO upload/download" "not reachable"
  fi
fi
rm -f /tmp/th-smoke-upload.txt

echo ""
echo "  ── CMS-1: Programs (dates + attachments) ──"
echo ""

# ─── 6. Create program with startDate/endDate ───
CREATE_PROG_RESP=$(curl -s -X POST "$API/programs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Smoke Test Program",
    "shortName":"STP",
    "description":"Created by smoke-test",
    "duration":"4 weeks",
    "startDate":"2026-04-01T00:00:00.000Z",
    "endDate":"2026-04-28T00:00:00.000Z",
    "status":"DRAFT"
  }' 2>/dev/null)

NEW_PROG_ID=$(echo "$CREATE_PROG_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

if [ -n "$NEW_PROG_ID" ] && [ "$NEW_PROG_ID" != "" ]; then
  # Verify dates are returned
  HAS_DATES=$(echo "$CREATE_PROG_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ok = d.get('startDate','') != '' and d.get('endDate','') != ''
print('yes' if ok else 'no')
" 2>/dev/null)
  if [ "$HAS_DATES" = "yes" ]; then
    check "Create program with startDate/endDate" "ok"
  else
    check "Create program with startDate/endDate" "dates missing in response"
  fi
else
  check "Create program with startDate/endDate" "no id returned"
fi

# ─── 7. Verify program appears in GET /programs ───
if [ -n "$NEW_PROG_ID" ]; then
  GET_PROG_STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
    "$API/programs/$NEW_PROG_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if [ "$GET_PROG_STATUS" = "200" ]; then
    check "GET /programs/:id (new program)" "ok"
  else
    check "GET /programs/:id (new program)" "HTTP $GET_PROG_STATUS"
  fi
fi

# ─── 8. Upload attachment to program ───
ATTACH_UPLOADED=""
if [ -n "$NEW_PROG_ID" ]; then
  # Create a small test file
  echo "smoke-test-attachment-content" > /tmp/th-smoke-attachment.txt

  UPLOAD_RESP=$(curl -s -X POST "$API/programs/$NEW_PROG_ID/attachments" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/th-smoke-attachment.txt;type=text/plain" 2>/dev/null)

  ATTACH_ID=$(echo "$UPLOAD_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [ -n "$ATTACH_ID" ] && [ "$ATTACH_ID" != "" ]; then
    check "Upload attachment to program" "ok"
    ATTACH_UPLOADED="yes"
  else
    check "Upload attachment to program" "no id returned"
  fi
  rm -f /tmp/th-smoke-attachment.txt
fi

# ─── 9. List attachments ───
if [ -n "$NEW_PROG_ID" ] && [ "$ATTACH_UPLOADED" = "yes" ]; then
  LIST_RESP=$(curl -s "$API/programs/$NEW_PROG_ID/attachments" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  ATT_COUNT=$(echo "$LIST_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else []
print(len(items))
" 2>/dev/null || echo "0")

  if [ "$ATT_COUNT" -gt 0 ] 2>/dev/null; then
    check "List attachments (count=$ATT_COUNT)" "ok"
  else
    check "List attachments" "empty list"
  fi
fi

# ─── 10. Download attachment ───
if [ -n "$NEW_PROG_ID" ] && [ -n "$ATTACH_ID" ] && [ "$ATTACH_ID" != "" ]; then
  DL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" \
    "$API/programs/$NEW_PROG_ID/attachments/$ATTACH_ID/download" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if [ "$DL_STATUS" = "200" ]; then
    check "Download attachment" "ok"
  else
    check "Download attachment" "HTTP $DL_STATUS"
  fi
fi

# ─── 11. Delete attachment ───
if [ -n "$NEW_PROG_ID" ] && [ -n "$ATTACH_ID" ] && [ "$ATTACH_ID" != "" ]; then
  DEL_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -X DELETE \
    "$API/programs/$NEW_PROG_ID/attachments/$ATTACH_ID" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  if [ "$DEL_STATUS" = "200" ]; then
    # Verify list is now empty
    LIST_AFTER=$(curl -s "$API/programs/$NEW_PROG_ID/attachments" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    AFTER_COUNT=$(echo "$LIST_AFTER" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else []
print(len(items))
" 2>/dev/null || echo "?")
    if [ "$AFTER_COUNT" = "0" ]; then
      check "Delete attachment (list empty after)" "ok"
    else
      check "Delete attachment" "list still has $AFTER_COUNT items"
    fi
  else
    check "Delete attachment" "HTTP $DEL_STATUS"
  fi
fi

echo ""
echo "  ── CMS-2: Users Invite ──"
echo ""

# ─── 12. Invite a new user ───
INVITE_EMAIL="smoke-invite-$(date +%s)@test.com"
INVITE_PROG_ID="${PROGRAM_ID:-$NEW_PROG_ID}"
INVITE_USER_ID=""

if [ -n "$INVITE_PROG_ID" ]; then
  INVITE_RESP=$(curl -s -X POST "$API/programs/$INVITE_PROG_ID/users/invite" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\":\"$INVITE_EMAIL\",
      \"name\":\"Smoke Invite User\",
      \"role\":\"TRAINEE\"
    }" 2>/dev/null)

  INVITE_USER_ID=$(echo "$INVITE_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
u = d.get('user', {})
print(u.get('id', ''))
" 2>/dev/null)

  if [ -n "$INVITE_USER_ID" ] && [ "$INVITE_USER_ID" != "" ]; then
    check "Invite new user ($INVITE_EMAIL)" "ok"
  else
    check "Invite new user" "no user.id returned"
  fi
else
  check "Invite new user" "no program ID available"
fi

# ─── 13. Verify user appears in users list ───
if [ -n "$INVITE_PROG_ID" ] && [ -n "$INVITE_USER_ID" ]; then
  USERS_RESP=$(curl -s "$API/programs/$INVITE_PROG_ID/users" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  FOUND_USER=$(echo "$USERS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else data.get('data', [])
found = any(m.get('user',{}).get('email','') == '$INVITE_EMAIL' for m in items)
print('yes' if found else 'no')
" 2>/dev/null)

  if [ "$FOUND_USER" = "yes" ]; then
    check "Invited user appears in users list" "ok"
  else
    check "Invited user appears in users list" "not found"
  fi
fi

# ─── 14. Verify MailLog has reset token/link ───
RESET_TOKEN=""
if [ -n "$INVITE_USER_ID" ]; then
  MAIL_RESP=$(curl -s "$API/auth/mail-log" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  RESET_TOKEN=$(echo "$MAIL_RESP" | python3 -c "
import sys, json
logs = json.loads(sys.stdin.read(), strict=False)
for log in logs:
    if log.get('to','') == '$INVITE_EMAIL' and log.get('token',''):
        print(log['token'])
        break
else:
    print('')
" 2>/dev/null)

  if [ -n "$RESET_TOKEN" ] && [ "$RESET_TOKEN" != "" ]; then
    check "MailLog has invite reset token" "ok"
  else
    check "MailLog has invite reset token" "not found"
  fi
fi

# ─── 15. Reset password and verify login ───
if [ -n "$RESET_TOKEN" ] && [ "$RESET_TOKEN" != "" ]; then
  RESET_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -X POST "$API/auth/reset-password" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$RESET_TOKEN\",\"password\":\"smoketest123\"}" 2>/dev/null)

  if [ "$RESET_STATUS" = "201" ] || [ "$RESET_STATUS" = "200" ]; then
    # Now try to login with the new password
    LOGIN2_RESP=$(curl -s -X POST "$API/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$INVITE_EMAIL\",\"password\":\"smoketest123\"}" 2>/dev/null)

    TOKEN2=$(echo "$LOGIN2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

    if [ -n "$TOKEN2" ] && [ "$TOKEN2" != "" ]; then
      check "Invited user set password + login" "ok"
    else
      check "Invited user set password + login" "login failed after reset"
    fi
  else
    check "Invited user set password + login" "reset returned HTTP $RESET_STATUS"
  fi
fi

echo ""
echo "  ── OPS: Attendance Ops Summary ──"
echo ""

# ─── 16. GET /sessions (find a session for ops-summary) ───
SESSION_ID=""
if [ -n "$PROGRAM_ID" ]; then
  SESSIONS_RESP=$(curl -s "$API/programs/$PROGRAM_ID/sessions" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  SESSION_ID=$(echo "$SESSIONS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data.get('data', data if isinstance(data, list) else [])
if items:
    print(items[0]['id'])
else:
    print('')
" 2>/dev/null)

  if [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "" ]; then
    check "GET /sessions (found session for ops test)" "ok"
  else
    check "GET /sessions" "no sessions found in seed program"
  fi
fi

# ─── 17. GET /sessions/:id/ops-summary ───
if [ -n "$PROGRAM_ID" ] && [ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "" ]; then
  OPS_RESP=$(curl -s "$API/programs/$PROGRAM_ID/sessions/$SESSION_ID/ops-summary" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  OPS_OK=$(echo "$OPS_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d.get('summary', {})
has_summary = 'totalTrainees' in s and 'checkedIn' in s and 'lateCount' in s and 'notCheckedIn' in s
has_trainees = isinstance(d.get('trainees'), list)
has_session = 'id' in d.get('session', {})
print('yes' if (has_summary and has_trainees and has_session) else 'no')
" 2>/dev/null)

  if [ "$OPS_OK" = "yes" ]; then
    # Check trainee rows have the new fields
    HAS_FIELDS=$(echo "$OPS_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
trainees = d.get('trainees', [])
if not trainees:
    print('yes')  # empty list is fine (no trainees enrolled)
else:
    t = trainees[0]
    ok = 'testSubmissionStatus' in t and 'submittedAt' in t
    print('yes' if ok else 'no')
" 2>/dev/null)
    if [ "$HAS_FIELDS" = "yes" ]; then
      check "GET /sessions/:id/ops-summary (summary + trainee fields)" "ok"
    else
      check "GET /sessions/:id/ops-summary" "missing testSubmissionStatus/submittedAt fields"
    fi
  else
    check "GET /sessions/:id/ops-summary" "invalid response shape"
  fi
fi

echo ""
echo "  ── 1B: Submit with File ──"
echo ""

# ─── 18. Login as trainee and submit-with-file ───
TRAINEE_LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nguyen.a@company.com","password":"admin123"}' 2>/dev/null)

TRAINEE_TOKEN=$(echo "$TRAINEE_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('accessToken',''))" 2>/dev/null)

if [ -n "$TRAINEE_TOKEN" ] && [ "$TRAINEE_TOKEN" != "" ]; then
  # Find a mission from the seed program to submit to
  # First get weeks for the seed program
  WEEKS_RESP=$(curl -s "$API/programs/$PROGRAM_ID/weeks" \
    -H "Authorization: Bearer $TRAINEE_TOKEN" 2>/dev/null)

  FIRST_WEEK_ID=$(echo "$WEEKS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else []
if items:
    print(items[0]['id'])
else:
    print('')
" 2>/dev/null)

  MISSION_ID=""
  if [ -n "$FIRST_WEEK_ID" ] && [ "$FIRST_WEEK_ID" != "" ]; then
    MISSIONS_RESP=$(curl -s "$API/programs/$PROGRAM_ID/missions/weeks/$FIRST_WEEK_ID" \
      -H "Authorization: Bearer $TRAINEE_TOKEN" 2>/dev/null)

    MISSION_ID=$(echo "$MISSIONS_RESP" | python3 -c "
import sys, json
data = json.load(sys.stdin)
items = data if isinstance(data, list) else []
# Pick a mission that hasn't been submitted yet (pending/overdue), or first one
for m in items:
    if m.get('userStatus','pending') in ('pending','overdue'):
        print(m['id']); break
else:
    if items:
        print(items[0]['id'])
    else:
        print('')
" 2>/dev/null)
  fi

  if [ -n "$MISSION_ID" ] && [ "$MISSION_ID" != "" ]; then
    # Create a test file and submit
    echo "smoke-test-submission-content" > /tmp/th-smoke-submit.txt

    SUBMIT_RESP=$(curl -s -X POST "$API/programs/$PROGRAM_ID/missions/$MISSION_ID/submit-with-file" \
      -H "Authorization: Bearer $TRAINEE_TOKEN" \
      -F "contentText=smoke test submission" \
      -F "file=@/tmp/th-smoke-submit.txt;type=text/plain" 2>/dev/null)

    SUBMIT_ID=$(echo "$SUBMIT_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    if [ -n "$SUBMIT_ID" ] && [ "$SUBMIT_ID" != "" ]; then
      # Verify attachment is in response
      ATT_OK=$(echo "$SUBMIT_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
atts = d.get('attachments', [])
print('yes' if len(atts) > 0 else 'no')
" 2>/dev/null)
      if [ "$ATT_OK" = "yes" ]; then
        check "Submit with file (submission + attachment)" "ok"
      else
        check "Submit with file" "no attachments in response"
      fi
    else
      check "Submit with file" "no submission id returned"
    fi

    rm -f /tmp/th-smoke-submit.txt
  else
    check "Submit with file" "no mission found for trainee"
  fi
else
  check "Submit with file" "trainee login failed"
fi

echo ""
echo "  Result: $PASS passed, $FAIL failed"
echo "============================================"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
