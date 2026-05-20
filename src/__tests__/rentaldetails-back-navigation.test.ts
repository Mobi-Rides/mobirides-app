/**
 * Dynamic back navigation in RentalDetails flow unit test
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const RENTAL_DETAILS = path.join(ROOT, 'src/pages/RentalDetailsRefactored.tsx');
const SKELETON = path.join(ROOT, 'src/components/rental-details/RentalDetailsSkeleton.tsx');
const NOT_FOUND = path.join(ROOT, 'src/components/rental-details/RentalDetailsNotFound.tsx');

const contentDetails = fs.readFileSync(RENTAL_DETAILS, 'utf-8');
const contentSkeleton = fs.readFileSync(SKELETON, 'utf-8');
const contentNotFound = fs.readFileSync(NOT_FOUND, 'utf-8');

describe('RentalDetails flow dynamic back navigation', () => {
  describe('RentalDetailsRefactored Page', () => {
    it('file exists', () => {
      expect(fs.existsSync(RENTAL_DETAILS)).toBe(true);
    });

    it('uses useLocation', () => {
      expect(contentDetails).toContain('useLocation');
    });

    it('contains handleBack checking location.key === "default"', () => {
      expect(contentDetails).toContain('handleBack');
      expect(contentDetails).toContain('location.key === "default"');
      expect(contentDetails).toMatch(/navigate\(\s*['"]\/bookings['"]\s*\)/);
      expect(contentDetails).toMatch(/navigate\(\s*-1\s*\)/);
    });

    it('passes handleBack to RentalDetailsHeader', () => {
      expect(contentDetails).toContain('onBack={handleBack}');
      expect(contentDetails).not.toContain("onBack={() => navigate('/bookings')}");
    });
  });

  describe('RentalDetailsSkeleton Component', () => {
    it('file exists', () => {
      expect(fs.existsSync(SKELETON)).toBe(true);
    });

    it('imports and invokes useLocation', () => {
      expect(contentSkeleton).toContain('useLocation');
      expect(contentSkeleton).toMatch(/const location\s*=\s*useLocation\(\)/);
    });

    it('dynamically handles back button click', () => {
      expect(contentSkeleton).toContain('location.key === "default"');
      expect(contentSkeleton).toMatch(/navigate\(\s*['"]\/bookings['"]\s*\)/);
      expect(contentSkeleton).toMatch(/navigate\(\s*-1\s*\)/);
    });
  });

  describe('RentalDetailsNotFound Component', () => {
    it('file exists', () => {
      expect(fs.existsSync(NOT_FOUND)).toBe(true);
    });

    it('imports and invokes useLocation', () => {
      expect(contentNotFound).toContain('useLocation');
      expect(contentNotFound).toMatch(/const location\s*=\s*useLocation\(\)/);
    });

    it('dynamically handles back button click', () => {
      expect(contentNotFound).toContain('location.key === "default"');
      expect(contentNotFound).toMatch(/navigate\(\s*['"]\/bookings['"]\s*\)/);
      expect(contentNotFound).toMatch(/navigate\(\s*-1\s*\)/);
    });
  });
});
