import { AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialBubble, TutorialReminderBubble } from './TutorialBubble';
import { TutorialContext } from './TutorialContext';
import { useAuthStatus } from '@/hooks/useAuthStatus';

/**
 * Global tutorial provider + manager.
 * Wraps children so they can access tutorial.restart() via TutorialContext.
 */
export function TutorialManager({ children }: { children?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStatus();
  const tutorial = useTutorial();

  // Always provide context (even while loading) so children can call restart
  return (
    <TutorialContext.Provider value={{ restart: tutorial.restart }}>
      {children}

      {isAuthenticated && !tutorial.isLoading && (
        <>
          {/* Active tutorial overlay */}
          <AnimatePresence>
            {tutorial.isActive && tutorial.currentStep && (
              <>
                <div
                  className="fixed inset-0 z-[9998] bg-black/20 pointer-events-none"
                  aria-hidden
                />
                <TutorialBubble
                  step={tutorial.currentStep}
                  currentIndex={tutorial.currentIndex}
                  totalSteps={tutorial.totalSteps}
                  onNext={tutorial.next}
                  onPrev={tutorial.prev}
                  onDismiss={tutorial.dismiss}
                />
              </>
            )}
          </AnimatePresence>

          {/* Reminder bubble after dismissal */}
          <AnimatePresence>
            {tutorial.dismissed && !tutorial.isActive && (
              <TutorialReminderBubble onRestart={tutorial.restart} />
            )}
          </AnimatePresence>
        </>
      )}
    </TutorialContext.Provider>
  );
}
