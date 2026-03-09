# Epic: Global Platform Compliance — Authentication & Legal
**Date:** 2026-03-09  
**Epic ID:** MOB-600  
**Priority:** P0–P2  
**Status:** 🟡 Planned  
**Owner:** Modisa Maphanyane  
**Sprint:** Sprint 7 (Mar 16–22, 2026)

---

## Summary

The MobiRides sign-up flow is missing legal consent checkboxes, standalone legal pages, a password strength meter, and GDPR-compliant cookie consent — all required for a globally compliant peer-to-peer rental platform.

---

## Tickets

### P0 — Blocker (Must ship before go-live)

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-601 | Add Terms of Service checkbox + link to SignUpForm | 🔴 Todo | `src/components/auth/SignUpForm.tsx` |
| MOB-602 | Add Privacy Policy checkbox + link to SignUpForm | 🔴 Todo | `src/components/auth/SignUpForm.tsx` |
| MOB-603 | Add Community Guidelines checkbox + link to SignUpForm | 🔴 Todo | `src/components/auth/SignUpForm.tsx` |
| MOB-604 | Add 18+ age confirmation checkbox to SignUpForm | 🔴 Todo | `src/components/auth/SignUpForm.tsx` |
| MOB-605 | Block signup unless all required consents checked | 🔴 Todo | `src/components/auth/SignUpForm.tsx` |

---

### P1 — High Priority

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-606 | Create `/terms-of-service` public route + page | 🔴 Todo | `src/pages/TermsOfService.tsx`, `src/App.tsx` |
| MOB-607 | Create `/privacy-policy` public route + page | 🔴 Todo | `src/pages/PrivacyPolicy.tsx`, `src/App.tsx` |
| MOB-608 | Create `/community-guidelines` public route + page | 🔴 Todo | `src/pages/CommunityGuidelines.tsx`, `src/App.tsx` |
| MOB-609 | Add PasswordStrengthMeter component to SignUpForm | 🔴 Todo | `src/components/auth/PasswordStrengthMeter.tsx` |
| MOB-610 | Extract SignUpConsents into reusable component | 🔴 Todo | `src/components/auth/SignUpConsents.tsx` |

---

### P2 — Medium Priority

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-611 | Add marketing communications opt-in (optional) | 🔴 Todo | `src/components/auth/SignUpConsents.tsx` |
| MOB-612 | Build GDPR cookie consent banner | 🔴 Todo | `src/components/legal/CookieConsentBanner.tsx` |
| MOB-613 | Add CookieConsentBanner to root layout | 🔴 Todo | `src/App.tsx` |

---

### P3 — Compliance Audit Trail

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-614 | Create `user_consents` DB table with RLS | 🔴 Todo | `supabase/migrations/` |
| MOB-615 | Store consent record on successful signup | 🔴 Todo | `src/components/auth/SignUpForm.tsx`, edge function |

---

## Acceptance Criteria

### MOB-601–605 (SignUpForm Consents)
- [ ] Checkboxes render below password confirm field
- [ ] Terms, Privacy, Community Guidelines links open correct pages in new tab
- [ ] Sign Up button disabled unless all P0 checkboxes are checked
- [ ] Marketing opt-in is unchecked by default
- [ ] Validation error shown if user attempts submit without required consents

### MOB-606–608 (Legal Pages)
- [ ] All 3 routes accessible without authentication
- [ ] Pages render correctly on mobile and desktop
- [ ] Content includes last-updated date and version
- [ ] Pages linked from Footer component

### MOB-609 (Password Strength Meter)
- [ ] Visual bar shows Weak / Medium / Strong states
- [ ] Requirements checklist: 8+ chars, uppercase, number, special char
- [ ] Updates live as user types

### MOB-612–613 (Cookie Consent)
- [ ] Banner appears on first visit (no prior consent stored)
- [ ] "Accept All" and "Manage Preferences" options present
- [ ] Consent stored in localStorage, banner dismissed on revisit

### MOB-614–615 (Consent Audit)
- [ ] `user_consents` table has RLS (users can only read/insert own row)
- [ ] Consent version string stored (e.g. `"v1.0"`)
- [ ] Timestamp recorded at moment of acceptance

---

## Schema: `user_consents` (MOB-614)

```sql
CREATE TABLE public.user_consents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  terms_accepted      BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted    BOOLEAN NOT NULL DEFAULT false,
  community_accepted  BOOLEAN NOT NULL DEFAULT false,
  age_confirmed       BOOLEAN NOT NULL DEFAULT false,
  marketing_opted_in  BOOLEAN NOT NULL DEFAULT false,
  consent_version     TEXT NOT NULL DEFAULT 'v1.0',
  consent_timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address          TEXT,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
```

---

## UX Wireframe (SignUpForm additions)

```
┌─────────────────────────────────────────────┐
│ Full Name                                   │
│ Email                                       │
│ Phone Number (country code + number)        │
│ Password        [████████░░] Strong  ← NEW  │
│   ✓ 8+ chars  ✓ Uppercase  ✗ Number         │
│ Confirm Password                            │
├─────────────────────────────────────────────┤
│ ☑ I confirm I am 18 years or older  ← NEW  │
│ ☑ I agree to the Terms of Service   ← NEW  │
│ ☑ I agree to the Privacy Policy     ← NEW  │
│ ☑ I agree to Community Guidelines   ← NEW  │
│ ☐ Send me updates (optional)        ← NEW  │
├─────────────────────────────────────────────┤
│             [ Sign Up ]                     │
└─────────────────────────────────────────────┘
```

---

## Skipped (Out of Scope)

| Item | Reason |
|------|--------|
| 2FA / MFA | Deferred — not in Sprint 7 scope |
| Accessibility Statement page | P4 — post-launch |
| Email verification banner | Already implemented via Supabase Auth |

---

## Dependencies

- Legal pages (MOB-606–608) must be created **before** consent checkboxes (MOB-601–603) go live so links are not broken
- `user_consents` table (MOB-614) must exist before MOB-615 stores records
- Cookie consent banner (MOB-612) has no blocking dependencies

---

## References

| Document | Path |
|----------|------|
| Privacy Policy source | `docs/PRIVACY_POLICY.md` |
| Feb Week 1 Status Report | `docs/Product Status/WEEK_1_FEBRUARY_2026_STATUS_REPORT.md` |
| Signup Form | `src/components/auth/SignUpForm.tsx` |
| App Router | `src/App.tsx` |
