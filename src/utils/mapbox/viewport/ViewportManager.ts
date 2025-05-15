
import { mapCore } from '../core/MapCore';

export interface ViewportState {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export class ViewportManager {
  private static instance: ViewportManager;

  private constructor() {}

  static getInstance(): ViewportManager {
    if (!ViewportManager.instance) {
      ViewportManager.instance = new ViewportManager();
    }
    return ViewportManager.instance;
  }

  updateView(viewport: Partial<ViewportState>): void {
    const map = mapCore.getMap();
    if (!map) return;

    map.easeTo({
      ...viewport,
      duration: 1000
    });
  }

  getViewport(): ViewportState | null {
    const map = mapCore.getMap();
    if (!map) return null;

    return {
      center: [map.getCenter().lng, map.getCenter().lat],
      zoom: map.getZoom(),
      pitch: map.getPitch(),
      bearing: map.getBearing()
    };
  }
}

export const viewportManager = ViewportManager.getInstance();
