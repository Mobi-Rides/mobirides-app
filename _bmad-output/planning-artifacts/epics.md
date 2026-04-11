---
stepsCompleted: ['validate_prerequisites']
inputDocuments: 
  - '📚 USER STORIES PRD INPUTS.md'
  - 'user_verification_flow_revision_technical_architecture.md'
  - 'handover_technical_architecture.md'
  - 'rls-security-architecture-overhaul-2025-10-30.md'
  - 'WEEK_1_APRIL_2026_STATUS_REPORT.md'
  - 'SPRINT_10_APRIL_2026_JIRA_EXECUTION_PLAN.md'
  - 'mobile-navigation-back-button-design.md'
status: 'in_progress'
---

# mobirides-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for mobirides-app, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User registration with email/password and profile management.
FR2: Profile picture upload and availability preference setting.
FR3: Role switching between Host and Renter without data loss.
FR4: Botswana Identity Verification (Omang OCR + Selfie matching).
FR5: Driving license and proof of address verification.
FR6: Vehicle ownership and insurance document validation for hosts.
FR7: Admin review interface for KYC approval/rejection.
FR8: Vehicle listing with multi-photo support (min 5), location, and availability.
FR9: Advanced car search with filters (type, transmission, price, location).
FR10: Booking system with upfront cost transparency and pickup coordination.
FR11: Booking modification and extension workflows with mutual approval.
FR12: Digital Wallet with top-up, withdrawal, and transaction history.
FR13: Integration with Botswana payments (Orange Money, local banks).
FR14: Real-time messaging with WebSocket support and photo sharing.
FR15: Multi-channel notifications (In-app, Push, Email, SMS).
FR16: 9-step mandatory vehicle handover process (identity, inspection, fuel, mileage, keys, signatures, photos).
FR17: GPS-verified handover location tracking.
FR18: Bidirectional rating system (Host rates Renter, Renter rates Host and Car).
FR19: Mapbox integration for Botswana-specific mapping and real-time tracking.
FR20: Admin Dashboard for platform metrics and user management.
FR21: Super-admin audit logging and role-based access control.
FR22: Fixed-tier Damage Protection (P80/P150/P250 daily rates) with %-based excess (20/15/10%).
FR23: Automated P150 admin fee deduction for all approved insurance claims.

### NonFunctional Requirements

NFR1: Mandatory email verification before account activation.
NFR2: Password complexity enforcement (8+ chars, mixed case, numbers).
NFR3: Real-time data synchronization for messaging and handover.
NFR4: Automated 15% commission calculation and deduction.
NFR5: Robust Row Level Security (RLS) on all database tables.
NFR6: Data encryption at rest and in transit.
NFR7: Botswana market localization (Setswana language, local mapping).
NFR8: Performance optimization: Page load times < 3 seconds.
NFR9: WCAG 2.1 AA accessibility compliance.
NFR10: PWA support for mobile users with limited connectivity.
NFR11: Strict TypeScript implementation (zero 'any' types).

### Additional Requirements

AD1: Maintenance of Dual-runtime support (Deno/Node).
AD2: Target Android API Level 34 for Capacitor builds.
AD3: Resolution of BUG-003 regarding Supabase function overloads.
AD4: Security hardening: implementation of MOB-701–706 remediation series.
AD5: Compliance implementation: Anonymize-on-Delete (MOB-110).
AD6: Dynamic business logic: Migration of constants to `platform_settings` table.

### UX Design Requirements

UX-DR1: Mobile-optimized navigation with back-button design.
UX-DR2: Focus management in sequential handover steps for screen readers.
UX-DR3: Sun-glare contrast optimization (minimum 7:1 ratio for outdoor use).
UX-DR4: Progressive profile completion indicator.

### FR Coverage Map

## Epic 1: User Identity & Trusted Access

Users can securely register, verify their Botswana National ID (Omang) or Passport, and manage their unique roles (Host/Renter).

### Story 1.1: Standard Email/Password Registration

As a new user,
I want to register with my email and a secure password,
So that I can access the platform and begin browsing vehicles.

**Acceptance Criteria:**

**Given** a guest user on the registration page
**When** the user provides a valid email and a strong password (8+ chars, mixed case, numbers)
**Then** the system creates a pending user record in Supabase Auth
**And** sends a mandatory verification email
**And** the user cannot access profile or messaging features until the email is verified.

### Story 1.2: Basic Profile & Wishlist Access

As a registered user,
I want to complete my basic profile and save vehicles to a wishlist,
So that I can personalize my experience and track cars I'm interested in before verification.

**Acceptance Criteria:**

**Given** an email-verified user
**When** the user provides their full name, phone number, and profile picture
**Then** the system updates their profile in the `profiles` table
**And** displays a "Verification Required" banner for advanced features
**And** the user can add/remove vehicles from their `wishlists` table (SELECT/INSERT access).

### Story 1.3: Role Selection & Hosting Preference

As a registered user,
I want to choose whether I am a Host, Renter, or both,
So that the UI displays relevant features for my current needs.

**Acceptance Criteria:**

