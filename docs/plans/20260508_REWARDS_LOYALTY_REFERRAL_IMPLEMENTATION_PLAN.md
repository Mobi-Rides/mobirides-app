# Rewards, Loyalty & Referral Program Implementation Plan

**Date:** May 8, 2026  
**Status:** 40% (Infrastructure Ready | UI Pending)  
**Version:** 1.0 (Consolidated)  
**Related Docs:** 
- `dynamic-pricing-plan-2025-10-28.md`
- `LAUNCH_CAMPAIGN_IMPLEMENTATION_PLAN_2025-12-04.md`
- `20260412_USER_STORIES_PRD_INPUTS_V2.0.md`

---

## 1. Executive Summary

This document consolidates the technical specifications for user growth and retention features. It bridges the gap between the established **Promo Code Engine (V1.0)** and the upcoming **Loyalty & Referral Ecosystem (V2.0)**. 

The goal is to drive user acquisition through social referrals and increase lifetime value (LTV) via tiered loyalty benefits, integrated directly into the existing `DynamicPricingService`.

---

## 2. Current Progress & Audit (May 2026)

| Module | Component | Status | Details |
| :--- | :--- | :--- | :--- |
| **Promo Engine** | Database Schema | 🟢 100% | `promo_codes`, `promo_code_usage` live. |
| **Promo Engine** | Service Logic | 🟢 100% | `promoCodeService.ts` handles validation/application. |
| **Promo Engine** | Campaign Seed | 🟢 100% | `FIRST100` code live for Botswana launch. |
| **Loyalty** | Database Schema | 🟡 0% | `user_loyalty_tiers` designed; pending migration. |
| **Loyalty** | Engine Logic | 🟡 50% | `DynamicPricingService` supports tiered multipliers. |
| **Referral** | Database Schema | 🔴 0% | `referrals` table pending. |
| **Referral** | Admin Portal | 🔴 0% | Manual verification UI required. |

---

## 3. Phase 1: Loyalty Program (V2.0 Core)

### 3.1 Database Schema (Pending Migration)
```sql
-- Track user loyalty levels for pricing benefits
CREATE TABLE public.user_loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  total_bookings INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_loyalty_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tier" ON public.user_loyalty_tiers FOR SELECT USING (auth.uid() = user_id);
```

### 3.2 Tier Definition Matrix
| Tier | Criteria (Bookings OR Spend) | Benefit (Fee Multiplier) |
| :--- | :--- | :--- |
| **Bronze** | 0-4 Bookings | 1.00x (Standard) |
| **Silver** | 5-9 Bookings / P2,000 | 0.98x (2% Discount) |
| **Gold** | 10-19 Bookings / P5,000 | 0.95x (5% Discount) |
| **Platinum** | 20+ Bookings / P10,000 | 0.90x (10% Discount) |

---

## 4. Phase 2: Referral Program (Growth)

### 4.1 Referral Flow Logic
1.  **Generation**: Each verified user gets a unique `referral_code` (e.g., `MOBI-USER-123`).
2.  **Activation**: New user enters code during signup or first booking.
3.  **Reward**:
    *   **Referee**: Immediate P50 discount on first rental.
    *   **Referrer**: P50 credit issued **ONLY** after Referee completes their first trip (status = `completed`).
4.  **Verification**: Credits marked as `pending` and require Admin sign-off in the SuperAdmin portal to prevent fraud.

### 4.2 Database Table: `referrals`
```sql
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id),
  referee_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reward_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Implementation Roadmap (Sprint 15+)

### Step 1: Backend Foundations
- [ ] Deploy `user_loyalty_tiers` migration.
- [ ] Implement `update_user_loyalty_tier` trigger on booking completion.
- [ ] Update `DynamicPricingService` to fetch user tier and apply multiplier.

### Step 2: Referral UI & Admin
- [ ] Create `ReferralDashboard.tsx` for users to share codes.
- [ ] Implement `ReferralVerificationTable.tsx` in SuperAdmin portal.
- [ ] Wire credit issuance to the `walletService`.

### Step 3: Polish & UX
- [ ] Add "Loyalty Badge" to user profile headers.
- [ ] Implement push notifications for tier upgrades ("You've reached Gold!").
- [ ] Add referral code input to the `SignUp` and `BookingDialog` components.

---

## 6. Testing & Success Metrics
- **Success Target**: 20% of new signups via referral in first 90 days.
- **Conversion**: Referral code usage vs. standard signup conversion rate.
- **LTV**: Spend difference between Gold/Platinum vs. Bronze users.
