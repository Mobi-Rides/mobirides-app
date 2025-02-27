
import { ResourceBase } from './ResourceBase';

export class DOMResource extends ResourceBase {
  private container: HTMLElement | null = null;

  constructor() {
    super('dom');
  }

  setContainer(element: HTMLElement | null) {
    this.container = element;
    if (element) {
      this.setState('ready');
    } else {
      this.setState('pending');
    }
  }

  async acquire(): Promise<boolean> {
    try {
      this.setState('loading');
      if (!this.container) {
        this.setState('error', 'No DOM container available');
        return false;
      }
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'Failed to acquire DOM container');
      return false;
    }
  }

  async release(): Promise<void> {
    this.container = null;
    this.setState('pending');
  }

  async validate(): Promise<boolean> {
    try {
      if (!this.container || !this.container.isConnected) {
        this.setState('error', 'DOM container not valid');
        return false;
      }
      this.setState('ready');
      return true;
    } catch (error) {
      this.setState('error', error instanceof Error ? error.message : 'DOM validation failed');
      return false;
    }
  }
}
