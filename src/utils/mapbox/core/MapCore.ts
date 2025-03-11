
import mapboxgl from 'mapbox-gl';
import { eventBus } from './eventBus';
import { resourceManager } from './resource/ResourceManager';
import { stateManager } from './stateManager';
import { viewportManager } from '../viewport/ViewportManager';
import { rollbackManager } from './rollback/RollbackManager';

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
    try {
      console.log('[MapCore] Starting map initialization');
      await stateManager.transition('prerequisites_checking');

      // Create initial checkpoint
      rollbackManager.createCheckpoint();

      // Configure resources with type-safe methods
      console.log('[MapCore] Configuring resources');
      await resourceManager.configureDOMResource({
        container,
        options: {
          validateSize: true,
          minWidth: 100,
          minHeight: 100
        }
      });

      await resourceManager.configureModuleResource({
        validateInstance: true,
        validateDependencies: true
      });

      await resourceManager.configureTokenResource({
        refreshInterval: 1800000,
        validateOnRefresh: true,
        validateDependencies: true
      });

      await stateManager.transition('resources_acquiring');
      
      // Create checkpoint after resource configuration
      rollbackManager.createCheckpoint();

      // Acquire resources in dependency order
      console.log('[MapCore] Acquiring resources');
      const tokenReady = await resourceManager.acquireResource('token');
      const moduleReady = await resourceManager.acquireResource('module');
      const domReady = await resourceManager.acquireResource('dom');
      
      if (!tokenReady || !moduleReady || !domReady) {
        const checkpoint = rollbackManager.getLatestCheckpoint();
        if (checkpoint) {
          await rollbackManager.recoverToCheckpoint(checkpoint);
        }
        throw new Error('Failed to acquire required resources');
      }

      await stateManager.transition('core_initializing');

      // Create checkpoint before map initialization
      rollbackManager.createCheckpoint();

      // Initialize map
      console.log('[MapCore] Creating map instance');
      this.map = new mapboxgl.Map({
        container,
        ...options
      });

      // Setup map event handlers
      this.setupEventHandlers();

      await stateManager.transition('features_activating');

      // Create checkpoint after map initialization
      rollbackManager.createCheckpoint();

      // Wait for style to load
      await new Promise<void>((resolve, reject) => {
        if (!this.map) return reject(new Error('Map not initialized'));
        
        if (this.map.isStyleLoaded()) {
          this.styleLoaded = true;
          resolve();
        } else {
          this.map.once('style.load', () => {
            this.styleLoaded = true;
            resolve();
          });

          // Add timeout for style loading
          setTimeout(() => {
            if (!this.styleLoaded) {
              const checkpoint = rollbackManager.getLatestCheckpoint();
              if (checkpoint) {
                rollbackManager.recoverToCheckpoint(checkpoint);
              }
              reject(new Error('Style loading timeout'));
            }
          }, 10000);
        }
      });

      await stateManager.transition('ready');
      
      // Create final checkpoint
      rollbackManager.createCheckpoint();
      
      console.log('[MapCore] Map initialization complete');
      return true;

    } catch (error) {
      console.error('[MapCore] Initialization error:', error);
      eventBus.emit({
        type: 'error',
        payload: error instanceof Error ? error.message : 'Failed to initialize map'
      });

      // Attempt recovery using latest checkpoint
      const checkpoint = rollbackManager.getLatestCheckpoint();
      if (checkpoint) {
        const recovery = await rollbackManager.recoverToCheckpoint(checkpoint);
        if (!recovery.success) {
          await stateManager.transition('error');
        }
      } else {
        await stateManager.transition('error');
      }
      
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

      // Attempt recovery on map errors
      const checkpoint = rollbackManager.getLatestCheckpoint();
      if (checkpoint) {
        rollbackManager.recoverToCheckpoint(checkpoint);
      }
    });

    // Style loading events
    this.map.on('style.load', () => {
      console.log('[MapCore] Map style loaded');
      this.styleLoaded = true;
      eventBus.emit({
        type: 'stateChange',
        payload: { state: 'style_loaded' }
      });
      rollbackManager.createCheckpoint();
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

  isStyleLoaded(): boolean {
    return this.styleLoaded;
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

    this.styleLoaded = false;

    // Release resources in reverse dependency order
    await resourceManager.releaseAll();
    await stateManager.transition('uninitialized');
    
    // Clear rollback checkpoints
    rollbackManager.clearCheckpoints();
    
    console.log('[MapCore] Cleanup complete');
  }
}

export const mapCore = MapCore.getInstance();
