import { MapInitializationState, MapResourceState } from '../types';
import { RollbackCheckpoint, RecoveryAction, RecoveryResult, RecoveryLevel } from './types';
import { resourceManager } from '../resource/ResourceManager';
import { mapCore } from '../MapCore';
import { eventBus } from '../eventBus';
import { stateManager } from '../stateManager';

export class RollbackManager {
  private static instance: RollbackManager;
  private checkpoints: RollbackCheckpoint[] = [];
  private maxCheckpoints: number = 5;
  private recoveryAttempts: Map<RecoveryLevel, number> = new Map();

  private constructor() {}

  static getInstance(): RollbackManager {
    if (!RollbackManager.instance) {
      RollbackManager.instance = new RollbackManager();
    }
    return RollbackManager.instance;
  }

  createCheckpoint(): RollbackCheckpoint {
    const checkpoint: RollbackCheckpoint = {
      state: stateManager.getCurrentState(),
      resources: stateManager.getResourceState(),
      map: {
        isInitialized: !!mapCore.getMap(),
        isStyleLoaded: mapCore.isStyleLoaded()
      },
      timestamp: Date.now()
    };

    this.checkpoints.push(checkpoint);
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }

    return checkpoint;
  }

  async recoverToCheckpoint(checkpoint: RollbackCheckpoint): Promise<RecoveryResult> {
    try {
      const action = this.determineRecoveryAction(checkpoint);
      
      const attempts = this.recoveryAttempts.get(action.level) || 0;
      if (attempts >= action.maxAttempts) {
        throw new Error(`Maximum recovery attempts reached for level ${action.level}`);
      }

      this.recoveryAttempts.set(action.level, attempts + 1);

      switch (action.level) {
        case 1:
          await this.recoverStyleLoading();
          break;
        case 2:
          await this.recoverMapInstance();
          break;
        case 3:
          await this.recoverResources(action.retainResources);
          break;
        case 4:
          await this.performCompleteReset();
          break;
      }

      await stateManager.transition(action.target);

      this.recoveryAttempts.delete(action.level);

      return {
        success: true,
        newState: action.target
      };

    } catch (error) {
      console.error('[RollbackManager] Recovery failed:', error);
      return {
        success: false,
        newState: 'error',
        error: error instanceof Error ? error.message : 'Recovery failed'
      };
    }
  }

  private determineRecoveryAction(checkpoint: RollbackCheckpoint): RecoveryAction {
    const currentState = stateManager.getCurrentState();
    
    if (currentState === 'error') {
      return {
        level: 4,
        target: 'prerequisites_checking',
        retainResources: [],
        maxAttempts: 3
      };
    }

    if (!mapCore.isStyleLoaded() && checkpoint.map.isStyleLoaded) {
      return {
        level: 1,
        target: checkpoint.state,
        retainResources: ['token', 'module', 'dom'],
        maxAttempts: 5
      };
    }

    if (!mapCore.getMap() && checkpoint.map.isInitialized) {
      return {
        level: 2,
        target: 'core_initializing',
        retainResources: ['token', 'module'],
        maxAttempts: 3
      };
    }

    return {
      level: 3,
      target: 'resources_acquiring',
      retainResources: ['token'],
      maxAttempts: 3
    };
  }

  private async recoverStyleLoading(): Promise<void> {
    const map = mapCore.getMap();
    if (!map) throw new Error('Map instance not available');

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Style loading timeout during recovery'));
      }, 10000);

      map.once('style.load', () => {
        clearTimeout(timeout);
        resolve();
      });

      map.setStyle(map.getStyle());
    });
  }

  private async recoverMapInstance(): Promise<void> {
    await mapCore.cleanup();
    const domResource = resourceManager.getResource('dom');
    if (!domResource) throw new Error('DOM resource not available');
    
    const container = domResource.getState().status === 'ready' ? 
      (resourceManager as any).resources.get('dom').container : 
      null;
    
    if (!container) throw new Error('DOM container not available');
    
    await mapCore.initialize(container, {
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-24.6282, 25.9692],
      zoom: 12
    });
  }

  private async recoverResources(retainResources: string[]): Promise<void> {
    const currentResources = Object.keys(stateManager.getResourceState());
    for (const resource of currentResources) {
      if (!retainResources.includes(resource)) {
        await resourceManager.releaseResource(resource as any);
      }
    }

    for (const resource of currentResources) {
      const resourceState = stateManager.getResourceState();
      const resourceKey = resource as keyof MapResourceState;
      
      if (!resourceState[resourceKey]) {
        await resourceManager.acquireResource(resource as any);
      }
    }
  }

  private async performCompleteReset(): Promise<void> {
    await mapCore.cleanup();
    this.checkpoints = [];
    this.recoveryAttempts.clear();
    eventBus.emit({
      type: 'stateChange',
      payload: { state: 'uninitialized' }
    });
  }

  getLatestCheckpoint(): RollbackCheckpoint | null {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }

  clearCheckpoints(): void {
    this.checkpoints = [];
    this.recoveryAttempts.clear();
  }
}

export const rollbackManager = RollbackManager.getInstance();
