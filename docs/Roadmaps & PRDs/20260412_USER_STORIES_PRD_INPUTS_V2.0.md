# MobiRides Product Requirements Document (PRD) V2.0
**Status**: 86% Production Ready | **Roadmap**: H1 2026 | **Version**: 100% Zero-Loss Sequential Master

---

## 1. Executive Vision & Strategy
MobiRides is a vertically integrated mobility platform serving the Southern African market. Transitioning from a pure-play car-sharing service into a **Two-Product Ecosystem**:
1.  **Car Sharing (Core)**: Peer-to-peer rental with localized identity verification.
2.  **Rent2Buy (Strategic)**: A path-to-ownership model for high-frequency users and fleet partners.

### 🇧🇼 Botswana Market Focus
*   **Omang integration**: Native support for Botswana National ID verification & OCR.
*   **Localized Payments**: Integration with Orange Money, FNB, Standard Bank, and Absa.
*   **i18n**: Support for English and Setswana (Roadmap extension).
*   **Geospatial**: Detailed mapping for Gaborone, Francistown, Maun, and major tourism corridors.

---

## 2. Platform Personas & Journey Matrix

| Persona | Role | Core Need | Key Epic Touchpoints |
| :--- | :--- | :--- | :--- |
| **Renter** | Consumer | Affordable, safe, fast mobility. | 2, 3, 4, 11, 12 |
| **Host** | Asset Owner | High ROI, asset safety, automated payouts. | 2, 4, 14, 16 |
| **Admin** | Operator | Policy enforcement, dispute resolution. | 9, 10, 13, 18 |
| **Partner** | Insurer/Financier | Risk visibility, maintenance auditability. | 11, 16, 17 |
| **Support** | Facilitator | Omni-channel resolution, diagnostic tools. | 5, 8, 13, 18 |

---

## 3. Epic Progress Tracker (Audited H1 2026)

| Epic | Module | Progress | Status Highlights |
| :--- | :--- | :--- | :--- |
| **01** | **Identity & Auth** | 🟢 95% | Omang OCR + MFA Security active. |
| **02** | **Fleet Management** | 🟡 85% | Search latency < 200ms; filters live. |
| **03** | **Booking & Pricing** | 🟡 90% | **Dynamic Pricing: Destination rules live.** |
| **04** | **Handover Ops** | 🟢 100% | **8-Step Interactive Session verified.** |
| **05** | **Communications** | 🟢 100% | MOB-712 Email Restoration complete. |
| **06** | **Reputation** | 🟡 85% | Bidirectional feedback stabilized. |
| **07** | **Financial/Wallet** | 🟡 80% | DPO/Paygate/Ooze integration ready. |
| **08** | **Notifications** | 🟢 100% | Push + SMS Fallback active. |
| **09** | **Admin Dashboard** | 🟢 100% | BUG-007 Table Standardization complete. |
| **10** | **Trust & KYC** | 🟢 95% | 3-step simplified verification. |
| **11** | **Insurance (SLA)** | 🟢 100% | **Pay-U SLA v1.1 Alignment confirmed.** |
| **12** | **Maps/Location** | 🟢 100% | **Navigation Module + Traffic restored.** |
| **13** | **Help/Support** | 🟢 100% | First 100% Complete Epic (MOB-300). |
| **14** | **Host Earnings** | 🟡 85% | Automated withdrawal logic live. |
| **15** | **Native Mobile** | 🔴 45% | Capacitor scaffolded; Build pipeline pending. |
| **16** | **Rent2Buy** | ⚪ 10% | Strategic Q2 Pilot specs drafted. |
| **17** | **Partner Portal** | ⚪ 0% | Planned Q2: Insurer/Financier UI. |
| **18** | **Compliance** | 🟢 100% | GDPR Soft-delete (MOB-110) complete. |
| **19** | **Rewards & Loyalty**| 🟡 40% | Pricing logic live; Referral UI pending. |
| **20** | **Host Subscriptions**| ⚪ 10% | Fleet/Roadside specs defined. |

---

## 4. Exhaustive Feature Specifications (Zero-Loss Sequential)

### 🔐 EPIC 1: USER AUTHENTICATION & ONBOARDING
**User Stories:**
- **As a new user**, I want to register with my email/password and complete a profile with personal details.
- **As a user**, I want to upload a profile picture and set host/renter role preferences.
- **As a user**, I want to seamlessly switch roles and **edit my profile** (name, contact, location).
- **As a registered user**, I want to **change my password** for account security.
**Acceptance Criteria:**
- **Verification**: Email code required; Password strength (8+ chars, mixed case, numbers).
- **MFA**: Optional 2FA; mandatory for high-balance hosts (>P5000).

