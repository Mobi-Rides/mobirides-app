# MobiRides Damage Protection Module

> **Version**: 1.0.0  
> **Date**: 2026-03-05  
> **Classification**: Mixed (sections marked individually)  
> **Owner**: MobiRides Product & Engineering  
> **Last Updated By**: Engineering Team

---

## Audience Matrix

| Section | Partners | Support | Investors | Engineers | Marketing |
|---------|:--------:|:-------:|:---------:|:---------:|:---------:|
| 1. Executive Summary | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2. Product Overview | ✅ | ✅ | ✅ | — | ✅ |
| 3. Coverage Tiers & Pricing | ✅ | ✅ | ✅ | ✅ | ✅ |
| 4. Business & Financial Model | ✅ (NDA) | — | ✅ | — | — |
| 5. Claims Process | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6. Risk Assessment & Underwriting | ✅ (NDA) | — | — | ✅ | — |
| 7. Technical Architecture | — | — | — | ✅ | — |
| 8. User Experience Flows | — | ✅ | ✅ | ✅ | ✅ |
| 9. Admin Operations | — | ✅ | — | ✅ | — |
| 10. Notifications & Communication | — | ✅ | — | ✅ | — |
| 11. Compliance & Terms | ✅ | ✅ | ✅ | ✅ | — |
| 12. Current Status & Known Gaps | — | — | ✅ | ✅ | — |
| 13. Roadmap | ✅ | — | ✅ | ✅ | ✅ |
| 14. Document References | — | — | — | ✅ | — |
| 15. Appendix | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend**: ✅ = Relevant | — = Not applicable | (NDA) = Requires partner NDA

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Coverage Tiers & Pricing](#3-coverage-tiers--pricing)
4. [Business & Financial Model](#4-business--financial-model)
5. [Claims Process](#5-claims-process)
6. [Risk Assessment & Underwriting](#6-risk-assessment--underwriting)
7. [Technical Architecture](#7-technical-architecture)
8. [User Experience Flows](#8-user-experience-flows)
9. [Admin Operations](#9-admin-operations)
10. [Notifications & Communication](#10-notifications--communication)
11. [Compliance & Terms](#11-compliance--terms)
12. [Current Status & Known Gaps](#12-current-status--known-gaps)
13. [Roadmap](#13-roadmap)
14. [Document References](#14-document-references)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

**Classification**: 🟢 Public

**Damage Protection** is MobiRides' integrated rental-period insurance product that protects hosts against vehicle damage and loss caused by renters. It is a core trust layer enabling peer-to-peer car sharing in Botswana.

### Key Facts

| Attribute | Detail |
|-----------|--------|
| **Product Name** | Damage Protection (branded; "insurance" used internally) |
| **Underwriting Partner** | Pay-U |
| **Revenue Split** | 90% Pay-U / 10% MobiRides commission |
| **Coverage Scope** | Botswana P2P car rentals via MobiRides platform |
| **Coverage Tiers** | 4 (No Coverage, Basic, Standard, Premium) |
| **International Coverage Cap** | $2,000,000 USD |
| **Premium Currency** | BWP (Botswana Pula) |
| **Premium Basis** | Percentage of daily rental rate × rental days × risk multiplier |
| **Claim Reporting Window** | 24 hours from incident |
| **Auto-Approval Threshold** | Claims < P500 |

### How It Works (30-Second Overview)

1. **Renter selects** a Damage Protection tier during booking checkout
2. **Premium is calculated** based on daily rental rate, tier percentage, and risk profile
3. **Policy certificate** (PDF) is auto-generated upon booking confirmation
4. **If an incident occurs**, the renter submits a claim via the app with evidence
5. **Claims are reviewed** by MobiRides admin (or auto-approved if < P500)
6. **Approved payouts** are credited to the renter's wallet; excess is collected from renter
7. **Premiums are remitted** to Pay-U in batches (90/10 split)

---

## 2. Product Overview

**Classification**: 🟢 Public

### What Is Damage Protection?

Damage Protection is rental-period coverage that shields car owners (hosts) from financial loss when their vehicle is damaged, stolen, or vandalized during a MobiRides rental. Unlike traditional rental car insurance sold by agencies, Damage Protection is:

- **Embedded**: Selected during the booking flow, not purchased separately
- **Proportional**: Priced as a percentage of the rental cost, not a flat fee
- **Risk-Adjusted**: Premiums factor in driver verification status, vehicle value, and claims history
- **Platform-Managed**: Claims are filed, tracked, and resolved entirely within MobiRides

### Why It Exists

Peer-to-peer car sharing requires a trust mechanism between strangers. Damage Protection:

- **Reduces host anxiety** about listing vehicles, increasing supply
- **Increases renter confidence** to book higher-value vehicles
- **Generates platform revenue** via the 10% commission on premiums
- **Creates competitive differentiation** vs informal rental arrangements

### Competitive Positioning

| Feature | MobiRides Damage Protection | Traditional Rental Insurance | Informal Arrangements |
|---------|:--:|:--:|:--:|
| Embedded in booking flow | ✅ | ❌ | ❌ |
| Risk-adjusted pricing | ✅ | ❌ | ❌ |
| In-app claims | ✅ | ❌ | ❌ |
| Auto-generated policy docs | ✅ | ✅ | ❌ |
| Professional underwriter | ✅ | ✅ | ❌ |
| P2P-optimized | ✅ | ❌ | ❌ |

### Target Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Attach rate | 30%+ | % of bookings with Damage Protection |
| Average premium per booking | P300–P600 | Based on Standard/Premium tiers |
| Monthly premium revenue | P15,000–P25,000 | At scale with 100+ monthly bookings |
| Claim approval rate | 70–80% | Excluding fraudulent/invalid claims |

---

## 3. Coverage Tiers & Pricing

**Classification**: 🟢 Public

### Tier Comparison

| Tier | Premium % | Coverage Cap | Excess (Deductible) | Minor Damage | Major Incidents |
|------|:---------:|:------------:|:-------------------:|:------------:|:---------------:|
| **No Coverage** | 0% | — | — | ❌ | ❌ |
| **Basic** | 10% | P15,000 | P300 | ✅ | ❌ |
| **Standard** | 15% | P50,000 | P1,000 | ✅ | ✅ |
| **Premium** | 20% | P50,000 | P500 (reduced) | ✅ | ✅ |

### What's Covered

**Minor Damage** (Basic, Standard, Premium):
- Windscreen/window damage
- Tyre damage or blowout
- Minor body scratches and dents
- Side mirror damage

**Major Incidents** (Standard, Premium only):
- Collision damage
- Theft of vehicle
- Vandalism
- Fire damage
- Weather/natural disaster damage
- Total loss

### Key Exclusions (All Tiers)

- Damage from illegal activities or unauthorized drivers
- Mechanical/engine failure (pre-existing)
- Wear and tear
- Personal belongings inside the vehicle
- Driving under the influence
- Use outside of Botswana without prior approval

### Premium Calculation Formula

```
Premium = Daily Rental Rate × Premium Percentage × Risk Multiplier × Number of Days
```

**Variables**:
- `Daily Rental Rate`: Car's listed price per day (BWP)
- `Premium Percentage`: Tier rate stored as decimal (0.10, 0.15, 0.20)
- `Risk Multiplier`: 1.0 (low), 1.2 (medium), 1.5 (high), 10.0 (prohibited/declined)
- `Number of Days`: Rental duration (minimum 1 day)

### Worked Examples

#### Example 1: P500/day car, 7-day rental, Standard tier, low risk

| Component | Calculation | Amount |
|-----------|-------------|--------|
| Daily rental | — | P500.00 |
| Premium % | 15% | 0.15 |
| Risk multiplier | Low risk | 1.0 |
| Days | — | 7 |
| **Premium per day** | P500 × 0.15 × 1.0 | **P75.00** |
| **Total premium** | P75.00 × 7 | **P525.00** |

#### Example 2: P1,000/day car, 3-day rental, Premium tier, medium risk

| Component | Calculation | Amount |
|-----------|-------------|--------|
| Daily rental | — | P1,000.00 |
| Premium % | 20% | 0.20 |
| Risk multiplier | Medium risk (unverified driver) | 1.2 |
| Days | — | 3 |
| **Premium per day** | P1,000 × 0.20 × 1.2 | **P240.00** |
| **Total premium** | P240.00 × 3 | **P720.00** |

---

## 4. Business & Financial Model

**Classification**: 🔴 Internal Only / Partner NDA Required

### Revenue Flow

```
Renter pays booking total (rental + damage protection premium)
         │
         ▼
   MobiRides Business Account (custodial)
         │
         ├── 85% rental amount ──► Host Wallet (ledger entry)
         ├── 15% rental amount ──► MobiRides Commission
         │
         └── Premium amount:
              ├── 90% ──► Pay-U (underwriter) via batch remittance
              └── 10% ──► MobiRides Insurance Commission
```

### Commission Configuration

The commission split is stored in the `insurance_commission_rates` database table, allowing rate adjustments without code changes:

| Field | Description |
|-------|-------------|
| `rate` | Current commission rate (decimal, e.g., 0.10 for 10%) |
| `effective_from` | Date the rate takes effect |
| `effective_until` | End date (null = current rate) |
| `min_premium_amount` | Minimum premium before commission applies |
| `max_commission_amount` | Cap on commission per policy |

### Remittance to Pay-U

Premiums owed to Pay-U are tracked in the `premium_remittance_batches` table:

1. **Accumulation**: As policies are created, their 90% Pay-U share accumulates
2. **Batch Creation**: Admin creates a remittance batch (weekly/monthly)
3. **Manual Transfer**: Funds are transferred to Pay-U via bank transfer
4. **Confirmation**: Batch is marked as remitted with reference number

> **Note**: Pay-U API integration for automated remittance is planned for Q2 2026. Current process is manual.

### Revenue Projections

| Scenario | Monthly Bookings | Attach Rate | Avg Premium | Monthly Premium Revenue | MobiRides Commission (10%) |
|----------|:----------------:|:-----------:|:-----------:|:-----------------------:|:--------------------------:|
| Conservative | 80 | 25% | P350 | P7,000 | P700 |
| Target | 150 | 30% | P450 | P20,250 | P2,025 |
| Optimistic | 250 | 40% | P550 | P55,000 | P5,500 |

### Revenue Per Booking Contribution

Damage Protection premium commission is one component of the P168.75 average revenue per booking target (see [GTM Plan](./20260206_MobiRides_Commercialization_GTM_Plan.md)).

---

## 5. Claims Process

**Classification**: 🟢 Public (extractable for support agents)

### End-to-End Claim Lifecycle

```
Incident Occurs
     │
     ▼
Renter Reports (within 24 hours)
     │
     ▼
Claim Submitted (status: submitted)
     │  ├── Auto-approval if < P500
     │  └── Manual review otherwise
     ▼
Under Review (status: under_review)
     │
     ├──► More Info Needed ──► Renter Responds ──► Back to Review
     │
     ├──► Approved (status: approved)
     │       │
     │       ├── Excess collected from renter
     │       ├── Payout credited to renter wallet
     │       └── Status: paid
     │
     └──► Rejected (status: rejected)
             └── Rejection reason provided
```

### Claim Types

| Type | Description | Police Report Required |
|------|-------------|:----------------------:|
| `collision` | Vehicle collision with another object/vehicle | ✅ |
| `theft` | Vehicle stolen during rental period | ✅ |
| `vandalism` | Intentional damage by third party | ✅ |
| `fire` | Fire damage | ✅ |
| `weather` | Storm, hail, flood damage | ❌ |
| `windscreen` | Windscreen/window crack or break | ❌ |
| `tyre` | Tyre blowout or damage | ❌ |

### Evidence Requirements

| Document | Required | Notes |
|----------|:--------:|-------|
| Incident photos | ✅ | Multiple angles of damage |
| Written description | ✅ | What happened, when, where |
| Repair quotes | Recommended | From certified repair shops |
| Police report number | For major incidents | Collision, theft, vandalism, fire |
| Police station name | For major incidents | Where report was filed |

### Claim Payout Calculation

```
Approved Amount = MIN(Estimated Damage Cost, Coverage Cap)
Excess Paid = Tier Excess Amount (P300/P500/P1,000)
Admin Fee = P150 (fixed)
Payout Amount = Approved Amount − Excess
Renter Pays = Excess + Admin Fee
Total Claim Cost = Payout Amount + Admin Fee
```

#### Payout Example

| Item | Value |
|------|-------|
| Estimated damage | P8,000 |
| Coverage cap (Standard) | P50,000 |
| Approved amount | P8,000 |
| Excess (Standard) | P1,000 |
| Admin fee | P150 |
| **Insurance pays** | **P7,000** |
| **Renter pays** | **P1,150** |

### Service Level Agreements

| SLA | Target |
|-----|--------|
| Claim reporting window | 24 hours from incident |
| Initial review | < 48 hours from submission |
| "More Info" response deadline | 7 days |
| Payout processing | < 24 hours from approval |
| Auto-approval (< P500) | Immediate |

### Excess Payment

- Renter pays excess via the platform's Excess Payment Modal
- Payment methods: card (via DPO/Paygate) or mobile money (OrangeMoney)
- Excess payment is recorded on the claim record (`excess_paid`, `excess_payment_date`)

### Repair Management

MobiRides coordinates repairs — hosts do not arrange their own. This ensures:
- Consistent quality and pricing
- Evidence chain integrity for underwriter
- Prevention of inflated repair claims

---

## 6. Risk Assessment & Underwriting

**Classification**: 🟡 Partner NDA Required

### Risk Scoring Model

The `UnderwriterService` assesses risk for each renter-car combination using a points-based model:

| Factor | Condition | Points Added | Notes |
|--------|-----------|:------------:|-------|
| Base score | All rentals | +20 | Starting point |
| Unverified driver | Profile not verified (KYC incomplete) | +30 | Biggest modifiable risk factor |
| High-value vehicle | Car price > P1,500/day | +20 | Luxury/premium vehicles |
| Rejected claims history | Any previously rejected claims | +40 per claim | Fraud/pattern indicator |

### Risk Tiers

| Score Range | Tier | Premium Load | Effect |
|:-----------:|:----:|:------------:|--------|
| 0–29 | Low | 1.0× | Standard pricing |
| 30–49 | Medium | 1.2× | 20% premium surcharge |
| 50–79 | High | 1.5× | 50% premium surcharge |
| 80–100 | Prohibited | Declined | Coverage unavailable (10× pricing as deterrent) |

### Default Risk Assessment

When profile or car data is unavailable, the system defaults to **medium risk** (score 40, load 1.2×) to prevent coverage denial due to data issues while maintaining prudent pricing.

### Future Enhancements (Planned)

- Driver age factor (requires `date_of_birth` field)
- Rental history factor (completed rentals without incidents)
- Vehicle age/mileage factor
- Geographic risk zones within Botswana
- Real-time telematics integration

---

## 7. Technical Architecture

**Classification**: 🔴 Internal Only (Engineers)

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│                                                      │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ InsurancePackage  │  │ ClaimsSubmissionForm    │  │
│  │ Selector          │  │ UserClaimsList          │  │
│  │ InsuranceCompar.  │  │ ClaimResponseDialog     │  │
│  │ PolicyDetailsCard │  │ ExcessPaymentModal      │  │
│  │ PolicyDocuments   │  │ AdminClaimsDashboard    │  │
│  │ View              │  │ AdminRemittanceDashboard│  │
│  └──────┬───────────┘  └──────────┬──────────────┘  │
│         │                         │                  │
└─────────┼─────────────────────────┼──────────────────┘
          │                         │
          ▼                         ▼
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│                                                      │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ InsuranceService  │  │ UnderwriterService      │  │
│  │ (738 lines)       │  │ (risk assessment)       │  │
│  └──────┬───────────┘  └─────────────────────────┘  │
│         │                                            │
│  ┌──────┴───────────┐  ┌─────────────────────────┐  │
│  │ walletService     │  │ insuranceNotification   │  │
│  │ (payout credit)   │  │ Service                 │  │
│  └──────────────────┘  └─────────────────────────┘  │
└─────────┬───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                  Supabase Backend                    │
│                                                      │
│  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ Database Tables   │  │ Edge Functions           │  │
│  │                   │  │                          │  │
│  │ insurance_packages│  │ calculate-insurance      │  │
│  │ insurance_policies│  │ (premium calculation)    │  │
│  │ insurance_claims  │  │                          │  │
│  │ insurance_claim_  │  └─────────────────────────┘  │
│  │   activities      │                               │
│  │ insurance_commis- │  ┌─────────────────────────┐  │
│  │   sion_rates      │  │ Storage Buckets          │  │
│  │ premium_remit-    │  │                          │  │
│  │   tance_batches   │  │ insurance-policies (PDF) │  │
│  └──────────────────┘  │ insurance-claims (photos) │  │
│                         └─────────────────────────┘  │
│  ┌──────────────────┐                                │
│  │ pg_cron Jobs      │                               │
│  │ expire-policies   │                               │
│  └──────────────────┘                                │
└─────────────────────────────────────────────────────┘
```

### Database Schema

#### `insurance_packages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Internal name (no_coverage, basic, standard, premium) |
| `display_name` | TEXT | User-facing name |
| `description` | TEXT | Tier description |
| `premium_percentage` | DECIMAL | Rate as decimal (0.10, 0.15, 0.20) |
| `coverage_cap` | DECIMAL | Maximum payout (BWP) |
| `excess_amount` | DECIMAL | Deductible (BWP) |
| `covers_minor_damage` | BOOLEAN | Minor damage coverage flag |
| `covers_major_incidents` | BOOLEAN | Major incident coverage flag |
| `features` | TEXT[] | List of covered items |
| `exclusions` | TEXT[] | List of exclusions |
| `is_active` | BOOLEAN | Tier availability |
| `sort_order` | INTEGER | Display ordering |

#### `insurance_policies`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `policy_number` | TEXT | Format: `INS-YYYY-XXXXXX` |
| `booking_id` | UUID | FK → bookings |
| `package_id` | UUID | FK → insurance_packages |
| `renter_id` | UUID | FK → auth.users |
| `car_id` | UUID | FK → cars |
| `start_date` / `end_date` | TIMESTAMPTZ | Coverage period |
| `rental_amount_per_day` | DECIMAL | Base rental rate |
| `premium_per_day` | DECIMAL | Calculated daily premium |
| `number_of_days` | INTEGER | Rental duration |
| `total_premium` | DECIMAL | Total premium paid |
| `coverage_cap` | DECIMAL | Snapshot of tier cap |
| `excess_amount` | DECIMAL | Snapshot of tier excess |
| `status` | TEXT | active, expired, cancelled, claimed |
| `terms_accepted_at` | TIMESTAMPTZ | T&C acceptance timestamp |
| `terms_version` | TEXT | T&C version (e.g., v1.0-2025-11) |
| `policy_document_url` | TEXT | URL to generated PDF |

#### `insurance_claims`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `claim_number` | TEXT | Format: `CLM-YYYY-XXXXX` |
| `policy_id` | UUID | FK → insurance_policies |
| `booking_id` | UUID | FK → bookings |
| `renter_id` | UUID | FK → auth.users |
| `incident_date` | TIMESTAMPTZ | When the incident occurred |
| `incident_type` | TEXT | collision, theft, vandalism, etc. |
| `incident_description` | TEXT | What happened |
| `damage_description` | TEXT | Damage details |
| `location` | TEXT | Where it happened |
| `police_report_filed` | BOOLEAN | Whether police were notified |
| `police_report_number` | TEXT | Police reference number |
| `police_station` | TEXT | Reporting station |
| `estimated_damage_cost` | DECIMAL | Renter's estimate |
| `actual_damage_cost` | DECIMAL | Assessed cost |
| `status` | TEXT | submitted, under_review, more_info_needed, approved, rejected, paid, closed |
| `approved_amount` | DECIMAL | Amount approved for payout |
| `excess_paid` | DECIMAL | Excess collected from renter |
| `excess_amount_due` | DECIMAL | Excess owed |
| `admin_fee` | DECIMAL | Processing fee (P150) |
| `payout_amount` | DECIMAL | Net payout to wallet |
| `total_claim_cost` | DECIMAL | Total insurance cost |
| `rejection_reason` | TEXT | Why claim was rejected |
| `evidence_urls` | TEXT[] | Uploaded photo/document URLs |
| `repair_quotes_urls` | TEXT[] | Repair estimate documents |
| `repair_invoices_urls` | TEXT[] | Final repair invoices |
| `reviewed_by` | UUID | Admin who reviewed |

#### `insurance_claim_activities`

Audit trail for all claim actions:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `claim_id` | UUID | FK → insurance_claims |
| `activity_type` | TEXT | submitted, reviewed, approved, rejected, paid, etc. |
| `description` | TEXT | Human-readable action description |
| `performed_by` | UUID | User/admin who performed the action |
| `metadata` | JSONB | Additional context (amounts, file counts, etc.) |

#### `insurance_commission_rates`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `rate` | DECIMAL | Commission rate (e.g., 0.10) |
| `effective_from` / `effective_until` | TIMESTAMPTZ | Rate validity window |
| `min_premium_amount` | DECIMAL | Minimum premium for commission |
| `max_commission_amount` | DECIMAL | Commission cap per policy |

#### `premium_remittance_batches`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `batch_date` | DATE | Remittance date |
| `total_amount` | DECIMAL | Total premiums in batch |
| `commission_amount` | DECIMAL | MobiRides share |
| `remittance_amount` | DECIMAL | Pay-U share |
| `status` | TEXT | pending, remitted, confirmed |
| `payment_reference` | TEXT | Bank transfer reference |

### Key Services

| Service | File | Responsibility |
|---------|------|----------------|
| `InsuranceService` | `src/services/insuranceService.ts` | Core CRUD, premium calculation, policy creation, claim submission, payout processing |
| `UnderwriterService` | `src/services/underwriterService.ts` | Risk assessment and premium load calculation |
| `insuranceNotificationService` | `src/services/wallet/insuranceNotificationService.ts` | Email notifications for claims and policies |
| `walletService` | `src/services/walletService.ts` | Wallet credits for claim payouts |
| `pdfGenerator` | `src/utils/pdfGenerator.ts` | Policy certificate PDF generation (jsPDF + autotable) |

### Edge Function: `calculate-insurance`

**Endpoint**: `POST /calculate-insurance`

Validates inputs and returns premium calculation:

```json
// Request
{ "dailyRentalAmount": 500, "premiumPercentage": 0.15, "numberOfDays": 7 }

// Response
{ "premiumPerDay": 75.00, "totalPremium": 525.00, "numberOfDays": 7, "dailyRentalAmount": 500, "premiumPercentage": 0.15 }
```

### Storage Buckets

| Bucket | Access | Contents |
|--------|--------|----------|
| `insurance-policies` | Public | Auto-generated policy PDF certificates |
| `insurance-claims` | Private | Claim evidence photos and documents |

### Automation

| Job | Mechanism | Schedule | Function |
|-----|-----------|----------|----------|
| Policy expiration | pg_cron | Hourly | `expire_insurance_policies()` |
| Small claims auto-approval | Application logic | On submission | Claims < P500 auto-approved |

---

## 8. User Experience Flows

**Classification**: 🟢 Public

### Booking Flow (Package Selection)

1. Renter selects car and dates → proceeds to booking checkout
2. **InsurancePackageSelector** displays all active tiers with calculated premiums
3. **InsuranceComparison** modal available for side-by-side tier comparison
4. Renter selects a tier (or "No Coverage")
5. Premium is added to booking total
6. On booking confirmation → policy is created automatically
7. Policy PDF is generated and stored; download link shown in booking details

### Claims Submission Flow

1. Renter navigates to their policy or booking details
2. Clicks "File a Claim" → **ClaimsSubmissionForm** opens
3. Multi-step form collects:
   - Incident type and date/time
   - Location of incident
   - Description of what happened
   - Damage description
   - Police report details (if applicable)
   - Evidence upload (photos, documents)
   - Estimated damage cost
4. Claim is submitted → confirmation shown with claim number

### Claims Tracking

- **UserClaimsList**: Shows all claims with status badges
- **ClaimResponseDialog**: When admin requests more info, renter can respond with additional details and documents
- **ExcessPaymentModal**: When claim is approved, renter pays excess via card/mobile money

### Policy Management

- **PolicyDocumentsView** (`/insurance-policies` page): Lists all policies with download links
- **PolicyDetailsCard**: Shows coverage details, status, and claim eligibility

---

## 9. Admin Operations

**Classification**: 🟡 Internal Only

### Claims Management (AdminClaimsDashboard)

Admins can:
- View all claims with filtering by status
- Review claim details and evidence
- Approve claims (sets approved amount, triggers payout)
- Reject claims (with reason)
- Request more information from renter
- Add admin notes to claims
- Process financial payouts (credits renter wallet)

### Remittance Management (AdminRemittanceDashboard)

Admins can:
- View pending premium amounts awaiting remittance to Pay-U
- Create remittance batches (groups policies for payment)
- Record Pay-U payment reference numbers
- Track batch status (pending → remitted → confirmed)

### Policy Automation

- **Expiration**: pg_cron job runs hourly to expire policies past their `end_date`
- **Auto-Approval**: Claims under P500 are automatically approved by the system without admin intervention

---

## 10. Notifications & Communication

**Classification**: 🟡 Internal Only

### Notification Matrix

| Event | Renter Email | Renter In-App | Host Email | Host In-App |
|-------|:------------:|:-------------:|:----------:|:-----------:|
| Policy created | ✅ | ✅ | — | — |
| Claim submitted | ✅ | ✅ | ✅ | ✅ |
| Claim under review | ✅ | ✅ | — | — |
| More info needed | ✅ | ✅ | — | — |
| Claim approved | ✅ | ✅ | ✅ | ✅ |
| Claim rejected | ✅ | ✅ | — | — |
| Payout processed | ✅ | ✅ | — | — |

### Host Notifications

When a claim is filed on their vehicle, the host receives:
- Email notification with claim number and incident type
- In-app notification linking to claim details
- Host is informed but does **not** manage the claim (MobiRides handles)

---

## 11. Compliance & Terms

**Classification**: 🟢 Public

### Terms & Conditions

Policy terms are versioned and timestamped at acceptance:

| Field | Description |
|-------|-------------|
| `terms_version` | Version identifier (e.g., `v1.0-2025-11`) |
| `terms_accepted_at` | ISO timestamp of acceptance |

### Key Terms (from Policy PDF)

1. Policy valid only for the specified rental duration
2. Renter responsible for excess amount for any claim
3. Police report required for all major incidents (theft, collision, etc.)
4. Coverage void if vehicle used for illegal activities or by unauthorized drivers
5. Claims must be reported within 24 hours of incident via MobiRides app

### Regulatory Considerations

- Botswana insurance regulations compliance (liaison with Pay-U as licensed underwriter)
- Data protection compliance for personal information in claims
- Evidence retention policies aligned with [Privacy Policy](./PRIVACY_POLICY.md)

### Data Retention

| Data Type | Retention Period | Storage |
|-----------|-----------------|---------|
| Policy records | Indefinite | Supabase DB |
| Policy PDFs | Indefinite | Supabase Storage |
| Claim records | Indefinite | Supabase DB |
| Claim evidence | 2 years after resolution | Supabase Storage |
| Claim activity logs | Indefinite | Supabase DB |

---

## 12. Current Status & Known Gaps

**Classification**: 🟡 Internal Only

### Implementation Status

| Area | Status | Notes |
|------|:------:|-------|
| Insurance packages (DB + seed) | ✅ Complete | 4 tiers seeded |
| Premium calculation | ✅ Complete | Service + Edge Function |
| Policy creation & PDF | ✅ Complete | Auto-generated on booking |
| Package selector UI | ✅ Complete | Integrated in booking flow |
| Claims submission form | ✅ Complete | Multi-step with evidence upload |
| User claims list | ✅ Complete | Status tracking |
| Admin claims dashboard | ✅ Complete | Review/approve/reject |
| Claim payout to wallet | ✅ Complete | Wallet integration |
| Risk assessment | ✅ Complete | UnderwriterService |
| Notification system | ✅ Complete | Email + in-app |
| Excess payment modal | ⚠️ Built | Untested in production |
| Admin remittance dashboard | ⚠️ Built | Manual process, no Pay-U API |
| Policy documents page | ⚠️ Partial | UI gaps per Week 4 report |
| Insurance comparison modal | ⚠️ Partial | Needs UX polish |
| Overall UI completion | ~56% | Per Week 4 February 2026 report |

### Known Gaps & Issues

1. **Premium percentages**: Database currently seeded with original values (0.25, 0.50, 1.00) — need migration to calibrated values (0.10, 0.15, 0.20)
2. **Pay-U API integration**: Manual remittance; no automated API calls
3. **Excess payment**: Modal built but payment flow untested end-to-end
4. **UI dark mode issues**: `VerificationRequiredDialog.tsx` has hardcoded `bg-gray-50` affecting contrast (tracked in [UI Display Issues](./UI_DISPLAY_ISSUES_2026-02-02.md), [Hotfix MOB-121](./hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md))
5. **Notification type mismatch**: Host claim notifications use `booking_request_received` type as workaround (see `insuranceService.ts` line 673)
6. **Missing date_of_birth**: Cannot implement driver age risk factor without profile schema update

---

## 13. Roadmap

**Classification**: 🟢 Public

| Timeline | Initiative | Priority |
|----------|-----------|:--------:|
| **Q1 2026** | Complete UI gaps and production testing | 🔴 High |
| **Q1 2026** | Migrate premium percentages to calibrated values (10/15/20%) | 🔴 High |
| **Q1 2026** | End-to-end excess payment testing | 🟡 Medium |
| **Q2 2026** | Automated Pay-U API remittance | 🟡 Medium |
| **Q2 2026** | Claims analytics dashboard (approval rates, processing times) | 🟡 Medium |
| **Q2 2026** | Driver age risk factor (requires profile schema update) | 🟢 Low |
| **Q3 2026** | Additional underwriter partnerships | 🟢 Low |
| **Q3 2026** | Rental history risk factor | 🟢 Low |
| **Q4 2026** | Telematics integration for real-time risk | 🟢 Low |

---

## 14. Document References

| Document | Path | Relevance |
|----------|------|-----------|
| Insurance Technical README | [`docs/INSURANCE_README.md`](./INSURANCE_README.md) | Technical implementation guide, API reference, deployment steps |
| Insurance Integration Plan v2.0 | [`docs/insurance-integration-plan-2025-11-12.md`](./insurance-integration-plan-2025-11-12.md) | Original implementation plan (1,984 lines) |
| Insurance Integration Plan v1.0 | [`docs/insurance-integration-plan-2025-10-28.md`](./insurance-integration-plan-2025-10-28.md) | Initial planning document |
| Payment Integration | [`docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md`](./PAYMENT_INTEGRATION_IMPLEMENTATION.md) | Section 14: Pay-U partnership model, remittance, premium split |
| GTM Plan | [`docs/20260206_MobiRides_Commercialization_GTM_Plan.md`](./20260206_MobiRides_Commercialization_GTM_Plan.md) | Revenue model, Pay-U partnership context |
| Valuation Framework | [`docs/MobiRides_Valuation_Framework_06-02-2026.md`](./MobiRides_Valuation_Framework_06-02-2026.md) | Insurance revenue in company valuation |
| Privacy Policy | [`docs/PRIVACY_POLICY.md`](./PRIVACY_POLICY.md) | Data handling for claims and policies |
| Product Roadmap | [`docs/ROADMAP.md`](./ROADMAP.md) | Phase 3 insurance roadmap |
| Nov-Dec 2025 Roadmap | [`docs/ROADMAP-NOV-DEC-2025.md`](./ROADMAP-NOV-DEC-2025.md) | Original insurance epic scope (Epics 1.4, 1.6) |
| UI Display Issues | [`docs/UI_DISPLAY_ISSUES_2026-02-02.md`](./UI_DISPLAY_ISSUES_2026-02-02.md) | Display issues in insurance UI components |
| Admin Portal Hotfix | [`docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md`](./hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md) | Active UI fixes affecting insurance components (MOB-118 to MOB-126) |
| Testing Coverage | [`docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md`](./testing/TESTING_COVERAGE_STATUS_2026_03_02.md) | Insurance test coverage status |
| Week 4 Feb 2026 Status | [`docs/Product Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md`](./Product%20Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md) | Latest status metrics (56% UI completion) |

---

## 15. Appendix

### A. Premium Calculation Quick Reference

| Daily Rate | Days | Basic (10%) | Standard (15%) | Premium (20%) |
|:----------:|:----:|:-----------:|:--------------:|:-------------:|
| P300 | 1 | P30 | P45 | P60 |
| P300 | 3 | P90 | P135 | P180 |
| P300 | 7 | P210 | P315 | P420 |
| P500 | 1 | P50 | P75 | P100 |
| P500 | 3 | P150 | P225 | P300 |
| P500 | 7 | P350 | P525 | P700 |
| P1,000 | 1 | P100 | P150 | P200 |
| P1,000 | 3 | P300 | P450 | P600 |
| P1,000 | 7 | P700 | P1,050 | P1,400 |

> **Note**: Premiums above assume low-risk (1.0× multiplier). Medium risk adds 20%, high risk adds 50%.

### B. Glossary

| Term | Definition |
|------|------------|
| **Attach Rate** | Percentage of bookings that include Damage Protection |
| **Coverage Cap** | Maximum amount payable per claim under a tier |
| **Excess (Deductible)** | Amount the renter must pay before insurance covers the rest |
| **Premium** | The cost of Damage Protection, paid by the renter |
| **Premium Load** | Risk-based multiplier applied to the base premium |
| **Remittance Batch** | A grouped payment of accumulated premiums sent to Pay-U |
| **Risk Score** | 0–100 score assessing renter-car risk combination |
| **Underwriter** | The licensed insurance company (Pay-U) bearing the financial risk |
| **Admin Fee** | Fixed P150 processing fee charged per claim |
| **Policy Certificate** | Auto-generated PDF documenting coverage terms |

### C. Support Agent Quick Reference Card

> **Extractable**: This section can be shared with support agents independently.

**When a customer asks about Damage Protection:**

1. **"What does it cover?"** → See [Section 3: Coverage Tiers](#3-coverage-tiers--pricing)
2. **"How much does it cost?"** → Premium = rental rate × tier % × days. Use the [Quick Reference table](#a-premium-calculation-quick-reference)
3. **"How do I file a claim?"** → In-app: go to your booking → "File a Claim". Must be within 24 hours of incident
4. **"What do I need to file a claim?"** → Photos of damage, written description, police report (for major incidents), repair quote (recommended)
5. **"How long does a claim take?"** → Initial review < 48 hours. Small claims (< P500) are auto-approved
6. **"What is the excess?"** → Basic: P300, Standard: P1,000, Premium: P500
7. **"Where does the payout go?"** → Credited to your MobiRides wallet
8. **"Can I cancel my protection?"** → No, it's tied to the booking. Choose "No Coverage" if not needed
9. **"Who is the underwriter?"** → Pay-U, a licensed insurance provider

### D. File Inventory

```
src/
├── components/insurance/
│   ├── AdminClaimsDashboard.tsx      # Admin claim review UI
│   ├── AdminRemittanceDashboard.tsx   # Premium remittance management
│   ├── ClaimResponseDialog.tsx        # Renter response to "more info needed"
│   ├── ClaimsSubmissionForm.tsx        # Multi-step claim form
│   ├── ExcessPaymentModal.tsx         # Excess payment collection
│   ├── InsuranceComparison.tsx        # Side-by-side tier comparison
│   ├── InsurancePackageSelector.tsx   # Booking flow tier selection
│   ├── PolicyDetailsCard.tsx          # Policy information display
│   ├── PolicyDocumentsView.tsx        # Policy list with PDF downloads
│   └── UserClaimsList.tsx             # User's claim history
├── services/
│   ├── insuranceService.ts            # Core insurance logic (738 lines)
│   ├── underwriterService.ts          # Risk assessment (117 lines)
│   └── wallet/
│       └── insuranceNotificationService.ts  # Email notifications
├── types/
│   └── insurance-schema.ts            # TypeScript interfaces
├── utils/
│   └── pdfGenerator.ts                # Policy PDF generation
├── pages/
│   └── InsurancePoliciesPage.tsx       # /insurance-policies route
supabase/
├── functions/
│   └── calculate-insurance/index.ts   # Premium calculation Edge Function
└── migrations/
    ├── 20251201140903_create_insurance_tables.sql
    ├── 20251224000000_implement_insurance_schema.sql
    └── 20251224010000_insurance_expiration_job.sql
```

---

**Document End**

> **Last Updated**: 2026-03-05  
> **Version**: 1.0.0  
> **Next Review**: 2026-04-05
