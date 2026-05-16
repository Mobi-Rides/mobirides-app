#!/usr/bin/env bash
# Integration test script for the session-monitor edge function.
# Usage: bash scripts/test-session-monitor.sh
#
# Required env vars (or in .env):
#   SUPABASE_URL              — e.g. https://xxxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — service role key

set -euo pipefail

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/session-monitor"

echo "================================================"
echo "  Session Monitor Edge Function — Test Suite"
echo "================================================"
echo "  URL : $FUNCTION_URL"
echo ""

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
FAILURES=0

# ── Test 1: process_auto_suspensions — service role gate ─────────────────────

echo "Test 1: process_auto_suspensions — service role auth succeeds"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"process_auto_suspensions"}')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "  HTTP : $HTTP_CODE"
echo "  Body : $BODY"
echo ""

if [[ "$HTTP_CODE" == "200" ]]; then
  pass "HTTP 200 OK"
else
  fail "Expected 200, got $HTTP_CODE"
fi

if echo "$BODY" | grep -q '"success":true'; then
  pass "Response contains success:true"
else
  fail "Response missing success:true"
fi

if echo "$BODY" | grep -qP '"processed":\d+'; then
  PROCESSED=$(echo "$BODY" | grep -oP '"processed":\K[0-9]+' || echo "?")
  pass "processed count present ($PROCESSED pending suspensions processed)"
else
  fail "processed count missing from response"
fi

# ── Test 2: process_auto_suspensions — wrong token rejected ──────────────────

echo "Test 2: process_auto_suspensions — wrong token returns 401/403"

RESPONSE2=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer not_the_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{"action":"process_auto_suspensions"}')

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | head -n-1)

echo "  HTTP : $HTTP_CODE2"
echo "  Body : $BODY2"
echo ""

if [[ "$HTTP_CODE2" == "403" || "$HTTP_CODE2" == "401" ]]; then
  pass "Wrong token rejected with $HTTP_CODE2"
else
  fail "Expected 401/403, got $HTTP_CODE2"
fi

# ── Test 3: log_login — invalid JWT returns 401 ───────────────────────────────

echo "Test 3: log_login — invalid JWT returns 401"

RESPONSE3=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer not_a_user_jwt" \
  -H "Content-Type: application/json" \
  -d '{"action":"log_login","user_agent":"test-runner/1.0"}')

HTTP_CODE3=$(echo "$RESPONSE3" | tail -n1)
BODY3=$(echo "$RESPONSE3" | head -n-1)

echo "  HTTP : $HTTP_CODE3"
echo "  Body : $BODY3"
echo ""

if [[ "$HTTP_CODE3" == "401" ]]; then
  pass "Invalid user JWT rejected with 401"
else
  fail "Expected 401, got $HTTP_CODE3"
fi

# ── Test 4: update_anomaly — invalid JWT returns 401 ─────────────────────────

echo "Test 4: update_anomaly — invalid JWT returns 401"

RESPONSE4=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer not_a_user_jwt" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_anomaly","anomaly_id":"00000000-0000-0000-0000-000000000000","verdict":"dismiss"}')

HTTP_CODE4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

echo "  HTTP : $HTTP_CODE4"
echo "  Body : $BODY4"
echo ""

if [[ "$HTTP_CODE4" == "401" ]]; then
  pass "Invalid user JWT rejected with 401"
else
  fail "Expected 401, got $HTTP_CODE4"
fi

# ── Test 5: Unknown action returns 400 ────────────────────────────────────────

echo "Test 5: Unknown action returns 400"

RESPONSE5=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"nonexistent_action"}')

HTTP_CODE5=$(echo "$RESPONSE5" | tail -n1)
BODY5=$(echo "$RESPONSE5" | head -n-1)

echo "  HTTP : $HTTP_CODE5"
echo "  Body : $BODY5"
echo ""

if [[ "$HTTP_CODE5" == "400" ]]; then
  pass "Unknown action returns 400"
else
  fail "Expected 400, got $HTTP_CODE5"
fi

# ── Test 6: DB tables exist ───────────────────────────────────────────────────

echo "Test 6: user_login_events table exists"

DB_RESPONSE6=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/rest/v1/user_login_events?limit=1&select=id" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")

HTTP_CODE6=$(echo "$DB_RESPONSE6" | tail -n1)
BODY6=$(echo "$DB_RESPONSE6" | head -n-1)

echo "  HTTP : $HTTP_CODE6"
echo "  Body : $BODY6"
echo ""

if [[ "$HTTP_CODE6" == "200" ]]; then
  pass "user_login_events table accessible"
elif echo "$BODY6" | grep -q '"Legacy API keys are disabled"'; then
  echo "  SKIP : REST API requires new sb_secret_ key — verify table in Supabase dashboard"
else
  fail "user_login_events table not accessible (HTTP $HTTP_CODE6)"
fi

echo "Test 7: session_anomalies table exists"

DB_RESPONSE7=$(curl -s -w "\n%{http_code}" \
  "${SUPABASE_URL}/rest/v1/session_anomalies?limit=1&select=id,risk_type,confidence,status" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")

HTTP_CODE7=$(echo "$DB_RESPONSE7" | tail -n1)
BODY7=$(echo "$DB_RESPONSE7" | head -n-1)

echo "  HTTP : $HTTP_CODE7"
echo "  Body : $BODY7"
echo ""

if [[ "$HTTP_CODE7" == "200" ]]; then
  pass "session_anomalies table accessible"
elif echo "$BODY7" | grep -q '"Legacy API keys are disabled"'; then
  echo "  SKIP : REST API requires new sb_secret_ key — verify table in Supabase dashboard"
else
  fail "session_anomalies table not accessible (HTTP $HTTP_CODE7)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo "================================================"
if [[ "$FAILURES" -eq 0 ]]; then
  echo "  All tests passed"
else
  echo "  $FAILURES test(s) failed"
fi
echo "================================================"

exit $FAILURES
