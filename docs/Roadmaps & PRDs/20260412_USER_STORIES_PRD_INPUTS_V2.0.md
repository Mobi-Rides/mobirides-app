# MobiRides Product Requirements Document (PRD) V2.0
**Status**: 86% Production Ready | **Roadmap**: H1 2026 | **Authority**: Consolidated Audit April 12, 2026

---

## 1. Executive Vision
MobiRides is a vertically integrated mobility platform serving the Southern African market. Transitioning from a pure-play car-sharing service into a **Two-Product Ecosystem**:
1.  **Car Sharing (Core)**: Peer-to-peer rental with localized identity verification.
2.  **Rent2Buy (Strategic)**: A path-to-ownership model for high-frequency users and fleet partners.

### 🎯 H1 2026 Success Metrics
- **Commercial Readiness**: 100% completion of P1/P2 epics (Handover, Payments, Security).
- **Revenue Target**: P1.368M ARR (projected from 8% market share).
- **User Trust**: < 3-step KYC verification with 99.9% uptime on identity vault services.

---

## 2. Platform Personas & Journey Matrix
We move beyond feature lists to **Journey-Driven Requirements**.

| Persona | Role | Core Need | Key Epic Touchpoints |
| :--- | :--- | :--- | :--- |
| **Renter** | Consumer | Affordable, safe, fast mobility. | 2, 3, 4, 11, 12 |
| **Host** | Asset Owner | High ROI, asset safety, automated payouts. | 2, 4, 14, 16 |
| **Admin** | Operator | Policy enforcement, dispute resolution. | 9, 10, 13, 18 |
| **Partner** | Insurer/Financier | Risk visibility, maintenance auditability. | 11, 16, 17 |
| **Support** | Facilitator | Omni-channel resolution, diagnostic tools. | 5, 13, 18 |

---

## 3. Epic Progress Tracker (H1 2026 Audit)

| Epic | Module | Progress | Status Highlights |
| :--- | :--- | :--- | :--- |
| **01** | **Identity & Auth** | 🟢 95% | Omang OCR + MFA Security active. |
| **02** | **Fleet Management** | 🟡 85% | Search latency < 200ms; filters live. |
| **03** | **Booking & Pricing** | 🟡 90% | **Dynamic Pricing: Destination rules live.** |
| **04** | **Handover Ops** | 🟢 100% | **8-Step Interactive Session verified.** |
| **05** | **Communications** | 🟢 100% | MOB-712 Email Restoration complete. |
| **06** | **Reputation** | 🟡 85% | Bidirectional feedback stabilized. |
| **07** | **Financial/Wallet** | 🟡 80% | DPO/Paygate sandbox active. |
| **08** | **Notifications** | 🟢 100% | Push + SMS Fallback active. |
| **09** | **Admin Dashboard** | 🟢 100% | BUG-007 Table Standardization complete. |
| **10** | **Trust & KYC** | 🟢 95% | 3-step simplified verification. |
| **11** | **Insurance (SLA)** | 🟢 100% | **Pay-U SLA v1.1 Alignment confirmed.** |
| **12** | **Maps/Location** | 🟢 100% | Mapbox routing + crash hardening done. |
| **13** | **Help/Support** | 🟢 100% | First 100% Complete Epic (MOB-300). |
| **14** | **Host Earnings** | 🟡 85% | Automated withdrawal logic live. |
| **15** | **Native Mobile** | 🔴 45% | Capacitor scaffolded; Build pipeline pending. |
| **16** | **Rent2Buy** | ⚪ 10% | Strategic Q2 Pilot specs drafted. |
| **17** | **Partner Portal** | ⚪ 0% | Planned Q2: Insurer interfaces. |
| **18** | **Compliance** | 🟢 100% | GDPR Soft-delete (MOB-110) complete. |

---

## 4. Pillar Specifications (Phase 1 Refinement)

### Epic 03: Booking & Dynamic Pricing (Realignment)
**Acceptance Criteria:**
- **Variable Pricing**: Pricing must adjust based on **Destination Risk** (e.g., Cross-border vs. Local).
- **Time-Based Surges**: Logic must support Q2 implementation of peak-hour multipliers.
- **Reservation Window**: Minimum 2-hour lead time for "Instant Book" unless Host-disabled.

### Epic 04: Handover & Lifecycle (Source of Truth)
*Consolidated from 14-step legacy draft to 8-step production reality.*
**The 8-Step Interactive Protocol:**
1.  **Location Check**: Geofence verification of pickup point.
2.  **Head-Out**: Host marks "Ready", Renter marks "Departed".
3.  **Arrival**: Mutual confirmation of presence.
4.  **Identity Verify**: Live face-to-photo verification.
5.  **External Inspection**: 4-quadrant photo upload.
6.  **Damage Log**: Pin-to-part reporting logic.
7.  **Key Exchange**: Digital signature of receipt.
8.  **Completion**: Rental session officially begins in `ACTIVE` state.

### Epic 11: Insurance & Damage Protection
**SLA Baseline (Pay-U v1.1):**
- **Basic**: P80/day (P5,000 Excess).
- **Standard**: P150/day (P2,500 Excess).
- **Premium**: P250/day (Zero Excess).
- **Claim Logic**: Claims must be filed within 12 hours of "Return Handover" completion.

### Epic 16: Rent2Buy Marketplace (New Strategic Pillar)
**Core Concept:**
- Transition high-trust renters into car owners via a **Lease-to-Own** agreement.
- **Financier Integration**: Direct hook for Motshelo/Financier partners to view "Payment Health" before approval.
- **Host Role**: Passive income shifts to "Asset Disposal" with higher monthly margins.

---

## 5. Security & Commercial Compliance
- **Authentication**: MFA required for Withdrawals and Personal Detail changes.
- **Data Privacy**: GDPR-compliant soft-deletion required for PII (Personally Identifiable Information).
- **Audit Logs**: Every admin action (e.g., manual KYC approval) must be immutable.

---
**Document Revision History**
- v1.0: Legacy Draft (Archived)
- v2.0: 2026-04-12 Modernization (Current)
