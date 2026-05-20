/**
 * Dynamic back navigation in CarDetails unit test
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../');
const FILE = path.join(ROOT, 'src/pages/CarDetails.tsx');

const content = fs.readFileSync(FILE, 'utf-8');

describe('CarDetails dynamic back navigation', () => {
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

  it('falls back to "/" when location.key is "default" (deep-link)', () => {
    expect(content).toMatch(/location\.key\s*===\s*["']default["']\s*\?\s*["']\/["']/);
  });

  it('uses "back" (navigate(-1)) for in-app navigation', () => {
    expect(content).toMatch(/:\s*["']back["']/);
  });

  it('no hard-coded backTo="/" remains', () => {
    expect(content).not.toContain('backTo="/"');
  });

  it('all three MobileHeader instances use backTo={backDestination}', () => {
    const occurrences = (content.match(/backTo=\{backDestination\}/g) ?? []).length;
    expect(occurrences).toBe(3);
  });
});
