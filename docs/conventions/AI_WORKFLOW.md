# AI-Assisted Development Workflow

**For all contributors using AI assistants (Kiro, Claude, Cursor, etc.)**

This document defines the standard workflow for completing bug fixes and features on MobiRides. Follow this exactly — it ensures no double work, clean history, and up-to-date status tracking.

---

## Before Starting Any Task

1. **Sync with latest develop**
   ```bash
   git checkout develop && git pull origin develop
   ```

2. **Check the status report first**
   Read `docs/Product Status/WEEK_4_MARCH_2026_STATUS_REPORT.md` (or the current week's report) to confirm the task is still open and not already fixed by a colleague.

3. **Check recent commits**
   ```bash
   git log origin/develop --oneline -20
   ```

---

## Task Execution Workflow

### 1. Create a branch off develop
```bash
git checkout -b fix/mob-XXX-short-description
# or
git checkout -b feat/mob-XXX-short-description
```

Branch naming: `fix/` for bugs, `feat/` for features. Always include the ticket number.

### 2. Investigate before writing code
- Read the relevant source files
- Check the DB schema/migrations for the affected tables
- Identify the root cause — don't guess

### 3. Implement the minimal fix
- Write only what's needed to fix the issue
- No refactoring unrelated code
- No adding tests unless explicitly requested
- Run `npx tsc --noEmit` before committing — must pass clean

### 4. Commit
```bash
git add <changed files>
git commit -m "fix(MOB-XXX): short description of what was wrong and what was fixed

Root cause: one sentence.
Fix: one sentence.

Signed-off-by: Your Name"
```

### 5. Push and open a PR to develop
```bash
git push origin fix/mob-XXX-short-description
gh pr create --base develop --head fix/mob-XXX-short-description \
  --title "fix(MOB-XXX): short description" \
  --body "## Problem
...
## Root Cause
...
## Fix
...
## Testing
..."
```

---

## After the Human Merges

**You (the human) merge the PR. The AI never merges.**

Once you've merged, tell the AI. It will then:

### 1. Pull latest develop
```bash
git checkout develop && git pull origin develop
```

### 2. Update the status report in a new branch + PR
```bash
git checkout -b docs/update-status-mob-XXX
# edit status report
git add "docs/Product Status/..."
git commit -m "docs: update status for MOB-XXX merged"
git push origin docs/update-status-mob-XXX
gh pr create --base develop --title "docs: update status for MOB-XXX"
```

You then merge the doc PR too.

### 1. Pull latest develop
```bash
git checkout develop && git pull origin develop
```

### 2. Update the status report
File: `docs/Product Status/WEEK_4_MARCH_2026_STATUS_REPORT.md` (update to current week's file)

Update these sections:
- **Bug Count Rollup table** — change ❌ to ✅ for fixed tickets, update Fixed/Open counts
- **Production Readiness Metrics table** — update the Sprint column (Known Bugs count, readiness %)
- **System Health section** — add a bullet summarising what was fixed and when
- **Commits Confirming Bug Fixes table** — add a row with ticket, PR number, and description

Then commit directly to develop:
```bash
git add "docs/Product Status/WEEK_4_MARCH_2026_STATUS_REPORT.md"
git commit -m "docs: update status for MOB-XXX fix merged [date]

Signed-off-by: Your Name"
git push origin develop
```

---

## Quick Reference — Status Report Fields

| Field | What to update |
|---|---|
| Bug Count Rollup | ❌→✅, update Fixed/Open totals per row and grand total |
| Known Bugs metric | Subtract fixed count from current open number |
| Production Readiness % | +1% per significant fix cluster (payment, handover, etc.) |
| System Health % | +1% when lifecycle/critical path bugs are closed |
| System Health bullets | Add: `- **[Feature] fixed (Mar DD)**: summary. PR #NNN.` |
| Commits table | Add row: `\| MOB-XXX \| PR #NNN \| Description \|` |

---

## Rules

- **Never start a task without pulling latest develop first** — your colleague may have already fixed it
- **Never push directly to develop** — not code, not docs, not anything
- **All changes go through a PR** — create the PR, then wait for a human to merge
- **Humans merge, AI does not** — never use `git push origin HEAD:develop` or any equivalent
- **Always run `tsc --noEmit`** before pushing — broken builds block everyone
- **One PR per ticket** — don't bundle unrelated fixes
- **Update docs after the human merges** — open a separate doc-only PR once the code PR is merged

> **Why:** Direct pushes to develop bypass code review, break the audit trail, and remove the human's ability to control what goes into the main branch. This is non-negotiable regardless of how trivial the change appears.

---

## Example Session (what a full task looks like)

```
1. git checkout develop && git pull origin develop
2. Check status report — confirm MOB-XXX is still open
3. git checkout -b fix/mob-XXX-description
4. Read source files, find root cause
5. Implement fix (minimal)
6. npx tsc --noEmit  ← must pass
7. git commit -m "fix(MOB-XXX): ..."
8. git push + gh pr create --base develop
9. [After merge] git checkout develop && git pull
10. Update status report → git commit → git push origin develop
```
