// __tests__/sessionAnomalyAlgorithms.test.ts
//
// Tests for the pure detection algorithm functions from
// supabase/functions/session-monitor/index.ts — duplicated here for Jest
// testability (no Deno runtime required).

// ── Pure helpers (duplicated from edge function) ──────────────────────────────

const CONTINENT_MAP: Record<string, string> = {
  // Africa
  DZ: "AF", AO: "AF", BJ: "AF", BW: "AF", BF: "AF", BI: "AF", CM: "AF",
  CV: "AF", CF: "AF", TD: "AF", KM: "AF", CG: "AF", CD: "AF", DJ: "AF",
  EG: "AF", GQ: "AF", ER: "AF", ET: "AF", GA: "AF", GM: "AF", GH: "AF",
  GN: "AF", GW: "AF", CI: "AF", KE: "AF", LS: "AF", LR: "AF", LY: "AF",
  MG: "AF", MW: "AF", ML: "AF", MR: "AF", MU: "AF", MA: "AF", MZ: "AF",
  NA: "AF", NE: "AF", NG: "AF", RW: "AF", ST: "AF", SN: "AF", SL: "AF",
  SO: "AF", ZA: "AF", SS: "AF", SD: "AF", SZ: "AF", TZ: "AF", TG: "AF",
  TN: "AF", UG: "AF", ZM: "AF", ZW: "AF",
  // North America
  AG: "NA", BS: "NA", BB: "NA", BZ: "NA", CA: "NA", CR: "NA", CU: "NA",
  DM: "NA", DO: "NA", SV: "NA", GD: "NA", GT: "NA", HT: "NA", HN: "NA",
  JM: "NA", MX: "NA", NI: "NA", PA: "NA", KN: "NA", LC: "NA", VC: "NA",
  TT: "NA", US: "NA",
  // South America
  AR: "SA", BO: "SA", BR: "SA", CL: "SA", CO: "SA", EC: "SA", GY: "SA",
  PY: "SA", PE: "SA", SR: "SA", UY: "SA", VE: "SA",
  // Europe
  AL: "EU", AD: "EU", AT: "EU", BY: "EU", BE: "EU", BA: "EU", BG: "EU",
  HR: "EU", CY: "EU", CZ: "EU", DK: "EU", EE: "EU", FI: "EU", FR: "EU",
  DE: "EU", GR: "EU", HU: "EU", IS: "EU", IE: "EU", IT: "EU", XK: "EU",
  LV: "EU", LI: "EU", LT: "EU", LU: "EU", MT: "EU", MD: "EU", MC: "EU",
  ME: "EU", NL: "EU", MK: "EU", NO: "EU", PL: "EU", PT: "EU", RO: "EU",
  RU: "EU", SM: "EU", RS: "EU", SK: "EU", SI: "EU", ES: "EU", SE: "EU",
  CH: "EU", UA: "EU", GB: "EU", VA: "EU",
  // Asia
  AM: "AS", AZ: "AS", BH: "AS", BD: "AS", BT: "AS", BN: "AS", KH: "AS",
  CN: "AS", GE: "AS", IN: "AS", ID: "AS", IR: "AS", IQ: "AS", IL: "AS",
  JP: "AS", JO: "AS", KZ: "AS", KW: "AS", KG: "AS", LA: "AS", LB: "AS",
  MY: "AS", MV: "AS", MN: "AS", MM: "AS", NP: "AS", KP: "AS", OM: "AS",
  PK: "AS", PS: "AS", PH: "AS", QA: "AS", SA: "AS", SG: "AS", KR: "AS",
  LK: "AS", SY: "AS", TW: "AS", TJ: "AS", TH: "AS", TL: "AS", TR: "AS",
  TM: "AS", AE: "AS", UZ: "AS", VN: "AS", YE: "AS",
  // Oceania
  AU: "OC", FJ: "OC", KI: "OC", MH: "OC", FM: "OC", NR: "OC", NZ: "OC",
  PW: "OC", PG: "OC", WS: "OC", SB: "OC", TO: "OC", TV: "OC", VU: "OC",
};

