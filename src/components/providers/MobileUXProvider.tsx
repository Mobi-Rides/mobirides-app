import * as React from "react";
import { useEffect } from "react";

/**
 * MobileUXProvider Props
 */
interface MobileUXProviderProps {
    children: React.ReactNode;
    /** Enable viewport meta tag management */
    manageViewport?: boolean;
    /** Enable touch feedback */
    enableTouchFeedback?: boolean;
    /** Enable keyboard handling */
    handleKeyboard?: boolean;
}

/**
 * MobileUXProvider
 * 
 * Provides mobile-optimized UX behaviors:
 * - Viewport management for iOS/Android
 * - Touch feedback improvements
 * - Keyboard handling
 * - Safe area support
 * 
 * @example
 * ```tsx
 * // In your App.tsx
 * <MobileUXProvider>
 *   <App />
 * </MobileUXProvider>
 * ```
 */
export function MobileUXProvider({
    children,
    manageViewport = true,
    enableTouchFeedback = true,
    handleKeyboard = true,
}: MobileUXProviderProps) {
    // Viewport management for iOS
    useEffect(() => {
        if (!manageViewport) return;

        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            // Ensure proper viewport settings for mobile
            const content = viewport.getAttribute('content') || '';
            if (!content.includes('viewport-fit=cover')) {
                viewport.setAttribute(
                    'content',
                    'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover, user-scalable=yes'
                );
            }
        }
    }, [manageViewport]);

    // Touch feedback improvements
    useEffect(() => {
        if (!enableTouchFeedback) return;

        const handleTouchStart = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            const interactiveElement = target.closest('button, a, [role="button"], input, select, textarea');

            if (interactiveElement) {
                interactiveElement.classList.add('touch-active');
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            const interactiveElement = target.closest('button, a, [role="button"], input, select, textarea');

            if (interactiveElement) {
                interactiveElement.classList.remove('touch-active');
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enableTouchFeedback]);

    // Keyboard handling for mobile
    useEffect(() => {
        if (!handleKeyboard) return;

        // Only run on mobile devices
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) return;

        const handleFocus = (e: FocusEvent) => {
            const target = e.target as HTMLElement;

            // Scroll element into view with offset for keyboard
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        };

        document.addEventListener('focusin', handleFocus);

        return () => {
            document.removeEventListener('focusin', handleFocus);
        };
    }, [handleKeyboard]);

    return (
        <>
            {/* CSS for touch feedback */}
            {enableTouchFeedback && (
                <style>{`
          .touch-active {
            opacity: 0.7;
            transform: scale(0.98);
          }
          
          button, a, [role="button"] {
            transition: opacity 0.15s ease, transform 0.15s ease;
          }
          
          @media (hover: hover) {
            button:hover, a:hover, [role="button"]:hover {
              opacity: 0.9;
            }
          }
        `}</style>
            )}
            {children}
        </>
    );
}

/**
 * useMobileUX Hook
 * 
 * Provides mobile UX utilities
 */
export function useMobileUX() {
    const [isMobile, setIsMobile] = React.useState(false);
    const [isTouch, setIsTouch] = React.useState(false);
    const [viewport, setViewport] = React.useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        // Check if mobile
        const checkMobile = () => {
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
            setIsMobile(mobileRegex.test(navigator.userAgent));
            setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
        };

        checkMobile();

        // Handle resize
        const handleResize = () => {
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    /**
     * Scroll to element with keyboard consideration
     */
    const scrollToElement = React.useCallback((element: HTMLElement, offset = 100) => {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset + rect.top - offset;

        window.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
        });
    }, []);

    /**
     * Hide keyboard on mobile
     */
    const hideKeyboard = React.useCallback(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.blur();
        }
    }, []);

    return {
        isMobile,
        isTouch,
        viewport,
        scrollToElement,
        hideKeyboard,
    };
}

export default MobileUXProvider;
