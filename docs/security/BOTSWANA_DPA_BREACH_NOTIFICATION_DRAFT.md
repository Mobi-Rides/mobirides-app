# Botswana DPA Breach Notification — Draft

> **IMPORTANT**: This is a draft notification template. Before sending, consult with a legal professional to ensure compliance with the **Data Protection Act, 2024** (Botswana) — specifically **Section 64** (Breach Notification). Notification must be filed within **72 hours** of becoming aware of the breach.

---

## Notification to the Information and Data Protection Commission (IDPC)

**To:** The Information and Data Protection Commission (IDPC), Botswana
**From:** MobiRides (Pty) Ltd
**Date:** [INSERT DATE]
**Reference:** BUG-004 / Security Incident — Service Role Key Exposure

---

### 1. Identity of the Data Controller

| Field | Detail |
|-------|--------|
| **Organisation** | MobiRides (Pty) Ltd |
| **Data Protection Officer** | Modisa Maphanyane |
| **Contact Email** | [INSERT OFFICIAL EMAIL] |
| **Contact Phone** | [INSERT PHONE NUMBER] |
| **Physical Address** | [INSERT ADDRESS] |

---

### 2. Description of the Breach

A security credential (database service role key) was inadvertently included in application source code files. This credential, if obtained by an unauthorized party, could have been used to bypass the platform's access controls and potentially access user data stored in the MobiRides database.

The breach was detected on **4 April 2026** when the platform's infrastructure provider (Supabase) flagged suspicious outbound network traffic originating from the application.

---

### 3. Categories of Personal Data Potentially Affected

In accordance with **Section 2** (Interpretation) of the Data Protection Act, 2024, the following categories of personal data may have been accessible during the exposure window:

| Category | DPA 2024 Classification | Examples |
|----------|------------------------|----------|
| Contact details | Personal data (S2) | Email addresses, phone numbers |
| Identity information | Personal data (S2) | Full names, profile photos |
| Location data | Personal data (S2) | Booking pickup/drop-off locations |
| Financial information | Personal data (S2) | Wallet balances, transaction amounts, booking prices |
| Private communications | Personal data (S2) | Direct messages between users |
| Identity documents | Sensitive personal data (S2) | Driver's license images, KYC verification photos, selfie verification images |
| Biometric data | Sensitive personal data (S2) | Facial images used for identity verification |

---

### 4. Data Subjects Affected

All registered users of the MobiRides platform are potentially affected. The exact number of affected individuals is: **[INSERT USER COUNT]**.

The categories of data subjects include:
- **Renters** — individuals who book vehicles through the platform
- **Hosts** — individuals who list vehicles for rental
- **Platform administrators**

---

### 5. Possible Consequences of the Breach

The potential consequences for affected data subjects include:

1. **Identity theft** — exposed identity documents (driver's licences, verification selfies) could be used for fraudulent identity purposes
2. **Financial fraud** — wallet balance and transaction information could be exploited
3. **Privacy violation** — private messages and booking location data could be disclosed
4. **Phishing risk** — exposed email addresses and personal details could be used in targeted phishing attacks
5. **Reputational harm** — disclosure of personal rental activity and communications

---

### 6. Measures Taken to Address the Breach

The following remediation steps were taken immediately upon discovery:

| # | Action | Date Completed |
|---|--------|---------------|
| 1 | Removed all hardcoded credentials from source code (16 files) | 4 April 2026 |
| 2 | Removed credentials from environment configuration files | 4 April 2026 |
| 3 | Implemented domain whitelisting to prevent outbound exploitation | 5 April 2026 |
| 4 | Rotated all database access credentials | 6 April 2026 |
| 5 | Disabled all legacy/previous credential versions | 6 April 2026 |
| 6 | Redeployed affected services with security controls active | 6 April 2026 |
| 7 | Verified security controls are operational via system logs | 6 April 2026 |
| 8 | Reduced excessive polling traffic (85% reduction) | 6 April 2026 |
| 9 | Added auth guards to eliminate unauthenticated query spam | 6 April 2026 |

---

### 7. Measures Data Subjects Can Take

We recommend the following precautionary steps:

1. **Change your MobiRides password** — as a precautionary measure, please update your account password
2. **Monitor for suspicious communications** — be alert for unexpected emails, SMS messages, or calls claiming to be from MobiRides
3. **Review your account activity** — log in and review your booking history and wallet transactions for any unauthorized activity
4. **Enable two-factor authentication** — if available, enable additional security on your account
5. **Report suspicious activity** — contact MobiRides immediately at **[INSERT SUPPORT EMAIL]** if you notice anything unusual

---

### 8. Notification to Data Subjects

In accordance with **Section 64** of the Data Protection Act, 2024, affected data subjects will be notified **without undue delay** where the breach poses a high risk to their rights and freedoms, via:

- [ ] **Email** — notification sent to registered email addresses
- [ ] **In-app notification** — alert displayed within the MobiRides application
- [ ] **SMS** — text message to registered phone numbers (if applicable)
- [ ] **Website notice** — public notice posted on the MobiRides website

---

### 9. Contact for Further Information

Data subjects may direct enquiries to:

- **Email:** [INSERT PRIVACY EMAIL, e.g., privacy@mobirides.com]
- **Phone:** [INSERT PHONE]
- **In-app:** Via the MobiRides support/chat feature

---

### 10. Information and Data Protection Commission (IDPC) Contact

Data subjects may also contact the IDPC directly:

| | |
|---|---|
| **Commissioner** | Kepaletswe Somolekae |
| **Email** | dataprotection@bocra.org.bw |
| **Telephone** | +267 3685432 / +267 3685516 |
| **Location** | Plot 50671 Independence Avenue, Gaborone, Botswana |
| **Postal Address** | Private Bag 00495 Gaborone, Botswana |

> **Note:** The IDPC operates under the Botswana Communications Regulatory Authority (BOCRA). Complaints regarding data privacy may be filed through BOCRA or the dedicated IDPC offices in Gaborone.

---

## Internal Checklist — Before Sending

- [ ] Confirm exact date range of exposure window with infrastructure provider
- [ ] Obtain exact count of registered users (data subjects)
- [ ] Review with legal counsel for DPA 2024 Section 64 compliance
- [ ] Assess whether sensitive personal data (biometric/identity docs) triggers enhanced notification obligations
- [ ] Insert all placeholder fields marked with `[INSERT ...]`
- [ ] Decide notification channels (email, SMS, in-app, website)
- [ ] Prepare user-facing FAQ document
- [ ] **File notification with IDPC within 72 hours of becoming aware of the breach (Section 64)**
- [ ] Notify affected data subjects without undue delay where breach poses high risk
- [ ] Retain proof of notification for compliance records

> **Penalties:** Non-compliance with the Data Protection Act, 2024 may result in fines of up to **BWP 50 million or 4% of global annual turnover** (whichever is higher).

---

*Draft prepared by: Modisa Maphanyane*
*Date: 2026-04-06*
*Classification: Internal — Confidential — Legal Privileged*
*Review required before distribution*
