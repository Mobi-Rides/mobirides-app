

# Update Breach Notification + Add Credential Security Rule to ALL AI/Convention Files

## Context
Remediation #11 from the legal advisor's review requires: "Implemented organizational rule requiring all coding agents to incorporate best practices to prevent service key leakage." This rule must be propagated to every file that governs AI agent or developer behavior.

## Part 1: Update Breach Notification Draft
File: `docs/security/BOTSWANA_DPA_BREACH_NOTIFICATION_DRAFT.md`

All changes from the legal advisor's v2 document (previously detailed), including:
- Entity name change to "Modisa Maphanyane t/a MobiRides"
- New Section 2 (Pre-Breach Safeguards)
- New Section 10 (Risk Assessment Matrix)
- Removal of "Possible Consequences" section
- Renumbering to 12 sections
- Fix duplicate #6, align email to `hello@mobirides.africa`
- Detection time correction (15:00hrs)
- Social media notice replaces website notice

## Part 2: Credential Security Rule

The following rule block will be added to **all** files that govern AI agent or developer behavior:

```text
### Security — Credential Handling (Mandatory)
- NEVER hardcode Supabase service_role keys, anon keys, JWT secrets, or any API credentials in source code, scripts, or configuration files committed to version control.
- ALWAYS use environment variables or secret management services for credentials.
- NEVER create administrative scripts that embed database credentials directly.
- If a task requires service_role access, it must be performed via Supabase Edge Functions with proper authentication guards — never from client-side code.
- Report any discovered hardcoded credentials immediately as a security incident.
```

### Files to Update (11 total)

| # | File | Where to Add |
|---|------|-------------|
| 1 | `_bmad-output/project-context.md` | Under "Critical Implementation Rules" |
| 2 | `.trae/rules/project_rules.md` | Under "Development Rules" / "Code Quality Standards" |
| 3 | `docs/conventions/AI_WORKFLOW.md` | New subsection under "Rules" |
| 4 | `docs/conventions/MIGRATION_PROTOCOL.md` | New section after "Rollback Strategy" |
| 5 | `.kilocode/rules/Signoff commits.md` | Append as additional guideline |
| 6 | `_bmad/bmm/4-implementation/bmad-agent-dev/SKILL.md` | Add to Amelia's Principles |
| 7 | `_bmad/bmm/4-implementation/bmad-agent-quick-flow-solo-dev/SKILL.md` | Add to Barry's Principles |
| 8 | `_bmad/bmm/3-solutioning/bmad-agent-architect/SKILL.md` | Add to Winston's Principles |
| 9 | `_bmad/bmm/4-implementation/bmad-agent-qa/SKILL.md` | Add to Quinn's Principles |
| 10 | `.claude/skills/bmad-agent-dev/SKILL.md` | Mirror of #6 |
| 11 | `.claude/skills/bmad-agent-architect/SKILL.md` | Mirror of #8 |
| 12 | `.claude/skills/bmad-agent-qa/SKILL.md` | Mirror of #9 |
| 13 | `.claude/skills/bmad-agent-quick-flow-solo-dev/SKILL.md` | Mirror of #7 |

## Summary

- 1 file updated (breach notification)
- 13 files receive the credential security rule
- No code changes, no migrations

