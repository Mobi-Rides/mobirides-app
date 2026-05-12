import {
  getBackDestination,
  getParentRoute,
  getRouteMetadata,
  isDetailPage,
  isRootRoute,
} from "@/lib/navigation";

describe("navigation route helpers", () => {
  it("resolves exact and parameterized parent routes", () => {
    expect(getParentRoute("/wallet")).toBe("/more");
    expect(getParentRoute("/rental-details/generated-booking")).toBe("/bookings");
    expect(getParentRoute("/cars/generated-car")).toEqual(["/", "/map"]);
    expect(getParentRoute("/unknown-route")).toBeNull();
  });

  it("identifies root routes and detail pages", () => {
    expect(isRootRoute("/")).toBe(true);
    expect(isRootRoute("/admin")).toBe(true);
    expect(isRootRoute("/rental-details/generated-booking")).toBe(false);

    expect(isDetailPage("/rental-details/generated-booking")).toBe(true);
    expect(isDetailPage("/unknown-route")).toBe(false);
  });

  it("returns back destinations from route hierarchy", () => {
    expect(getBackDestination("/cars/generated-car")).toBe("/");
    expect(getBackDestination("/settings/security")).toBe("/more");
    expect(getBackDestination("/unknown-route")).toBe("back");
  });

  it("returns metadata for known and unknown routes", () => {
    expect(getRouteMetadata("/dashboard")).toMatchObject({
      title: "Dashboard",
      showBackButton: false,
      isRoot: true,
    });

    expect(getRouteMetadata("/rental-details/generated-booking")).toMatchObject({
      title: "",
      showBackButton: true,
      isRoot: false,
    });
  });
});
