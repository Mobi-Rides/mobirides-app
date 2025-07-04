// Google Analytics utility functions for tracking guest-to-registered conversion and session duration

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Session activity tracking
interface SessionActivity {
  pageViews: number;
  clicks: number;
  scrolls: number;
  lastActivity: number;
}

// Authentication trigger tracking
interface AuthTrigger {
  triggerType: 'booking' | 'save_car' | 'contact_host' | 'message_owner' | 'form_start';
  triggerLocation: string;
  timestamp: number;
  carId?: string;
  pageUrl: string;
}

// User journey funnel tracking
interface FunnelStep {
  step: string;
  timestamp: number;
  pageUrl: string;
  userType: 'new' | 'returning';
  sessionId: string;
}

// Scroll tracking state
let scrollTrackingInitialized = false;
let lastScrollTime = 0;
const SCROLL_THROTTLE = 1000; // Track scrolls at most once per second

/**
 * Track guest session start
 * Fired when a guest (unauthenticated user) first visits the site
 */
export const trackGuestSessionStart = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'guest_session_start', {
      event_category: 'engagement',
      event_label: 'guest_browsing',
      value: 1
    });
    console.log('📊 Analytics: Guest session started');
  }
};

/**
 * Track user registration
 * Fired when a user successfully completes registration
 */
export const trackUserRegistered = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_registered', {
      event_category: 'engagement',
      event_label: 'conversion',
      value: 1
    });
    console.log('📊 Analytics: User registered');
  }
};

/**
 * Track user journey funnel step
 * Fired when users complete key steps in the user journey
 */
export const trackFunnelStep = (step: string, userType: 'new' | 'returning' = 'new') => {
  if (typeof window !== 'undefined' && window.gtag) {
    const sessionId = sessionStorage.getItem('guest_session_tracked') || 
                     sessionStorage.getItem('user_session_id') || 
                     `session_${Date.now()}`;
    
    const funnelStep: FunnelStep = {
      step,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      userType,
      sessionId
    };

    // Store funnel step for journey analysis
    const funnelSteps = JSON.parse(sessionStorage.getItem('funnel_steps') || '[]');
    funnelSteps.push(funnelStep);
    sessionStorage.setItem('funnel_steps', JSON.stringify(funnelSteps));

    // Track the funnel step event
    window.gtag('event', 'funnel_step', {
      event_category: 'conversion',
      event_label: step,
      value: 1,
      custom_parameters: {
        user_type: userType,
        session_id: sessionId,
        page_url: funnelStep.pageUrl,
        step_number: funnelSteps.length,
        session_duration: getSessionDuration()
      }
    });

    console.log(`📊 Analytics: Funnel step - ${step} (${userType} user)`);
  }
};

/**
 * Track user journey completion
 * Fired when users complete the full journey (e.g., successful booking)
 */
export const trackJourneyCompletion = (journeyType: 'booking' | 'car_save' | 'profile_complete', userType: 'new' | 'returning' = 'new') => {
  if (typeof window !== 'undefined' && window.gtag) {
    const funnelSteps = JSON.parse(sessionStorage.getItem('funnel_steps') || '[]');
    const sessionId = sessionStorage.getItem('guest_session_tracked') || 
                     sessionStorage.getItem('user_session_id') || 
                     `session_${Date.now()}`;
    
    // Track journey completion
    window.gtag('event', 'journey_completion', {
      event_category: 'conversion',
      event_label: journeyType,
      value: 1,
      custom_parameters: {
        user_type: userType,
        session_id: sessionId,
        journey_type: journeyType,
        total_steps: funnelSteps.length,
        session_duration: getSessionDuration(),
        funnel_steps: funnelSteps.map((step: FunnelStep) => step.step).join(',')
      }
    });

    // Track funnel conversion rate
    window.gtag('event', 'funnel_conversion', {
      event_category: 'conversion',
      event_label: `${journeyType}_${userType}`,
      value: 1,
      custom_parameters: {
        user_type: userType,
        journey_type: journeyType,
        conversion_time: getSessionDuration()
      }
    });

    console.log(`📊 Analytics: Journey completion - ${journeyType} (${userType} user, ${funnelSteps.length} steps)`);
  }
};

/**
 * Track user type identification
 * Fired when we identify if a user is new or returning
 */
