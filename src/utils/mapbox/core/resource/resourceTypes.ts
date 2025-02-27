
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

export interface ResourceConfig<T = unknown> {
  type: ResourceType;
  config: T;
}

export interface DOMResourceConfig {
  container: HTMLElement;
  options?: {
    validateSize?: boolean;
    minWidth?: number;
    minHeight?: number;
  }
}

export interface ModuleResourceConfig {
  validateInstance?: boolean;
}

export interface TokenResourceConfig {
  refreshInterval?: number;
  validateOnRefresh?: boolean;
}

export type ResourceConfigs = {
  'dom': DOMResourceConfig;
  'module': ModuleResourceConfig;
  'token': TokenResourceConfig;
}

export interface Resource {
  type: ResourceType;
  state: ResourceState;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  validate: () => Promise<boolean>;
  configure: (config: ResourceConfigs[ResourceType]) => Promise<boolean>;
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
}