**Given** a logged-in user
**When** the user selects a role in their profile settings
**Then** the system updates the `user_roles` in the database
**And** switches the UI context to show the "Host Dashboard" or "Renter Marketplace"
**And** the user can switch roles instantly without data loss.

### Story 1.4: Multi-Document Identity Verification (Omang/Passport)

As a user wanting to book or host a car,
I want to verify my identity using my Botswana Omang card or Passport with OCR extraction,
So that I can build trust and access the full platform functionality.

**Acceptance Criteria:**

**Given** a user attempting to "Request Booking" or "List Vehicle"
**When** the user selects "Omang" or "Passport" and uploads the corresponding photo
**Then** the system triggers a Supabase Edge Function to extract ID/Passport number, Names, and Expiry
**And** pre-fills the verification form for user confirmation
**And** requires a "Liveness Check" selfie to match the document photo
**And** sets the user's `kyc_status` to `pending_verification` on success.

### Story 1.5: Driving License & Physical Address OCR

As a renter,
I want to upload my driving license and proof of address with automated data extraction,
So that I can quickly prove my legal eligibility to operate a vehicle.

**Acceptance Criteria:**

**Given** a user in the KYC verification flow
**When** the user uploads their Driving License photo
**Then** the system OCRs the license number, class (e.g., Class B), and expiry date
**And** validates the license class against the vehicle type being rented
**And** documents the proof of address in the `user_verifications` table
**And** notifies the user once the official `verified` status is granted.

### Story 1.6: Admin KYC Management Interface

As a platform admin,
I want to review, approve, or reject user verification submissions,
So that I can maintain the security and integrity of the marketplace.

**Acceptance Criteria:**

**Given** a verified admin user in the portal
**When** the admin views a list of `pending` verification requests
**Then** they can inspect the uploaded documents (Omang/Passport, DL, Address)
**And** click "Approve" (setting `kyc_status = verified`) or "Reject" (triggering a mandatory reason code)
**And** the system notifies the user of the decision immediately.

FR6: Epic 2 - Vehicle ownership and insurance validation.
FR7: Epic 1 - Admin KYC review.
FR8: Epic 2 - Vehicle listing and price setting.
FR9: Epic 2 - Search and advanced filters.
FR10: Epic 3 - Booking reservation and cost transparency.
FR11: Epic 3 - Booking modification and extensions.
FR12: Epic 4 - Digital wallet and history.
FR13: Epic 4 - Botswana payment methods integration.
FR14: Epic 5 - Real-time messaging and photo sharing.
FR15: Epic 5 - Multi-channel notifications.
FR16: Epic 6 - 9-step mandatory handover process.
FR17: Epic 6 - GPS handover verification.
FR18: Epic 7 - Bidirectional review/rating system.
FR19: Epic 2 - Mapbox integration for mapping.
FR20: Epic 8 - Admin Dashboard and metrics.
FR21: Epic 9 - Audit logs and super-admin access.

## Epic List

### Epic 1: User Identity & Trusted Access
Users can securely register, verify their Botswana National ID (Omang), and manage their unique roles (Host/Renter).
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR7

### Epic 2: Vehicle Showcase & Marketplace
Hosts can list vehicles with verified documentation, and Renters can discover cars using advanced Botswana-specific location filters.
**FRs covered:** FR6, FR8, FR9, FR19

### Epic 3: Reservation & Booking Lifecycle
Renters can reserve vehicles with full cost transparency, while both parties manage the booking pipeline from request to confirmation.
**FRs covered:** FR10, FR11

### Epic 4: Financial Transactions & Wallet
Users manage their balance and pay for bookings via integrated local Botswana methods (Orange Money, local banks), including the latest fixed-tier insurance premiums.
**FRs covered:** FR12, FR13, FR22

### Epic 5: Real-time Communication & Coordination
Enables secure, real-time messaging, photo sharing, and multi-channel notifications (Push/SMS/Email) between users.
**FRs covered:** FR14, FR15

### Epic 6: Physical Vehicle Handover (The 9-Step Process)
A structured, mandatory 9-step exchange process with GPS verification and digital signatures ensures safe vehicle handovers.
**FRs covered:** FR16, FR17

### Epic 7: Community Trust & Ratings
A bidirectional rating and review system builds reliable reputations for both Hosts and Renters.
**FRs covered:** FR18

### Epic 8: Platform Oversight & Administration
Comprehensive dashboards for Admins to monitor platform health, approve KYC, and manage the car inventory.
**FRs covered:** FR20

### Epic 9: Advanced Security & Audit
Super-admins have full accountability through audit logs, and the platform is hardened against fraud with RLS and encryption.
**FRs covered:** FR21

### Epic 10: Infrastructure Stability & Maintenance
Maintaining the high-performing dual-runtime foundation (Deno/Node), resolving schema bugs, and migrating insurance logic to the new Pay-U SLA (P80/P150/P250).
**FRs covered:** AD1, AD2, AD3, AD6, FR22, FR23

### Epic 11: PWA & Mobile UX Optimization
Optimizing the experience for the Botswana mobile market with high-contrast UI, offline support, and touch-optimized navigation.
**FRs covered:** NFR9, NFR10

---

Last Updated: 2026-04-06T18:50:00Z
