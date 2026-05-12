import {
  createEarlyReturnNotification,
  createNavigationNotification,
  ResendEmailService,
  triggerNavigationEvent,
  TwilioNotificationService,
  TwilioWhatsAppService,
} from "@/services/notificationService";
import { supabase } from "@/integrations/supabase/client";
import { reverseGeocode } from "@/utils/mapbox";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

jest.mock("@/utils/mapbox", () => ({
  reverseGeocode: jest.fn(),
}));

const recipient = {
  id: "user-1",
  name: "Test User",
  email: "test@example.com",
  phone: "26770000000",
  emailEnabled: true,
  whatsappEnabled: true,
};

const bookingData = {
  bookingId: "booking-1",
  customerName: "Test User",
  hostName: "Host User",
  carBrand: "Toyota",
  carModel: "Vitz",
  pickupDate: "2026-05-15",
  pickupTime: "09:00",
  pickupLocation: "Gaborone",
  dropoffLocation: "Airport",
  totalAmount: 500,
  bookingReference: "MR-001",
};

describe("notificationService coverage", () => {
  let emailService: ResendEmailService;
  let whatsappService: TwilioWhatsAppService;
  let legacyService: TwilioNotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    emailService = ResendEmailService.getInstance();
    whatsappService = TwilioWhatsAppService.getInstance();
    legacyService = TwilioNotificationService.getInstance();
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
    jest.restoreAllMocks();
  });

  it("sends email through the Resend edge function and handles failures", async () => {
    (supabase.functions.invoke as jest.Mock)
      .mockResolvedValueOnce({ data: { success: true, data: { id: "email-1" } }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "edge unavailable" } })
      .mockResolvedValueOnce({ data: { success: false, error: "template missing" }, error: null })
      .mockRejectedValueOnce(new Error("network down"));

    await expect(emailService.sendEmail("to@example.com", "welcome-renter", { name: "User" }, "Subject"))
      .resolves.toEqual({ success: true, messageId: "email-1" });
    await expect(emailService.sendEmail("to@example.com", "welcome-renter", {}))
      .resolves.toEqual({ success: false, error: "edge unavailable" });
    await expect(emailService.sendEmail("to@example.com", "missing-template", {}))
      .resolves.toEqual({ success: false, error: "template missing" });
    await expect(emailService.sendEmail("to@example.com", "welcome-renter", {}))
      .resolves.toEqual({ success: false, error: "network down" });
  });

  it("builds common email notification payloads and rejects missing email recipients", async () => {
    const sendEmail = jest.spyOn(emailService, "sendEmail").mockResolvedValue({ success: true, messageId: "email-2" });

    await expect(emailService.sendWelcomeEmail({ ...recipient, email: undefined })).resolves.toEqual({
      success: false,
      error: "No email address provided",
    });
    await emailService.sendWelcomeEmail(recipient);
    await emailService.sendVerificationStatusUpdate(recipient, false, "Blurry ID");
    await emailService.sendBookingConfirmation(recipient, bookingData, true);
    await emailService.sendPaymentRequiredEmail(recipient, bookingData);
    await emailService.sendBookingRequestReceivedEmail(recipient, bookingData);
    await emailService.sendPickupReminder(recipient, bookingData);
    await emailService.sendReturnReminder(recipient, bookingData);
    await emailService.sendPromoNotification(recipient, {
      code: "SAVE10",
      discount: "10%",
      description: "Launch offer",
    });
    await emailService.sendPayoutConfirmation(recipient, {
      amount: 250,
      payoutDate: "2026-05-20",
      paymentMethod: "bank",
      transactionId: "txn-1",
    });
    await emailService.sendReviewRequest(recipient, "Toyota Vitz", "https://app.mobirides.com/review");
    await emailService.sendListingStatusUpdate(recipient, {
      carName: "Toyota Vitz",
      status: "approved",
      listingUrl: "https://app.mobirides.com/cars/car-1",
    });
    await emailService.sendBookingModification(recipient, {
      bookingReference: "MR-001",
      modificationDetails: "Time changed",
      bookingUrl: "https://app.mobirides.com/bookings/booking-1",
    });
    await emailService.sendWalletNotification(recipient, { message: "Top up received", balance: 300 });

    expect(sendEmail).toHaveBeenCalledWith("test@example.com", "welcome-renter", expect.objectContaining({
      first_name: "Test",
    }), "Welcome to MobiRides! 🚗");
    expect(sendEmail).toHaveBeenCalledWith("test@example.com", "verification-rejected", expect.objectContaining({
      rejectionReason: "Blurry ID",
    }), "Action Required: Your Verification was not approved");
    expect(sendEmail).toHaveBeenCalledWith("test@example.com", "owner-booking-notification", expect.any(Object), expect.stringContaining("New Booking Request"));
    expect(sendEmail).toHaveBeenCalledWith("test@example.com", "wallet-notification", expect.objectContaining({
      balance: "300.00",
    }), "💳 Wallet Activity - MobiRides");
  });

  it("sends WhatsApp messages and formats phone numbers", async () => {
    (supabase.functions.invoke as jest.Mock)
      .mockResolvedValueOnce({ data: { messageId: "wa-1" }, error: null })
      .mockRejectedValueOnce(new Error("twilio down"));

    await expect(whatsappService.sendWhatsApp("26770000000", "TPL", { "1": "User" })).resolves.toEqual({
      success: true,
      messageId: "wa-1",
    });
    await expect(whatsappService.sendWhatsApp("+26770000000", "TPL", {})).resolves.toEqual({
      success: false,
      error: "twilio down",
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith("send-whatsapp", {
      body: {
        to: "+26770000000",
        templateSid: "TPL",
        variables: { "1": "User" },
      },
    });
  });

  it("builds WhatsApp booking reminder payloads", async () => {
    const sendWhatsApp = jest.spyOn(whatsappService, "sendWhatsApp").mockResolvedValue({ success: true, messageId: "wa-2" });

    await expect(whatsappService.sendBookingConfirmation({ ...recipient, phone: undefined }, bookingData))
      .resolves.toEqual({ success: false, error: "No phone number provided" });
    await whatsappService.sendBookingConfirmation(recipient, bookingData, true);
    await whatsappService.sendPickupReminder(recipient, bookingData);
    await whatsappService.sendReturnReminder(recipient, bookingData);

    expect(sendWhatsApp).toHaveBeenCalledWith("26770000000", "BOOKING_REQUEST_TEMPLATE", expect.objectContaining({
      "3": "Toyota Vitz",
    }));
    expect(sendWhatsApp).toHaveBeenCalledWith("26770000000", "PICKUP_REMINDER_TEMPLATE", expect.objectContaining({
      "6": "Gaborone",
    }));
    expect(sendWhatsApp).toHaveBeenCalledWith("26770000000", "RETURN_REMINDER_TEMPLATE", expect.objectContaining({
      "4": "Airport",
    }));
  });

  it("combines enabled legacy notification channels", async () => {
    jest.spyOn(legacyService, "sendWhatsApp").mockResolvedValue({ success: true, messageId: "wa-3" });
    jest.spyOn(legacyService, "sendEmail").mockResolvedValue({ success: true, messageId: "email-3" });

    await expect(legacyService.sendBookingConfirmation(recipient, bookingData)).resolves.toEqual({
      whatsapp: { success: true, messageId: "wa-3" },
      email: { success: true, messageId: "email-3" },
    });
    await expect(legacyService.sendPickupReminder(recipient, bookingData, 24)).resolves.toEqual({
      whatsapp: { success: true, messageId: "wa-3" },
    });
    await expect(legacyService.sendEarlyReturnNotification(recipient, bookingData, "2026-05-16")).resolves.toEqual({
      whatsapp: { success: true, messageId: "wa-3" },
      email: { success: true, messageId: "email-3" },
    });
  });

  it("creates navigation and early return booking notifications", async () => {
    (reverseGeocode as jest.Mock).mockResolvedValue("Central Mall");
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: null });

    await createNavigationNotification("pickup_location_shared", {
      bookingId: "booking-1",
      userId: "user-1",
      location: { latitude: -24.6, longitude: 25.9 },
    });
    await triggerNavigationEvent("booking-2", "arrive_pickup", "user-2", {
      latitude: -24.7,
      longitude: 25.8,
      address: "Airport",
    });
    await createEarlyReturnNotification("booking-3", "2026-05-16", "2026-05-18");

    expect(supabase.rpc).toHaveBeenCalledWith("create_booking_notification", expect.objectContaining({
      p_booking_id: "booking-1",
      p_content: "Pickup location has been shared at Central Mall",
    }));
    expect(supabase.rpc).toHaveBeenCalledWith("create_booking_notification", expect.objectContaining({
      p_booking_id: "booking-2",
      p_content: "Driver has arrived at the pickup location at Airport",
    }));
    expect(supabase.rpc).toHaveBeenCalledWith("create_booking_notification", expect.objectContaining({
      p_booking_id: "booking-3",
      p_notification_type: "early_return_notification",
    }));
  });

  it("surfaces booking notification RPC errors", async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ error: { message: "rpc failed" } });

    await expect(createEarlyReturnNotification("booking-4", "2026-05-16", "2026-05-18"))
      .rejects.toEqual({ message: "rpc failed" });
  });

  it("sends and cancels admin broadcasts through the broadcast edge function", async () => {
    (supabase.functions.invoke as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          success: true,
          broadcast_id: "broadcast-1",
          recipient_count: 10,
          delivery_count: 9,
          failure_count: 1,
          scheduled_at: "2026-05-20T08:00:00Z",
          rateLimited: false,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { success: true }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "edge failed" } })
      .mockRejectedValueOnce(new Error("network down"));

    await expect(emailService.sendSystemBroadcast({
      audience: "all",
      channel: "both",
      subject: "Maintenance",
      message: "Scheduled maintenance",
    })).resolves.toMatchObject({
      success: true,
      broadcastId: "broadcast-1",
      recipientCount: 10,
      deliveryCount: 9,
      failureCount: 1,
    });
    await expect(emailService.cancelBroadcast("broadcast-1")).resolves.toEqual({ success: true, error: undefined });
    await expect(emailService.sendSystemBroadcast({
      audience: "hosts",
      channel: "email",
      subject: "Host update",
      message: "Details",
    })).resolves.toEqual({ success: false, error: "edge failed" });
    await expect(emailService.cancelBroadcast("broadcast-2")).resolves.toEqual({ success: false, error: "network down" });
  });
});
