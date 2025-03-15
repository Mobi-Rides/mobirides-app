
import mapboxgl from 'mapbox-gl';
import { eventBus } from '../eventBus';
import { viewportManager } from '../../viewport/ViewportManager';
import { rollbackManager } from '../rollback/RollbackManager';

export class MapEvents {
  setupEventHandlers(map: mapboxgl.Map, onStyleLoaded: (isLoaded: boolean) => void): void {
    if (!map) return;

    // Basic error handling
    map.on('error', (e) => {
      console.error('[MapEvents] Map error:', e);
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
    map.on('style.load', () => {
      console.log('[MapEvents] Map style loaded');
      onStyleLoaded(true);
      eventBus.emit({
        type: 'stateChange',
        payload: { state: 'style_loaded' }
      });
      rollbackManager.createCheckpoint();
    });

    // Viewport change events
    map.on('moveend', () => {
      if (!map) return;
      const viewport = viewportManager.getViewport();
      eventBus.emit({
        type: 'stateChange',
        payload: { state: 'viewport_changed', viewport }
      });
    });
  }

  removeEventHandlers(map: mapboxgl.Map | null): void {
    if (!map) return;
    
    // Fix: Add proper event name and handler reference to off() method
    map.off('error', () => {});
    map.off('style.load', () => {});
    map.off('moveend', () => {});
  }
}

export const mapEvents = new MapEvents();
