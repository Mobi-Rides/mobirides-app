
import mapboxgl from 'mapbox-gl';
import { eventBus } from '../eventBus';
import { resourceManager } from '../resource/ResourceManager';
import { stateManager } from '../stateManager';
import { rollbackManager } from '../rollback/RollbackManager';

export class MapInitializer {
  async initialize(
    container: HTMLElement, 
    options: Omit<mapboxgl.MapOptions, 'container'>,
    map: mapboxgl.Map | null,
    onStyleLoaded: (isLoaded: boolean) => void
  ): Promise<{ map: mapboxgl.Map | null; success: boolean }> {
    try {
      console.log('[MapInitializer] Starting map initialization');
      await stateManager.transition('prerequisites_checking');

      // Create initial checkpoint
      rollbackManager.createCheckpoint();

      // Configure resources with type-safe methods
      console.log('[MapInitializer] Configuring resources');
      await this.configureResources(container);

      await stateManager.transition('resources_acquiring');
      
      // Create checkpoint after resource configuration
      rollbackManager.createCheckpoint();

      // Acquire resources in dependency order
      console.log('[MapInitializer] Acquiring resources');
      const resourcesReady = await this.acquireResources();
      
      if (!resourcesReady) {
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
      console.log('[MapInitializer] Creating map instance');
      map = new mapboxgl.Map({
        container,
        ...options
      });

      await stateManager.transition('features_activating');

      // Create checkpoint after map initialization
      rollbackManager.createCheckpoint();

      // Wait for style to load
      const styleLoaded = await this.waitForStyleToLoad(map, onStyleLoaded);
      if (!styleLoaded) {
        const checkpoint = rollbackManager.getLatestCheckpoint();
        if (checkpoint) {
          await rollbackManager.recoverToCheckpoint(checkpoint);
        }
        throw new Error('Style loading timeout');
      }

      await stateManager.transition('ready');
      
      // Create final checkpoint
      rollbackManager.createCheckpoint();
      
      console.log('[MapInitializer] Map initialization complete');
      return { map, success: true };
    } catch (error) {
      console.error('[MapInitializer] Initialization error:', error);
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
      
      return { map, success: false };
    }
  }

  private async configureResources(container: HTMLElement): Promise<void> {
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
  }

  private async acquireResources(): Promise<boolean> {
    const tokenReady = await resourceManager.acquireResource('token');
    const moduleReady = await resourceManager.acquireResource('module');
    const domReady = await resourceManager.acquireResource('dom');
    
    return tokenReady && moduleReady && domReady;
  }

  private async waitForStyleToLoad(
    map: mapboxgl.Map, 
    onStyleLoaded: (isLoaded: boolean) => void
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (!map) return resolve(false);
      
      if (map.isStyleLoaded()) {
        onStyleLoaded(true);
        resolve(true);
      } else {
        const timeoutId = setTimeout(() => {
          onStyleLoaded(false);
          resolve(false);
        }, 10000);

        map.once('style.load', () => {
          clearTimeout(timeoutId);
          onStyleLoaded(true);
          resolve(true);
        });
      }
    });
  }
}

export const mapInitializer = new MapInitializer();
