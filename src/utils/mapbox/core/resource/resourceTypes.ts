
export type ResourceType = 'token' | 'module' | 'dom';

export type ResourceStatus = 'pending' | 'loading' | 'ready' | 'error';

export interface ResourceState {
  status: ResourceStatus;
  error?: string;
  timestamp: number;
}

export interface Resource {
  type: ResourceType;
  state: ResourceState;
  acquire: () => Promise<boolean>;
  release: () => Promise<void>;
  validate: () => Promise<boolean>;
}
