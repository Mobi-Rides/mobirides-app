

# Security Remediation: Delete Remaining Compromised Scripts + Update Lovable Access

## Two Separate Issues

### Issue 1: The `https://vip.66591.vip/.env.test` Outbound Traffic

This URL is **not in your codebase**. It's a malicious probe — likely triggered by the previously exposed service role key being used by an attacker to invoke your edge functions (specifically `send-push-notification`, which fetches arbitrary `subscription.endpoint` URLs without validation). The attacker stored a malicious push subscription endpoint pointing to `vip.66591.vip/.env.test` to scan for exposed environment files on other targets. This is the SSRF vulnerability identified earlier.

**The key rotation you've already done stops this attack vector.** The endpoint validation fix (whitelisting push service domains) in `send-push-notification` is still needed to prevent recurrence — that's tracked as part of MOB-700/BUG-002.

### Issue 2: More Scripts With Hardcoded Keys Still Exist

We deleted 9 scripts last round, but **7 more** still contain hardcoded old service role keys or anon keys. Plus `test-verification.js` at the project root. These must all be deleted:

| File | Contains |
|------|----------|
| `scripts/check-restrictions-by-phone.cjs` | Hardcoded service_role + anon key + admin credentials |
| `scripts/fix-car-covers.js` | Hardcoded service_role key |
| `scripts/test-hotfix-phase1.js` | Hardcoded service_role key |
| `scripts/test-arnold-sprint9.ts` | Hardcoded anon key (service_role from env) |
| `scripts/test-s9-009.ts` | Hardcoded anon key |
| `scripts/test-s9-011.ts` | Hardcoded anon key |
| `test-verification.js` (project root) | Hardcoded anon key + test credentials |

**Safe to keep** (no hardcoded keys):
- `scripts/test-promo-codes.cjs` — reads from env
- `scripts/validate-migrations.cjs` — file-system only, no Supabase
- `scripts/check_verifications.js` — reads from env
- `scripts/test-voice-feature.ts` — reads from env
- `scripts/verify-arnold-comprehensive.ts` — reads from env
- `scripts/test-s9-001-002.ts` — reads from env (but has hardcoded URL, not keys)
- `scripts/test-s9-010.ts` — reads from env
- `scripts/safe-db-reset.sh` — shell script, no keys
- `scripts/test-realtime-status.ts` — needs checking

### Issue 3: Updating Lovable's Access (New Keys)

Since you've rotated your Supabase keys:

1. **Anon key**: Go to your Supabase Dashboard → Settings → API → copy the new `anon` / `public` key
2. **In Lovable**: Go to **Project Settings → Supabase** and reconnect with the new project credentials, or update the environment variables (`VITE_SUPABASE_ANON_KEY`) in the Lovable project settings
3. The `.env` file in the codebase also contains the old keys and will need updating with the new anon key (the service role key should be removed from `.env` entirely — it should only live in Supabase Edge Function secrets)

### Issue 4: `.env` Contains Service Role Key

The `.env` file currently has `SUPABASE_SERVICE_ROLE_KEY` in plain text. This must be removed — it should only be configured as a Supabase Edge Function secret, never committed to source.

## Implementation Steps

1. **Delete 7 scripts** with hardcoded keys (listed above)
2. **Remove `SUPABASE_SERVICE_ROLE_KEY`** and `SUPABASE_ACCESS_TOKEN` lines from `.env`
3. **Update `.env`** anon key values to the new rotated key (you'll provide the new key)
4. **Add SSRF validation** to `send-push-notification/index.ts` (whitelist `fcm.googleapis.com`, `*.push.services.mozilla.com`, `*.notify.windows.com`)

## How to Update Lovable's Supabase Connection

You don't need to do anything special in code — Lovable reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the project environment. Once you provide me the new anon key, I'll update the `.env` file. The service role key should **only** be set in the Supabase Dashboard under Edge Functions → Secrets (it's already there as `SUPABASE_SERVICE_ROLE_KEY`).

