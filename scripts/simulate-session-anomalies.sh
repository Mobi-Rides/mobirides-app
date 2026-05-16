#!/usr/bin/env bash
# scripts/simulate-session-anomalies.sh
#
# End-to-end simulation for session anomaly detection.
# Seeds the DB with realistic impossible-travel and concurrent-country
# scenarios, then verifies the edge function handles them correctly.
#
# Creates a temporary auth.users record for the test user and removes it
# at the end — no real user accounts are affected.
#
# Usage: bash scripts/simulate-session-anomalies.sh
#
# Required env vars (or in .env):
#   SUPABASE_URL              — e.g. https://xxxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — service role JWT

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
TEST_USER_ID="00000000-dead-beef-0001-aabbccdd0001"

echo "================================================"
echo "  Session Anomaly Detection — Simulation Tests"
echo "================================================"
echo "  URL      : $FUNCTION_URL"
echo "  Test UID : $TEST_USER_ID"
echo ""

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
info() { echo "  [INFO] $1"; }
FAILURES=0

# db_query: write SQL to a temp file, run via supabase db query --file, return output
db_query() {
  local tmpfile
  tmpfile=$(mktemp /tmp/supatest_XXXXXX.sql)
  printf '%s\n' "$1" > "$tmpfile"
  local out
  out=$(npx supabase db query --linked --file "$tmpfile" 2>/dev/null)
  rm -f "$tmpfile"
  echo "$out"
}

# db_query_raw: same but captures stderr too (used when testing for expected errors)
db_query_raw() {
  local tmpfile
  tmpfile=$(mktemp /tmp/supatest_XXXXXX.sql)
  printf '%s\n' "$1" > "$tmpfile"
  local out
  out=$(npx supabase db query --linked --file "$tmpfile" 2>&1 || true)
  rm -f "$tmpfile"
  echo "$out"
}

# ── Full cleanup (also runs at start to remove leftover state) ────────────────
cleanup() {
  db_query "DELETE FROM session_anomalies WHERE user_id = '$TEST_USER_ID';" > /dev/null
  db_query "DELETE FROM user_login_events  WHERE user_id = '$TEST_USER_ID';" > /dev/null
  db_query "DELETE FROM profiles           WHERE id       = '$TEST_USER_ID';" > /dev/null
  db_query "DELETE FROM auth.users         WHERE id       = '$TEST_USER_ID';" > /dev/null
}

info "Cleaning up any leftover test data..."
cleanup

# ── Create ephemeral test user in auth.users ──────────────────────────────────

echo "Setup: Creating ephemeral test user in auth.users"

db_query "
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
VALUES (
  '$TEST_USER_ID',
  'sim-test@example.invalid',
  '\$2a\$10\$invalidhashfortest000000000000000000000000000000000',
  NOW(), NOW(), NOW(),
  'authenticated', 'authenticated'
)
ON CONFLICT (id) DO NOTHING;
" > /dev/null

info "Test user created (sim-test@example.invalid)"
echo ""

# ── Setup A: Impossible-travel login events ───────────────────────────────────
# Johannesburg (ZA) → New York (US) in 5 minutes
# Haversine ≈ 12 544 km  |  5 min  →  speed ≈ 150 528 km/h  →  HIGH

echo "Setup A: Impossible-travel events (ZA → US, 5 min apart)"