export const trackUserType = (userType: 'new' | 'returning', trigger: 'first_visit' | 'login' | 'registration') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_type_identified', {
      event_category: 'engagement',
      event_label: userType,
      value: 1,
      custom_parameters: {
        user_type: userType,
        identification_trigger: trigger,
        session_duration: getSessionDuration()
      }
    });

    // Store user type for session
    sessionStorage.setItem('user_type', userType);
    
    console.log(`📊 Analytics: User type identified - ${userType} (${trigger})`);
  }
};

/**
 * Track authentication trigger point
 * Fired when a guest is prompted to authenticate for a specific action
 */
export const trackAuthTrigger = (triggerType: AuthTrigger['triggerType'], triggerLocation: string, carId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track if this is a guest session
    if (sessionStorage.getItem('guest_session_tracked')) {
      const trigger: AuthTrigger = {
        triggerType,
        triggerLocation,
        timestamp: Date.now(),
        carId,
        pageUrl: window.location.href
      };

      // Store trigger for later conversion tracking
      const triggers = JSON.parse(sessionStorage.getItem('auth_triggers') || '[]');
      triggers.push(trigger);
      sessionStorage.setItem('auth_triggers', JSON.stringify(triggers));

      // Track the trigger event
      window.gtag('event', 'auth_trigger', {
        event_category: 'conversion',
        event_label: triggerType,
        value: 1,
        custom_parameters: {
          trigger_location: triggerLocation,
          car_id: carId || '',
          page_url: trigger.pageUrl,
          session_duration: getSessionDuration()
        }
      });

      console.log(`📊 Analytics: Auth trigger - ${triggerType} at ${triggerLocation}`);
    }
  }
};

/**
 * Track authentication trigger conversion
 * Fired when a user registers after being triggered
 */
export const trackAuthTriggerConversion = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    const triggers = JSON.parse(sessionStorage.getItem('auth_triggers') || '[]');
    
    if (triggers.length > 0) {
      // Get the most recent trigger
      const lastTrigger = triggers[triggers.length - 1];
      const timeToConversion = Date.now() - lastTrigger.timestamp;
      
      // Track conversion for the specific trigger
      window.gtag('event', 'auth_trigger_conversion', {
        event_category: 'conversion',
        event_label: lastTrigger.triggerType,
        value: 1,
        custom_parameters: {
          trigger_location: lastTrigger.triggerLocation,
          car_id: lastTrigger.carId || '',
          page_url: lastTrigger.pageUrl,
          time_to_conversion_seconds: Math.round(timeToConversion / 1000),
          session_duration: getSessionDuration(),
          trigger_count: triggers.length
        }
      });

      // Track conversion rate by trigger type
      window.gtag('event', 'auth_trigger_effectiveness', {
        event_category: 'conversion',
        event_label: `${lastTrigger.triggerType}_conversion`,
        value: 1,
        custom_parameters: {
          trigger_type: lastTrigger.triggerType,
          trigger_location: lastTrigger.triggerLocation,
          conversion_time: Math.round(timeToConversion / 1000)
        }
      });

      console.log(`📊 Analytics: Auth trigger conversion - ${lastTrigger.triggerType} (${Math.round(timeToConversion / 1000)}s)`);
    }

    // Clear triggers after conversion
    sessionStorage.removeItem('auth_triggers');
  }
};

/**
 * Track authentication modal dismissal
 * Fired when a guest dismisses the auth modal without converting
 */
export const trackAuthModalDismissal = (triggerType: AuthTrigger['triggerType']) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track if this is a guest session
    if (sessionStorage.getItem('guest_session_tracked')) {
      window.gtag('event', 'auth_modal_dismissed', {
        event_category: 'conversion',
        event_label: triggerType,
        value: 1,
        custom_parameters: {
          trigger_type: triggerType,
          session_duration: getSessionDuration(),
          page_url: window.location.href
        }
      });

      console.log(`📊 Analytics: Auth modal dismissed - ${triggerType}`);
    }
  }
};

/**
 * Get current session duration in seconds
 */
const getSessionDuration = (): number => {
  const startTime = sessionStorage.getItem('guest_session_start') || 
                   sessionStorage.getItem('user_session_start');
  if (startTime) {
    return Math.round((Date.now() - parseInt(startTime)) / 1000);
  }
  return 0;
};

/**
 * Track guest session end with enhanced duration analytics
 * Fired when a guest session ends (user registers or leaves)
 */
