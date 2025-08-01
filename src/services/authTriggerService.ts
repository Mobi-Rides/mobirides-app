interface PendingAction {
  type: 'booking' | 'save_car' | 'contact_host';
  payload: Record<string, unknown>;
  context?: string;
}

class AuthTriggerService {
  private static readonly STORAGE_KEY = 'pending_auth_action';
  private static readonly SESSION_TRACKER_KEY = 'auth_session_tracker';
  private static readonly MIN_EXECUTION_INTERVAL = 5000; // 5 seconds
  private static executionTimeout: number | null = null;

  static storePendingAction(action: PendingAction) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(action));
  }

  static getPendingAction(): PendingAction | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  static clearPendingAction() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static getSessionTracker() {
    const stored = localStorage.getItem(this.SESSION_TRACKER_KEY);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  private static setSessionTracker(sessionId: string, executedAt: number) {
    localStorage.setItem(this.SESSION_TRACKER_KEY, JSON.stringify({
      sessionId,
      executedAt,
      lastExecutionTime: Date.now()
    }));
  }

  static clearSessionTracker() {
    localStorage.removeItem(this.SESSION_TRACKER_KEY);
  }

  private static hasExecutedForSession(sessionId: string): boolean {
    const tracker = this.getSessionTracker();
    return tracker?.sessionId === sessionId;
  }

  private static canExecuteNow(): boolean {
    const tracker = this.getSessionTracker();
    if (!tracker) return true;
    
    const timeSinceLastExecution = Date.now() - tracker.lastExecutionTime;
    return timeSinceLastExecution >= this.MIN_EXECUTION_INTERVAL;
  }

  static async executePendingAction(sessionId?: string): Promise<boolean> {
    const action = this.getPendingAction();
    if (!action) return false;

    // Guard against duplicate executions for the same session
    if (sessionId && this.hasExecutedForSession(sessionId)) {
      console.log('Pending action already executed for this session, skipping');
      return false;
    }

    // Rate limiting protection
    if (!this.canExecuteNow()) {
      console.log('Rate limit protection: too soon since last execution');
      return false;
    }

    console.log('Executing pending action:', action);

    // Clear any existing timeout
    if (this.executionTimeout) {
      clearTimeout(this.executionTimeout);
      this.executionTimeout = null;
    }

    // Debounce execution by 300ms
    return new Promise((resolve) => {
      this.executionTimeout = window.setTimeout(async () => {
        try {
          switch (action.type) {
            case 'booking':
              console.log('Dispatching execute-booking event:', action.payload);
              window.dispatchEvent(new CustomEvent('execute-booking', { 
                detail: action.payload 
              }));
              break;
            case 'save_car':
              console.log('Dispatching execute-save-car event:', action.payload);
              window.dispatchEvent(new CustomEvent('execute-save-car', { 
                detail: action.payload 
              }));
              break;
            case 'contact_host':
              console.log('Dispatching execute-contact-host event:', action.payload);
              window.dispatchEvent(new CustomEvent('execute-contact-host', { 
                detail: action.payload 
              }));
              break;
          }
          
          // Mark as executed for this session
          if (sessionId) {
            this.setSessionTracker(sessionId, Date.now());
          }
          
          this.clearPendingAction();
          resolve(true);
        } catch (error) {
          console.error('Failed to execute pending action:', error);
          this.clearPendingAction();
          resolve(false);
        }
      }, 300); // 300ms debounce
    });
  }
}

export default AuthTriggerService;