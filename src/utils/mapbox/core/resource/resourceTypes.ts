
import { ResourceBase } from './ResourceBase';

export type ResourceType = 'token' | 'module' | 'dom';

export type ResourceStatus = 'pending' | 'loading' | 'ready' | 'error';

/**
 * Represents the state of a resource including its status and metadata
 */
export interface ResourceState {
  status: ResourceStatus;
  error?: string;
  timestamp: number;
}

/**
 * Base configuration interface for all resource types
 */
export interface ResourceConfig<T = unknown> {
  type: ResourceType;
  config?: T;
}

/**
 * Configuration options for DOM resources
 */
export interface DOMResourceConfig {
  container: HTMLElement;
  options?: {
    validateSize?: boolean;
    minWidth?: number;
    minHeight?: number;
  }
}

/**
 * Configuration options for module resources
 */
export interface ModuleResourceConfig {
  validateInstance?: boolean;
}

/**
 * Configuration options for token resources
 */
export interface TokenResourceConfig {
  refreshInterval?: number;
  validateOnRefresh?: boolean;
}

/**
 * Type-safe mapping of resource types to their configurations
 */
export type ResourceConfigs = {
  'dom': DOMResourceConfig;
  'module': ModuleResourceConfig;
  'token': TokenResourceConfig;
}

/**
 * Core resource interface with type-safe configuration
 */
export interface Resource {
  type: ResourceType;
  state: ResourceState;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  validate: () => Promise<boolean>;
  configure: <T extends ResourceType>(config: ResourceConfigs[T]) => Promise<boolean>;
}

/**
 * Dependency graph for resource initialization order
 */
export type ResourceDependencyGraph = {
  [K in ResourceType]: ResourceType[];
};

/**
 * Resource initialization dependencies
 */
export const resourceDependencies: ResourceDependencyGraph = {
  'token': [],
  'module': ['token'],
  'dom': [],
};

/**
 * Resource error types for standardized error handling
 */
export type ResourceError = {
  type: ResourceType;
  code: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

/**
 * Resource performance metrics for monitoring
 */
export interface ResourceMetrics {
  loadTime: number;
  validationTime: number;
  errorCount: number;
  lastValidated: number;
}

