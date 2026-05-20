/**
 * BUG-064 — Dynamic back navigation in BookingRequestDetails
 *
 * Verifies that the MobileHeader no longer uses a hard-coded backTo="/host-bookings"
 * and instead derives the destination from React Router's location.key so that:
 *  - Deep-links (email / push notifications) fall back to /host-bookings
 *  - In-app navigation (from /notifications, /dashboard, etc.) uses browser history
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const FILE = path.join(ROOT, 'src/pages/BookingRequestDetails.tsx');

const content = fs.readFileSync(FILE, 'utf-8');

describe('BUG-064 — BookingRequestDetails back navigation', () => {
  it('file exists', () => {
    expect(fs.existsSync(FILE)).toBe(true);
  });

  it('imports useLocation from react-router-dom', () => {
    expect(content).toMatch(/useLocation/);
    expect(content).toMatch(/from ['"]react-router-dom['"]/);
  });

  it('derives backDestination from location.key', () => {
    expect(content).toContain('location.key');
    expect(content).toContain('"default"');
    expect(content).toContain('backDestination');
  });

  it('falls back to /host-bookings when location.key is "default" (deep-link)', () => {
    expect(content).toMatch(/location\.key\s*===\s*["']default["']\s*\?\s*["']\/host-bookings["']/);
  });

  it('uses "back" (navigate(-1)) for in-app navigation', () => {
    expect(content).toMatch(/:\s*["']back["']/);
  });

  it('no hard-coded backTo="/host-bookings" remains', () => {
    expect(content).not.toContain('backTo="/host-bookings"');
  });

  it('both MobileHeader instances use backTo={backDestination}', () => {
    const occurrences = (content.match(/backTo=\{backDestination\}/g) ?? []).length;
    expect(occurrences).toBe(2);
  });
});
