import { useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Custom handler type for hardware back button
 * Return true to prevent default navigation
 * Return false to allow default back navigation
 */
export type HardwareBackHandler = () => boolean;

/**
 * Route configuration for root routes (where app should exit)
 */
const ROOT_ROUTES = [
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
];

/**
 * Check if current route is a root route
 */
function isRootRoute(pathname: string): boolean {
    // Exact match
    if (ROOT_ROUTES.includes(pathname)) {
        return true;
    }

    // Check for routes that start with root paths but have no sub-path
    for (const route of ROOT_ROUTES) {
        if (route !== "/" && pathname === route) {
            return true;
        }
    }

    return false;
}

/**
 * useHardwareBackButton Hook
 *
 * Handles Android hardware back button using Capacitor's App plugin.
 * Provides customizable behavior for back navigation including:
 * - Custom handlers for unsaved changes dialogs
 * - Automatic exit on root pages
 * - Navigation history support
 *
 * @param handler - Optional custom handler. Return true to prevent default behavior.
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Basic usage - default back behavior
 * const MyComponent = () => {
 *   useHardwareBackButton();
 *   return <div>...</div>;
 * };
 *
 * // With custom handler for unsaved changes
 * const FormComponent = () => {
 *   const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
 *
 *   useHardwareBackButton(() => {
 *     if (hasUnsavedChanges) {
 *       // Show confirmation dialog
 *       showUnsavedChangesDialog();
 *       return true; // Prevent default back
 *     }
 *     return false; // Allow default back
 *   });
 *
 *   return <form>...</form>;
 * };
 *
 * // Disable hardware back handling
 * const StaticPage = () => {
 *   useHardwareBackButton(undefined, { enabled: false });
 *   return <div>...</div>;
 * };
 * ```
 */
export function useHardwareBackButton(
    handler?: HardwareBackHandler,
    options: { enabled?: boolean } = {}
): void {
    const { enabled = true } = options;
    const navigate = useNavigate();
    const location = useLocation();

    // Memoize the handler to prevent unnecessary re-registrations
    const memoizedHandler = useCallback(() => {
        if (handler) {
            return handler();
        }
        return false;
    }, [handler]);

    useEffect(() => {
        // Only run on native platforms (Android/iOS)
        if (!enabled || !Capacitor.isNativePlatform()) {
            return;
        }

        // Add back button listener
        const setupListener = async () => {
            const listener = await App.addListener(
                "backButton",
                ({ canGoBack }) => {
                    // Check if custom handler wants to prevent default behavior
                    if (memoizedHandler()) {
                        return;
                    }

                    // If we can go back in history, navigate back
                    if (canGoBack && !isRootRoute(location.pathname)) {
                        navigate(-1);
                    } else {
                        // Exit the app if on root page
                        App.exitApp();
                    }
                }
            );

            return listener;
        };

        let listenerPromise: Promise<{ remove: () => void }> | undefined;

        try {
            listenerPromise = setupListener();
        } catch (error) {
            console.error("Error setting up hardware back button listener:", error);
        }

        // Cleanup listener on unmount
        return () => {
            if (listenerPromise) {
                listenerPromise
                    .then((listener) => listener.remove())
                    .catch((error) => {
                        console.error("Error removing back button listener:", error);
                    });
            }
        };
    }, [enabled, memoizedHandler, navigate, location.pathname]);
}

/**
 * Helper hook to check if running on a native platform
 */
export function useIsNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Exit the app programmatically (native platforms only)
 */
export async function exitApp(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
        await App.exitApp();
    }
}
