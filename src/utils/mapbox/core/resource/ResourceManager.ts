
import { 
  ResourceType, 
  ResourceState,
  Resource,
  ResourceConfigs,
  resourceDependencies,
  ResourceValidationResult,
  DOMResourceConfig,
  ModuleResourceConfig,
  TokenResourceConfig,
  ResourceConfigBase
} from './resourceTypes';
import { ResourceBase } from './ResourceBase';
import { TokenResource } from './TokenResource';
import { ModuleResource } from './ModuleResource';
import { DOMResource } from './DOMResource';
import { eventBus } from '../eventBus';
import { stateManager } from '../stateManager';

export class ResourceManager implements ResourceConfigs {
  private static instance: ResourceManager;
  private resources: Map<ResourceType, ResourceBase> = new Map();
  private state: Record<ResourceType, ResourceState> = {} as Record<ResourceType, ResourceState>;
  private validationInProgress: boolean = false;

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

  // Type-safe configuration methods
  async configureDOMResource(config: DOMResourceConfig): Promise<boolean> {
    return this.configureTypedResource('dom', config);
  }

  async configureModuleResource(config: ModuleResourceConfig): Promise<boolean> {
    return this.configureTypedResource('module', config);
  }

  async configureTokenResource(config: TokenResourceConfig): Promise<boolean> {
    return this.configureTypedResource('token', config);
  }

  private async configureTypedResource<T extends ResourceType>(
    type: T, 
    config: ResourceConfigBase
  ): Promise<boolean> {
    console.log(`[ResourceManager] Configuring resource: ${type}`);
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      return await resource.configure(config);
    } catch (error) {
      console.error(`[ResourceManager] Failed to configure resource ${type}:`, error);
      eventBus.emit({
        type: 'error',
        payload: `Failed to configure resource ${type}: ${error}`
      });
      return false;
    }
  }

  // Resource lifecycle methods
  async acquireResource(type: ResourceType): Promise<boolean> {
    console.log(`[ResourceManager] Acquiring resource: ${type}`);
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      const dependencyValidation = await this.validateDependencies(type);
      if (!dependencyValidation.isValid) {
        console.error(`[ResourceManager] Dependencies not valid for ${type}:`, dependencyValidation.error);
        eventBus.emit({
          type: 'error',
          payload: dependencyValidation.error || `Dependencies not valid for resource ${type}`
        });
        return false;
      }

      const success = await resource.acquire();
      this.state[type] = resource.getState();
      
      if (success) {
        stateManager.updateResourceState({ [type]: true });
        console.log(`[ResourceManager] Successfully acquired resource: ${type}`);
      }

      return success;
    } catch (error) {
      console.error(`[ResourceManager] Failed to acquire resource ${type}:`, error);
      eventBus.emit({
        type: 'error',
        payload: `Failed to acquire resource ${type}: ${error}`
      });
      return false;
    }
  }

  async releaseResource(type: ResourceType): Promise<void> {
    console.log(`[ResourceManager] Releasing resource: ${type}`);
    const resource = this.resources.get(type);
    if (!resource) {
      throw new Error(`Resource ${type} not found`);
    }

    try {
      await resource.release();
      this.state[type] = resource.getState();
      stateManager.updateResourceState({ [type]: false });
      console.log(`[ResourceManager] Successfully released resource: ${type}`);
    } catch (error) {
      console.error(`[ResourceManager] Failed to release resource ${type}:`, error);
      eventBus.emit({
        type: 'error',
        payload: `Failed to release resource ${type}: ${error}`
      });
    }
  }

  private async validateDependencies(type: ResourceType): Promise<ResourceValidationResult> {
    const dependencies = resourceDependencies[type];
    const start = Date.now();
    
    for (const dep of dependencies) {
      const resource = this.resources.get(dep);
      if (!resource) {
        return {
          isValid: false,
          error: `Dependency ${dep} not found for resource ${type}`,
          metrics: {
            dependencyValidationTime: Date.now() - start
          }
        };
      }

      const validation = await resource.validate();
      if (!validation) {
        return {
          isValid: false,
          error: `Dependency ${dep} validation failed for resource ${type}`,
          metrics: {
            dependencyValidationTime: Date.now() - start
          }
        };
      }
    }
    
    return {
      isValid: true,
      metrics: {
        dependencyValidationTime: Date.now() - start
      }
    };
  }

  async releaseAll(): Promise<void> {
    console.log('[ResourceManager] Starting release of all resources');
    const types = Array.from(this.resources.keys());
    const reversedTypes = this.sortByDependencies(types).reverse();
    
    for (const type of reversedTypes) {
      await this.releaseResource(type);
    }
    console.log('[ResourceManager] Completed release of all resources');
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

  // State access methods
  getResource(type: ResourceType): ResourceBase | undefined {
    return this.resources.get(type);
  }

  getResourceState(type: ResourceType): ResourceState {
    return this.state[type];
  }

  getAllResourceStates(): Record<ResourceType, ResourceState> {
    return { ...this.state };
  }

  // Implement the interface properties for resource configs
  dom!: DOMResourceConfig;
  module!: ModuleResourceConfig;
  token!: TokenResourceConfig;
}

export const resourceManager = ResourceManager.getInstance();
