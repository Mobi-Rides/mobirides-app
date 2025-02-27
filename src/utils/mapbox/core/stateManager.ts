
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
    console.log(`[StateManager] Transitioning from ${this.currentState} to ${newState}`);
    
    // Validate state transition
    if (!this.isValidTransition(this.currentState, newState)) {
      throw new Error(`Invalid state transition from ${this.currentState} to ${newState}`);
    }

    this.currentState = newState;
    this.notifySubscribers();
  }

  updateResourceState(updates: Partial<MapResourceState>) {
    this.resourceState = {
      ...this.resourceState,
      ...updates
    };

    // Check if all resources are ready
    if (this.areResourcesReady() && this.currentState === 'resources_acquiring') {
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

