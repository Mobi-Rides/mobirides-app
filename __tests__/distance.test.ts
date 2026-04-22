import { calculateDistance } from '@/utils/distance';

describe('distance utils', () => {
  it('calculates distance between two points correctly', () => {
    // Gaborone to Francistown (approximately 418km)
    const distance = calculateDistance(-24.6282, 25.9231, -21.1714, 27.5146);
    expect(distance).toBeCloseTo(418, 0);
  });

  it('returns 0 for same coordinates', () => {
    const distance = calculateDistance(-24.6282, 25.9231, -24.6282, 25.9231);
    expect(distance).toBe(0);
  });

  it('calculates short distances correctly', () => {
    // Very short distance (a few meters)
    const distance = calculateDistance(-24.6282, 25.9231, -24.6283, 25.9231);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1); // Less than 1km
  });

  it('handles negative coordinates', () => {
    // Using negative latitudes (southern hemisphere)
    const distance = calculateDistance(-33.9249, 18.4241, -34.0522, 18.4432); // Cape Town area
    expect(distance).toBeGreaterThan(0);
  });

  it('works with various lat/lon ranges', () => {
    // Test with different coordinate ranges
    const distance1 = calculateDistance(0, 0, 0, 1); // 1 degree longitude at equator
    expect(distance1).toBeCloseTo(111, 0); // ~111km

    const distance2 = calculateDistance(0, 0, 1, 0); // 1 degree latitude
    expect(distance2).toBeCloseTo(111, 0); // ~111km
  });
});