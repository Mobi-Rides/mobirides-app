
import { MapStateEvent, EventSubscriber } from './types';

export class EventBus {
  private static instance: EventBus;
  private subscribers: EventSubscriber[] = [];

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(subscriber: EventSubscriber) {
    this.subscribers.push(subscriber);
  }

  unsubscribe(subscriber: EventSubscriber) {
    this.subscribers = this.subscribers.filter(s => s !== subscriber);
  }

  emit(event: MapStateEvent) {
    console.log(`[EventBus] Emitting event:`, event);
    this.subscribers.forEach(subscriber => {
      subscriber.onEvent(event);
    });
  }
}

export const eventBus = EventBus.getInstance();

