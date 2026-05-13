const put = jest.fn();
const get = jest.fn();
const del = jest.fn();
const clear = jest.fn();
const contains = jest.fn(() => false);
const createObjectStore = jest.fn();

jest.mock("idb", () => ({
  openDB: jest.fn((_name, _version, options) => {
    options.upgrade({
      objectStoreNames: { contains },
      createObjectStore,
    });
    return Promise.resolve({
      put,
      get,
      delete: del,
      clear,
    });
  }),
}));

import { offlineNavigationService } from "@/services/offlineNavigationService";

const makeRouteRequest = () => ({
  origin: { latitude: -24.6, longitude: 25.9 },
  destination: { latitude: -24.7, longitude: 25.8 },
  waypoints: [{ latitude: -24.65, longitude: 25.85 }],
  profile: "driving" as const,
});

const makeRoute = () => ({
  distance: 1200,
  duration: 360,
  geometry: {
    coordinates: [[25.9, -24.6], [25.8, -24.7]],
    type: "LineString" as const,
  },
  steps: [],
});

describe("offlineNavigationService coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(4000000000000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("saves routes with a deterministic request key", async () => {
    const request = makeRouteRequest();
    const route = makeRoute();

    await offlineNavigationService.saveRoute(request as any, route as any);

    expect(put).toHaveBeenCalledWith(
      "routes",
      { route, timestamp: 4000000000000, request },
      "driving:-24.6,25.9->-24.7,25.8[-24.65,25.85]"
    );
  });

  it("returns cached routes that have not expired", async () => {
    const request = makeRouteRequest();
    const route = makeRoute();
    get.mockResolvedValue({
      route,
      request,
      timestamp: 4000000000000 - 1000,
    });

    await expect(offlineNavigationService.getOfflineRoute(request as any)).resolves.toEqual(route);
    expect(del).not.toHaveBeenCalled();
  });

  it("deletes expired cached routes", async () => {
    const request = makeRouteRequest();
    get.mockResolvedValue({
      route: makeRoute(),
      request,
      timestamp: 4000000000000 - (8 * 24 * 60 * 60 * 1000),
    });

    await expect(offlineNavigationService.getOfflineRoute(request as any)).resolves.toBeNull();
    expect(del).toHaveBeenCalledWith("routes", "driving:-24.6,25.9->-24.7,25.8[-24.65,25.85]");
  });

  it("clears the route cache", async () => {
    await offlineNavigationService.clearCache();

    expect(clear).toHaveBeenCalledWith("routes");
  });
});
