import { useContext } from "react";
import { HandoverContext, HandoverContextType } from "@/contexts/HandoverContext";

/**
 * Hook to access the Handover context.
 * Throws an error if used outside of a HandoverProvider.
 */
export const useHandover = (): HandoverContextType => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error("useHandover must be used within a HandoverProvider");
  }
  return context;
};

/**
 * Hook to access the Handover context safely.
 * Returns null if used outside of a HandoverProvider.
 */
export const useHandoverSafe = (): HandoverContextType | null => {
  return useContext(HandoverContext) ?? null;
};
