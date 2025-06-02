
import { Location } from '../location/LocationManager';

export type MapInitializationState = 
  | 'uninitialized'
  | 'prerequisites_checking'
  | 'resources_acquiring'
  | 'core_initializing'
  | 'features_activating'
  | 'ready'
  | 'error';

export type MapResourceState = {
  token: boolean;
  module: boolean;
  dom: boolean;
};

export type MapStateEvent = {
  type: 'stateChange' | 'resourceUpdate' | 'error' | 'locationUpdate' | 'realtimeLocationUpdate';
  payload: any;
};

export interface StateSubscriber {
  onStateChange: (state: MapInitializationState) => void;
}

export interface EventSubscriber {
  onEvent: (event: MapStateEvent) => void;
}
