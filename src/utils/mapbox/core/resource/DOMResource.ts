
import { ResourceBase } from './ResourceBase';
import { ResourceConfigs, ResourceType } from './resourceTypes';

export class DOMResource extends ResourceBase {
  private container: HTMLElement | null = null;
  private config: ResourceConfigs['dom'] | null = null;

  constructor() {
    super('dom');
  }

  async configure<T extends ResourceType>(config: ResourceConfigs[T]): Promise<boolean> {
    if (this.type !== 'dom') return false;
    
    try {
      const domConfig = config as ResourceConfigs['dom'];
      this.config = domConfig;
      this.container = domConfig.container;
      
      if (this.container) {
        this.setState('ready');
        return true;
      }
      
      this.setState('error', 'Invalid container configuration');
      return false;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Configuration failed');
      return false;
    }
  }

  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');
      
      if (!this.container) {
        this.setState('error', 'No DOM container configured');
        return false;
      }

      if (!this.container.isConnected) {
        this.setState('error', 'Container not connected to DOM');
        return false;
      }

      if (this.config?.options?.validateSize) {
        const { minWidth = 0, minHeight = 0 } = this.config.options;
        const rect = this.container.getBoundingClientRect();
        
        if (rect.width < minWidth || rect.height < minHeight) {
          this.setState('error', 'Container size validation failed');
          return false;
        }
      }

      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to acquire DOM container');
      return false;
    }
  }

  async release(): Promise<void> {
    this.container = null;
    this.config = null;
    this.setState('pending');
  }

  async validate(): Promise<boolean> {
    try {
      if (!this.container || !this.container.isConnected) {
        this.setState('error', 'DOM container not valid');
        return false;
      }

      if (this.config?.options?.validateSize) {
        const { minWidth = 0, minHeight = 0 } = this.config.options;
        const rect = this.container.getBoundingClientRect();
        
        if (rect.width < minWidth || rect.height < minHeight) {
          this.setState('error', 'Container size validation failed');
          return false;
        }
      }

      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'DOM validation failed');
      return false;
    }
  }
}
