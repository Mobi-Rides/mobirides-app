
import { useAuth } from "@/hooks/useAuth";

export const useAuthStatus = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    userRole: null, // Will be determined from user profile data
    isLoadingRole: isLoading,
    userId: user?.id || null,
  };
};
