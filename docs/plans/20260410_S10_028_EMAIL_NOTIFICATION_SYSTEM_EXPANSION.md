# [S10-028 / MOB-712] Email Notification System Expansion

## Objective
Standardize and expand the platform's email notification infrastructure to address missing lifecycle communication gaps, particularly the `verification-rejected` email constraint and other key operational triggers (e.g., Host Payouts, Review Requests, Booking Modifications).

## Background
A codebase audit of the `resend-service` Edge Function revealed that although some crucial emails are sent (like `verification-complete`), many other standard SaaS/MaaS templates are omitted. Most notably: a user whose identity verification is denied currently does not receive an automated explanatory email, leaving a significant UX gap in the onboarding flow. Investigations into logging show that current emails invoke the proxy or functions but lack strong traceability for exact verifications sent. We need to formalize these templates and their invocation mechanisms.

## Scope of Work

1. **Add Missing Resend Templates in Edge Function:**
   - Modify `supabase/functions/resend-service/index.ts` to include HTML templates for:
     - `verification-rejected` (with reasons context)
     - `payout-confirmation` (for hosts)
     - `review-request` (post-trip)
     - `listing-status-update` (approval/rejection)
     - `booking-modification` (admin/host initiated changes)

2. **Integration with the Notification Service (Frontend/Backend):**
   - Update `src/services/notificationService.ts` to export helper functions that explicitly call these new email triggers alongside any WhatsApp notifications if necessary.
   - Update `src/config/resend-templates.ts` if typing or enums are synced there.

3. **Database Triggers (Optional / Recommended):**
   - Provide SQL migrations (if necessary) to automatically call the email service via `.rpc` when rows update (e.g. `user_verifications` transitioning to `rejected`).

## File Modifications

- `supabase/functions/resend-service/index.ts`
- `src/services/notificationService.ts`
- `src/config/resend-templates.ts` (if applicable)
- `supabase/migrations/[new_migration].sql` (if automating triggers via DB)

## Acceptance Criteria
- [ ] `verification-rejected` template added and successfully rendered with dynamic `reason` content.
- [ ] At least 4 other missing MaaS lifecycle templates defined.
- [ ] Calling `/functions/v1/resend-service` with `template: 'verification-rejected'` returns a `200` status.
- [ ] Notification service wrapper is updated to strongly type and support these new templates.

## Notes & Risks
- **Testing:** Do not fire live emails to arbitrary users. Ensure testing environment overrides destination addresses or restricts scope to developer emails.
- Ensure the HTML uses the existing Mobi Rides branding (`#E2EE0D`, custom headers/footers).
