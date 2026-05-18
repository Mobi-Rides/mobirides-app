# Sprint 14 Execution Plan: Rental Compliance & Agreements (MOB-151)
## MobiRides Application — May 16, 2026

**Prepared by:** Antigravity (AI Assistant)  
**Status:** 🔵 IN PROGRESS  
**Epic:** Commercial Readiness & V1.0 Launch

---

## 📊 Overview
To meet legal requirements for the V1.0 launch, we must ensure that both Renters and Hosts explicitly accept the Rental Terms & Conditions. Additionally, signed Rental Agreements must be generated and made available for download after the handover process is complete.

This plan addresses the implementation of mandatory compliance checkboxes, database persistence for audit trails, and the automated generation of PDF rental agreements.

## 🎯 Objectives
1.  **Mandatory Compliance**: Prevent booking or approval without explicit T&C acceptance.
2.  **Audit Trail**: Record the exact timestamp of acceptance in the database for legal verification.
3.  **Document Generation**: Automatically generate a professional, branded PDF Rental Agreement.
4.  **Accessibility**: Allow both parties to download their signed agreements from the rental details/actions view.

---

## 📋 Backlog Items

### Category 1: Infrastructure & Database (P0)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-151-01** | 🟡 TO DO | Add `renter_terms_accepted_at` and `host_terms_accepted_at` to `bookings` table via migration. |

### Category 2: Renter Workflow (P0)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-151-02** | 🟡 TO DO | Integrate mandatory T&C checkbox and legal link into `BookingDialog.tsx`. |
| **MOB-151-03** | 🟡 TO DO | Update booking creation service to persist `renter_terms_accepted_at` timestamp. |

### Category 3: Host Workflow (P0)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-151-04** | 🟡 TO DO | Integrate mandatory T&C checkbox into Host approval/acceptance UI (`BookingActions.tsx`). |
| **MOB-151-05** | 🟡 TO DO | Update `handleAccept` logic to persist `host_terms_accepted_at` timestamp. |

### Category 4: PDF & Agreement Generation (P1)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-151-06** | 🟡 TO DO | Implement `useRentalAgreement.ts` centralized data fetching hook. |
| **MOB-151-07** | 🟡 TO DO | Develop `generateRentalAgreementPDF.ts` utility using `jspdf` and `jspdf-autotable`. |
| **MOB-151-08** | ✅ DONE | Resolve Signature Visibility (Light/Dark mode) in `DigitalSignatureStep.tsx`. |

### Category 5: User Interface Actions (P1)
| Ticket | Status | Summary |
|--------|--------|---------|
| **MOB-151-09** | 🟡 TO DO | Integrate "Download Agreement" button into `RentalActions.tsx` for completed handovers. |

---

## 🚦 Verification Plan

### Automated Tests
- [ ] Verify that `createBooking` fails if T&C acceptance is missing.
- [ ] Verify that `acceptBooking` (Host) fails if T&C acceptance is missing.
- [ ] Unit tests for PDF generation layout consistency.

### Manual Verification
- [ ] **Renter Flow**: Attempt to book a car without checking the T&C box; verify it is blocked.
- [ ] **Host Flow**: Attempt to accept a booking without checking the T&C box; verify it is blocked.
- [ ] **Audit Check**: Verify timestamps appear in the Supabase table after successful actions.
- [ ] **PDF Check**: Download a generated agreement and verify branding, details, and signature visibility.

---

## 🏁 Final Goal
Ensure 100% legal compliance for rental transactions before the V1.0 commercial launch.