### 🚗 EPIC 2: CAR FLEET MANAGEMENT
**User Stories:**
- **As a host**, I want to list my vehicle with 5+ photos, features, and ownership (Blue Book) documents.
- **As a host**, I want to set a daily price and define pickup zones (Host location or Custom).
- **As a host**, I want to mark cars as "Unavailable" temporarily and set **Availability Preferences**.
- **As a renter**, I want to search and filter cars, view detailed listings, and **save cars to a Wishlist**.
- **As a renter**, I want to **contact car owners directly** to ask questions before booking.
**Acceptance Criteria:**
- **Validation**: Minimum 5 photos; description >100 characters.
- **Map Discovery**: Real-time Mapbox clustering; automated availability conflict detection.

### 📅 EPIC 3: BOOKING SYSTEM & DYNAMIC PRICING
**User Stories:**
- **As a renter**, I want to book a car, see the total cost breakdown, and receive immediate confirmation.
- **As a renter**, I want to **cancel my booking** or **modify pickup details** (subject to policy).
- **As a host**, I want to accept/decline booking requests and set **Dynamic Pricing** based on risk.
- **As both parties**, I want a **Modification Workflow** to extend rentals or update parameters.
**Acceptance Criteria:**
- **Multipliers**: 1.5x Cross-border; 1.2x Peak.
- **Rules**: Cancellation refund logic based on "Stay-at-Home" vs "In-Progress" status.

### 🤝 EPIC 4: VEHICLE HANDOVER OPS (8-STEP PROTOCOL)
**Operational Verification Steps:**
1.  **Location Check**: GPS match within pickup zone.
2.  **Head-Out/Arrival**: Mutual signaling of arrival status.
3.  **Identity Verify**: QR code or photo match of Renter's ID.
4.  **External Inspection**: 4 Mandatory high-res photos (Front, Back, L, R).
5.  **Damage Log**: Pin damage locations on digital diagram.
6.  **Conditions**: Log fuel (%) and odometer reading.
7.  **Key Exchange**: Renter confirms physical receipt.
8.  **Sign-off**: Digital signature captured (legally valid).

### 💬 EPIC 5: OMNICHANNEL MESSAGING
**User Stories:**
- **As a user**, I want real-time chat with photo attachments, "Read" receipts, and message search.
- **As a user**, I want to **block or report** problematic interactions.
**Acceptance Criteria:**
- **Encryption**: Messages encrypted at rest; delivery <100ms via Supabase Realtime.

### ⭐ EPIC 6: REPUTATION & REVIEWS
**User Stories:**
- **As a renter/host**, I want to leave bidirectional ratings/reviews across multiple categories.
- **As a host**, I want to **respond to reviews** publicly to address concerns.
**Acceptance Criteria:**
- **Rules**: Reviews only published once both parties submit; 500-character limit.

### 💰 EPIC 7: WALLET & PAYMENTS
**User Stories:**
- **As a user**, I want to top up my wallet via **Orange Money** or Local Bank EFT (FNB/Absa).
- **As a host**, I want to set up **Weekly Automated Payouts** and see transparent fee deductions.
**Acceptance Criteria:**
- **Gateways**: DPO/Paygate/Ooze active; Triple-entry ledger for 100% auditability.

### 🔔 EPIC 8: NOTIFICATION SERVICES
**User Stories:**
- **As a user**, I want to set notification preferences for Push, Email, and SMS alerts.
**Acceptance Criteria:**
- **Omnichannel**: Redundant delivery (Push -> Email -> SMS fallback).

### 👨‍💼 EPIC 09: ADMIN MANAGEMENT
**User Stories:**
- **As an Admin**, I want to manage KYC applications and handle user disputes.
- **As a SuperAdmin**, I want to **manage other admin accounts** and **override system decisions**.
**Acceptance Criteria:**
- **Standardization**: BUG-007 compliant table controls; export to CSV (unlimited).

### ✅ EPIC 10: TRUST & KYC (VERIFICATION)
**User Stories:**
- **As a user**, I want to verify density (Omang OCR, Driving License, Address, Selfie).
- **As a user**, I want **re-verification prompts** when my documents are nearing expiry.
**Acceptance Criteria:**
- **Accuracy**: OCR parity for Botswana National ID formatting.

### 🛡️ EPIC 11: INSURANCE & PROTECTION (SLA v1.1)
**User Stories:**
- **As a renter**, I want to choose between Basic, Standard, and Premium protection.
**Acceptance Criteria:**
- **Plans**: P80 / P150 / P250 daily rates aligned with Pay-U SLA v1.1.

