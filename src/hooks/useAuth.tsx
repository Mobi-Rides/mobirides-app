import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import AuthTriggerService from '@/services/authTriggerService';
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Detect stale / revoked session errors (e.g. after JWT key rotation)
     * and silently clear the corrupted local state so the user sees a
     * clean sign-in form instead of a cryptic API error.
     */
    const isStaleSessionError = (err: unknown): boolean => {
      if (!err || typeof err !== 'object') return false;
      const msg = (err as { message?: string }).message ?? '';
      return (
        msg.includes('Legacy API keys are disabled') ||
        msg.includes('Invalid Refresh Token') ||
        msg.includes('Refresh Token Not Found') ||
        msg.includes('invalid JWT')
      );
    };

    const clearStaleSession = () => {
      console.warn('[AuthProvider] Stale session detected — clearing local auth state');
      // Remove Supabase auth keys from localStorage
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      }
      setSession(null);
      setUser(null);
      setIsLoading(false);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state change event:', event, !!currentSession);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        
        // Only execute pending actions on actual sign-in events, NOT on token refresh
        if (currentSession?.user && event === 'SIGNED_IN') {
          console.log('Sign-in detected, executing pending actions with session ID:', currentSession.access_token.substring(0, 10));
          // Pass session ID to prevent duplicate executions
          AuthTriggerService.executePendingAction(currentSession.access_token);
        }
        
        // Clear session tracker on sign out
        if (event === 'SIGNED_OUT') {
          console.log('Sign-out detected, clearing session tracker');
          AuthTriggerService.clearSessionTracker();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (error && isStaleSessionError(error)) {
          clearStaleSession();
          return;
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (isStaleSessionError(err)) {
          clearStaleSession();
        } else {
          console.error('[AuthProvider] Unexpected getSession error:', err);
          setIsLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthProvider] Starting sign out process...');
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
        toast.error('Failed to sign out. Please try again.');
        throw error;
      }
      
      console.log('[AuthProvider] Sign out successful');
      toast.success('Signed out successfully');
      
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
    } catch (error) {
      console.error('[AuthProvider] Sign out failed:', error);
      toast.error('An error occurred while signing out');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
