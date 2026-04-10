# Botswana DPA Breach Notification — Draft

> **IMPORTANT**: This is a draft notification template. Before sending, consult with a legal professional to ensure compliance with the **Data Protection Act, 2024** (Botswana) — specifically **Section 64** (Breach Notification). Notification must be filed within **72 hours** of becoming aware of the breach.

---

## Notification to the Information and Data Protection Commission (IDPC)

**To:** The Information and Data Protection Commission (IDPC), Botswana
**From:** Modisa Maphanyane t/a MobiRides
**Date:** [INSERT DATE]
**Reference:** BUG-004 / Security Incident — Service Role Key Exposure

---

### 1. Identity of the Data Controller

| Field | Detail |
|-------|--------|
| **Organisation** | Modisa Maphanyane t/a MobiRides |
| **Data Protection Officer** | Modisa Maphanyane |
| **Contact Email** | maphanyane@mobirides.africa |
| **Contact Phone** | +267 78689464 |
| **Physical Address** | Plot 16530, Gwest Phase 1 |

---

### 2. Existing Security Measures at Time of Breach

The following security controls were in place at the time of the incident, demonstrating that the organisation had implemented reasonable measures to protect personal data:

| Safeguard | Description |
|-----------|-------------|
| **Row Level Security (RLS)** | Enabled on all user-facing tables — profiles, bookings, messages, wallets, documents — restricting data access to record owners |
| **Supabase Auth with JWT** | All API access authenticated via signed JWT tokens; no anonymous write access permitted |
| **Password Hashing** | User passwords stored using bcrypt hashing (via Supabase Auth); plaintext never stored or transmitted |
| **Storage Bucket Policies** | Verification documents (driver's licences, KYC selfies) stored in private buckets with per-user RLS policies |
| **Role-Based Access Control** | Admin functions gated behind `is_admin()` security-definer function; separate `user_roles` table with RLS |
| **HTTPS Enforcement** | All client-server communication over TLS; Supabase endpoints enforce HTTPS |
| **Environment Separation** | Production and development environments use separate Supabase projects |

> **Note:** Despite these controls, the specific vulnerability (hardcoded `service_role` key in administrative scripts) bypassed RLS by design, as the `service_role` key is intended to override RLS for administrative operations. The key was inadvertently committed to version-controlled source code.

---

### 3. Description of the Breach

A security credential (database service role key) was inadvertently included in application source code files. This credential, if obtained by an unauthorized party, could have been used to bypass the platform's access controls and potentially access user data stored in the MobiRides database.

The breach was detected on **6 April 2026** at **15:00hrs** when the platform's infrastructure provider (Supabase) flagged suspicious outbound network traffic originating from the application. Forensic analysis identified approximately **7,000 anomalous network requests** directed at external cloud service endpoints (AWS, Azure, GCP). These requests were consistent with automated Server-Side Request Forgery (SSRF) scanning rather than targeted database exfiltration — no evidence of data deletion, modification, or bulk extraction was found.

---

### 4. Categories of Personal Data Potentially Affected

In accordance with **Section 2** (Interpretation) of the Data Protection Act, 2024, the following categories of personal data may have been accessible during the exposure window:

| Category | DPA 2024 Classification | Examples |
|----------|------------------------|----------|
| Contact details | Personal data (S2) | Email addresses, phone numbers |
| Identity information | Personal data (S2) | Full names, profile photos |
| Location data | Personal data (S2) | Booking pickup/drop-off locations |
| Financial information | Personal data (S2) | Wallet balances, transaction amounts, booking prices |
| Private communications | Personal data (S2) | Direct messages between users |
| Identity documents | Sensitive personal data (S2) | Driver's licence images, KYC verification photos, selfie verification images |
| Biometric data | Sensitive personal data (S2) | Facial images used for identity verification |

---

### 5. Data Subjects Affected

All registered users of the MobiRides platform are potentially affected. The exact number of affected individuals is: 244.

The categories of data subjects include:
- **Renters** — individuals who book vehicles through the platform
- **Hosts** — individuals who list vehicles for rental
- **Platform administrators**

---

### 6. Measures Taken to Address the Breach

The following remediation steps were taken immediately upon discovery:

| # | Action | Date Completed |
|---|--------|---------------|
| 1 | Removed all hardcoded credentials from source code (16 files) | 6 April 2026 |
| 2 | Removed credentials from environment configuration files | 6 April 2026 |
| 3 | Implemented domain whitelisting to prevent outbound exploitation | 6 April 2026 |
| 4 | Rotated all database access API keys (Anon / Service Role) | 6 April 2026 |
| 5 | Upgraded to asymmetric JWT Signing Keys (ECC P-256) and revoked compromised legacy JWT Secret to instantly invalidate any compromised active user sessions | 6 April 2026 |
| 6 | Disabled all legacy/previous credential API key versions | 7 April 2026 |
| 7 | Redeployed affected services with security controls active | 7 April 2026 |
| 8 | Verified security controls are operational via system logs | 7 April 2026 |
| 9 | Reduced excessive polling traffic (85% reduction) to embed deviation warning | 7 April 2026 |
| 10 | Added auth guards to eliminate unauthenticated query spam | 7 April 2026 |
| 11 | Implemented organisational rule requiring all AI coding agents to incorporate best practices to prevent service key leakage | 8 April 2026 |

---

### 7. Measures Data Subjects Can Take

We have recommended the following precautionary steps:

1. **Change your MobiRides password** — as a precautionary measure, please update your account password
2. **Monitor for suspicious communications** — be alert for unexpected emails, SMS messages, or calls (particularly from international numbers) claiming to be from MobiRides
3. **Review your account activity** — log in and review your booking history and wallet transactions for any unauthorized activity
4. **Report suspicious activity** — contact MobiRides immediately at **hello@mobirides.africa** or **+267 78689464** if you notice anything unusual

---

### 8. Notification to Data Subjects

In accordance with **Section 64** of the Data Protection Act, 2024, affected data subjects will be notified **without undue delay** where the breach poses a high risk to their rights and freedoms, via:

- **Email** — notification sent to registered email addresses
- **In-app notification** — alert displayed within the MobiRides application
- **Social media notice** — public notice posted on the MobiRides social media (Facebook, LinkedIn, X, WhatsApp channel)

---

### 9. Risk Assessment Matrix

The following matrix assesses each category of potentially affected data by likelihood of exploitation and severity of impact:

| Data Category | Likelihood | Impact | Overall Risk | Rationale |
|---------------|-----------|--------|-------------|-----------|
| Email addresses & phone numbers | **High** | **High** | **High** | Easily extractable; usable for phishing, spam, and social engineering |
| Full names & profile data | Medium | Medium | **Medium** | Useful for social engineering when combined with contact details |
| Booking/location data | Low | Medium | **Low-Medium** | Historical data; limited standalone value |
| Wallet balances & transactions | Low | High | **Medium** | Financial data but no banking/card details stored on platform |
| Private messages | Low | Medium | **Low-Medium** | Requires targeted extraction; limited commercial value |
| Identity documents (KYC/licences) | Low | **Critical** | **Medium** | Stored in private buckets with separate access controls; no evidence of storage access |
| Biometric/verification photos | Low | **Critical** | **Medium** | Same as above — private bucket storage provides additional protective layer |
| Passwords | **Negligible** | Critical | **Low** | Stored as bcrypt hashes; not practically reversible |

> **Note:** No evidence of actual data exfiltration was found. The approximately 7,000 suspicious requests were outbound SSRF scans to external cloud provider domains, not database extraction queries.

---

### 10. Contact for Further Information

Data subjects may direct enquiries to:

- **Email:** hello@mobirides.africa
- **Phone:** +267 78689464
- **In-app:** Via the MobiRides support/chat feature

---

### 11. Information and Data Protection Commission (IDPC) Contact

Our notice has also advised that data subjects may also contact the IDPC directly:

| | |
|---|---|
| **Commissioner** | Kepaletswe Somolekae |
| **Email** | dataprotection@bocra.org.bw |
| **Telephone** | +267 3685432 / +267 3685516 |
| **Location** | Plot 50671 Independence Avenue, Gaborone, Botswana |
| **Postal Address** | Private Bag 00495 Gaborone, Botswana |

> **Note:** The IDPC operates under the Botswana Communications Regulatory Authority (BOCRA). Complaints regarding data privacy may be filed through BOCRA or the dedicated IDPC offices in Gaborone.

---

> **Penalties:** Non-compliance with the Data Protection Act, 2024 may result in fines of up to **BWP 50 million or 4% of global annual turnover** (whichever is higher).

---

*Draft prepared by: Modisa Maphanyane*
*Date: 2026-04-06*
*Last revised: 2026-04-09*
*Classification: Internal — Confidential — Legal Privileged*
*Review required before distribution*
