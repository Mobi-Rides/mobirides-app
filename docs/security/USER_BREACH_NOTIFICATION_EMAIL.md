# User Breach Notification Email

**Status:** DRAFT — Pending review before distribution  
**Date:** 7 April 2026  
**Related Incident:** BUG-004 (see SECURITY_INCIDENT_REPORT_BUG004.md)  
**Regulation:** Botswana Data Protection Act (DPA) 2024

---

## Email Subject Line

**Important Security Notice — Action Required for Your MobiRides Account**

---

## Email Body

Dear MobiRides User,

We are writing to inform you of a security incident that was recently detected on the MobiRides platform. We take the protection of your personal data very seriously, and we want to be fully transparent about what happened, what information may have been affected, and what steps you can take to protect yourself.

### What Happened

Our security team identified unauthorised access activity on the MobiRides platform. Upon discovery, we acted immediately to neutralise the breach and have since implemented additional security measures to prevent a recurrence.

### What Information May Have Been Affected

Based on our investigation, the following personal information **may** have been exposed:

- **Email addresses**
- **Phone numbers / contact numbers**

### What Was NOT Affected

We want to assure you that the following data shows **no evidence of compromise**:

- **Passwords** — All passwords on MobiRides are stored in a securely hashed format. Your password was not exposed in plain text. However, as a precautionary measure, we strongly recommend changing your password.
- **Verification documents** — Identity documents, driver's licences, and other uploaded verification files stored in our secure storage system show no signs of unauthorised access.
- **Payment information** — Payment processing is handled by third-party payment providers and is not stored on our servers.

### What We Are Doing

- The breach has been **fully neutralised** and the attack vector has been closed.
- We have **hardened platform security**, including improved access controls, query optimisation to reduce attack surface, and enhanced monitoring.
- We are filing a formal report with the **Information and Data Protection Commission (IDPC)** of Botswana, in compliance with the Botswana Data Protection Act (DPA) 2024.

### What You Should Do

We recommend that you take the following steps to protect your account and personal information:

1. **Change your MobiRides password immediately**
   - Log in to MobiRides and navigate to your Security Settings to update your password.
   - Choose a strong, unique password that you do not use for any other service.

2. **Change your email password if you used the same password**
   - If your MobiRides password was the same as your email account password (Gmail, Outlook, Yahoo, etc.), please change your email password with your email service provider as well.

3. **Be alert for suspicious activity**
   - Be cautious of **unexpected phone calls**, especially from international or unknown numbers.
   - Be cautious of **suspicious emails** claiming to come from MobiRides. Legitimate emails from MobiRides will only come from the following domains:
     - **@mobirides.com**
     - **@mobirides.africa**
   - If you receive an email from any other domain claiming to be MobiRides, **do not click any links** and report it to us immediately.

4. **Report any suspicious activity to us**
   - If you have received suspicious calls, emails, or notice any unusual activity on your account, please contact us immediately via WhatsApp:
   - **WhatsApp: +267 78 689 464**

### Our Commitment to You

We understand that incidents like this can be concerning. We want to assure you that the security of your data is our highest priority. This notification is part of our commitment to transparency and to ensuring that you have the information you need to protect yourself.

We will continue to monitor the situation closely and will notify you of any further developments.

Thank you for your continued trust in MobiRides.

Warm regards,

**The MobiRides Team**  
WhatsApp: +267 78 689 464  
Web: [mobirides.com](https://mobirides.com)

---

## Internal Notes (Do Not Include in Email)

- **Distribution method:** To be determined (in-app notification, transactional email via platform, or manual send)
- **Audience:** All registered MobiRides users with active accounts
- **Regulatory filing:** IDPC notification to be submitted within 72 hours of discovery per DPA 2024
  - Commissioner: Kepaletswe Somolekae
  - Email: dataprotection@bocra.org.bw
  - Phone: +267 3685432 / 3685516
  - Address: Plot 50671 Independence Avenue, Gaborone, Botswana
  - Postal: Private Bag 00495 Gaborone, Botswana
- **Cross-reference:** See `docs/security/POPIA_BREACH_NOTIFICATION_DRAFT.md` (now updated for Botswana DPA)
- **Cross-reference:** See `docs/security/SECURITY_INCIDENT_REPORT_BUG004.md` for full incident timeline
