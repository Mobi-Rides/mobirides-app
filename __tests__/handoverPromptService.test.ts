import { HandoverPrompt, HandoverPromptService } from "@/services/handoverPromptService";

const basePrompt: HandoverPrompt = {
  id: "booking-1",
  bookingId: "booking-1",
  carId: "car-1",
  handoverType: "pickup",
  isUrgent: false,
  urgencyLevel: "morning",
  carBrand: "Toyota",
  carModel: "Corolla",
  startDate: new Date("2026-05-12T08:00:00.000Z"),
  endDate: new Date("2026-05-14T08:00:00.000Z"),
  userRole: "renter",
  shouldInitiate: true,
  otherPartyName: "Host User",
  location: "Gaborone",
};

describe("HandoverPromptService display helpers", () => {
  it("returns urgency copy for morning, soon, and immediate prompts", () => {
    expect(HandoverPromptService.getUrgencyMessage({
      ...basePrompt,
      urgencyLevel: "morning",
    })).toContain("Pickup today");

    expect(HandoverPromptService.getUrgencyMessage({
      ...basePrompt,
      handoverType: "return",
      urgencyLevel: "soon",
    })).toContain("Return in less than 2 hours");

    expect(HandoverPromptService.getUrgencyMessage({
      ...basePrompt,
      urgencyLevel: "immediate",
    })).toContain("URGENT");
  });

  it("returns action copy for initiating and preparing parties", () => {
    expect(HandoverPromptService.getActionMessage(basePrompt)).toBe("Start pickup process with Host User");

    expect(HandoverPromptService.getActionMessage({
      ...basePrompt,
      handoverType: "return",
      shouldInitiate: true,
    })).toBe("Start return process with Host User");

    expect(HandoverPromptService.getActionMessage({
      ...basePrompt,
      shouldInitiate: false,
      otherPartyName: "Renter User",
    })).toBe("Prepare for pickup by Renter User");

    expect(HandoverPromptService.getActionMessage({
      ...basePrompt,
      handoverType: "return",
      shouldInitiate: false,
      otherPartyName: "Renter User",
    })).toBe("Prepare for return from Renter User");
  });
});