export const trackGuestSessionEnd = (duration: number, activity?: SessionActivity) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const durationSeconds = Math.round(duration / 1000);
    
    // Basic session end event
    window.gtag('event', 'guest_session_end', {
      event_category: 'engagement',
      event_label: 'session_duration',
      value: durationSeconds
    });

    // Enhanced session duration analytics
    window.gtag('event', 'guest_session_duration', {
      event_category: 'engagement',
      event_label: getDurationSegment(durationSeconds),
      value: durationSeconds,
      custom_parameters: {
        duration_minutes: Math.round(durationSeconds / 60),
        duration_seconds: durationSeconds,
        page_views: activity?.pageViews || 0,
        total_clicks: activity?.clicks || 0,
        total_scrolls: activity?.scrolls || 0,
        session_type: activity?.pageViews > 3 ? 'engaged' : 'bounce'
      }
    });

    // Track auth trigger effectiveness for this session
    const triggers = JSON.parse(sessionStorage.getItem('auth_triggers') || '[]');
    if (triggers.length > 0) {
      window.gtag('event', 'auth_trigger_session_summary', {
        event_category: 'conversion',
        event_label: 'session_with_triggers',
        value: triggers.length,
        custom_parameters: {
          total_triggers: triggers.length,
          trigger_types: triggers.map((t: AuthTrigger) => t.triggerType).join(','),
          session_duration: durationSeconds,
          conversion_attempted: false
        }
      });
    }

    // Track funnel analysis for this session
    const funnelSteps = JSON.parse(sessionStorage.getItem('funnel_steps') || '[]');
    if (funnelSteps.length > 0) {
      window.gtag('event', 'funnel_session_summary', {
        event_category: 'conversion',
        event_label: 'incomplete_journey',
        value: funnelSteps.length,
        custom_parameters: {
          total_steps: funnelSteps.length,
          steps_completed: funnelSteps.map((step: FunnelStep) => step.step).join(','),
          session_duration: durationSeconds,
          user_type: funnelSteps[0]?.userType || 'unknown'
        }
      });
    }

    console.log(`📊 Analytics: Guest session ended (duration: ${durationSeconds}s, pages: ${activity?.pageViews || 0})`);
  }
};

/**
 * Track page view during guest session
 */
export const trackGuestPageView = (pageName: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track if this is a guest session
    if (sessionStorage.getItem('guest_session_tracked')) {
      window.gtag('event', 'guest_page_view', {
        event_category: 'engagement',
        event_label: pageName,
        value: 1
      });

      // Update session activity
      updateSessionActivity('pageView');
      
      console.log(`📊 Analytics: Guest page view - ${pageName}`);
    }
  }
};

/**
 * Track user interaction during guest session
 */
export const trackGuestInteraction = (interactionType: 'click' | 'scroll' | 'form_start' | 'car_view') => {
  if (typeof window !== 'undefined' && window.gtag) {
    // Only track if this is a guest session
    if (sessionStorage.getItem('guest_session_tracked')) {
      window.gtag('event', 'guest_interaction', {
        event_category: 'engagement',
        event_label: interactionType,
        value: 1
      });

      // Update session activity
      updateSessionActivity(interactionType);
      
      console.log(`📊 Analytics: Guest interaction - ${interactionType}`);
    }
  }
};

/**
 * Initialize scroll tracking for guest sessions
 */
