
import { Resource, ResourceType, ResourceState, ResourceStatus, ResourceConfigs, ResourceMetrics, ResourceValidationResult } from './resourceTypes';
import { eventBus } from '../eventBus';

export abstract class ResourceBase implements Resource {
  public state: ResourceState = {
    status: 'pending',
    timestamp: Date.now()
  };

  protected metrics: ResourceMetrics = {
    loadTime: 0,
    validationTime: 0,
    errorCount: 0,
    lastValidated: 0,
    dependencyValidationTime: 0
  };

  constructor(public readonly type: ResourceType) {}

  protected setState(status: ResourceStatus, error?: string) {
    const previousState = this.state.status;
    
    if (!this.isValidStateTransition(previousState, status)) {
      console.warn(`Invalid state transition from ${previousState} to ${status}`);
      return;
    }

    const timestamp = Date.now();
    this.state = { status, error, timestamp };

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
  abstract configure(config: ResourceConfigs[ResourceType]): Promise<boolean>;

  protected async validateWithMetrics(): Promise<ResourceValidationResult> {
    const start = Date.now();
    try {
      const isValid = await this.validate();
      const validationTime = Date.now() - start;
      this.metrics.validationTime = validationTime;
      this.metrics.lastValidated = Date.now();

      return {
        isValid,
        metrics: {
          validationTime,
          lastValidated: this.metrics.lastValidated
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        metrics: {
          validationTime: Date.now() - start
        }
      };
    }
  }

  getState(): ResourceState {
    return { ...this.state };
  }

  getMetrics(): ResourceMetrics {
    return { ...this.metrics };
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
