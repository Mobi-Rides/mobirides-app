
import mapboxgl from 'mapbox-gl';
import { resourceManager } from '../resource/ResourceManager';
import { stateManager } from '../stateManager';
import { rollbackManager } from '../rollback/RollbackManager';
import { mapEvents } from '../events/MapEvents';

export class MapCleanup {
  async cleanup(map: mapboxgl.Map | null): Promise<void> {
    console.log('[MapCleanup] Starting cleanup');
    
    if (map) {
      // Remove event listeners
      mapEvents.removeEventHandlers(map);

      // Remove map
      map.remove();
    }

    // Release resources in reverse dependency order
    await resourceManager.releaseResource('dom');
    await resourceManager.releaseResource('module');
    await resourceManager.releaseResource('token');
    
    await stateManager.transition('uninitialized');
    
    // Clear rollback checkpoints
    rollbackManager.clearCheckpoints();
    
    console.log('[MapCleanup] Cleanup complete');
  }
}

export const mapCleanup = new MapCleanup();
