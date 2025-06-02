
import mapboxgl from 'mapbox-gl';
import { mapInitializer } from './initialization/MapInitializer';
import { mapEvents } from './events/MapEvents';
import { mapCleanup } from './cleanup/MapCleanup';

export class MapCore {
  private static instance: MapCore;
  private map: mapboxgl.Map | null = null;
  private styleLoaded = false;

  private constructor() {}

  static getInstance(): MapCore {
    if (!MapCore.instance) {
      MapCore.instance = new MapCore();
    }
    return MapCore.instance;
  }

  async initialize(container: HTMLElement, options: Omit<mapboxgl.MapOptions, 'container'>): Promise<boolean> {
    const result = await mapInitializer.initialize(
      container, 
      options, 
      this.map,
      (isLoaded) => { this.styleLoaded = isLoaded; }
    );
    
    this.map = result.map;
    
    if (this.map && result.success) {
      mapEvents.setupEventHandlers(this.map, (isLoaded) => { this.styleLoaded = isLoaded; });
      return true;
    }
    
    return false;
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  isStyleLoaded(): boolean {
    return this.styleLoaded;
  }

  async cleanup(): Promise<void> {
    await mapCleanup.cleanup(this.map);
    this.map = null;
    this.styleLoaded = false;
  }
}

export const mapCore = MapCore.getInstance();
