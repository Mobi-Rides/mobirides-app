# Code Review Checklist

Comprehensive checklist for reviewing code changes and pull requests.

## Before Review

### PR Information
- [ ] Read the PR description
- [ ] Understand the context/background
- [ ] Check linked issues/tickets
- [ ] Review related tests

### Local Setup
- [ ] Pull latest changes
- [ ] Checkout PR branch
- [ ] Install dependencies
- [ ] Run linting
- [ ] Run tests locally

## During Review

### Code Quality
- [ ] Check for syntax errors
- [ ] Verify proper error handling
- [ ] Ensure type safety (TypeScript)
- [ ] Check naming conventions
- [ ] Review comment quality

### Security
- [ ] No hardcoded secrets/keys
- [ ] Proper input validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Authentication checks

### Performance
- [ ] No unnecessary re-renders (React)
- [ ] Efficient database queries
- [ ] Proper use of indices
- [ ] Lazy loading where appropriate

### Testing
- [ ] Unit tests present
- [ ] Integration tests present
- [ ] Edge cases covered
- [ ] Test naming clear

### Documentation
- [ ] Functions properly documented
- [ ] Complex logic explained
- [ ] API contracts clear
- [ ] Breaking changes noted

## After Review

### Feedback
- [ ] Provide constructive feedback
- [ ] Suggest improvements
- [ ] Approve if ready OR
- [ ] Request changes with specifics

### Approval Checklist
- [ ] Code meets standards
- [ ] Tests pass
- [ ] Security review complete
- [ ] Documentation adequate

## Review Comments

| Line | Comment | Status |
|-----|---------|--------|
|     |         |        |
|     |         |        |