
import { Resource, ResourceType, ResourceState, ResourceStatus } from './types';
import { eventBus } from '../eventBus';

export abstract class ResourceBase implements Resource {
  protected state: ResourceState = {
    status: 'pending',
    timestamp: Date.now()
  };

  constructor(public readonly type: ResourceType) {}

  protected setState(status: ResourceStatus, error?: string) {
    this.state = {
      status,
      error,
      timestamp: Date.now()
    };

    eventBus.emit({
      type: 'resourceUpdate',
      payload: {
        type: this.type,
        state: this.state
      }
    });
  }

  abstract acquire(): Promise<boolean>;
  abstract release(): Promise<void>;
  abstract validate(): Promise<boolean>;

  getState(): ResourceState {
    return { ...this.state };
  }
}
