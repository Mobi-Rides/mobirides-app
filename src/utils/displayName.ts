/**
 * Utility for consistent user display name across admin interfaces
 */

interface UserDisplayInfo {
  full_name?: string | null;
  email?: string | null;
  id?: string;
}

/**
 * Returns the best display name for a user.
 * Priority: full_name → email → truncated UUID → "Unknown User"
 */
export const getDisplayName = (user: UserDisplayInfo): string => {
  if (user.full_name) {
    return user.full_name;
  }
  
  if (user.email) {
    return user.email;
  }
  
  if (user.id) {
    return `User ${user.id.slice(0, 8)}...`;
  }
  
  return "Unknown User";
};

/**
 * Returns name and email formatted for display
 * e.g., "John Doe" or "John Doe (john@example.com)" or "john@example.com"
 */
export const getDisplayNameWithEmail = (user: UserDisplayInfo): string => {
  if (user.full_name && user.email) {
    return `${user.full_name} (${user.email})`;
  }
  
  return getDisplayName(user);
};
