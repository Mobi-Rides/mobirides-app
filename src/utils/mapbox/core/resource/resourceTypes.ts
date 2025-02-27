
export type ResourceType = 'token' | 'module' | 'dom';

export type ResourceStatus = 'pending' | 'loading' | 'ready' | 'error';

export interface ResourceState {
  status: ResourceStatus;
  error?: string;
  timestamp: number;
}

export interface ResourceConfig<T = unknown> {
  type: ResourceType;
  config?: T;
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
  configure: <T extends ResourceType>(config: ResourceConfigs[T]) => Promise<boolean>;
}

export type ResourceDependencyGraph = {
  [K in ResourceType]: ResourceType[];
};

export const resourceDependencies: ResourceDependencyGraph = {
  'token': [],
  'module': ['token'],
  'dom': [],
};
