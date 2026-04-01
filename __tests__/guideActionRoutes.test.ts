import { getRouteForAction } from "@/utils/guideActionRoutes";

describe("guideActionRoutes", () => {
  it("returns route for direct action match", () => {
    expect(getRouteForAction("Go to Sign Up")).toBe("/signup");
    expect(getRouteForAction("Browse Cars")).toBe("/cars");
  });

  it("returns route for case-insensitive action match", () => {
    expect(getRouteForAction("go to sign up")).toBe("/signup");
    expect(getRouteForAction("wallet")).toBe("/wallet");
  });

  it("returns null for unknown action", () => {
    expect(getRouteForAction("Unmapped Action")).toBeNull();
  });

  it("returns null when action is undefined", () => {
    expect(getRouteForAction(undefined)).toBeNull();
  });
});