import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface AuthPromptConfig {
  title: string;
  description: string;
  feature: string;
  benefits: string[];
  primaryAction: 'signin' | 'signup';
}

export const useAuthPrompt = () => {
  const { user } = useAuth();
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptConfig, setPromptConfig] = useState<AuthPromptConfig | null>(null);

  const showAuthPrompt = useCallback((config: AuthPromptConfig) => {
    if (!user) {
      setPromptConfig(config);
      setIsPromptOpen(true);
      return true; // Prompt shown
    }
    return false; // User is authenticated, no prompt needed
  }, [user]);

  const hideAuthPrompt = useCallback(() => {
    setIsPromptOpen(false);
    setPromptConfig(null);
  }, []);

  return {
    isPromptOpen,
    promptConfig,
    showAuthPrompt,
    hideAuthPrompt,
    isAuthenticated: !!user
  };
};