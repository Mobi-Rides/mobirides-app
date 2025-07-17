/**
 * Verification Page Component
 * Main page wrapper for the user verification system
 * Provides the VerificationProvider context and renders VerificationHub
 */

import React from "react";
import { VerificationProvider } from "@/contexts/VerificationContext";
import { VerificationHub } from "@/components/verification/VerificationHub";

/**
 * Verification Page Component
 * Entry point for the user verification process
 */
const Verification: React.FC = () => {
  return (
    <VerificationProvider>
      <VerificationHub />
    </VerificationProvider>
  );
};

export default Verification;
