import { NotificationClassifier } from "@/utils/NotificationClassifier";
import { NormalizedNotification } from "@/utils/notificationHelpers";

const notification = (type: string): NormalizedNotification => ({
  id: type.length,
  type: type as NormalizedNotification["type"],
  user_id: "user-1",
  title: "Title",
  description: "Description",
  content: "Content",
  is_read: false,
  created_at: "2026-05-12T00:00:00.000Z",
  updated_at: "2026-05-12T00:00:00.000Z",
  expires_at: null,
  metadata: {},
  role_target: "system_wide",
  related_booking_id: null,
  related_car_id: null,
});

describe("NotificationClassifier coverage", () => {
  it.each([
    ["booking_request", "booking", 95],
    ["wallet_topup", "payment", 95],
    ["pickup_reminder", "handover", 90],
    ["message_received", "message", 95],
    ["system_notification", "system", 95],
    ["unknown_type", "system", 50],
  ] as const)("classifies %s as %s", (type, expectedType, confidence) => {
    expect(NotificationClassifier.classifyNotification(notification(type))).toMatchObject({
      type: expectedType,
      confidence,
      details: expect.stringContaining(type),
    });
  });

  it("identifies booking and payment notification types", () => {
    expect(NotificationClassifier.isBookingNotification(notification("booking_confirmed"))).toBe(true);
    expect(NotificationClassifier.isBookingNotification(notification("request_cancelled"))).toBe(true);
    expect(NotificationClassifier.isBookingNotification(notification("wallet_topup"))).toBe(false);

    expect(NotificationClassifier.isPaymentNotification(notification("payment_received"))).toBe(true);
    expect(NotificationClassifier.isPaymentNotification(notification("wallet_deduction"))).toBe(true);
    expect(NotificationClassifier.isPaymentNotification(notification("booking_request"))).toBe(false);
  });

  it("identifies active rental, system, message, and handover notifications", () => {
    expect(NotificationClassifier.isActiveRentalNotification(notification("return_started"))).toBe(true);
    expect(NotificationClassifier.isActiveRentalNotification(notification("trip_started"))).toBe(true);
    expect(NotificationClassifier.isActiveRentalNotification(notification("booking_confirmed"))).toBe(true);
    expect(NotificationClassifier.isActiveRentalNotification(notification("wallet_topup"))).toBe(false);

    expect(NotificationClassifier.isSystemNotification(notification("system_maintenance"))).toBe(true);
    expect(NotificationClassifier.isSystemNotification(notification("booking_confirmed"))).toBe(false);

    expect(NotificationClassifier.isMessageNotification(notification("message_received"))).toBe(true);
    expect(NotificationClassifier.isMessageNotification(notification("booking_confirmed"))).toBe(false);

    expect(NotificationClassifier.isHandoverNotification(notification("navigation_started"))).toBe(true);
    expect(NotificationClassifier.isHandoverNotification(notification("location_shared"))).toBe(true);
    expect(NotificationClassifier.isHandoverNotification(notification("payment_failed"))).toBe(false);
  });
});
