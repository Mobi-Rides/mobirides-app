/**
 * Navigation Utilities
 *
 * This file contains route mappings and helper functions for navigation
 * throughout the Mobi Rides application.
 */

/**
 * Route parent mapping for automatic back navigation
 * Maps child routes to their parent routes
 */
export const ROUTE_PARENTS: Record<string, string | string[]> = {
    // Detail pages - High Priority
    "/cars/:carId": ["/", "/map"], // Can come from home or map
    "/bookings/:id": "/bookings",
    "/booking-requests/:id": "/host-bookings",
    "/rental-details/:id": "/bookings",
    "/rental-review/:bookingId": "/bookings",
    "/review/host/:bookingId": "/host-bookings",
    "/notifications/:id": "/notifications",
    "/edit-car/:id": "/car-listing",

    // Settings pages - Medium Priority
    "/settings/profile": "/more",
    "/settings/verification": "/more",
    "/settings/display": "/more",
    "/settings/security": "/more",
    "/wallet": "/more",
    "/verification": "/more",
    "/notification-preferences": "/more",
    "/promo-codes": "/more",
    "/claims": "/more",
    "/insurance/policies": "/more",

    // Profile pages
    "/edit-profile": "/profile",
    "/profile-view": "/profile",

    // Car management
    "/add-car": "/car-listing",
    "/create-car": "/car-listing",
    "/car-listing": "/more",
    "/saved-cars": "/",

    // Help
    "/help/:role/:section": "/help/:role",
    "/help/:role": "/more",

    // Admin routes
    "/admin/users": "/admin",
    "/admin/cars": "/admin",
    "/admin/bookings": "/admin",
    "/admin/transactions": "/admin",
    "/admin/verifications": "/admin",
    "/admin/messages": "/admin",
    "/admin/management": "/admin",
    "/admin/audit": "/admin",
    "/admin/analytics": "/admin",
    "/admin/promo-codes": "/admin",
    "/admin/reviews": "/admin",
    "/admin/claims": "/admin",
    "/admin/remittances": "/admin",
};

/**
 * Root routes where the app should exit when hardware back button is pressed
 */
export const ROOT_ROUTES = [
    "/",
    "/bookings",
    "/host-bookings",
    "/renter-bookings",
    "/messages",
    "/notifications",
    "/more",
    "/map",
    "/profile",
    "/dashboard",
    "/admin",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
];

/**
 * Get the parent route for a given pathname
 * Supports parameterized routes like /cars/:carId
 *
 * @param pathname - Current route pathname
 * @returns Parent route path, array of possible parents, or null if no parent defined
 *
 * @example
 * ```typescript
 * getParentRoute('/bookings/123'); // Returns '/bookings'
 * getParentRoute('/cars/abc'); // Returns ['/', '/map']
 * getParentRoute('/unknown'); // Returns null
 * ```
 */
export function getParentRoute(
    pathname: string
): string | string[] | null {
    // First try exact match
    if (ROUTE_PARENTS[pathname]) {
        return ROUTE_PARENTS[pathname];
    }

    // Try to match parameterized routes
    for (const [pattern, parent] of Object.entries(ROUTE_PARENTS)) {
        if (pattern.includes(":")) {
            const regexPattern = pattern
                .replace(/:\w+/g, "([^/]+)") // Replace :param with capture group
                .replace(/\*/g, ".*"); // Replace * with wildcard

            const regex = new RegExp(`^${regexPattern}$`);
            if (regex.test(pathname)) {
                return parent;
            }
        }
    }

    return null;
}

/**
 * Check if a route is a root route
 *
 * @param pathname - Route pathname to check
 * @returns True if the route is a root route
 *
 * @example
 * ```typescript
 * isRootRoute('/'); // Returns true
 * isRootRoute('/bookings'); // Returns true
 * isRootRoute('/bookings/123'); // Returns false
 * ```
 */
export function isRootRoute(pathname: string): boolean {
    // Exact match
    if (ROOT_ROUTES.includes(pathname)) {
        return true;
    }

    // Check if it's an admin root
    if (pathname === "/admin") {
        return true;
    }

    return false;
}

/**
 * Check if a route is a detail/sub-page that should have a back button
 *
 * @param pathname - Route pathname to check
 * @returns True if the route is a detail/sub-page
 */
export function isDetailPage(pathname: string): boolean {
    return getParentRoute(pathname) !== null;
}

/**
 * Get the appropriate back destination for a pathname
 * Returns the parent route if available, otherwise 'back' for browser history
 *
 * @param pathname - Current route pathname
 * @returns String path, 'back', or undefined
 *
 * @example
 * ```typescript
 * getBackDestination('/bookings/123'); // Returns '/bookings'
 * getBackDestination('/unknown'); // Returns 'back'
 * ```
 */
export function getBackDestination(
    pathname: string
): string | "back" | undefined {
    const parent = getParentRoute(pathname);

    if (parent) {
        // If multiple parents, return the first one
        if (Array.isArray(parent)) {
            return parent[0];
        }
        return parent;
    }

    // If no parent defined, use browser back
    return "back";
}

/**
 * Navigation helper type for back button destinations
 */
export type BackDestination = string | number | "back";

/**
 * Route metadata for navigation context
 */
export interface RouteMetadata {
    title: string;
    parent?: string;
    showBackButton: boolean;
    isRoot: boolean;
}

/**
 * Common route metadata for known routes
 */
export const ROUTE_METADATA: Record<string, RouteMetadata> = {
    "/": {
        title: "Explore",
        showBackButton: false,
        isRoot: true,
    },
    "/bookings": {
        title: "My Bookings",
        showBackButton: false,
        isRoot: true,
    },
    "/host-bookings": {
        title: "Host Bookings",
        showBackButton: false,
        isRoot: true,
    },
    "/messages": {
        title: "Messages",
        showBackButton: false,
        isRoot: true,
    },
    "/notifications": {
        title: "Notifications",
        showBackButton: false,
        isRoot: true,
    },
    "/more": {
        title: "More",
        showBackButton: false,
        isRoot: true,
    },
    "/map": {
        title: "Map",
        showBackButton: false,
        isRoot: true,
    },
    "/profile": {
        title: "Profile",
        showBackButton: false,
        isRoot: true,
    },
    "/dashboard": {
        title: "Dashboard",
        showBackButton: false,
        isRoot: true,
    },
};

/**
 * Get metadata for a route
 *
 * @param pathname - Route pathname
 * @returns Route metadata or default metadata if not found
 */
export function getRouteMetadata(pathname: string): RouteMetadata {
    // Check exact match first
    if (ROUTE_METADATA[pathname]) {
        return ROUTE_METADATA[pathname];
    }

    // Check for parameterized routes
    for (const [pattern, metadata] of Object.entries(ROUTE_METADATA)) {
        if (pattern.includes(":")) {
            const regexPattern = pattern.replace(/:\w+/g, "[^/]+");
            const regex = new RegExp(`^${regexPattern}$`);
            if (regex.test(pathname)) {
                return metadata;
            }
        }
    }

    // Return default metadata
    return {
        title: "",
        showBackButton: isDetailPage(pathname),
        isRoot: isRootRoute(pathname),
    };
}
