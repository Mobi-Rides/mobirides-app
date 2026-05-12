import { navigationService, NavigationRoute, RouteRequest } from "@/services/navigationService";
import { offlineNavigationService } from "@/services/offlineNavigationService";
import { getMapboxToken } from "@/utils/mapbox";
import { toast } from "@/utils/toast-utils";

jest.mock("@/utils/mapbox", () => ({
  getMapboxToken: jest.fn(),
}));

jest.mock("@/utils/toast-utils", () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock("@/services/offlineNavigationService", () => ({
  offlineNavigationService: {
    getOfflineRoute: jest.fn(),
    saveRoute: jest.fn(),
  },
}));

jest.mock("@/utils/navigationAnalytics", () => ({
  navigationAnalytics: {
    startSession: jest.fn(() => "session-1"),
    endSession: jest.fn(),
    logReroute: jest.fn(),
  },
}));

const routeRequest: RouteRequest = {
  origin: { latitude: -24.6282, longitude: 25.9231 },
  destination: { latitude: -24.654, longitude: 25.91 },
};

const sampleRoute: NavigationRoute = {
  geometry: {
    type: "LineString",
    coordinates: [
      [25.9231, -24.6282],
      [25.91, -24.654],
    ],
  },
  distance: 1500,
  duration: 600,
  steps: [
    {
      instruction: "Head south",
      distance: 1500,
      duration: 600,
      maneuver: "depart",
      road_name: "Main Road",
      geometry: {
        type: "LineString",
        coordinates: [
          [25.9231, -24.6282],
          [25.91, -24.654],
        ],
      },
    },
  ],
};

describe("navigationService", () => {
  const originalFetch = global.fetch;
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    jest.clearAllMocks();
    navigationService.stopActiveNavigation();
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    (getMapboxToken as jest.Mock).mockResolvedValue("mapbox-token");
    (offlineNavigationService.getOfflineRoute as jest.Mock).mockResolvedValue(null);
    (offlineNavigationService.saveRoute as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: originalShare,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
  });

  it("formats distances and durations for navigation UI", () => {
    expect(navigationService.formatDistance(250)).toBe("250m");
    expect(navigationService.formatDistance(1550)).toBe("1.6km");
    expect(navigationService.formatDuration(30)).toBe("< 1 min");
    expect(navigationService.formatDuration(900)).toBe("15 min");
    expect(navigationService.formatDuration(7320)).toBe("2h 2m");
  });

  it("fetches a Mapbox route and caches it for offline use", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [
          {
            geometry: sampleRoute.geometry,
            distance: sampleRoute.distance,
            duration: sampleRoute.duration,
            legs: [
              {
                steps: [
                  {
                    maneuver: { instruction: "Head south", type: "depart" },
                    distance: 1500,
                    duration: 600,
                    name: "Main Road",
                    geometry: sampleRoute.steps[0].geometry,
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as Response);

    const route = await navigationService.getRoute(routeRequest);

    expect(getMapboxToken).toHaveBeenCalled();
    expect(route?.steps[0].instruction).toBe("Head south");
    expect(route?.steps[0].road_name).toBe("Main Road");
    expect(offlineNavigationService.saveRoute).toHaveBeenCalledWith(routeRequest, expect.objectContaining({
      distance: 1500,
      duration: 600,
    }));
  });

  it("returns cached routes while offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    (offlineNavigationService.getOfflineRoute as jest.Mock).mockResolvedValue(sampleRoute);

    const route = await navigationService.getRoute(routeRequest);

    expect(route).toEqual(sampleRoute);
    expect(toast.info).toHaveBeenCalledWith("Using offline route");
  });

  it("falls back to clipboard sharing when native share is unavailable", async () => {
    const success = await navigationService.shareETA("Airport", "12:30");

    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("I'm on my way to Airport. ETA: 12:30");
    expect(toast.success).toHaveBeenCalledWith("ETA copied to clipboard");
  });
});
