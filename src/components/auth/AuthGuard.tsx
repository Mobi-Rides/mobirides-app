import React from 'react';
import { useAuthPrompt } from '@/hooks/useAuthPrompt';
import AuthPrompt from './AuthPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  feature: string;
  title: string;
  description: string;
  benefits: string[];
  primaryAction?: 'signin' | 'signup';
  fallback?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  feature,
  title,
  description,
  benefits,
  primaryAction = 'signup',
  fallback
}) => {
  const { isAuthenticated, isPromptOpen, promptConfig, showAuthPrompt, hideAuthPrompt } = useAuthPrompt();

  const handleProtectedAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const prompted = showAuthPrompt({
      title,
      description,
      feature,
      benefits,
      primaryAction
    });
    
    if (!prompted) {
      // User is authenticated, allow the action
      // This would typically trigger the original action
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <div onClick={handleProtectedAction} className="cursor-pointer">
          {fallback || children}
        </div>
        <AuthPrompt 
          isOpen={isPromptOpen}
          onClose={hideAuthPrompt}
          config={promptConfig}
        />
      </>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;