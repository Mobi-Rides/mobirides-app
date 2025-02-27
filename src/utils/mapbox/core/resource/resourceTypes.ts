
/**
 * Core resource types and interfaces for map initialization
 */

export type ResourceType = 'token' | 'module' | 'dom';
export type ResourceStatus = 'pending' | 'loading' | 'ready' | 'error';

export interface ResourceState {
  status: ResourceStatus;
  error?: string;
  timestamp: number;
}

// Base configuration shared by all resources
export interface ResourceConfigBase {
  validateDependencies?: boolean;
}

// Specific resource configurations
export interface DOMResourceConfig extends ResourceConfigBase {
  container: HTMLElement;
  options?: {
    validateSize?: boolean;
    minWidth?: number;
    minHeight?: number;
  }
}

export interface ModuleResourceConfig extends ResourceConfigBase {
  validateInstance?: boolean;
}

export interface TokenResourceConfig extends ResourceConfigBase {
  refreshInterval?: number;
  validateOnRefresh?: boolean;
}

// Resource management interfaces
export interface ResourceConfigs {
  configureDOMResource(config: DOMResourceConfig): Promise<boolean>;
  configureModuleResource(config: ModuleResourceConfig): Promise<boolean>;
  configureTokenResource(config: TokenResourceConfig): Promise<boolean>;
  acquireResource(type: ResourceType): Promise<boolean>;
  releaseResource(type: ResourceType): Promise<void>;
}

export interface Resource {
  type: ResourceType;
  state: ResourceState;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  validate: () => Promise<boolean>;
  configure: (config: ResourceConfigBase) => Promise<boolean>;
}

export const resourceDependencies = {
  'token': [] as ResourceType[],
  'module': ['token'] as ResourceType[],
  'dom': [] as ResourceType[],
} as const;

export interface ResourceMetrics {
  loadTime: number;
  validationTime: number;
  errorCount: number;
  lastValidated: number;
  dependencyValidationTime?: number;
}

export interface ResourceValidationResult {
  isValid: boolean;
  error?: string;
  metrics?: Partial<ResourceMetrics>;
}
