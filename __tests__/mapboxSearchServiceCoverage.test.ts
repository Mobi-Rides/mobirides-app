const getMapboxToken = jest.fn();

jest.mock("@/utils/mapbox", () => ({
  getMapboxToken: () => getMapboxToken(),
}));

describe("mapboxSearchService coverage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    getMapboxToken.mockReset();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const loadService = async () => {
    const mod = await import("@/services/mapboxSearchService");
    return mod.mapboxSearchService;
  };

  it("initializes once, skips blank searches, and maps geocoding results", async () => {
    getMapboxToken.mockResolvedValue("pk.test-token");
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "place.1",
            text: "Gaborone",
            place_name: "Gaborone, Botswana",
            geometry: { coordinates: [25.9, -24.6] },
            place_type: ["place"],
            context: [
              { id: "country.1", text: "Botswana" },
              { id: "region.1", text: "South-East" },
              { id: "district.1", text: "Gaborone" },
            ],
          },
        ],
      }),
    });

    const service = await loadService();

    await expect(service.initialize()).resolves.toBeUndefined();
    await expect(service.search("   ")).resolves.toEqual({
      suggestions: [],
      query: "   ",
    });

    const result = await service.search("gabs");

    expect(getMapboxToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("country=BW");
    expect(result).toEqual({
      query: "gabs",
      suggestions: [
        {
          id: "place.1",
          name: "Gaborone",
          full_address: "Gaborone, Botswana",
          coordinates: [25.9, -24.6],
          place_type: ["place"],
          context: {
            country: "Botswana",
            region: "South-East",
            district: "Gaborone",
            place: undefined,
          },
        },
      ],
    });
  });

  it("throws initialization and search API errors", async () => {
    getMapboxToken.mockResolvedValueOnce("");
    const service = await loadService();

    await expect(service.initialize()).rejects.toThrow("Mapbox token not available");

    getMapboxToken.mockResolvedValueOnce("pk.retry-token");
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
    });

    await expect(service.search("airport")).rejects.toThrow("Geocoding API error: 500 Server Error");
  });

  it("returns coordinates, null results, and null on coordinate fetch errors", async () => {
    getMapboxToken.mockResolvedValue("pk.test-token");
    const fetchMock = global.fetch as jest.Mock;
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [{ geometry: { coordinates: [26.1, -24.4] } }] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ features: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

    const service = await loadService();

    await expect(service.getCoordinates("place.1")).resolves.toEqual([26.1, -24.4]);
    await expect(service.getCoordinates("missing")).resolves.toBeNull();
    await expect(service.getCoordinates("broken")).resolves.toBeNull();
  });
});
