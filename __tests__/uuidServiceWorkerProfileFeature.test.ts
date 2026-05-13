import { isFeatureEnabled } from "@/lib/featureFlags";
import { createLocationUpdatePayload, hasLocationFields } from "@/utils/profileTypes";
import { registerServiceWorker, unregisterServiceWorker } from "@/utils/serviceWorkerRegistration";
import { generateUUID } from "@/utils/uuid";

describe("UUID utility", () => {
  const originalCrypto = global.crypto;

  afterEach(() => {
    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: originalCrypto,
    });
    jest.restoreAllMocks();
  });

  it("uses crypto.randomUUID when available", () => {
    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: { randomUUID: jest.fn(() => "generated-by-crypto") },
    });

    expect(generateUUID()).toBe("generated-by-crypto");
  });

  it("falls back to an RFC4122-shaped UUID when crypto.randomUUID is unavailable", () => {
    Object.defineProperty(global, "crypto", {
      configurable: true,
      value: undefined,
    });
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    expect(generateUUID()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("service worker registration utilities", () => {
  const originalServiceWorker = navigator.serviceWorker;

  afterEach(() => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: originalServiceWorker,
    });
    jest.restoreAllMocks();
  });

  it("registers the push service worker when supported", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    const registration = { scope: "/" };
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        register: jest.fn().mockResolvedValue(registration),
      },
    });

    await expect(registerServiceWorker()).resolves.toBe(registration);
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/push-sw.js", { scope: "/" });
  });

  it("returns false when unregister has no registration to remove", async () => {
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: jest.fn().mockResolvedValue(undefined),
      },
    });

    await expect(unregisterServiceWorker()).resolves.toBe(false);
  });

  it("unregisters an existing service worker registration", async () => {
    const unregister = jest.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: jest.fn().mockResolvedValue({ unregister }),
      },
    });

    await expect(unregisterServiceWorker()).resolves.toBe(true);
    expect(unregister).toHaveBeenCalled();
  });
});

describe("profile type helpers and feature flags", () => {
  it("detects location sharing fields without relying on row keys", () => {
    expect(hasLocationFields(null)).toBeFalsy();
    expect(hasLocationFields({ role: "renter" })).toBeFalsy();
    expect(hasLocationFields({
      is_sharing_location: true,
      location_sharing_scope: "booking",
    })).toBeTruthy();
  });

  it("creates location update payloads with coordinates only while sharing", () => {
    const withoutCoords = createLocationUpdatePayload(false, { latitude: 1, longitude: 2 });
    expect(withoutCoords).toMatchObject({ is_sharing_location: false });
    expect(withoutCoords).not.toHaveProperty("latitude");
    expect(withoutCoords).not.toHaveProperty("longitude");

    const withCoords = createLocationUpdatePayload(true, { latitude: -24.6, longitude: 25.9 });
    expect(withCoords).toMatchObject({
      is_sharing_location: true,
      latitude: -24.6,
      longitude: 25.9,
    });
    expect(new Date(withCoords.updated_at).toString()).not.toBe("Invalid Date");
  });

  it("reports enabled and disabled feature flags", () => {
    expect(isFeatureEnabled("DYNAMIC_PRICING")).toBe(true);
    expect(isFeatureEnabled("INSURANCE_V2")).toBe(true);
    expect(isFeatureEnabled("SUPERADMIN_ANALYTICS")).toBe(false);
  });
});