export const initializeScrollTracking = () => {
  if (scrollTrackingInitialized || typeof window === 'undefined') {
    return;
  }

  const handleScroll = () => {
    // Only track if this is a guest session
    if (!sessionStorage.getItem('guest_session_tracked')) {
      return;
    }

    const now = Date.now();
    if (now - lastScrollTime > SCROLL_THROTTLE) {
      lastScrollTime = now;
      trackGuestInteraction('scroll');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  scrollTrackingInitialized = true;
  
  console.log('📊 Analytics: Scroll tracking initialized');
};

/**
 * Get duration segment for analytics
 */
const getDurationSegment = (durationSeconds: number): string => {
  if (durationSeconds < 30) return 'short_0_30s';
  if (durationSeconds < 120) return 'medium_30s_2m';
  if (durationSeconds < 300) return 'medium_2m_5m';
  if (durationSeconds < 900) return 'long_5m_15m';
  return 'very_long_15m_plus';
};

/**
 * Update session activity counters
 */
const updateSessionActivity = (type: 'pageView' | 'click' | 'scroll' | 'form_start' | 'car_view') => {
  const activityKey = 'guest_session_activity';
  let activity: SessionActivity = JSON.parse(sessionStorage.getItem(activityKey) || '{"pageViews":0,"clicks":0,"scrolls":0,"lastActivity":0}');
  
  activity.lastActivity = Date.now();
  
  switch (type) {
    case 'pageView':
      activity.pageViews++;
      break;
    case 'click':
      activity.clicks++;
      break;
    case 'scroll':
      activity.scrolls++;
      break;
    case 'form_start':
    case 'car_view':
      activity.clicks++; // Count as interaction
      break;
  }
  
  sessionStorage.setItem(activityKey, JSON.stringify(activity));
};

/**
 * Get current session activity
 */
const getSessionActivity = (): SessionActivity => {
  const activityKey = 'guest_session_activity';
  return JSON.parse(sessionStorage.getItem(activityKey) || '{"pageViews":0,"clicks":0,"scrolls":0,"lastActivity":0}');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async () => {
  try {
    const { data: { user } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
    return !!user;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Initialize guest session tracking with enhanced duration analytics
 * Should be called once per session for unauthenticated users
 */
export const initializeGuestTracking = () => {
  // Check if we've already tracked this session
  const sessionKey = 'guest_session_tracked';
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  // Mark this session as tracked
  sessionStorage.setItem(sessionKey, 'true');
  
  // Initialize session activity tracking
  const initialActivity: SessionActivity = {
    pageViews: 1, // Count initial page load
    clicks: 0,
    scrolls: 0,
    lastActivity: Date.now()
  };
  sessionStorage.setItem('guest_session_activity', JSON.stringify(initialActivity));
  
  // Initialize auth triggers array
  sessionStorage.setItem('auth_triggers', '[]');
  
  // Initialize funnel steps array
  sessionStorage.setItem('funnel_steps', '[]');
  
  // Track guest session start
  trackGuestSessionStart();
  
  // Store session start time for duration tracking
  sessionStorage.setItem('guest_session_start', Date.now().toString());
  
  // Add beforeunload event listener to track session end
  const handleBeforeUnload = () => {
    const startTime = sessionStorage.getItem('guest_session_start');
    if (startTime) {
      const duration = Date.now() - parseInt(startTime);
      const activity = getSessionActivity();
      trackGuestSessionEnd(duration, activity);
    }
  };

  // Add visibility change listener to track when user switches tabs
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // User switched away from tab
      const activity = getSessionActivity();
      activity.lastActivity = Date.now();
      sessionStorage.setItem('guest_session_activity', JSON.stringify(activity));
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Initialize scroll tracking
  initializeScrollTracking();
  
  // Track initial page view
  trackGuestPageView('home');
  
  console.log('📊 Analytics: Guest tracking initialized with funnel analysis');
};

/**
 * Track guest session end when user registers
 * Call this when a user successfully registers to track the conversion
 */
export const trackGuestSessionEndOnRegistration = () => {
  const startTime = sessionStorage.getItem('guest_session_start');
  if (startTime) {
    const duration = Date.now() - parseInt(startTime);
    const activity = getSessionActivity();
    trackGuestSessionEnd(duration, activity);
    
    // Track auth trigger conversion
    trackAuthTriggerConversion();
    
    // Track journey completion for new user
    trackJourneyCompletion('profile_complete', 'new');
    
    // Clear the session data since user is now registered
    sessionStorage.removeItem('guest_session_start');
    sessionStorage.removeItem('guest_session_tracked');
    sessionStorage.removeItem('guest_session_activity');
    sessionStorage.removeItem('auth_triggers');
    sessionStorage.removeItem('funnel_steps');
  }
};

/**
 * Track session heartbeat (optional - for very detailed analytics)
 * Can be called periodically to track active session time
 */
export const trackSessionHeartbeat = () => {
  if (sessionStorage.getItem('guest_session_tracked')) {
    const startTime = sessionStorage.getItem('guest_session_start');
    if (startTime) {
      const duration = Date.now() - parseInt(startTime);
      const activity = getSessionActivity();
      
      // Only track if user has been active recently (within last 5 minutes)
      const timeSinceLastActivity = Date.now() - activity.lastActivity;
      if (timeSinceLastActivity < 300000) { // 5 minutes
        window.gtag && window.gtag('event', 'guest_session_heartbeat', {
          event_category: 'engagement',
          event_label: 'active_session',
          value: Math.round(duration / 1000)
        });
      }
    }
  }
}; 