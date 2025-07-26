import { NotificationClassifier } from "./NotificationClassifier";

describe("NotificationClassifier.classifyNotification", () => {
  it("classifies a clear payment notification", () => {
    const notification = { content: "Your wallet has been topped up with P2000.00", type: "wallet_topup" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("payment");
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it("classifies a clear booking notification", () => {
    const notification = { content: "Booking confirmed for Toyota Camry on March 15", type: "booking_confirmed" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("booking");
    expect(result.confidence).toBeGreaterThanOrEqual(90);
  });

  it("classifies a payment with currency pattern", () => {
    const notification = { content: "Payment received from booking #12345. Amount: $75.00", type: "payment" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("payment");
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it("classifies a booking with car brand and date", () => {
    const notification = { content: "Your booking for BMW is scheduled for tomorrow.", type: "booking" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("booking");
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it("classifies ambiguous/other notification", () => {
    const notification = { content: "Welcome to the app! Enjoy your experience.", type: "info" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("other");
    expect(result.confidence).toBeLessThanOrEqual(70);
  });

  it("handles empty content gracefully", () => {
    const notification = { content: "", type: "" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("other");
    expect(result.confidence).toBe(0);
  });

  it("classifies a long, ambiguous message as booking (fallback)", () => {
    const notification = { content: "This is a very long message with no clear payment or booking keywords but it is over 100 characters so it should trigger the fallback mechanism and be classified as booking.", type: "" };
    const result = NotificationClassifier.classifyNotification(notification);
    expect(result.type).toBe("booking");
    expect(result.confidence).toBeLessThanOrEqual(60);
  });
}); 