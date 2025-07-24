
import React, { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
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
        Loading...
      </div>
    );
  }

  // Check role if specified
  if (isAuthenticated && requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page
        </p>
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
          />
        </div>
      )}
    </>
  );
};
