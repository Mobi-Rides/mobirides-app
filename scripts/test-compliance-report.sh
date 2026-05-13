#!/usr/bin/env bash
# Test script for the compliance-report edge function.
# Usage: bash scripts/test-compliance-report.sh [YYYY-MM]
#
# Required env vars (or in .env):
#   SUPABASE_URL              — e.g. https://xxxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — old JWT OR new sb_secret_... key
#
# Optional:
#   SUPABASE_ANON_KEY         — new sb_publishable_... key (for REST checks)

set -euo pipefail

MONTH="${1:-2026-04}"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
# Fall back to publishable key for REST reads if service role rejected there
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-${SUPABASE_SERVICE_ROLE_KEY}}"

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

FUNCTION_URL="${SUPABASE_URL}/functions/v1/compliance-report"

echo "================================================"
echo "  Compliance Report Edge Function — Test Suite"
echo "================================================"
echo "  URL   : $FUNCTION_URL"
echo "  Month : $MONTH"
echo ""

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
FAILURES=0

# ── Test 1: Generate report ───────────────────────────────────────────────────

echo "Test 1: Generate compliance report for $MONTH"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"month\": \"$MONTH\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "  HTTP  : $HTTP_CODE"
echo "  Body  : $BODY"
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

RECORD_COUNT=$(echo "$BODY" | grep -oP '"record_count":\K[0-9]+' || echo "missing")
echo "  Info  : record_count=$RECORD_COUNT"
if [[ "$RECORD_COUNT" != "missing" ]]; then
  pass "record_count present ($RECORD_COUNT records)"
else
  fail "record_count missing from response"
fi

# ── Test 2: Verify action — invalid signature returns valid:false ─────────────

echo "Test 2: Verify endpoint — invalid signature"

VERIFY_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"verify","canonical_json":"{\"report_month\":\"2026-01\"}","signature_b64":"invalidsig=="}')

VERIFY_CODE=$(echo "$VERIFY_RESPONSE" | tail -n1)
VERIFY_BODY=$(echo "$VERIFY_RESPONSE" | head -n-1)

echo "  HTTP  : $VERIFY_CODE"
echo "  Body  : $VERIFY_BODY"
echo ""

if [[ "$VERIFY_CODE" == "200" ]]; then
  pass "Verify endpoint returned 200"
else
  fail "Verify endpoint expected 200, got $VERIFY_CODE"
fi

if echo "$VERIFY_BODY" | grep -q '"valid":false'; then
  pass "Invalid signature correctly returns valid:false"
else
  fail "Expected valid:false for bad signature"
fi

if echo "$VERIFY_BODY" | grep -q '"key_fingerprint"'; then
  pass "key_fingerprint present in verify response"
else
  fail "key_fingerprint missing from verify response"
fi

# ── Test 3: Auth gate — wrong token ──────────────────────────────────────────

echo "Test 3: Auth gate — random token returns 401 or 403"

AUTH_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer not_a_real_token" \
  -H "Content-Type: application/json" \
  -d "{\"month\": \"$MONTH\"}")

AUTH_CODE=$(echo "$AUTH_RESPONSE" | tail -n1)
AUTH_BODY=$(echo "$AUTH_RESPONSE" | head -n-1)

echo "  HTTP  : $AUTH_CODE"
echo "  Body  : $AUTH_BODY"
echo ""

if [[ "$AUTH_CODE" == "401" || "$AUTH_CODE" == "403" ]]; then
  pass "Invalid token rejected with $AUTH_CODE"
else
  fail "Expected 401/403, got $AUTH_CODE"
fi

# ── Test 4: Verify row in compliance_reports table ────────────────────────────

echo "Test 4: compliance_reports row exists after generation"

MONTH_DATE="${MONTH}-01"
DB_RESPONSE=$(curl -s \
  "${SUPABASE_URL}/rest/v1/compliance_reports?report_month=eq.${MONTH_DATE}&select=report_month,record_count,status,storage_path" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY")

echo "  Row   : $DB_RESPONSE"
echo ""

if echo "$DB_RESPONSE" | grep -q '"status":"completed"'; then
  pass "compliance_reports row has status:completed"
elif echo "$DB_RESPONSE" | grep -q '"Legacy API keys are disabled"'; then
  echo "  SKIP  : REST API requires new sb_secret_ key — check Supabase dashboard for the row"
else
  fail "No completed row found in compliance_reports for $MONTH"
fi

if echo "$DB_RESPONSE" | grep -q '"storage_path"'; then
  STORAGE_PATH=$(echo "$DB_RESPONSE" | grep -oP '"storage_path":"\K[^"]+' || echo "null")
  if [[ "$STORAGE_PATH" != "null" && -n "$STORAGE_PATH" ]]; then
    pass "storage_path is set: $STORAGE_PATH"
  else
    fail "storage_path is null — PDF may not have uploaded"
  fi
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
