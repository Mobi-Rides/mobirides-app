
import { ResourceBase } from './ResourceBase';
import { mapboxTokenManager } from '../../tokenManager';
import { ResourceConfigs, ResourceType } from './resourceTypes';

export class ModuleResource extends ResourceBase {
  private config: ResourceConfigs['module'] | null = null;

  constructor() {
    super('module');
  }

  async configure<T extends ResourceType>(config: ResourceConfigs[T]): Promise<boolean> {
    if (this.type !== 'module') return false;
    
    try {
      const moduleConfig = config as ResourceConfigs['module'];
      this.config = moduleConfig;
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Configuration failed');
      return false;
    }
  }

  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');
      const instanceManager = mapboxTokenManager.getInstanceManager();
      const module = await instanceManager.getMapboxModule();
      if (!module) {
        this.setState('error', 'Failed to load Mapbox module');
        return false;
      }

      if (this.config?.validateInstance) {
        if (!instanceManager.isReady()) {
          this.setState('error', 'Module instance validation failed');
          return false;
        }
      }

      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to acquire module');
      return false;
    }
  }

  async release(): Promise<void> {
    try {
      const instanceManager = mapboxTokenManager.getInstanceManager();
      instanceManager.clearGlobalInstance();
      this.setState('pending');
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to release module');
    }
  }

  async validate(): Promise<boolean> {
    try {
      const instanceManager = mapboxTokenManager.getInstanceManager();
      if (!instanceManager.isReady()) {
        this.setState('error', 'Module not ready');
        return false;
      }
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Module validation failed');
      return false;
    }
  }
}
