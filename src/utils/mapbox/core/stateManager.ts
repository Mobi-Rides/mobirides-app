
import { MapInitializationState, MapResourceState, StateSubscriber } from './types';

export class StateManager {
  private static instance: StateManager;
  private currentState: MapInitializationState = 'uninitialized';
  private resourceState: MapResourceState = {
    token: false,
    module: false,
    dom: false
  };
  private subscribers: StateSubscriber[] = [];
  private transitionInProgress: boolean = false;

  private constructor() {}

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  getCurrentState(): MapInitializationState {
    return this.currentState;
  }

  getResourceState(): MapResourceState {
    return { ...this.resourceState };
  }

  subscribe(subscriber: StateSubscriber) {
    this.subscribers.push(subscriber);
  }

  unsubscribe(subscriber: StateSubscriber) {
    this.subscribers = this.subscribers.filter(s => s !== subscriber);
  }

  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      subscriber.onStateChange(this.currentState);
    });
  }

  async transition(newState: MapInitializationState) {
    if (this.transitionInProgress) {
      console.warn(`[StateManager] State transition already in progress: ${this.currentState} -> ${newState}`);
      return;
    }

    this.transitionInProgress = true;
    console.log(`[StateManager] Starting transition from ${this.currentState} to ${newState}`);
    
    try {
      // Validate state transition
      if (!this.isValidTransition(this.currentState, newState)) {
        throw new Error(`Invalid state transition from ${this.currentState} to ${newState}`);
      }

      // Handle special state transitions
      if (newState === 'core_initializing' && !this.areResourcesReady()) {
        throw new Error('Cannot transition to core_initializing: resources not ready');
      }

      this.currentState = newState;
      this.notifySubscribers();
      console.log(`[StateManager] Successfully transitioned to ${newState}`);
    } catch (error) {
      console.error('[StateManager] Transition error:', error);
      // Force transition to error state on failure
      this.currentState = 'error';
      this.notifySubscribers();
    } finally {
      this.transitionInProgress = false;
    }
  }

  updateResourceState(updates: Partial<MapResourceState>) {
    console.log('[StateManager] Updating resource state:', updates);
    this.resourceState = {
      ...this.resourceState,
      ...updates
    };

    // Check if all resources are ready
    if (this.areResourcesReady() && this.currentState === 'resources_acquiring') {
      console.log('[StateManager] All resources ready, transitioning to core_initializing');
      this.transition('core_initializing');
    }
  }

  private areResourcesReady(): boolean {
    return Object.values(this.resourceState).every(value => value);
  }

  private isValidTransition(from: MapInitializationState, to: MapInitializationState): boolean {
    const validTransitions: Record<MapInitializationState, MapInitializationState[]> = {
      'uninitialized': ['prerequisites_checking', 'error'],
      'prerequisites_checking': ['resources_acquiring', 'error'],
      'resources_acquiring': ['core_initializing', 'error'],
      'core_initializing': ['features_activating', 'error'],
      'features_activating': ['ready', 'error'],
      'ready': ['error'],
      'error': ['prerequisites_checking']
    };

    return validTransitions[from]?.includes(to) ?? false;
  }
}

export const stateManager = StateManager.getInstance();
