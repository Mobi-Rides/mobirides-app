# Epic: Global Platform Compliance — Authentication & Legal
**Date:** 2026-03-09  
**Epic ID:** MOB-600  
**Priority:** P0–P2  
**Status:** ✅ P0/P1 Complete, P2 Complete, P3 Todo  
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
| MOB-601 | Add Terms of Service checkbox + link to SignUpForm | ✅ Done | `src/components/auth/SignUpConsents.tsx` |
| MOB-602 | Add Privacy Policy checkbox + link to SignUpForm | ✅ Done | `src/components/auth/SignUpConsents.tsx` |
| MOB-603 | Add Community Guidelines checkbox + link to SignUpForm | ✅ Done | `src/components/auth/SignUpConsents.tsx` |
| MOB-604 | Add 18+ age confirmation checkbox to SignUpForm | ✅ Done | `src/components/auth/SignUpConsents.tsx` |
| MOB-605 | Block signup unless all required consents checked | ✅ Done | `src/components/auth/SignUpForm.tsx` |

---

### P1 — High Priority

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-606 | Create `/terms-of-service` public route + page | ✅ Done | `src/pages/TermsOfService.tsx`, `src/App.tsx` |
| MOB-607 | Create `/privacy-policy` public route + page | ✅ Done | `src/pages/PrivacyPolicy.tsx`, `src/App.tsx` |
| MOB-608 | Create `/community-guidelines` public route + page | ✅ Done | `src/pages/CommunityGuidelines.tsx`, `src/App.tsx` |
| MOB-609 | Add PasswordStrengthMeter component to SignUpForm | ✅ Done | `src/components/auth/PasswordStrengthMeter.tsx` |
| MOB-610 | Extract SignUpConsents into reusable component | ✅ Done | `src/components/auth/SignUpConsents.tsx` |

---

### P2 — Medium Priority

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-611 | Add marketing communications opt-in (optional) | ✅ Done | `src/components/auth/SignUpConsents.tsx` |
| MOB-612 | Build GDPR cookie consent banner | ✅ Done | `src/components/legal/CookieConsentBanner.tsx` |
| MOB-613 | Add CookieConsentBanner to root layout | ✅ Done | `src/App.tsx` |

---

### P3 — Compliance Audit Trail

| Ticket | Title | Status | File(s) |
|--------|-------|--------|---------|
| MOB-614 | Create `user_consents` DB table with RLS | 🔴 Todo | `supabase/migrations/` |
| MOB-615 | Store consent record on successful signup | 🔴 Todo | `src/components/auth/SignUpForm.tsx`, edge function |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/auth/SignUpForm.tsx` | Added consents state, password meter, consent validation |
| `src/components/auth/SignUpConsents.tsx` | New — reusable consent checkboxes component |
| `src/components/auth/PasswordStrengthMeter.tsx` | New — visual password strength indicator |
| `src/components/legal/CookieConsentBanner.tsx` | New — GDPR cookie consent with localStorage |
| `src/pages/TermsOfService.tsx` | New — public Terms of Service page |
| `src/pages/PrivacyPolicy.tsx` | New — public Privacy Policy page |
| `src/pages/CommunityGuidelines.tsx` | New — public Community Guidelines page |
| `src/App.tsx` | Added 3 legal routes + CookieConsentBanner |
