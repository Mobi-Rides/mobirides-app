import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { saveCar, unsaveCar } from "./savedCarService";

export interface PostAuthIntent {
  action: 'book' | 'save' | 'contact' | 'message';
  carId: string;
  timestamp: number;
  ownerId?: string;
  receiverId?: string;
  message?: string;
}

export class AuthTriggerService {
  /**
   * Store user intent for post-authentication action
   */
  static storeIntent(intent: PostAuthIntent): void {
    localStorage.setItem('postAuthIntent', JSON.stringify(intent));
  }

  /**
   * Retrieve and clear stored intent
   */
  static getStoredIntent(): PostAuthIntent | null {
    const stored = localStorage.getItem('postAuthIntent');
    if (!stored) return null;

    try {
      const intent = JSON.parse(stored);
      // Check if intent is not too old (24 hours)
      const isExpired = Date.now() - intent.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem('postAuthIntent');
        return null;
      }
      return intent;
    } catch (error) {
      console.error('Error parsing stored intent:', error);
      localStorage.removeItem('postAuthIntent');
      return null;
    }
  }

  /**
   * Clear stored intent
   */
  static clearStoredIntent(): void {
    localStorage.removeItem('postAuthIntent');
  }

  /**
   * Execute post-authentication action based on stored intent
   */
  static async executeStoredIntent(): Promise<boolean> {
    const intent = this.getStoredIntent();
    if (!intent) return false;

    try {
      switch (intent.action) {
        case 'book':
          await this.handleBookIntent(intent);
          break;
        case 'save':
          await this.handleSaveIntent(intent);
          break;
        case 'contact':
          await this.handleContactIntent(intent);
          break;
        case 'message':
          await this.handleMessageIntent(intent);
          break;
        default:
          console.warn('Unknown intent action:', intent.action);
          return false;
      }

      this.clearStoredIntent();
      return true;
    } catch (error) {
      console.error('Error executing stored intent:', error);
      toast.error('Failed to complete your intended action. Please try again.');
      return false;
    }
  }

  /**
   * Handle booking intent after authentication
   */
  private static async handleBookIntent(intent: PostAuthIntent): Promise<void> {
    // Navigate to car details page to trigger booking
    window.location.href = `/cars/${intent.carId}`;
    toast.success('Welcome back! You can now book this vehicle.');
  }

  /**
   * Handle save intent after authentication
   */
  private static async handleSaveIntent(intent: PostAuthIntent): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const success = await saveCar(intent.carId);
    if (success) {
      toast.success('Vehicle added to your saved list!');
    } else {
      throw new Error('Failed to save vehicle');
    }
  }

  /**
   * Handle contact intent after authentication
   */
  private static async handleContactIntent(intent: PostAuthIntent): Promise<void> {
    // Navigate to car details page to trigger contact
    window.location.href = `/cars/${intent.carId}`;
    toast.success('Welcome back! You can now contact the host.');
  }

  /**
   * Handle message intent after authentication
   */
  private static async handleMessageIntent(intent: PostAuthIntent): Promise<void> {
    if (!intent.receiverId || !intent.message) {
      throw new Error('Missing message details');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from("messages").insert({
      content: intent.message,
      sender_id: user.id,
      receiver_id: intent.receiverId,
      related_car_id: intent.carId,
    });

    if (error) throw error;
    toast.success('Message sent successfully!');
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }

  /**
   * Get current user ID
   */
  static async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }
} 