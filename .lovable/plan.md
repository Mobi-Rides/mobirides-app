

# Force-Redeploy `send-push-notification` and Verify via Logs

## Context
The SSRF domain whitelist is in the source code but may not be live on Supabase's edge runtime. Supabase Security continues to flag outbound scanning traffic, confirming the deployed version likely predates the fix.

## Step 1: Force-redeploy the edge function
Use the `supabase--deploy_edge_functions` tool to redeploy `send-push-notification` immediately. No code changes needed — the whitelist is already in `index.ts`.

## Step 2: Verify deployment
Use `supabase--curl_edge_functions` to send a test request with a **malicious endpoint** (e.g., `https://evil.example.com/.env`) and confirm the function returns a `403` with `"Push endpoint domain not allowed"`.

## Step 3: Check logs
Use `supabase--edge_function_logs` to look for `Blocked push to disallowed endpoint:` entries, confirming the whitelist is active in production.

## Step 4: Update documentation
Add a redeployment note to **BUG-004** in `docs/BUG_REPORT.md` with the deployment timestamp and verification result.

## Files Modified
| File | Change |
|------|--------|
| `docs/BUG_REPORT.md` | Add redeployment confirmation note to BUG-004 |

No code changes. One edge function redeployment. One doc update.

