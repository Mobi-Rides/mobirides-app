
import { ResourceType, ResourceState, ResourceManagerState } from './types';
import { TokenResource } from './TokenResource';
import { ModuleResource } from './ModuleResource';
import { DOMResource } from './DOMResource';
import { eventBus } from '../eventBus';
import { stateManager } from '../stateManager';

export class ResourceManager {
  private static instance: ResourceManager;
  private resources: Map<ResourceType, ResourceBase> = new Map();
  private state: ResourceManagerState = {};

  private constructor() {
    this.initializeResources();
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  private initializeResources() {
    this.resources.set('token', new TokenResource());
    this.resources.set('module', new ModuleResource());
    this.resources.set('dom', new DOMResource());

    // Initialize state for each resource
    this.resources.forEach((resource, type) => {
      this.state[type] = resource.getState();
    });
  }

  async acquireResource(type: ResourceType): Promise<boolean> {
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      const success = await resource.acquire();
      this.state[type] = resource.getState();
      
      if (success) {
        stateManager.updateResourceState({ [type]: true });
      }

      return success;
    } catch (error) {
      eventBus.emit({
        type: 'error',
        payload: `Failed to acquire resource ${type}: ${error}`
      });
      return false;
    }
  }

  async releaseResource(type: ResourceType): Promise<void> {
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      await resource.release();
      this.state[type] = resource.getState();
      stateManager.updateResourceState({ [type]: false });
    } catch (error) {
      eventBus.emit({
        type: 'error',
        payload: `Failed to release resource ${type}: ${error}`
      });
    }
  }

  async validateResource(type: ResourceType): Promise<boolean> {
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      const isValid = await resource.validate();
      this.state[type] = resource.getState();
      return isValid;
    } catch (error) {
      eventBus.emit({
        type: 'error',
        payload: `Failed to validate resource ${type}: ${error}`
      });
      return false;
    }
  }

  getResource<T extends ResourceBase>(type: ResourceType): T | undefined {
    return this.resources.get(type) as T | undefined;
  }

  getResourceState(type: ResourceType): ResourceState {
    return this.state[type];
  }

  getAllResourceStates(): ResourceManagerState {
    return { ...this.state };
  }

  async releaseAll(): Promise<void> {
    for (const [type] of this.resources) {
      await this.releaseResource(type);
    }
  }
}

export const resourceManager = ResourceManager.getInstance();
