

# Plan: Create Damage Protection Module Documentation

## File to Create
`docs/DAMAGE_PROTECTION_MODULE.md`

## Target Audiences
Insurance partners (Pay-U, prospective underwriters), support agents, investors/financiers, engineers, marketing team.

## Proposed Document Structure (~600-700 lines)

### 1. Document Header & Classification
- Version, date, confidentiality level (mark sections as "Partner-Facing", "Internal Only", "Public")
- Audience matrix: which sections are relevant to which audience

### 2. Executive Summary
- Product name: "Damage Protection" (branded term for insurance)
- Partnership model: MobiRides + Pay-U (underwriter)
- Revenue split: 90% Pay-U / 10% MobiRides commission
- Coverage scope: Botswana P2P car rentals
- Key stats: 4 tiers, $2M international coverage cap (USD), BWP-denominated premiums

### 3. Product Overview (Marketing / Partners / Investors)
- What it is: rental-period protection for hosts against damage/loss caused by renters
- Why it exists: trust layer for P2P car sharing
- Competitive positioning vs traditional rental insurance
- Attach rate targets (30%+), average premium targets (P300-600/booking)

### 4. Coverage Tiers & Pricing
- No Coverage (0%), Basic (10%), Standard (15%), Premium (20%)
- Coverage caps, excess amounts, what's covered vs excluded per tier
- Premium formula: `Daily Rental × Premium % × Risk Multiplier × Days`
- Worked examples at P500/day and P1,000/day

### 5. Business & Financial Model (Investors / Partners)
- Revenue flow diagram (from PAYMENT_INTEGRATION_IMPLEMENTATION.md Section 14)
- Premium collection → 90/10 split → manual remittance to Pay-U
- Commission rate configuration (insurance_commission_rates table)
- Revenue projections: P15,000-25,000/month from insurance premiums
- Revenue per booking contribution: part of the P168.75 target

### 6. Claims Process (Partners / Support / Marketing)
- End-to-end claim lifecycle: incident → submission → review → approval/rejection → payout/liability
- Claim types: collision, theft, vandalism, fire, weather, windscreen, tyre
- Evidence requirements: photos, repair quotes, police reports
- SLAs: 24hr reporting window, <48hr processing target
- Auto-approval threshold: claims < P500
- Excess collection: renter pays excess via platform
- Repair management: MobiRides arranges repairs (not hosts)
- Pay-U external status tracking

### 7. Risk Assessment & Underwriting (Partners / Engineers)
- UnderwriterService: risk scoring model
- Risk factors: verification status, car value, claims history
- Risk tiers: low/medium/high/prohibited with premium load multipliers
- Default risk assessment fallbacks

### 8. Technical Architecture (Engineers)
- System diagram (from INSURANCE_README.md)
- Database schema: insurance_packages, insurance_policies, insurance_claims, insurance_claim_activities, insurance_commission_rates, premium_remittance_batches
- Key services: InsuranceService, UnderwriterService, automationService, insuranceNotificationService
- Edge Function: calculate-insurance
- PDF generation (jsPDF)
- Storage buckets: insurance-policies, insurance-claims

### 9. User Experience Flows (Marketing / Support / Engineers)
- Booking flow: package selection → premium calculation → payment
- Policy documents: auto-generated PDF certificates
- Claims submission: multi-step form with evidence upload
- User claims list: status tracking
- Claim response dialog: "more info needed" workflow
- Host notification flow

### 10. Admin Operations (Support / Engineers)
- AdminClaimsDashboard: review, approve, reject, request info
- AdminRemittanceDashboard: pending remittance, batch creation, Pay-U transfer
- InsuranceRemittanceTable: pending policy tracking
- Policy expiration automation (pg_cron)
- Small claims auto-approval

### 11. Notification & Communication (Support / Engineers)
- Policy confirmation emails
- Claim received/status update emails
- Host claim notifications
- In-app notifications for claim status changes

### 12. Compliance & Terms (Partners / Legal)
- Terms version tracking (policy.terms_version)
- Terms acceptance timestamp
- Key T&C points (from PDF generator)
- Botswana regulatory considerations
- Data retention and privacy (link to PRIVACY_POLICY.md)

### 13. Current Status & Known Gaps
- Implementation: 56% complete (UI gaps per Week 4 report)
- Premium percentages: calibrated to 10/15/20% (memory context) vs original 25/50/100% (INSURANCE_README)
- Remittance service: designed but not fully implemented
- Pay-U API integration: manual process, no automated API
- Excess payment modal: built but untested in production

### 14. Roadmap
- Q1 2026: Complete UI gaps, production testing
- Q2 2026: Automated Pay-U API remittance
- Q2 2026: Claims analytics dashboard
- Q3 2026: Additional underwriter partnerships

### 15. Document References
All linked docs with brief descriptions:

| Document | Relevance |
|----------|-----------|
| `docs/INSURANCE_README.md` | Technical implementation guide |
| `docs/insurance-integration-plan-2025-11-12.md` | Original implementation plan (v2.0, 1984 lines) |
| `docs/insurance-integration-plan-2025-10-28.md` | Original planning document (v1.0) |
| `docs/PAYMENT_INTEGRATION_IMPLEMENTATION.md` (Section 14) | Pay-U partnership model, remittance, premium split |
| `docs/20260206_MobiRides_Commercialization_GTM_Plan.md` | Revenue model, Pay-U partnership context |
| `docs/MobiRides_Valuation_Framework_06-02-2026.md` | Insurance revenue in valuation |
| `docs/PRIVACY_POLICY.md` | Data handling for claims/policies |
| `docs/ROADMAP.md` | Phase 3 insurance roadmap |
| `docs/ROADMAP-NOV-DEC-2025.md` | Original insurance epic scope (Epics 1.4/1.6) |
| `docs/hotfixes/HOTFIX_ADMIN_PORTAL_2026_02_24.md` | Active UI fixes affecting insurance components |
| `docs/UI_DISPLAY_ISSUES_2026-02-02.md` | Display issues in insurance UI |
| `docs/testing/TESTING_COVERAGE_STATUS_2026_03_02.md` | Insurance test coverage status |
| `docs/Product Status/WEEK_4_FEBRUARY_2026_STATUS_REPORT.md` | Latest status metrics |

### 16. Appendix
- Premium calculation examples (table)
- Glossary of terms (excess, coverage cap, premium load, remittance batch)
- Support agent quick-reference card (extractable)

## Sensitivity Notes
- Sections 5, 8, 10 marked "Internal Only" or "Partner NDA Required"
- Section 4 (tiers/pricing) and Section 6 (claims process) are extractable for marketing/support
- Section 3 is public-facing

