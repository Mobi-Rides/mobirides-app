export interface NavigationSession {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  distance: number;
  duration: number;
  completed: boolean;
}

class NavigationAnalytics {
  private sessions: NavigationSession[] = [];

  startSession(userId: string, origin: { lat: number; lng: number }, destination: { lat: number; lng: number }, route: any): string {
    const id = crypto.randomUUID();
    const session: NavigationSession = {
      id,
      userId,
      startTime: Date.now(),
      origin,
      destination,
      distance: route.distance,
      duration: route.duration,
      completed: false
    };
    this.sessions.push(session);
    console.log('[Analytics] Navigation started:', session);
    // In real app, send to Supabase
    return id;
  }

  endSession(sessionId: string, completed: boolean = true) {
    const session = this.sessions.find(s => s.id === sessionId);
    if (session) {
      session.endTime = Date.now();
      session.completed = completed;
      console.log('[Analytics] Navigation ended:', session);
      // In real app, update in Supabase
    }
  }

  logReroute(sessionId: string, location: { lat: number; lng: number }) {
    console.log('[Analytics] Reroute occurred:', { sessionId, location, timestamp: Date.now() });
  }
}

export const navigationAnalytics = new NavigationAnalytics();
