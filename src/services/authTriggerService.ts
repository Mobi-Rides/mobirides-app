interface PendingAction {
  type: 'booking' | 'save_car' | 'contact_host';
  payload: any;
  context?: string;
}

class AuthTriggerService {
  private static readonly STORAGE_KEY = 'pending_auth_action';

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

  static async executePendingAction(): Promise<boolean> {
    const action = this.getPendingAction();
    if (!action) return false;

    try {
      switch (action.type) {
        case 'booking':
          // Trigger booking dialog with stored car data
          window.dispatchEvent(new CustomEvent('execute-booking', { 
            detail: action.payload 
          }));
          break;
        case 'save_car':
          // Trigger save car action
          window.dispatchEvent(new CustomEvent('execute-save-car', { 
            detail: action.payload 
          }));
          break;
        case 'contact_host':
          // Trigger contact host action
          window.dispatchEvent(new CustomEvent('execute-contact-host', { 
            detail: action.payload 
          }));
          break;
      }
      
      this.clearPendingAction();
      return true;
    } catch (error) {
      console.error('Failed to execute pending action:', error);
      this.clearPendingAction();
      return false;
    }
  }
}

export default AuthTriggerService;