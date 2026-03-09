import { AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/hooks/useTutorial';
import { TutorialBubble, TutorialReminderBubble } from './TutorialBubble';
import { useAuthStatus } from '@/hooks/useAuthStatus';

/**
 * Global tutorial manager — renders at the app root level.
 * Auto-starts for new/returning users, shows reminder after dismissal.
 */
export function TutorialManager() {
  const { isAuthenticated } = useAuthStatus();
  const tutorial = useTutorial();

  // Don't render anything for unauthenticated users or while loading
  if (!isAuthenticated || tutorial.isLoading) return null;

  return (
    <>
      {/* Active tutorial overlay with subtle backdrop */}
      <AnimatePresence>
        {tutorial.isActive && tutorial.currentStep && (
          <>
            {/* Soft backdrop */}
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

      {/* Reminder bubble after dismissal (but not completion) */}
      <AnimatePresence>
        {tutorial.dismissed && !tutorial.isActive && (
          <TutorialReminderBubble onRestart={tutorial.restart} />
        )}
      </AnimatePresence>
    </>
  );
}
