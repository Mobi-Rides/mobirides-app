
# Payment Integration Testing Guide

This guide covers the step-by-step process to verify the entire payment system, from booking a car to withdrawing earnings.

## 🎭 Roles & Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Host** | `bathoensescob@gmail.com` | `Hawdybitch25` | Approves bookings, receives money, withdraws funds. |
| **Renter** | `test_renter_1770479971687@example.com` | `password123` | Requests booking, pays, picks up car. |
| **Admin** | *(Your Admin Email)* | *(Your Password)* | Monitors transactions, insurance, and withdrawals. |

---

## 🧪 Test Scenarios

### 1. Booking & Payment (Renter Side)
1.  **Login as Renter**.
2.  Search for a car (e.g., "Toyota Land Cruiser").
3.  Select dates and click **"Book Now"**.
    *   *Result:* Booking created with status `Pending`.
4.  **Wait for Approval** (See Step 2).
5.  Once approved, refresh **"My Trips"**.
6.  Click **"Pay Now"**.
    *   *Action:* Use the mock payment page (click "Simulate Success").
    *   *Result:* Status changes to `Confirmed`. "Initiate Pickup" button appears.

### 2. Approval (Host Side)
1.  **Login as Host**.
2.  Go to **"Bookings"** tab.
3.  Find the `Pending` request.
4.  Click **"Approve"**.
    *   *Result:* Status changes to `Awaiting Payment`.

### 3. Handover Process
1.  **Meet Up**: Ideally, open the app on two different devices/browsers.
2.  **Pickup**:
    *   Both Renter and Host click **"Initiate Pickup"**.
    *   Complete the checklist (Photos, Fuel, Mileage).
    *   *Result:* Rental is now `In Progress`.
3.  **Return**:
    *   Both click **"Initiate Return"**.
    *   Complete checklist.
    *   *Result:* Booking is `Completed`.

### 4. Earnings & Withdrawal (Host Side)
1.  **Check Wallet**:
    *   Go to **"Wallet"**.
    *   Verify the balance has increased (Rental Price - 15% Commission).
    *   *Note:* If balance is still "Pending", wait 24h or run the `process_due_earnings_releases` script.
2.  **Add Payout Method**:
    *   Click **"Withdraw"** -> **"Add New Method"**.
    *   Enter Bank Details (e.g., FNB, Account #).
3.  **Request Withdrawal**:
    *   Select the method.
    *   Enter Amount (min BWP 200).
    *   Click **"Withdraw Funds"**.
    *   *Result:* Balance decreases, "Pending Withdrawal" appears in history.

### 5. Financial Oversight (Admin Side)
1.  **Login as Admin**.
2.  Go to **"Admin Portal"** -> **"Transactions"**.
3.  **Verify Tabs**:
    *   **Inbound Payments**: See the money paid by the renter.
    *   **Withdrawals**: See the Host's withdrawal request (Approve/Reject logic pending).
    *   **Insurance**: See the accumulated insurance premiums to be sent to Pay-U.

---

## 🛠️ Automated Test Scripts
We have created scripts to run these scenarios automatically if you don't want to click through the UI.

| Script | Command | Description |
|--------|---------|-------------|
| **Master E2E** | `npx tsx scripts/run_e2e_scenario.ts` | Runs the **entire** flow (Booking -> Payment -> Handover -> Release -> Withdrawal). |
| **Financials** | `npx tsx scripts/test_financial_features.ts` | Tests Host adding bank details and requesting withdrawals. |
| **Automation** | `npx tsx scripts/test_cron_jobs.ts` | Tests the auto-expiry and auto-earnings-release logic. |

## ⚠️ Troubleshooting
*   **"Payment Failed"**: Ensure you are using the mock provider and not a real card yet.
*   **"No Earnings"**: Earnings are held in "Pending" status until the trip is completed + 24 hours. Use the admin script to force release if testing.
*   **"Withdrawal Failed"**: Ensure Host balance > BWP 200.