### 🗺️ EPIC 12: NAVIGATION & MAPS (NAVIGATION MODULE)
**User Stories:**
- **As a renter**, I want **turn-by-turn directions**, real-time traffic, and live location sharing.
- **As a renter**, I want to save frequent locations and see "Near Me" results.
- **As a host**, I want to track arrival status and see geofencing alerts.
**Acceptance Criteria:**
- **Integration**: Deep links for **Google Maps, Waze, and Apple Maps**.
- **Offline**: Cached routing for low-connectivity regions.

### 🆘 EPIC 13: HELP & SUPPORT OPS
**User Stories:**
- **As a user**, I want access to a comprehensive Help Center (FAQs, Guides) and direct support chat.
**Acceptance Criteria:**
- **MOB-300**: 100% completion of support logic and guide management.

### 📈 EPIC 14: HOST MANAGEMENT & EARNINGS
**User Stories:**
- **As a host**, I want to see detailed ROI charts and automated earnings calculations.
**Acceptance Criteria:**
- **Automation**: Earnings moved to "Available" immediately upon Handover-Return.

### 📱 EPIC 15: NATIVE MOBILE (UI/UX)
**User Stories:**
- **As a user**, I want a high-performance experience on iOS and Android via a native build.
**Acceptance Criteria:**
- **Capacitor**: Cross-platform bridging for camera/GPS/Push access.

### 🚀 EPIC 16: RENT2BUY SYSTEM
**User Stories:**
- **As a Host**, I want to list a car for Rent2Buy; **As a Financier**, I want to audit payer health.
**Acceptance Criteria:**
- **Path-to-Ownership**: Automated lease contract generation.

### 🤝 EPIC 17: PARTNER PORTAL
**User Stories:**
- **As a Partner (Insurer/Mechanic)**, I want a dedicated portal to view claim photos and service logs.
**Acceptance Criteria:**
- **Visibility**: Segregated read-only access to relevant rental conditions.

### 🔒 EPIC 18: COMPLIANCE & SECURITY
**User Stories:**
- **As a user**, I want to report security concerns and know my data is protected by RLS and GDPR.
- **As an Admin**, I want to manually review pending referral credits to prevent "bonus farming" fraud.
**Acceptance Criteria:**
- **Protection**: **Fraud detection algorithms**; **Malware scanning** for file uploads; SQL scrubbers.
- **Manual Audit**: Referral payouts held in "Pending" status until Admin sign-off (ref: Epic 19).

### 🏆 EPIC 19: REWARDS, LOYALTY & REFERRALS
**User Stories:**
- **As a Renter**, I want to earn loyalty points and reach tiers (Bronze, Gold, Platinum) for lower service fees.
- **As a user**, I want to **refer a friend** via a unique code and earn credits.
- **As a repeat Renter**, I want an automated discount on my **5th booking**.
**Acceptance Criteria:**
- **Loyalty Rule**: Integration with `DynamicPricingService` rules (Tier-based multipliers).
- **Referral Logic**: Manual Admin verification required before credit issuance.
- **5th Booking**: 10% auto-credit applied to the 5th verified rental completion.

### 💼 EPIC 20: HOST PREMIUM SERVICES & SUBSCRIPTIONS
**User Stories:**
- **As a Host**, I want to subscribe to **Fleet Management** tools to monitor multiple vehicles.
- **As a Host**, I want real-time **GPS Tracking** and Geofence alerts for my assets.
- **As a Host**, I want **Roadside Assistance** and **Maintenance Scheduling** tools via a premium subscription.
- **As an Admin**, I want to **configure subscription pricing** for various "Pro Host" tiers in the portal.
**Acceptance Criteria:**
- **Admin Configuration**: Portal UI for managing monthly/per-vehicle subscription fees.
- **Tracking**: Mapbox integration for live GPS breadcrumbs (Epic 12).
- **Emergency**: Roadside assistance 1-click dispatch via Partner Portal (Epic 17).

---

## 5. Success Metrics & Success Targets (Comprehensive)
1. **User Acquisition**: 500+ registrations/month; >60% 30-day retention; >7/10 NPS.
2. **Operations**: >90% Verification completion; >85% Host acceptance; <15% Cancellation.
3. **Conversion**: >25% Booking conversion (Search to Confirmed).
4. **Performance**: >98% Payment success; >95% Handover completion; <3.0s Load Time.
5. **Growth**: Monthly Recurring Revenue (MRR) and ARPU growth trajectory tracking.

---
**Revision History**
- v1.0: Legacy Draft (Archived)
- v2.6: 2026-04-13 **Definitive Zero-Loss Master**
- v2.7: 2026-04-13 **Strategic Growth Expansion (20 Epics)**
