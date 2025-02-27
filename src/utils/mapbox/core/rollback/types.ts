
export type RecoveryLevel = 1 | 2 | 3 | 4;

export interface RollbackCheckpoint {
  state: MapInitializationState;
  resources: {
    token: boolean;
    module: boolean;
    dom: boolean;
  };
  map: {
    isInitialized: boolean;
    isStyleLoaded: boolean;
  };
  timestamp: number;
}

export interface RecoveryAction {
  level: RecoveryLevel;
  target: MapInitializationState;
  retainResources: string[];
  maxAttempts: number;
}

export interface RecoveryResult {
  success: boolean;
  newState: MapInitializationState;
  error?: string;
}
