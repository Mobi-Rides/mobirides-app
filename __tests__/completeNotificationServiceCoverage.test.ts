import { completeNotificationService } from "@/services/completeNotificationService";
import { pushNotificationService } from "@/services/pushNotificationService";
import { ResendEmailService, TwilioWhatsAppService } from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock("@/services/pushNotificationService", () => ({
  pushNotificationService: {
    sendPushNotification: jest.fn(),
    sendMessageNotification: jest.fn(),
  },
}));

const sendEmail = jest.fn();
const sendBookingConfirmation = jest.fn();

jest.mock("@/services/notificationService", () => ({
  ResendEmailService: {
    getInstance: jest.fn(() => ({ sendEmail })),
  },
  TwilioWhatsAppService: {
    getInstance: jest.fn(() => ({ sendBookingConfirmation })),
  },
}));

const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const makeProfileQuery = (data: unknown) => ({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data, error: null }),
    }),
  }),
});

describe("completeNotificationService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an in-app notification and fans out to push, email, and WhatsApp", async () => {
    const userId = makeId("user");
    const bookingId = makeId("booking");
    const notificationInsert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce({ insert: notificationInsert })
      .mockReturnValueOnce(makeProfileQuery({ full_name: "Renter Name" }))
      .mockReturnValueOnce(makeProfileQuery({ phone_number: "+26770000000", full_name: "Renter Name" }));
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: ["renter@example.test"], error: null });
    (pushNotificationService.sendPushNotification as jest.Mock).mockResolvedValue(undefined);
    sendEmail.mockResolvedValue(undefined);
    sendBookingConfirmation.mockResolvedValue(undefined);

    await expect(completeNotificationService.createNotification({
      userId,
      type: "awaiting_payment",
      title: "Payment required",
      description: "Please pay for your booking",
      relatedBookingId: bookingId,
      metadata: {
        carBrand: "Toyota",
        carModel: "Corolla",
        totalAmount: 900,
        bookingReference: bookingId,
      },
      roleTarget: "renter_only",
    })).resolves.toEqual({ success: true });
    await Promise.resolve();
    await Promise.resolve();

    expect(notificationInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: userId,
      type: "system_notification",
      related_booking_id: bookingId,
      role_target: "renter_only",
      is_read: false,
    }));
    expect(pushNotificationService.sendPushNotification).toHaveBeenCalledWith(userId, expect.objectContaining({
      title: "Payment required",
      url: "/notifications",
    }));
    expect(ResendEmailService.getInstance).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      ["renter@example.test"],
      "awaiting-payment",
      expect.objectContaining({
        name: "Renter Name",
        carDetails: "Toyota Corolla",
        actionUrl: `${window.location.origin}/notifications`,
      }),
      "Payment required"
    );
    expect(TwilioWhatsAppService.getInstance).toHaveBeenCalled();
    expect(sendBookingConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId, phone: "+26770000000" }),
      expect.objectContaining({ bookingId, totalAmount: 900 }),
      false
    );
  });

  it("returns database insert errors without sending other channels", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: "insert failed" } }),
    });
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await completeNotificationService.createNotification({
      userId: makeId("user"),
      type: "booking_confirmed_renter",
      title: "Confirmed",
      description: "Booking confirmed",
    });

    expect(result).toEqual({ success: false, error: "insert failed" });
    expect(pushNotificationService.sendPushNotification).not.toHaveBeenCalled();
    (console.error as jest.Mock).mockRestore();
  });

  it("creates message notifications with truncated previews", async () => {
    const recipientId = makeId("user");
    const insert = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({ insert });
    (pushNotificationService.sendMessageNotification as jest.Mock).mockResolvedValue(undefined);

    await expect(completeNotificationService.createMessageNotification(
      recipientId,
      "Host User",
      "This is a long message preview that should be shortened before storage and push delivery"
    )).resolves.toEqual({ success: true });
    await Promise.resolve();

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: recipientId,
      type: "message_received",
      title: "New Message",
      description: expect.stringMatching(/^Host User: This is a long message preview/),
      metadata: { sender_name: "Host User" },
    }));
    expect(pushNotificationService.sendMessageNotification).toHaveBeenCalledWith(recipientId, {
      senderName: "Host User",
      messagePreview: expect.any(String),
    });
  });

  it("returns booking-not-found for missing booking details", async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: { message: "missing" } }),
        }),
      }),
    });

    await expect(completeNotificationService.createBookingNotification(
      makeId("booking"),
      "request",
      "New request",
      "Request submitted"
    )).resolves.toEqual({ success: false, error: "Booking not found" });
  });

  it("creates host and renter booking notifications with role-specific metadata", async () => {
    const bookingId = makeId("booking");
    const hostId = makeId("host");
    const renterId = makeId("renter");
    const carId = makeId("car");
    const createNotification = jest
      .spyOn(completeNotificationService, "createNotification")
      .mockResolvedValue({ success: true });
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: bookingId,
              renter_id: renterId,
              cars: {
                id: carId,
                owner_id: hostId,
                brand: "Mazda",
                model: "CX-5",
              },
            },
            error: null,
          }),
        }),
      }),
    });

    await expect(completeNotificationService.createBookingNotification(
      bookingId,
      "confirmed",
      "Host confirmation",
      "Renter confirmation"
    )).resolves.toEqual({ success: true });

    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: hostId,
      type: "booking_confirmed_host",
      title: "Booking Confirmed",
      relatedCarId: carId,
      roleTarget: "host_only",
    }));
    expect(createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: renterId,
      type: "booking_confirmed_renter",
      description: "Renter confirmation",
      roleTarget: "renter_only",
    }));
    createNotification.mockRestore();
  });
});
