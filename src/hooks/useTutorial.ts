import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from './useAuthStatus';
import {
  TutorialStep,
  TUTORIAL_VERSION,
  getStepsForRole,
} from '@/data/tutorialSteps';

interface TutorialState {
  /** Whether the tutorial bubble is visible */
  isActive: boolean;
  /** Current step being shown */
  currentStep: TutorialStep | null;
  /** Index within the full ordered steps array */
  currentIndex: number;
  /** All steps for the user's role */
  allSteps: TutorialStep[];
  /** Keys of completed steps */
  completedKeys: Set<string>;
  /** Loading state */
  isLoading: boolean;
}

export function useTutorial() {
  const { userId, userRole, isAuthenticated } = useAuthStatus();
  const location = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const role = (userRole as 'renter' | 'host') ?? 'renter';
  const allSteps = useMemo(() => getStepsForRole(role), [role]);
  const currentStep = allSteps[currentIndex] ?? null;

  // ── Load progress & check if tutorial should auto-start ───
  useEffect(() => {
    if (!userId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        // Check profile tutorial state
        const { data: profile } = await supabase
          .from('profiles')
          .select('tutorial_completed, tutorial_dismissed_at, tutorial_version')
          .eq('id', userId)
          .single();

        // Load completed steps
        const { data: progress } = await supabase
          .from('user_tutorial_progress' as any)
          .select('step_key')
          .eq('user_id', userId);

        const keys = new Set<string>(
          (progress as any[] | null)?.map((p: any) => p.step_key) ?? []
        );
        setCompletedKeys(keys);

        // Auto-start if tutorial not completed or version bumped
        const shouldStart =
          !profile?.tutorial_completed ||
          (profile?.tutorial_version ?? 0) < TUTORIAL_VERSION;

        if (shouldStart && !profile?.tutorial_dismissed_at) {
          // Find first incomplete step
          const firstIncomplete = allSteps.findIndex(
            (s) => !keys.has(s.key)
          );
          setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
          setIsActive(true);
        }
      } catch (err) {
        console.error('[Tutorial] Failed to load progress:', err);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [userId, isAuthenticated, allSteps]);

  // ── Mark step complete ────────────────────────────────────
  const markComplete = useCallback(
    async (stepKey: string) => {
      if (!userId || completedKeys.has(stepKey)) return;

      setCompletedKeys((prev) => new Set([...prev, stepKey]));

      try {
        await supabase.from('user_tutorial_progress' as any).upsert(
          { user_id: userId, step_key: stepKey } as any,
          { onConflict: 'user_id,step_key' }
        );
      } catch (err) {
        console.error('[Tutorial] Failed to save progress:', err);
      }
    },
    [userId, completedKeys]
  );

  // ── Navigation ────────────────────────────────────────────
  const next = useCallback(() => {
    if (!currentStep) return;
    markComplete(currentStep.key);
    if (currentIndex < allSteps.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Tutorial finished
      completeTutorial();
    }
  }, [currentStep, currentIndex, allSteps.length, markComplete]);

  const prev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const skipToStep = useCallback(
    (index: number) => {
      if (index >= 0 && index < allSteps.length) setCurrentIndex(index);
    },
    [allSteps.length]
  );

  const completeTutorial = useCallback(async () => {
    setIsActive(false);
    if (!userId) return;

    try {
      await supabase
        .from('profiles')
        .update({
          tutorial_completed: true,
          tutorial_version: TUTORIAL_VERSION,
        } as any)
        .eq('id', userId);
    } catch (err) {
      console.error('[Tutorial] Failed to mark complete:', err);
    }
  }, [userId]);

  const dismiss = useCallback(async () => {
    setIsActive(false);
    setDismissed(true);
    if (!userId) return;

    try {
      await supabase
        .from('profiles')
        .update({
          tutorial_dismissed_at: new Date().toISOString(),
        } as any)
        .eq('id', userId);
    } catch (err) {
      console.error('[Tutorial] Failed to dismiss:', err);
    }
  }, [userId]);

  const restart = useCallback(async () => {
    setCurrentIndex(0);
    setCompletedKeys(new Set());
    setDismissed(false);
    setIsActive(true);

    if (!userId) return;

    try {
      // Clear progress
      await supabase
        .from('user_tutorial_progress' as any)
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('profiles')
        .update({
          tutorial_completed: false,
          tutorial_dismissed_at: null,
          tutorial_version: TUTORIAL_VERSION,
        } as any)
        .eq('id', userId);
    } catch (err) {
      console.error('[Tutorial] Failed to restart:', err);
    }
  }, [userId]);

  return {
    isActive,
    currentStep,
    currentIndex,
    totalSteps: allSteps.length,
    allSteps,
    completedKeys,
    isLoading,
    dismissed,
    next,
    prev,
    skipToStep,
    dismiss,
    restart,
    completeTutorial,
  };
}
