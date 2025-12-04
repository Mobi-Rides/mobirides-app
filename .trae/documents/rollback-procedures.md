# Rollback Procedures — v2.4.0

- Snapshot database before applying migrations
- If failure:
  - Revert frontend to previous build
  - Rollback latest migration batch
  - Restore feature flags to previous state
- Validate: run smoke tests, confirm audit logs

