import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TutorialStep } from '@/data/tutorialSteps';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TutorialBubbleProps {
  step: TutorialStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
}

export function TutorialBubble({
  step,
  currentIndex,
  totalSteps,
  onNext,
  onPrev,
  onDismiss,
}: TutorialBubbleProps) {
  const navigate = useNavigate();
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSteps - 1;

  // ── Position bubble relative to target element ─────────
  useEffect(() => {
    if (!step.targetSelector) {
      setPos(null); // will use center positioning
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      setPos(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    const bubble = bubbleRef.current;
    const bw = bubble?.offsetWidth ?? 340;
    const bh = bubble?.offsetHeight ?? 200;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2 - bw / 2;
        break;
      case 'top':
        top = rect.top - bh - 12;
        left = rect.left + rect.width / 2 - bw / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - bh / 2;
        left = rect.left - bw - 12;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - bh / 2;
        left = rect.right + 12;
        break;
      default:
        setPos(null);
        return;
    }

    // Clamp to viewport
    top = Math.max(8, Math.min(top, window.innerHeight - bh - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));

    setPos({ top, left });
  }, [step]);

  const isCentered = !pos;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.key}
        ref={bubbleRef}
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className={cn(
          'fixed z-[9999] w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-card text-card-foreground shadow-xl',
          isCentered && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        )}
        style={pos ? { top: pos.top, left: pos.left } : undefined}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          {/* Mobi avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight truncate">
              {step.title}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Step {currentIndex + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close tutorial"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {step.content}
          </p>
        </div>

        {/* Help guide link */}
        {step.helpGuideLink && (
          <div className="px-4 pb-2">
            <button
              onClick={() => navigate(step.helpGuideLink!)}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <BookOpen className="h-3 w-3" />
              View help guide
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
            className="h-8 px-3 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Back
          </Button>

          <Button
            size="sm"
            onClick={onNext}
            className="h-8 px-4 text-xs"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Small reminder bubble shown after dismissal */
export function TutorialReminderBubble({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onRestart}
      className="fixed bottom-20 right-6 z-[9998] flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-lg hover:bg-muted transition-colors"
      title="Restart tutorial"
    >
      <RotateCcw className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium text-foreground">
        Restart tutorial
      </span>
    </motion.button>
  );
}
