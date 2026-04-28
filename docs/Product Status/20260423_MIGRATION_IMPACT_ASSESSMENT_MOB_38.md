# Migration Impact Assessment: MOB-38
**Migration:** `20260423153500_add_host_linking_to_promo_codes.sql`  
**Date:** 2026-04-23  
**Status:** 🟢 Ready for Review

---

## 1. Executive Summary

**Purpose:** Implementation of host-linked and car-scoped promotional capabilities.  
**Scope:** Schema extension for `promo_codes` and creation of `promo_code_cars` junction table.  
**Status:** Pre-flight verification complete. No conflicts with existing 2025/2026 migrations detected.

---

## 2. Detailed Analysis

### 2.1 Schema Extension: `public.promo_codes`
*   **Change:** Add `host_id UUID` (Nullable, references `public.profiles.id`).
*   **Rationale:** Enables platform-wide vs. host-specific scoping.
*   **Impact:** 🟢 **Low.** Nullable column addition is a non-blocking operation in PostgreSQL 11+. Existing "Platform-wide" codes (where `host_id` is NULL) will continue to function without modification.

### 2.2 New Table: `public.promo_code_cars`
*   **Change:** Creation of a junction table between `promo_codes` and `cars`.
*   **Rationale:** Enables fine-grained scoping to specific individual vehicles.
*   **Impact:** 🟢 **Minimal.** As a new relation, it has zero impact on existing application queries.

### 2.3 Row Level Security (RLS)
*   **Change:** Enable RLS on `promo_code_cars`.
*   **Policies:**
    *   `SELECT`: Open to `authenticated` users (required for the booking flow to validate if a code applies to the current car).
    *   `ALL`: Restricted to `public.admins` role.
*   **Safety Check:** Verified that policy logic does not reference tables with recursive policies. Direct `EXISTS` check on `public.admins` is used per best practices.

---

## 3. Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| **Schema Drift** | 🟢 Low | Migration timestamp follows the latest `remote_schema` reconciliation. |
| **Breaking API Changes** | 🟢 Low | `host_id` is optional; existing logic remains valid. |
| **Performance Degradation** | 🟡 Medium | Added indexes `idx_promo_code_cars_promo_id` and `idx_promo_code_cars_car_id` to ensure $O(1)$ lookups during booking validation. |
| **Locking/Downtime** | 🟢 Low | Metadata-only change on `promo_codes`. No heavy data rewrites required. |

---

## 4. Dependency Verification

*   ✅ **Base Table:** `public.promo_codes` exists (created in 2025).
*   ✅ **Reference Table:** `public.profiles` exists.
*   ✅ **Reference Table:** `public.cars` exists.
*   ✅ **Auth Dependency:** `public.admins` exists (verified in `MIGRATION_INVESTIGATION_RESULTS.md`).

---

## 5. Verification Strategy

### 5.1 Automated Validation
- [ ] `supabase db lint`
- [ ] `supabase db reset --local` (Verifies chronological execution)

### 5.2 Functional Validation
- [ ] Verify creation of a host-linked promo code via SQL.
- [ ] Verify that a host-linked code is **invalid** for a car owned by a different host.
- [ ] Verify that car-scoped codes only apply to the specific vehicle ID.

---

## 6. Conclusion

The migration is compliant with project security and performance SOPs. It is defensive, additive, and maintains backward compatibility for all existing platform-wide promotional campaigns.

**Next Step:** Apply migration to shadow database and update `promoCodeService.ts`.
