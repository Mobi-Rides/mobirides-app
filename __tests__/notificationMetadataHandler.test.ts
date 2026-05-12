import { formatMetadataForDisplay, NotificationMetadataHandler } from "@/utils/notificationMetadataHandler";
import { NormalizedNotification } from "@/utils/notificationHelpers";

const notification = (overrides: Partial<NormalizedNotification>): NormalizedNotification => ({
  id: 1,
  user_id: "user-1",
  type: "booking_request_received" as any,
  title: "Notification",
  description: "Description",
  content: "Content",
  is_read: false,
  created_at: "2026-05-12T08:00:00.000Z",
  updated_at: "2026-05-12T08:00:00.000Z",
  expires_at: null,
  metadata: {},
  role_target: "renter" as any,
  related_booking_id: null,
  related_car_id: null,
  ...overrides,
});

describe("NotificationMetadataHandler", () => {
  it("extracts booking summaries and booking actions", () => {
    const result = formatMetadataForDisplay(notification({
      related_booking_id: "booking-1",
      metadata: {
        booking_id: "booking-1",
        car_make: "Toyota",
        car_model: "Corolla",
        pickup_location: "Airport",
        pickup_date: "2026-05-12T08:00:00.000Z",
        total_amount: 500,
      },
    }));

    expect(result.summary).toEqual(expect.arrayContaining([
      "Vehicle: Toyota Corolla",
      "Pickup: Airport",
      "Amount: BWP 500.00",
    ]));
    expect(result.actions.map((action) => action.action)).toEqual([
      "accept_booking",
      "decline_booking",
      "view_booking",
    ]);
  });

  it("builds payment summary and retry action for failed payments", () => {
    const actions = NotificationMetadataHandler.getActionButtons(notification({
      type: "payment_failed" as any,
      is_read: true,
      metadata: {
        amount: 250,
        currency: "BWP",
        payment_method: "card",
        status: "failed",
        wallet_balance: 100,
      },
    }));

    const summary = NotificationMetadataHandler.getMetadataSummary(notification({
      type: "payment_failed" as any,
      metadata: {
        amount: 250,
        currency: "BWP",
        payment_method: "card",
        status: "failed",
        wallet_balance: 100,
      },
    }));

    expect(summary).toEqual([
      "Amount: BWP 250.00",
      "Method: card",
      "Status: failed",
      "Balance: BWP 100.00",
    ]);
    expect(actions.map((action) => action.action)).toEqual(["view_wallet", "retry_payment"]);
  });

  it("builds handover, message, system, and rental summaries", () => {
    expect(NotificationMetadataHandler.getMetadataSummary(notification({
      type: "handover_ready" as any,
      metadata: {
        car_make: "Honda",
        car_model: "Fit",
        location: "CBD",
        status: "in_progress",
        progress_percentage: 50,
        step_name: "Photos",
      },
    }))).toEqual([
      "Vehicle: Honda Fit",
      "Location: CBD",
      "Status: IN PROGRESS",
      "Progress: 50%",
      "Current Step: Photos",
    ]);

    expect(NotificationMetadataHandler.getMetadataSummary(notification({
      type: "message_received" as any,
      metadata: {
        sender_name: "Alice",
        message_preview: "I am outside",
        attachment_count: 2,
      },
    }))).toEqual(["From: Alice", "Preview: I am outside", "Attachments: 2"]);

    expect(NotificationMetadataHandler.getMetadataSummary(notification({
      type: "system_maintenance" as any,
      metadata: {
        severity: "warning",
        action_required: true,
        maintenance_window: "Tonight",
      },
    }))).toEqual(["Severity: WARNING", "Action Required", "Maintenance: Tonight"]);

    expect(NotificationMetadataHandler.getMetadataSummary(notification({
      type: "rental_earnings" as any,
      metadata: {
        car_make: "Mazda",
        car_model: "Demio",
        earnings: 320,
        duration: "2 days",
        status: "completed",
      },
    }))).toEqual([
      "Vehicle: Mazda Demio",
      "Earnings: BWP 320.00",
      "Duration: 2 days",
      "Status: completed",
    ]);
  });
});
