/**
 * Hardcoded tutorial step definitions for the Mobi tutorial system.
 * Steps are role-aware and page-route-specific.
 */

export type TutorialRole = 'renter' | 'host' | 'both';

export type BubblePosition = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TutorialStep {
  /** Unique key used for progress tracking */
  key: string;
  /** Page route this step belongs to (exact or prefix match) */
  pageRoute: string;
  /** CSS selector for the target element (optional – center bubble if missing) */
  targetSelector?: string;
  /** Which role sees this step */
  role: TutorialRole;
  /** Order within the full tutorial flow */
  order: number;
  /** Mobi's greeting / title */
  title: string;
  /** Mobi's chatty explanation */
  content: string;
  /** Preferred bubble position relative to target */
  position: BubblePosition;
  /** Optional link to a help guide */
  helpGuideLink?: string;
}

// Current tutorial content version — bump when content changes significantly
export const TUTORIAL_VERSION = 1;

export const TUTORIAL_STEPS: TutorialStep[] = [
  // ── Universal steps (both roles) ────────────────────────────
  {
    key: 'welcome',
    pageRoute: '/',
    role: 'both',
    order: 1,
    title: "Hey there! I'm Mobi 👋",
    content:
      "Welcome to MobiRides! I'm your personal guide and I'll walk you through everything you need to know. Let's get started!",
    position: 'center',
  },
  {
    key: 'home-search',
    pageRoute: '/',
    targetSelector: '[data-tutorial-target="search"]',
    role: 'both',
    order: 2,
    title: 'Find your perfect ride 🔍',
    content:
      'Use the search bar to find cars by location, date, or type. You can filter results to match exactly what you need.',
    position: 'bottom',
  },
  {
    key: 'home-featured',
    pageRoute: '/',
    targetSelector: '[data-tutorial-target="featured-cars"]',
    role: 'both',
    order: 3,
    title: 'Check out these beauties 🚗',
    content:
      "Here are some of our most popular cars. Tap any card to see full details, photos, and reviews.",
    position: 'top',
  },

  // ── Renter-specific steps ───────────────────────────────────
  {
    key: 'renter-car-details',
    pageRoute: '/cars/',
    role: 'renter',
    order: 10,
    title: 'Car details & booking 📋',
    content:
      "This is where the magic happens! Check out photos, features, reviews, and the host's profile. When you're ready, hit Book to reserve it.",
    position: 'center',
  },
  {
    key: 'renter-bookings',
    pageRoute: '/bookings',
    targetSelector: '[data-tutorial-target="bookings-list"]',
    role: 'renter',
    order: 11,
    title: 'Your bookings hub 📅',
    content:
      'All your reservations live here. Track status, manage upcoming trips, and view past rentals.',
    position: 'center',
  },
  {
    key: 'renter-verification',
    pageRoute: '/verification',
    role: 'renter',
    order: 12,
    title: 'Get verified ✅',
    content:
      "Verify your identity and driver's license to unlock booking. It's quick and keeps everyone safe!",
    position: 'center',
    helpGuideLink: '/help',
  },
  {
    key: 'renter-map',
    pageRoute: '/map',
    role: 'renter',
    order: 13,
    title: 'Explore nearby cars 🗺️',
    content:
      'Use the map to discover cars near you. Tap markers for quick details and directions.',
    position: 'center',
  },

  // ── Host-specific steps ─────────────────────────────────────
  {
    key: 'host-dashboard',
    pageRoute: '/dashboard',
    role: 'host',
    order: 20,
    title: 'Your host command centre 📊',
    content:
      "Welcome to your dashboard! See earnings, active bookings, and how your cars are performing — all at a glance.",
    position: 'center',
  },
  {
    key: 'host-add-car',
    pageRoute: '/add-car',
    role: 'host',
    order: 21,
    title: 'List your first car 🚘',
    content:
      "Ready to earn? Fill in the details, upload great photos, and set a competitive price. I'll guide you through each step.",
    position: 'center',
    helpGuideLink: '/help',
  },
  {
    key: 'host-bookings',
    pageRoute: '/host-bookings',
    targetSelector: '[data-tutorial-target="host-bookings-list"]',
    role: 'host',
    order: 22,
    title: 'Manage booking requests 📩',
    content:
      'Approve or decline requests here. Quick responses mean happier renters and better reviews!',
    position: 'center',
  },
  {
    key: 'host-wallet',
    pageRoute: '/wallet',
    targetSelector: '[data-tutorial-target="wallet-balance"]',
    role: 'host',
    order: 23,
    title: 'Your earnings 💰',
    content:
      'Track your balance, view transaction history, and manage payouts. MobiRides handles the commission automatically.',
    position: 'center',
  },

  // ── Shared tail steps ───────────────────────────────────────
  {
    key: 'profile',
    pageRoute: '/profile',
    role: 'both',
    order: 90,
    title: 'Your profile 👤',
    content:
      'Keep your profile up to date — a complete profile builds trust with other users.',
    position: 'center',
  },
  {
    key: 'notifications',
    pageRoute: '/notifications',
    role: 'both',
    order: 91,
    title: 'Stay in the loop 🔔',
    content:
      "You'll get notifications for bookings, messages, and important updates. Never miss a thing!",
    position: 'center',
  },
  {
    key: 'messages',
    pageRoute: '/messages',
    role: 'both',
    order: 92,
    title: 'Chat with hosts & renters 💬',
    content:
      'Have a question? Message the other party directly. Quick communication makes for smooth rentals.',
    position: 'center',
  },
  {
    key: 'tutorial-complete',
    pageRoute: '/',
    role: 'both',
    order: 100,
    title: "You're all set! 🎉",
    content:
      "That's the basics! You can restart this tutorial anytime from the menu. Happy riding!",
    position: 'center',
  },
];

/**
 * Returns the ordered tutorial steps for a given role,
 * filtered to only include steps for the current page (or all if showAll=true).
 */
export function getStepsForRole(role: 'renter' | 'host'): TutorialStep[] {
  return TUTORIAL_STEPS.filter(
    (s) => s.role === 'both' || s.role === role
  ).sort((a, b) => a.order - b.order);
}

/**
 * Returns steps that match the current route for a given role.
 */
export function getStepsForPage(
  route: string,
  role: 'renter' | 'host'
): TutorialStep[] {
  return getStepsForRole(role).filter(
    (s) => route === s.pageRoute || route.startsWith(s.pageRoute)
  );
}
