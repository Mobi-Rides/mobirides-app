
import mapboxgl from 'mapbox-gl';
import { eventBus } from './eventBus';
import { resourceManager } from './resource/ResourceManager';

export class MapCore {
  private static instance: MapCore;
  private map: mapboxgl.Map | null = null;

  private constructor() {}

  static getInstance(): MapCore {
    if (!MapCore.instance) {
      MapCore.instance = new MapCore();
    }
    return MapCore.instance;
  }

  async initialize(container: HTMLElement, options: Omit<mapboxgl.MapOptions, 'container'>): Promise<boolean> {
    try {
      // Ensure resources are ready
      const tokenReady = await resourceManager.acquireResource('token');
      const moduleReady = await resourceManager.acquireResource('module');
      
      if (!tokenReady || !moduleReady) {
        throw new Error('Failed to acquire required resources');
      }

      // Initialize map
      this.map = new mapboxgl.Map({
        container,
        ...options
      });

      // Setup basic event handlers
      this.map.on('error', (e) => {
        eventBus.emit({
          type: 'error',
          payload: e.error ? e.error.message : 'Map error occurred'
        });
      });

      return true;
    } catch (error) {
      eventBus.emit({
        type: 'error',
        payload: error instanceof Error ? error.message : 'Failed to initialize map'
      });
      return false;
    }
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  cleanup(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}

export const mapCore = MapCore.getInstance();
