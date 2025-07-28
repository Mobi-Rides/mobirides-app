import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";

interface HandoverState {
  isActive: boolean;
  sessionId: string | null;
  currentStep: number;
  totalSteps: number;
  progress: number;
  lastUpdated: Date | null;
}

interface HandoverStateContextType {
  state: HandoverState;
  updateState: (updates: Partial<HandoverState>) => void;
  clearState: () => void;
}

const HandoverStateContext = createContext<HandoverStateContextType | undefined>(undefined);

export const useHandoverState = () => {
  const context = useContext(HandoverStateContext);
  if (!context) {
    throw new Error("useHandoverState must be used within HandoverStateProvider");
  }
  return context;
};

interface HandoverStateProviderProps {
  children: React.ReactNode;
}

export const HandoverStateProvider: React.FC<HandoverStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<HandoverState>({
    isActive: false,
    sessionId: null,
    currentStep: 0,
    totalSteps: 0,
    progress: 0,
    lastUpdated: null,
  });

  const updateState = (updates: Partial<HandoverState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date(),
    }));
  };

  const clearState = () => {
    setState({
      isActive: false,
      sessionId: null,
      currentStep: 0,
      totalSteps: 0,
      progress: 0,
      lastUpdated: null,
    });
  };

  // Clean up state when user navigates away from handover
  useEffect(() => {
    const currentPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const isHandoverMode = searchParams.get('mode') === 'handover';
    
    if (!isHandoverMode && state.isActive) {
      console.log("User left handover mode, cleaning up state");
      clearState();
    }
  }, [state.isActive]);

  // Save state to localStorage for persistence
  useEffect(() => {
    if (state.sessionId) {
      localStorage.setItem('handover_state', JSON.stringify(state));
    } else {
      localStorage.removeItem('handover_state');
    }
  }, [state]);

  // Restore state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('handover_state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only restore if less than 1 hour old
        const lastUpdated = new Date(parsedState.lastUpdated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastUpdated > oneHourAgo) {
          setState(parsedState);
        } else {
          localStorage.removeItem('handover_state');
        }
      } catch (error) {
        console.error("Error restoring handover state:", error);
        localStorage.removeItem('handover_state');
      }
    }
  }, []);

  return (
    <HandoverStateContext.Provider value={{ state, updateState, clearState }}>
      {children}
    </HandoverStateContext.Provider>
  );
};