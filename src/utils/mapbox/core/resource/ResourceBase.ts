
import { Resource, ResourceType, ResourceState, ResourceStatus, ResourceConfigs } from './resourceTypes';
import { eventBus } from '../eventBus';

export abstract class ResourceBase implements Resource {
  public state: ResourceState = {
    status: 'pending',
    timestamp: Date.now()
  };

  constructor(public readonly type: ResourceType) {}

  protected setState(status: ResourceStatus, error?: string) {
    const previousState = this.state.status;
    
    // Validate state transition
    if (!this.isValidStateTransition(previousState, status)) {
      console.warn(`Invalid state transition from ${previousState} to ${status}`);
      return;
    }

    this.state = {
      status,
      error,
      timestamp: Date.now()
    };

    eventBus.emit({
      type: 'resourceUpdate',
      payload: {
        type: this.type,
        state: this.state,
        previousState
      }
    });
  }

  abstract acquire(): Promise<boolean>;
  abstract release(): Promise<void>;
  abstract validate(): Promise<boolean>;
  abstract configure<T extends ResourceType>(config: ResourceConfigs[T]): Promise<boolean>;

  getState(): ResourceState {
    return { ...this.state };
  }

  private isValidStateTransition(from: ResourceStatus, to: ResourceStatus): boolean {
    const validTransitions: Record<ResourceStatus, ResourceStatus[]> = {
      'pending': ['loading', 'error'],
      'loading': ['ready', 'error'],
      'ready': ['loading', 'error', 'pending'],
      'error': ['loading', 'pending']
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}
