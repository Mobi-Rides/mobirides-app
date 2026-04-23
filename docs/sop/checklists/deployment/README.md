# Deployment Checklists

This folder contains checklists for deployment verification and rollback procedures.

## Available Checklists

| Checklist | Description |
|-----------|-------------|
| [pre-deploy.md](pre-deploy.md) | Pre-deployment verification |
| [post-deploy.md](post-deploy.md) | Post-deployment verification |
| [rollback.md](rollback.md) | Rollback procedure checklist |

## Usage

1. **Pre-Deploy**: Before initiating deployment
2. **Post-Deploy**: After deployment completes
3. **Rollback**: When issues require reverting

## Deployment Workflow

1. Complete pre-deploy checklist
2. Execute deployment
3. Complete post-deploy checklist
4. Monitor for issues

### Rollback Trigger
If issues arise:
1. Assess severity using rollback.md criteria
2. Get approval if needed
3. Execute rollback procedure
4. Verify system recovers

## Related Files

- [vercel.json](../vercel.json) - Vercel deployment config
- [server.js](../server.js) - Server configuration