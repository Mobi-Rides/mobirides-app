# Rollback Procedure Checklist

Procedures to follow if rollback is needed.

## When to Rollback

### Critical Issues
- [ ] Service down
- [ ] Data corruption
- [ ] Security breach
- [ ] Complete feature failure

### Non-Critical Issues
- [ ] Partial feature failure
- [ ] Performance degradation
- [ ] Non-critical bugs

## Rollback Decision

### Assessment
- [ ] Issue severity confirmed
- [ ] Impact on users assessed
- [ ] Time to fix estimated
- [ ] Rollback time estimated

### Decision Made By
- [ ] Engineering Lead
- [ ] Product Manager
- [ ] Operations

## Rollback Procedures

### Frontend Rollback
- [ ] Revert to previous version
- [ ] Deploy previous build
- [ ] Verify deployment

### API Rollback
- [ ] Revert API version
- [ ] Deploy previous version
- [ ] Verify endpoints

### Database Rollback
- [ ] Run rollback migration
- [ ] Verify schema
- [ ] Restore if needed

### External Services
- [ ] Rollback configurations
- [ ] Verify integrations

## Post-Rollback Verification

### System Health
- [ ] Service responding
- [ ] Database accessible
- [ ] API responding
- [ ] External services working

### Core Functionality
- [ ] User login works
- [ ] Core features work
- [ ] API endpoints respond

## Communication

### Team Notification
- [ ] Engineering notified
- [ ] Product notified
- [ ] Stakeholders notified

### Documentation
- [ ] Incident logged
- [ ] Post-mortem scheduled

## Rollback Summary

| Item | Pre-Rollback | Post-Rollback |
|------|-------------|--------------|
| Version |        |        |
| Time |        |        |
| Issues |        |        |

**Rollback Duration:**

**Root Cause:**

**Next Steps:**