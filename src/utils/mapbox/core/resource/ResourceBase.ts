
import { Resource, ResourceType, ResourceState, ResourceStatus, ResourceConfigs } from './resourceTypes';
import { eventBus } from '../eventBus';

/**
 * Base class for all resource implementations with type-safe configuration
 */
export abstract class ResourceBase implements Resource {
  public state: ResourceState = {
    status: 'pending',
    timestamp: Date.now()
  };

  private metrics = {
    loadTime: 0,
    validationTime: 0,
    errorCount: 0,
    lastValidated: 0
  };

  constructor(public readonly type: ResourceType) {}

  protected setState(status: ResourceStatus, error?: string) {
    const previousState = this.state.status;
    
    if (!this.isValidStateTransition(previousState, status)) {
      console.warn(`Invalid state transition from ${previousState} to ${status}`);
      return;
    }

    const timestamp = Date.now();
    this.state = {
      status,
      error,
      timestamp
    };

    // Track metrics
    if (status === 'error') {
      this.metrics.errorCount++;
    }
    if (status === 'ready') {
      this.metrics.loadTime = timestamp - this.metrics.lastValidated;
    }

    eventBus.emit({
      type: 'resourceUpdate',
      payload: {
        type: this.type,
        state: this.state,
        previousState,
        metrics: { ...this.metrics }
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

  getMetrics() {
    return { ...this.metrics };
  }

  protected async validateWithMetrics(): Promise<boolean> {
    const start = Date.now();
    const isValid = await this.validate();
    this.metrics.validationTime = Date.now() - start;
    this.metrics.lastValidated = Date.now();
    return isValid;
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

