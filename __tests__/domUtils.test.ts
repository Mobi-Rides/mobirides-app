import { createMarkerElement } from '@/utils/domUtils';

describe('domUtils', () => {
  beforeEach(() => {
    // Reset document body for each test
    document.body.innerHTML = '';
  });

  it('creates a marker element with correct structure', () => {
    const element = createMarkerElement(50);
    
    expect(element).toBeInstanceOf(HTMLDivElement);
    expect(element.className).toBe('relative');
    expect(element.children).toHaveLength(2);
  });

  it('creates marker with correct classes for dot', () => {
    const element = createMarkerElement(50);
    const dot = element.children[1] as HTMLElement;
    
    expect(dot.className).toContain('w-4');
    expect(dot.className).toContain('h-4');
    expect(dot.className).toContain('bg-blue-500');
    expect(dot.className).toContain('rounded-full');
  });

  it('creates accuracy circle with dynamic size based on accuracy', () => {
    // Test with low accuracy (small circle)
    const elementLow = createMarkerElement(10);
    const circleLow = elementLow.children[0] as HTMLElement;
    const lowSize = parseInt(circleLow.style.width);
    
    // Test with high accuracy (larger circle)
    const elementHigh = createMarkerElement(200);
    const circleHigh = elementHigh.children[0] as HTMLElement;
    const highSize = parseInt(circleHigh.style.width);
    
    // Higher accuracy should result in larger circle (up to max 100)
    expect(highSize).toBeGreaterThan(lowSize);
    expect(highSize).toBeLessThanOrEqual(100);
  });

  it('respects minimum circle size', () => {
    const element = createMarkerElement(5); // Very low accuracy
    const circle = element.children[0] as HTMLElement;
    const size = parseInt(circle.style.width);
    
    expect(size).toBeGreaterThanOrEqual(16); // Min 16px
  });

  it('respects maximum circle size', () => {
    const element = createMarkerElement(1000); // Very high accuracy
    const circle = element.children[0] as HTMLElement;
    const size = parseInt(circle.style.width);
    
    expect(size).toBeLessThanOrEqual(100); // Max 100px
  });

  it('circle has correct positioning', () => {
    const element = createMarkerElement(50);
    const circle = element.children[0] as HTMLElement;
    
    expect(circle.style.position).toBe('absolute');
    expect(circle.className).toContain('rounded-full');
    expect(circle.className).toContain('bg-blue-500/20');
  });
});