import { getDisplayName, getDisplayNameWithEmail } from "@/utils/displayName";

describe("displayName utils", () => {
  it("returns full name when available", () => {
    expect(getDisplayName({ full_name: "Jane Doe", email: "jane@example.com" })).toBe("Jane Doe");
  });

  it("falls back to email when full name is missing", () => {
    expect(getDisplayName({ email: "jane@example.com" })).toBe("jane@example.com");
  });

  it("falls back to truncated user id when only id exists", () => {
    expect(getDisplayName({ id: "1234567890abcdef" })).toBe("User 12345678...");
  });

  it("returns unknown user as final fallback", () => {
    expect(getDisplayName({})).toBe("Unknown User");
  });

  it("formats full name with email when both are present", () => {
    expect(getDisplayNameWithEmail({ full_name: "Jane Doe", email: "jane@example.com" })).toBe(
      "Jane Doe (jane@example.com)",
    );
  });

  it("falls back to base display name logic when email or full name is missing", () => {
    expect(getDisplayNameWithEmail({ email: "jane@example.com" })).toBe("jane@example.com");
    expect(getDisplayNameWithEmail({ id: "1234567890abcdef" })).toBe("User 12345678...");
  });
});