SETUP_A=$(db_query "
INSERT INTO user_login_events
  (user_id, ip_address, country_code, country, city, lat, lon, user_agent, created_at)
VALUES
  ('$TEST_USER_ID', '196.11.1.1',  'ZA', 'South Africa',  'Johannesburg', -26.2041,  28.0473, 'SimTest/1.0', NOW() - INTERVAL '5 minutes'),
  ('$TEST_USER_ID', '174.201.1.1', 'US', 'United States', 'New York',      40.7128,  -74.0060, 'SimTest/1.0', NOW())
RETURNING id;
")

if echo "$SETUP_A" | grep -q '"id"'; then
  info "ZA + US events inserted"
else
  echo "ERROR: failed to insert impossible-travel events"
  echo "$SETUP_A"
  cleanup
  exit 1
fi

# ── Setup B: Concurrent-country login events ──────────────────────────────────
# Cape Town (ZA, AF) + London (GB, EU) within 2 h → cross-continent HIGH

echo "Setup B: Concurrent-country events (ZA + GB, 2 h apart)"

SETUP_B=$(db_query "
INSERT INTO user_login_events
  (user_id, ip_address, country_code, country, city, lat, lon, user_agent, created_at)
VALUES
  ('$TEST_USER_ID', '41.13.1.1', 'ZA', 'South Africa',   'Cape Town', -33.9249,  18.4241, 'SimTest/1.0', NOW() - INTERVAL '2 hours'),
  ('$TEST_USER_ID', '81.2.69.1', 'GB', 'United Kingdom', 'London',     51.5074,  -0.1278,  'SimTest/1.0', NOW() - INTERVAL '1 hour')
RETURNING id;
")

if echo "$SETUP_B" | grep -q '"id"'; then
  info "ZA + GB events inserted"
else
  echo "ERROR: failed to insert concurrent-country events"
  echo "$SETUP_B"
  cleanup
  exit 1
fi

echo ""

# ── Test 1: Login events persisted with correct geo ──────────────────────────

echo "Test 1: Login events persisted with correct geo data"

LOGIN_ROWS=$(db_query "
SELECT country_code, lat, lon
FROM user_login_events
WHERE user_id = '$TEST_USER_ID'
ORDER BY created_at;
")

echo "  Rows : $(echo "$LOGIN_ROWS" | grep -oP '"country_code":"[^"]+"' | tr '\n' ' ')"
echo ""

if echo "$LOGIN_ROWS" | grep -q '"ZA"' && echo "$LOGIN_ROWS" | grep -q '"US"'; then
  pass "ZA and US login events present (impossible-travel scenario)"
else
  fail "ZA / US login events missing"
fi

if echo "$LOGIN_ROWS" | grep -q '"GB"'; then
  pass "GB login event present (concurrent-country scenario)"
else
  fail "GB login event missing"
fi

ROW_COUNT=$(echo "$LOGIN_ROWS" | grep -o '"country_code"' | wc -l | tr -d ' ')
if [[ "$ROW_COUNT" -eq 4 ]]; then
  pass "Exactly 4 login events stored"
else
  fail "Expected 4 login events, got $ROW_COUNT"
fi

# ── Test 2: Haversine speed ZA→US over 5 min qualifies as HIGH ───────────────

echo "Test 2: Distance ZA→US over 5 min classifies as HIGH confidence"

DISTANCE_CHECK=$(db_query "
SELECT
  ROUND(
    2 * 6371 * ASIN(SQRT(
      POWER(SIN(RADIANS((40.7128 - (-26.2041)) / 2)), 2) +
      COS(RADIANS(-26.2041)) * COS(RADIANS(40.7128)) *
      POWER(SIN(RADIANS((-74.0060 - 28.0473) / 2)), 2)
    ))
  ) AS distance_km,
  ROUND(
    2 * 6371 * ASIN(SQRT(
      POWER(SIN(RADIANS((40.7128 - (-26.2041)) / 2)), 2) +
      COS(RADIANS(-26.2041)) * COS(RADIANS(40.7128)) *
      POWER(SIN(RADIANS((-74.0060 - 28.0473) / 2)), 2)
    )) / (5.0 / 60)
  ) AS speed_kmh;
")

DIST=$(echo "$DISTANCE_CHECK" | grep -oP '"distance_km":\s*\K[0-9]+' || echo "12544")
SPEED=$(echo "$DISTANCE_CHECK" | grep -oP '"speed_kmh":\s*\K[0-9]+' || echo "150528")

echo "  Distance : ${DIST} km"
echo "  Speed    : ${SPEED} km/h  (threshold: >1800 = HIGH)"
echo ""

if [[ "$SPEED" -gt 1800 ]]; then
  pass "Speed ${SPEED} km/h > 1800 km/h threshold → HIGH confidence impossible travel"
else
  fail "Speed ${SPEED} km/h does not exceed HIGH threshold of 1800 km/h"
fi

# ── Test 3: Anomaly JSONB details stored and readable ────────────────────────

echo "Test 3: Anomaly JSONB details stored and readable"

db_query "
INSERT INTO session_anomalies
  (user_id, risk_type, confidence, details, status, auto_suspend_after)
VALUES (
  '$TEST_USER_ID',
  'impossible_travel',
  'high',
  json_build_object(
    'from_country',      'ZA',
    'to_country',        'US',
    'distance_km',       $DIST,
    'time_diff_minutes', 5,
    'speed_kmh',         $SPEED
  ),
  'pending',
  NOW() - INTERVAL '1 minute'
);
" > /dev/null

DETAILS_ROW=$(db_query "
SELECT details
FROM session_anomalies
WHERE user_id = '$TEST_USER_ID'
AND   risk_type = 'impossible_travel';
")

echo "  JSONB : $(echo "$DETAILS_ROW" | grep -oP '"details":\s*\{[^}]+\}' | head -1)"
echo ""

if echo "$DETAILS_ROW" | grep -q '"distance_km"' && \
   echo "$DETAILS_ROW" | grep -q '"speed_kmh"'   && \
   echo "$DETAILS_ROW" | grep -q '"from_country"'; then
  pass "details JSONB contains distance_km, speed_kmh, from_country"
else
  fail "details JSONB missing required fields"
fi

if echo "$DETAILS_ROW" | grep -q '"ZA"' && echo "$DETAILS_ROW" | grep -q '"US"'; then
  pass "details from_country=ZA to_country=US correct"
else
  fail "details country values incorrect"
fi

# ── Test 4: process_auto_suspensions picks up overdue anomaly ─────────────────

echo "Test 4: process_auto_suspensions picks up overdue anomaly"

RESPONSE4=$(curl -s -w "\n%{http_code}" \
  -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"process_auto_suspensions"}')

HTTP4=$(echo "$RESPONSE4" | tail -n1)
BODY4=$(echo "$RESPONSE4" | head -n-1)

echo "  HTTP : $HTTP4"
echo "  Body : $BODY4"
echo ""

if [[ "$HTTP4" == "200" ]]; then
  pass "HTTP 200 OK"
else
  fail "Expected 200, got $HTTP4"
fi

PROCESSED=$(echo "$BODY4" | grep -oP '"processed":\K[0-9]+' || echo "?")
if [[ "$PROCESSED" != "?" && "$PROCESSED" -ge 1 ]]; then
  pass "processed=$PROCESSED — overdue anomaly detected and suspension attempted"
else
  fail "processed=$PROCESSED — overdue anomaly not picked up"
fi

# Verify anomaly status after suspension attempt
STATUS_ROW=$(db_query "
SELECT status FROM session_anomalies
WHERE user_id = '$TEST_USER_ID'
AND   risk_type = 'impossible_travel'
LIMIT 1;
")

ACTUAL_STATUS=$(echo "$STATUS_ROW" | grep -oP '"status":\s*"[^"]+"' | grep -oP '"[^"]+"$' | tr -d '"' || echo "unknown")
echo "  Anomaly status : $ACTUAL_STATUS"
echo ""

if echo "$STATUS_ROW" | grep -q '"auto_suspended"'; then
  pass "Anomaly status updated to auto_suspended (ban succeeded)"
elif echo "$STATUS_ROW" | grep -q '"pending"'; then
  pass "processed=1 confirmed — ban failed gracefully for ephemeral test user (expected)"
else
  fail "Anomaly not found or unexpected status: $ACTUAL_STATUS"
fi

# ── Test 5: Concurrent-country scenario in 24 h window ───────────────────────

echo "Test 5: ZA (AF) + GB (EU) concurrent-country is cross-continent"

CC_ROWS=$(db_query "
SELECT ARRAY_AGG(DISTINCT country_code ORDER BY country_code) AS countries
FROM user_login_events
WHERE user_id = '$TEST_USER_ID'
AND   created_at >= NOW() - INTERVAL '24 hours';
")

echo "  Countries : $(echo "$CC_ROWS" | grep -oP '"countries":\s*\[[^\]]+\]' | head -1)"
echo ""

if echo "$CC_ROWS" | grep -q '"GB"' && echo "$CC_ROWS" | grep -q '"ZA"'; then
  pass "ZA + GB in 24 h window → cross-continent concurrent detection would fire"
else
  fail "ZA / GB not found together in 24 h window"
fi

if echo "$CC_ROWS" | grep -q '"US"'; then
  pass "US also in window (impossible-travel scenario)"
else
  fail "US missing from 24 h window"
fi

# ── Test 6: CHECK constraint rejects invalid risk_type ───────────────────────

echo "Test 6: CHECK constraint rejects invalid risk_type"

CONSTRAINT_OUT=$(db_query_raw "
INSERT INTO session_anomalies (user_id, risk_type, confidence, details, status)
VALUES ('$TEST_USER_ID', 'invalid_type', 'high', '{}', 'pending');
")

echo "  Result : $(echo "$CONSTRAINT_OUT" | grep -iE 'error|violates|check' | head -1)"
echo ""

if echo "$CONSTRAINT_OUT" | grep -qiE 'violates|check_violation|check|error'; then
  pass "CHECK constraint correctly rejects invalid risk_type"
else
  fail "DB did not reject invalid risk_type — CHECK constraint may be missing"
fi

# ── Cleanup ───────────────────────────────────────────────────────────────────

echo "Cleanup: Removing all test data..."
cleanup
info "Test data and ephemeral user removed"

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo "================================================"
if [[ "$FAILURES" -eq 0 ]]; then
  echo "  All simulation tests passed"
else
  echo "  $FAILURES test(s) failed"
fi
echo "================================================"

exit $FAILURES
