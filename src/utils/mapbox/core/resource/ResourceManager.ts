
import { 
  ResourceType, 
  ResourceState, 
  Resource, 
  ResourceConfigs,
  resourceDependencies
} from './resourceTypes';
import { ResourceBase } from './ResourceBase';
import { TokenResource } from './TokenResource';
import { ModuleResource } from './ModuleResource';
import { DOMResource } from './DOMResource';
import { eventBus } from '../eventBus';
import { stateManager } from '../stateManager';

export interface ResourceManagerState {
  [key: string]: ResourceState;
}

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

    this.resources.forEach((resource, type) => {
      this.state[type] = resource.getState();
    });
  }

  private async validateDependencies(type: ResourceType): Promise<boolean> {
    const dependencies = resourceDependencies[type];
    
    for (const dep of dependencies) {
      const resource = this.resources.get(dep);
      if (!resource || resource.state.status !== 'ready') {
        console.error(`Dependency ${dep} not ready for resource ${type}`);
        return false;
      }
    }
    
    return true;
  }

  async acquireResource(type: ResourceType): Promise<boolean> {
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      // Check dependencies first
      const dependenciesReady = await this.validateDependencies(type);
      if (!dependenciesReady) {
        eventBus.emit({
          type: 'error',
          payload: `Dependencies not ready for resource ${type}`
        });
        return false;
      }

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

  async configureResource<T extends ResourceType>(
    type: T,
    config: ResourceConfigs[T]
  ): Promise<boolean> {
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      return await resource.configure(config);
    } catch (error) {
      eventBus.emit({
        type: 'error',
        payload: `Failed to configure resource ${type}: ${error}`
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

  getResource<T extends ResourceType>(type: T): ResourceBase | undefined {
    return this.resources.get(type);
  }

  getResourceState(type: ResourceType): ResourceState {
    return this.state[type];
  }

  getAllResourceStates(): ResourceManagerState {
    return { ...this.state };
  }

  async releaseAll(): Promise<void> {
    // Release in reverse dependency order
    const types = Array.from(this.resources.keys());
    const reversedTypes = this.sortByDependencies(types).reverse();
    
    for (const type of reversedTypes) {
      await this.releaseResource(type);
    }
  }

  private sortByDependencies(types: ResourceType[]): ResourceType[] {
    const visited = new Set<ResourceType>();
    const sorted: ResourceType[] = [];

    const visit = (type: ResourceType) => {
      if (visited.has(type)) return;
      visited.add(type);

      for (const dep of resourceDependencies[type]) {
        visit(dep);
      }

      sorted.push(type);
    };

    types.forEach(visit);
    return sorted;
  }
}

export const resourceManager = ResourceManager.getInstance();
