
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

// Generic resource configuration
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

// Type-safe configuration mapping
export type ResourceConfigs = {
  'dom': DOMResourceConfig;
  'module': ModuleResourceConfig;
  'token': TokenResourceConfig;
}

// Type helper for configuration
export type ConfigForResource<T extends ResourceType> = ResourceConfigs[T];

export interface Resource {
  type: ResourceType;
  state: ResourceState;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  validate: () => Promise<boolean>;
  configure: <T extends ResourceType>(config: ConfigForResource<T>) => Promise<boolean>;
}

export const resourceDependencies = {
  'token': [] as ResourceType[],
  'module': ['token'] as ResourceType[],
  'dom': [] as ResourceType[],
} as const;

export type ResourceError = {
  type: ResourceType;
  code: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

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
