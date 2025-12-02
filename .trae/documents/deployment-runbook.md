# Deployment Runbook — v2.4.0

- Pre-checks: lint, build, migrations dry-run
- Flags: DYNAMIC_PRICING on, INSURANCE_V2 off initially, SUPERADMIN_ANALYTICS on for admins
- Steps:
  - Merge `feature` branches into `release/v2.4.0`
  - Apply migrations in order
  - Deploy frontend
  - Verify health endpoints and core flows
- Post-deploy: toggle insurance after validation, monitor audit logs

