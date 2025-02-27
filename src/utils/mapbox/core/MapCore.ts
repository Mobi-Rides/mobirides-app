
import mapboxgl from 'mapbox-gl';
import { eventBus } from './eventBus';
import { resourceManager } from './resource/ResourceManager';
import { stateManager } from './stateManager';
import { viewportManager } from '../viewport/ViewportManager';

export class MapCore {
  private static instance: MapCore;
  private map: mapboxgl.Map | null = null;
  private isStyleLoaded = false;

  private constructor() {}

  static getInstance(): MapCore {
    if (!MapCore.instance) {
      MapCore.instance = new MapCore();
    }
    return MapCore.instance;
  }

  async initialize(container: HTMLElement, options: Omit<mapboxgl.MapOptions, 'container'>): Promise<boolean> {
    try {
      console.log('[MapCore] Starting map initialization');
      await stateManager.transition('prerequisites_checking');

      // Configure and acquire resources in correct order
      const domConfig = {
        container,
        options: {
          validateSize: true,
          minWidth: 100,
          minHeight: 100
        }
      };

      const moduleConfig = {
        validateInstance: true
      };

      const tokenConfig = {
        refreshInterval: 1800000, // 30 minutes
        validateOnRefresh: true
      };

      // Configure resources
      console.log('[MapCore] Configuring resources');
      await resourceManager.configureResource('dom', domConfig);
      await resourceManager.configureResource('token', tokenConfig);
      await resourceManager.configureResource('module', moduleConfig);

      await stateManager.transition('resources_acquiring');

      // Acquire resources in dependency order
      console.log('[MapCore] Acquiring resources');
      const tokenReady = await resourceManager.acquireResource('token');
      const moduleReady = await resourceManager.acquireResource('module');
      const domReady = await resourceManager.acquireResource('dom');
      
      if (!tokenReady || !moduleReady || !domReady) {
        throw new Error('Failed to acquire required resources');
      }

      await stateManager.transition('core_initializing');

      // Initialize map
      console.log('[MapCore] Creating map instance');
      this.map = new mapboxgl.Map({
        container,
        ...options
      });

      // Setup map event handlers
      this.setupEventHandlers();

      await stateManager.transition('features_activating');

      // Wait for style to load
      await new Promise<void>((resolve, reject) => {
        if (!this.map) return reject(new Error('Map not initialized'));
        
        if (this.map.isStyleLoaded()) {
          this.isStyleLoaded = true;
          resolve();
        } else {
          this.map.once('style.load', () => {
            this.isStyleLoaded = true;
            resolve();
          });

          // Add timeout for style loading
          setTimeout(() => {
            if (!this.isStyleLoaded) {
              reject(new Error('Style loading timeout'));
            }
          }, 10000);
        }
      });

      await stateManager.transition('ready');
      console.log('[MapCore] Map initialization complete');
      return true;

    } catch (error) {
      console.error('[MapCore] Initialization error:', error);
      eventBus.emit({
        type: 'error',
        payload: error instanceof Error ? error.message : 'Failed to initialize map'
      });
      await stateManager.transition('error');
      return false;
    }
  }

  private setupEventHandlers() {
    if (!this.map) return;

    // Basic error handling
    this.map.on('error', (e) => {
      console.error('[MapCore] Map error:', e);
      eventBus.emit({
        type: 'error',
        payload: e.error ? e.error.message : 'Map error occurred'
      });
    });

    // Style loading events
    this.map.on('style.load', () => {
      console.log('[MapCore] Map style loaded');
      this.isStyleLoaded = true;
      eventBus.emit({
        type: 'stateChange',
        payload: { state: 'style_loaded' }
      });
    });

    // Viewport change events
    this.map.on('moveend', () => {
      if (!this.map) return;
      const viewport = viewportManager.getViewport();
      eventBus.emit({
        type: 'stateChange',
        payload: { state: 'viewport_changed', viewport }
      });
    });
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  async cleanup(): Promise<void> {
    console.log('[MapCore] Starting cleanup');
    
    if (this.map) {
      // Remove event listeners
      this.map.off('error');
      this.map.off('style.load');
      this.map.off('moveend');

      // Remove map
      this.map.remove();
      this.map = null;
    }

    this.isStyleLoaded = false;

    // Release resources in reverse dependency order
    await resourceManager.releaseResource('module');
    await resourceManager.releaseResource('token');
    await resourceManager.releaseResource('dom');

    await stateManager.transition('uninitialized');
    console.log('[MapCore] Cleanup complete');
  }
}

export const mapCore = MapCore.getInstance();
