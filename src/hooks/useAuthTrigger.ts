import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthTriggerService, type PostAuthIntent } from "@/services/authTriggerService";

export const useAuthTrigger = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Trigger authentication for a specific action
   */
  const triggerAuth = (intent: PostAuthIntent) => {
    AuthTriggerService.storeIntent(intent);
    setIsAuthModalOpen(true);
  };

  /**
   * Trigger authentication for booking
   */
  const triggerBookingAuth = (carId: string) => {
    triggerAuth({
      action: 'book',
      carId,
      timestamp: Date.now()
    });
  };

  /**
   * Trigger authentication for saving
   */
  const triggerSaveAuth = (carId: string) => {
    triggerAuth({
      action: 'save',
      carId,
      timestamp: Date.now()
    });
  };

  /**
   * Trigger authentication for contacting host
   */
  const triggerContactAuth = (carId: string, ownerId: string) => {
    triggerAuth({
      action: 'contact',
      carId,
      ownerId,
      timestamp: Date.now()
    });
  };

  /**
   * Trigger authentication for messaging
   */
  const triggerMessageAuth = (carId: string, receiverId: string, message: string) => {
    triggerAuth({
      action: 'message',
      carId,
      receiverId,
      message,
      timestamp: Date.now()
    });
  };

  /**
   * Close auth modal
   */
  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return {
    isAuthenticated,
    isAuthModalOpen,
    triggerAuth,
    triggerBookingAuth,
    triggerSaveAuth,
    triggerContactAuth,
    triggerMessageAuth,
    closeAuthModal
  };
}; 