import { navigationAnalytics, NavigationSession } from '@/utils/navigationAnalytics';

describe('navigationAnalytics', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear any existing sessions
    (navigationAnalytics as any).sessions = [];
    // Spy on console.log to verify logging
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('starts a session and returns an ID', () => {
    const origin = { lat: -24.6282, lng: 25.9231 };
    const destination = { lat: -21.1714, lng: 27.5146 };
    const route = { distance: 430, duration: 3600000 }; // 430km, 1 hour
    
    const sessionId = navigationAnalytics.startSession('user-1', origin, destination, route);
    
    expect(sessionId).toBeDefined();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBeGreaterThan(0);
  });

  it('stores session data when starting', () => {
    const origin = { lat: -24.6282, lng: 25.9231 };
    const destination = { lat: -21.1714, lng: 27.5146 };
    const route = { distance: 430, duration: 3600000 };
    
    const sessionId = navigationAnalytics.startSession('user-1', origin, destination, route);
    const sessions = (navigationAnalytics as any).sessions as NavigationSession[];
    
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(sessionId);
    expect(sessions[0].userId).toBe('user-1');
    expect(sessions[0].origin).toEqual(origin);
    expect(sessions[0].destination).toEqual(destination);
    expect(sessions[0].distance).toBe(430);
    expect(sessions[0].duration).toBe(3600000);
    expect(sessions[0].completed).toBe(false);
  });

  it('ends a session and marks it as completed', () => {
    const origin = { lat: -24.6282, lng: 25.9231 };
    const destination = { lat: -21.1714, lng: 27.5146 };
    const route = { distance: 430, duration: 3600000 };
    
    const sessionId = navigationAnalytics.startSession('user-1', origin, destination, route);
    navigationAnalytics.endSession(sessionId, true);
    
    const sessions = (navigationAnalytics as any).sessions as NavigationSession[];
    expect(sessions[0].completed).toBe(true);
    expect(sessions[0].endTime).toBeDefined();
  });

  it('ends a session and marks it as not completed', () => {
    const origin = { lat: -24.6282, lng: 25.9231 };
    const destination = { lat: -21.1714, lng: 27.5146 };
    const route = { distance: 430, duration: 3600000 };
    
    const sessionId = navigationAnalytics.startSession('user-1', origin, destination, route);
    navigationAnalytics.endSession(sessionId, false);
    
    const sessions = (navigationAnalytics as any).sessions as NavigationSession[];
    expect(sessions[0].completed).toBe(false);
    expect(sessions[0].endTime).toBeDefined();
  });

  it('handles endSession for non-existent session gracefully', () => {
    // Should not throw
    expect(() => {
      navigationAnalytics.endSession('non-existent-id', true);
    }).not.toThrow();
  });

  it('logs reroute events', () => {
    const origin = { lat: -24.6282, lng: 25.9231 };
    const destination = { lat: -21.1714, lng: 27.5146 };
    const route = { distance: 430, duration: 3600000 };
    
    const sessionId = navigationAnalytics.startSession('user-1', origin, destination, route);
    
    const newLocation = { lat: -24.0, lng: 26.0 };
    navigationAnalytics.logReroute(sessionId, newLocation);
    
    expect(consoleSpy).toHaveBeenCalled();
  });
});