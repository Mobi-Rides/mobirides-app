/**
 * Maps guide step action labels to app routes.
 * Used by HelpSection to make action buttons navigable.
 * 
 * @author Modisa Maphanyane
 * @ticket MOB-301
 */

const actionRouteMap: Record<string, string> = {
  // Renter actions
  "Go to Sign Up": "/signup",
  "Sign Up": "/signup",
  "Browse Cars": "/cars",
  "Search Cars": "/cars",
  "View Cars": "/cars",
  "Book a Car": "/cars",
  "View Bookings": "/bookings",
  "My Bookings": "/bookings",
  "Start Verification": "/verification",
  "Verify Identity": "/verification",
  "Complete Verification": "/verification",
  "Edit Profile": "/edit-profile",
  "Update Profile": "/edit-profile",
  "View Profile": "/profile",
  "View Messages": "/messages",
  "Contact Host": "/messages",

  // Host actions
  "List Your Car": "/add-car",
  "Add a Car": "/add-car",
  "Add Car": "/add-car",
  "Manage Cars": "/my-cars",
  "View My Cars": "/my-cars",
  "Manage Bookings": "/host-bookings",
  "View Booking Requests": "/host-bookings",
  "View Earnings": "/wallet",
  "My Wallet": "/wallet",
  "Wallet": "/wallet",

  // Shared actions
  "Go to Help Center": "/help",
  "View Help": "/help",
  "Contact Support": "/messages",
};

/**
 * Resolves an action label to its corresponding app route.
 * Falls back to the help center if no match is found.
 */
export const getRouteForAction = (actionLabel: string | undefined): string | null => {
  if (!actionLabel) return null;

  // Direct match
  if (actionRouteMap[actionLabel]) {
    return actionRouteMap[actionLabel];
  }

  // Case-insensitive match
  const lowerLabel = actionLabel.toLowerCase();
  for (const [key, route] of Object.entries(actionRouteMap)) {
    if (key.toLowerCase() === lowerLabel) {
      return route;
    }
  }

  return null;
};