function getContinent(countryCode: string): string {
  return CONTINENT_MAP[countryCode] ?? "UNKNOWN";
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Impossible Travel decision logic (extracted from edge function)
function classifyImpossibleTravel(
  distanceKm: number,
  timeDiffMinutes: number
): "high" | "medium" | null {
  if (timeDiffMinutes < 1) return null;
  const speedKmh = distanceKm / (timeDiffMinutes / 60);
  if (speedKmh <= 900) return null;
  return speedKmh > 1800 ? "high" : "medium";
}

// Concurrent Countries decision logic (extracted from edge function)
function classifyConcurrentCountries(
  countryCodes: string[]
): "high" | "medium" | null {
  const distinct = [...new Set(countryCodes.filter(Boolean))];
  if (distinct.length <= 1) return null;
  const continents = [...new Set(distinct.map(getContinent))];
  const crossContinent = continents.length > 1 && !continents.includes("UNKNOWN");
  return crossContinent ? "high" : "medium";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("haversineKm", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(haversineKm(-26.2, 28.0, -26.2, 28.0)).toBeCloseTo(0, 1);
  });

  it("returns ~9075 km for Johannesburg → London", () => {
    // JNB: -26.2, 28.0  |  LHR: 51.5, -0.4
    expect(haversineKm(-26.2, 28.0, 51.5, -0.4)).toBeCloseTo(9075, -2);
  });

  it("returns ~11153 km for Sydney → New York", () => {
    // SYD: -33.9, 151.2  |  JFK: 40.6, -73.8
    expect(haversineKm(-33.9, 151.2, 40.6, -73.8)).toBeCloseTo(16013, -2);
  });

  it("is symmetric (A→B == B→A)", () => {
    const ab = haversineKm(51.5, -0.4, 40.7, -74.0);
    const ba = haversineKm(40.7, -74.0, 51.5, -0.4);
    expect(ab).toBeCloseTo(ba, 0);
  });
});

describe("getContinent", () => {
  it("maps ZA to AF", () => expect(getContinent("ZA")).toBe("AF"));
  it("maps GB to EU", () => expect(getContinent("GB")).toBe("EU"));
  it("maps US to NA", () => expect(getContinent("US")).toBe("NA"));
  it("maps JP to AS", () => expect(getContinent("JP")).toBe("AS"));
  it("maps AU to OC", () => expect(getContinent("AU")).toBe("OC"));
  it("maps BR to SA", () => expect(getContinent("BR")).toBe("SA"));
  it("returns UNKNOWN for unrecognised code", () => expect(getContinent("XX")).toBe("UNKNOWN"));
});

describe("classifyImpossibleTravel", () => {
  it("returns null when time_diff < 1 minute (duplicate login)", () => {
    expect(classifyImpossibleTravel(9000, 0.5)).toBeNull();
  });

  it("returns null when speed ≤ 900 km/h (plausible)", () => {
    // 500 km in 1 hour = 500 km/h
    expect(classifyImpossibleTravel(500, 60)).toBeNull();
  });

  it("returns medium when 900 < speed ≤ 1800 km/h (commercial flight speed)", () => {
    // 1000 km in 60 min = 1000 km/h — between 900 and 1800
    expect(classifyImpossibleTravel(1000, 60)).toBe("medium");
  });

  it("returns high when speed > 1800 km/h (physically impossible travel)", () => {
    // JNB→LHR in 18 minutes: ~9418 km / 0.3 h ≈ 31393 km/h
    expect(classifyImpossibleTravel(9418, 18)).toBe("high");
  });

  it("returns high at exactly 1801 km/h", () => {
    // 1801 km/h × 1h = 1801 km in 60 minutes
    expect(classifyImpossibleTravel(1801, 60)).toBe("high");
  });

  it("returns medium at exactly 901 km/h", () => {
    expect(classifyImpossibleTravel(901, 60)).toBe("medium");
  });

  it("returns null at exactly 900 km/h boundary", () => {
    expect(classifyImpossibleTravel(900, 60)).toBeNull();
  });
});

describe("classifyConcurrentCountries", () => {
  it("returns null for single country", () => {
    expect(classifyConcurrentCountries(["ZA", "ZA", "ZA"])).toBeNull();
  });

  it("returns null when only one distinct country", () => {
    expect(classifyConcurrentCountries(["ZA"])).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(classifyConcurrentCountries([])).toBeNull();
  });

  it("returns medium for two countries in the same continent (ZA + ZW = both AF)", () => {
    expect(classifyConcurrentCountries(["ZA", "ZW"])).toBe("medium");
  });

  it("returns medium for two EU countries (GB + DE)", () => {
    expect(classifyConcurrentCountries(["GB", "DE"])).toBe("medium");
  });

  it("returns high for cross-continent countries (ZA=AF + GB=EU)", () => {
    expect(classifyConcurrentCountries(["ZA", "GB"])).toBe("high");
  });

  it("returns high for ZA + US (AF + NA)", () => {
    expect(classifyConcurrentCountries(["ZA", "US"])).toBe("high");
  });

  it("returns medium (not high) when an UNKNOWN country is involved", () => {
    // UNKNOWN continent guard prevents false cross-continent HIGH
    expect(classifyConcurrentCountries(["ZA", "XX"])).toBe("medium");
  });

  it("deduplicates country codes before evaluating", () => {
    // ZA appears 3 times, GB appears 2 times — still cross-continent HIGH
    expect(classifyConcurrentCountries(["ZA", "ZA", "ZA", "GB", "GB"])).toBe("high");
  });
});
