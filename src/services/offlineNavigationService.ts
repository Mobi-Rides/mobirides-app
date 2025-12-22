import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { NavigationRoute, RouteRequest } from './navigationService';

interface NavigationDB extends DBSchema {
  routes: {
    key: string;
    value: {
      route: NavigationRoute;
      timestamp: number;
      request: RouteRequest;
    };
  };
}

const DB_NAME = 'mobirides-navigation';
const STORE_NAME = 'routes';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

class OfflineNavigationService {
  private dbPromise: Promise<IDBPDatabase<NavigationDB>>;

  constructor() {
    this.dbPromise = openDB<NavigationDB>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }

  private generateKey(request: RouteRequest): string {
    const { origin, destination, waypoints = [], profile } = request;
    const waypointsStr = waypoints
      .map(wp => `${wp.latitude},${wp.longitude}`)
      .join(';');
    return `${profile}:${origin.latitude},${origin.longitude}->${destination.latitude},${destination.longitude}[${waypointsStr}]`;
  }

  async saveRoute(request: RouteRequest, route: NavigationRoute): Promise<void> {
    try {
      const db = await this.dbPromise;
      await db.put(STORE_NAME, {
        route,
        timestamp: Date.now(),
        request
      }, this.generateKey(request));
      console.log('Route cached for offline use');
    } catch (error) {
      console.error('Failed to cache route:', error);
    }
  }

  async getOfflineRoute(request: RouteRequest): Promise<NavigationRoute | null> {
    try {
      const db = await this.dbPromise;
      const key = this.generateKey(request);
      const cached = await db.get(STORE_NAME, key);

      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > CACHE_DURATION) {
        await db.delete(STORE_NAME, key);
        return null;
      }

      return cached.route;
    } catch (error) {
      console.error('Failed to retrieve offline route:', error);
      return null;
    }
  }

  async clearCache(): Promise<void> {
    const db = await this.dbPromise;
    await db.clear(STORE_NAME);
  }
}

export const offlineNavigationService = new OfflineNavigationService();
