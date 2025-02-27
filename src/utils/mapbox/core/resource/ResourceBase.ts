
import { Resource, ResourceType, ResourceState, ResourceStatus, ResourceConfigs, ResourceMetrics, ResourceValidationResult } from './resourceTypes';
import { eventBus } from '../eventBus';

export abstract class ResourceBase implements Resource {
  protected state: ResourceState = {
    status: 'pending',
    timestamp: Date.now(),
    retryCount: 0
  };

  protected metrics: ResourceMetrics = {
    loadTime: 0,
    validationTime: 0,
    errorCount: 0,
    lastValidated: 0,
    retryCount: 0,
    averageValidationTime: 0
  };

  protected maxRetries: number = 3;
  protected retryDelay: number = 1000;

  constructor(public readonly type: ResourceType) {}

  protected setState(status: ResourceStatus, error?: string) {
    const previousState = this.state.status;
    
    if (!this.isValidStateTransition(previousState, status)) {
      console.warn(`[ResourceBase] Invalid state transition from ${previousState} to ${status}`);
      return;
    }

    const timestamp = Date.now();
    this.state = { 
      ...this.state,
      status, 
      error, 
      timestamp,
      retryCount: status === 'error' ? (this.state.retryCount || 0) + 1 : this.state.retryCount
    };

    if (status === 'error') {
      this.metrics.errorCount++;
    }
    if (status === 'ready') {
      this.metrics.loadTime = timestamp - (this.metrics.lastValidated || timestamp);
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

  protected async withRetry<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(errorMessage);
        console.warn(`[ResourceBase] Attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);
        
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error(errorMessage);
  }

  protected async validateWithMetrics(): Promise<ResourceValidationResult> {
    const start = Date.now();
    try {
      const isValid = await this.validate();
      const validationTime = Date.now() - start;
      
      this.metrics.validationTime = validationTime;
      this.metrics.lastValidated = Date.now();
      this.metrics.averageValidationTime = (
        this.metrics.averageValidationTime * this.metrics.retryCount + validationTime
      ) / (this.metrics.retryCount + 1);

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
          validationTime: Date.now() - start,
          lastValidated: this.metrics.lastValidated
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

  protected isValidStateTransition(from: ResourceStatus, to: ResourceStatus): boolean {
    const validTransitions: Record<ResourceStatus, ResourceStatus[]> = {
      'pending': ['loading', 'error'],
      'loading': ['ready', 'error'],
      'ready': ['loading', 'error', 'pending'],
      'error': ['loading', 'pending']
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  protected canRetry(): boolean {
    return (this.state.retryCount || 0) < this.maxRetries;
  }

  protected resetRetryCount(): void {
    this.state.retryCount = 0;
  }
}
