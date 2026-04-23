# Bug Investigation Checklist

Systematic approach for investigating and fixing bugs.

## Initial Triage

### Bug Report Review
- [ ] Read bug description fully
- [ ] Note affected user flow
- [ ] Identify environment (dev/staging/prod)
- [ ] Check browser/device if relevant
- [ ] Note error messages logged

### Reproduce the Bug
- [ ] Local environment setup
- [ ] Reproduce steps documented
- [ ] Can reproduce consistently?
- [ ] Frequency: Always/Sometimes/Rare

## Investigation

### Gather Information
- [ ] Check console logs
- [ ] Check server logs
- [ ] Review database state
- [ ] Check API responses
- [ ] Review recent changes (git)

### Root Cause Analysis
- [ ] Identify the failing component
- [ ] Trace data flow
- [ ] Check related code
- [ ] Verify edge cases
- [ ] Determine root cause

### Fix Strategy
- [ ] Propose solution
- [ ] Consider side effects
- [ ] Plan test cases
- [ ] Review similar code

## Implementation

### Fix Development
- [ ] Write failing test
- [ ] Implement fix
- [ ] Verify test passes
- [ ] Check related functionality

### Verification
- [ ] Test the exact scenario
- [ ] Test edge cases
- [ ] Test related flows
- [ ] Run full test suite

## Documentation

### Fix Details
- [ ] Document root cause
- [ ] Document fix approach
- [ ] Add test coverage
- [ ] Update documentation

## Bug Report Summary

| Field | Value |
|-------|-------|
| Bug ID |        |
| Priority |       |
| Status |        |
| Assignee |       |

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Root Cause:**


**Fix Applied:**