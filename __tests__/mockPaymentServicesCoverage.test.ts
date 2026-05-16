import { mockBookingPaymentService } from "@/services/mockBookingPaymentService";
import { mockPaymentService } from "@/services/mockPaymentService";

const makeBookingRequest = (grandTotal: number) => ({
  booking_id: `booking-${crypto.randomUUID()}`,
  payment_method: "card" as const,
  base_rental_price: 1000,
  dynamic_pricing_adjustment: 100,
  insurance_premium: 200,
  discount_amount: 50,
  grand_total: grandTotal,
});

describe("mock payment services coverage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(4000000000000);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("exposes preset amounts and payment methods", () => {
    expect(mockPaymentService.getPresetAmounts()).toEqual([50, 100, 200, 500, 1000]);
    expect(mockPaymentService.getPaymentMethodById("bank_transfer")).toEqual(expect.objectContaining({
      id: "bank_transfer",
      name: "Bank Transfer",
    }));
    expect(mockPaymentService.getPaymentMethodById("missing")).toBeUndefined();
    expect(mockPaymentService.isValidAmount(10)).toBe(true);
    expect(mockPaymentService.isValidAmount(50001)).toBe(false);
  });

  it("processes wallet payment success and failure paths deterministically", async () => {
    jest.spyOn(Math, "random")
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.123456);

    const successPromise = mockPaymentService.processPayment({
      amount: 100,
      payment_method: "card",
    });
    jest.advanceTimersByTime(2000);

    await expect(successPromise).resolves.toEqual(expect.objectContaining({
      success: true,
      payment_reference: expect.stringMatching(/^PAY_4000000000000_/),
    }));

    (Math.random as jest.Mock).mockReturnValue(0.01);
    const failurePromise = mockPaymentService.processPayment({
      amount: 100,
      payment_method: "card",
    });
    jest.advanceTimersByTime(2000);

    await expect(failurePromise).resolves.toEqual(expect.objectContaining({
      success: false,
      error_message: expect.any(String),
    }));
  });

  it("returns deterministic booking payment failure trigger codes", async () => {
    const insufficientFunds = mockBookingPaymentService.processPayment(makeBookingRequest(1200.01));
    jest.advanceTimersByTime(2000);
    await expect(insufficientFunds).resolves.toEqual(expect.objectContaining({
      success: false,
      error_code: "INSUFFICIENT_FUNDS",
    }));

    const timeout = mockBookingPaymentService.processPayment(makeBookingRequest(1200.02));
    jest.advanceTimersByTime(2000);
    await expect(timeout).resolves.toEqual(expect.objectContaining({
      success: false,
      error_code: "TIMEOUT",
    }));

    const declined = mockBookingPaymentService.processPayment(makeBookingRequest(1200.03));
    jest.advanceTimersByTime(2000);
    await expect(declined).resolves.toEqual(expect.objectContaining({
      success: false,
      error_code: "DECLINED",
    }));
  });

  it("calculates booking payment splits on successful payment", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.333333);
    const payment = mockBookingPaymentService.processPayment(makeBookingRequest(1250.99));
    jest.advanceTimersByTime(2000);

    await expect(payment).resolves.toEqual(expect.objectContaining({
      success: true,
      platform_commission: 157.5,
      host_earnings: 892.5,
      mobirides_insurance_commission: 20,
      payu_remittance_amount: 180,
      transaction_id: expect.stringMatching(/^TXN_4000000000000_/),
    }));
  });

  it("returns pending user action for mobile money trigger amounts", async () => {
    const payment = mockBookingPaymentService.processPayment({
      ...makeBookingRequest(1200.04),
      payment_method: "orange_money",
      mobile_number: "+26770000000",
    });
    jest.advanceTimersByTime(2000);

    await expect(payment).resolves.toEqual(expect.objectContaining({
      success: true,
      requires_user_action: true,
      transaction_id: "TXN_4000000000000_PENDING",
      provider_reference: "REF_4000000000000_USSD",
    }));
  });
});
