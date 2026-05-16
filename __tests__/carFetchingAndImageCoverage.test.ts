import { fetchCars } from "@/utils/carFetching";
import { getCarImagePublicUrl } from "@/utils/carImageUtils";
import { supabase } from "@/integrations/supabase/client";

jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

const makeCar = (overrides: Record<string, unknown> = {}) => ({
  id: `car-${crypto.randomUUID()}`,
  brand: "Toyota",
  model: "Corolla",
  year: 2024,
  price_per_day: 550,
  is_available: true,
  ...overrides,
});

const makeCarQuery = (response: unknown) => {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    range: jest.fn(),
    or: jest.fn(),
    ilike: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    then: (resolve: (value: unknown) => unknown, reject: (reason?: unknown) => unknown) =>
      Promise.resolve(response).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.range.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  query.lte.mockReturnValue(query);
  query.order.mockReturnValue(query);

  return query;
};

describe("car fetching and image utilities coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("applies search, filter, pagination, and sort clauses when fetching cars", async () => {
    const rows = Array.from({ length: 10 }, (_, index) => makeCar({ id: `car-${index}` }));
    const query = makeCarQuery({ data: rows, error: null, count: 25 });
    (supabase.from as jest.Mock).mockReturnValue(query);

    const result = await fetchCars({
      pageParam: 2,
      filters: {
        model: "rolla",
        year: 2024,
        minPrice: 300,
        maxPrice: 800,
        vehicleType: "sedan",
        location: "Gaborone",
        sortBy: "price",
        sortOrder: "asc",
      } as never,
      searchParams: {
        brand: "Toyota",
        searchTerm: "corolla",
      },
    });

    expect(supabase.from).toHaveBeenCalledWith("cars");
    expect(query.select).toHaveBeenCalledWith("*", { count: "exact" });
    expect(query.eq).toHaveBeenCalledWith("is_available", true);
    expect(query.range).toHaveBeenCalledWith(20, 29);
    expect(query.or).toHaveBeenCalledWith("brand.ilike.%corolla%,model.ilike.%corolla%");
    expect(query.eq).toHaveBeenCalledWith("brand", "Toyota");
    expect(query.ilike).toHaveBeenCalledWith("model", "%rolla%");
    expect(query.eq).toHaveBeenCalledWith("year", 2024);
    expect(query.gte).toHaveBeenCalledWith("price_per_day", 300);
    expect(query.lte).toHaveBeenCalledWith("price_per_day", 800);
    expect(query.eq).toHaveBeenCalledWith("vehicle_type", "sedan");
    expect(query.ilike).toHaveBeenCalledWith("location", "%Gaborone%");
    expect(query.order).toHaveBeenCalledWith("price_per_day", { ascending: true });
    expect(result).toEqual({ data: rows, nextPage: 3, count: 25 });
  });

  it("filters malformed car rows and throws Supabase errors", async () => {
    const validCar = makeCar();
    const query = makeCarQuery({
      data: [validCar, null, { id: "missing-brand", model: "Nope" }, { brand: "No id", model: "Nope" }],
      error: null,
      count: 4,
    });
    (supabase.from as jest.Mock).mockReturnValueOnce(query);

    await expect(fetchCars({})).resolves.toEqual({
      data: [validCar],
      nextPage: undefined,
      count: 4,
    });

    const error = new Error("database unavailable");
    (supabase.from as jest.Mock).mockReturnValueOnce(makeCarQuery({ data: null, error, count: null }));

    await expect(fetchCars({ pageParam: 1 })).rejects.toThrow("database unavailable");
    expect(console.error).toHaveBeenCalledWith("Error fetching cars:", error);
  });

  it("returns existing image URLs and parses stored array image paths", () => {
    (supabase.storage.from as jest.Mock).mockReturnValue({
      getPublicUrl: jest.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
    });

    expect(getCarImagePublicUrl(null)).toBeUndefined();
    expect(getCarImagePublicUrl("null")).toBeUndefined();
    expect(getCarImagePublicUrl("undefined")).toBeUndefined();
    expect(getCarImagePublicUrl("https://example.test/car.jpg")).toBe("https://example.test/car.jpg");
    expect(getCarImagePublicUrl("/images/car.jpg")).toBe("/images/car.jpg");
    expect(getCarImagePublicUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
    expect(getCarImagePublicUrl('["fleet/car.jpg"]')).toBe("https://cdn.test/fleet/car.jpg");
    expect(getCarImagePublicUrl("[not-json")).toBe("https://cdn.test/[not-json");
  });
});
