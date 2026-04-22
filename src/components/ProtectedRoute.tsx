import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { LoadingView } from "@/components/home/LoadingView";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Show auth modal if not authenticated and not loading
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setIsAuthModalOpen(true);
    } else if (isAuthenticated) {
      setIsAuthModalOpen(false);
    }
  }, [isAuthenticated, isLoading]);

  const handleCloseModal = () => {
    setIsAuthModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingView message="Checking authentication..." />
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-8">
            Please sign in to access this page
          </p>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={handleCloseModal}
            defaultTab="signin"
            idPrefix="protected"
          />
        </div>
      )}
    </>
  );
};
