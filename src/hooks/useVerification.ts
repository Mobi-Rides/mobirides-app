import { useContext } from "react";
import { VerificationContext } from "../contexts/VerificationContextDefinition";

export function useVerification() {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}