import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/utils/toast-utils";
import { HANDOVER_STEPS, completeHandoverStep } from "@/services/enhancedHandoverService";

export interface HandoverStep {
  name: string;
  order: number;
  owner: "host" | "renter" | "both" | "dynamic";
  title: string;
  description: string;
  is_completed: boolean;
  host_completed: boolean;
  renter_completed: boolean;
  completion_data: any;
}

export interface HandoverSessionData {
  id: string;
  booking_id: string;
  current_step_order: number;
  waiting_for: "host" | "renter" | "both" | "none";
  handover_completed: boolean;
  handover_type: "pickup" | "return";
  host_id: string;
  renter_id: string;
  handover_location_lat?: number;
  handover_location_lng?: number;
  handover_location_name?: string;
  handover_location_type?: string;
}

export const useInteractiveHandover = (sessionId: string | null) => {
  const [session, setSession] = useState<HandoverSessionData | null>(null);
  const [steps, setSteps] = useState<HandoverStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get session data
      const { data: sessionData, error: sessionError } = await supabase
        .from("handover_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData as HandoverSessionData);

      // Get steps data
      const { data: stepsData, error: stepsError } = await supabase
        .from("handover_step_completion")
        .select("*")
        .eq("handover_session_id", sessionId)
        .order("step_order");

      if (stepsError) throw stepsError;

      // Merge with HANDOVER_STEPS definitions
      const mergedSteps = HANDOVER_STEPS.map(def => {
        const dbStep = (stepsData || []).find(s => s.step_name === def.name);
        return {
          ...def,
          is_completed: dbStep?.is_completed || false,
          host_completed: dbStep?.host_completed || false,
          renter_completed: dbStep?.renter_completed || false,
          completion_data: dbStep?.completion_data || {}
        } as HandoverStep;
      });

      setSteps(mergedSteps);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching handover session:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Re-fetch on reconnect / tab becoming visible to recover missed updates
  useEffect(() => {
    if (!sessionId) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchSessionData();
    };
    const handleOnline = () => fetchSessionData();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [sessionId, fetchSessionData]);

  // Real-time subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`handover_session_${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "handover_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setSession(payload.new as HandoverSessionData);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "handover_step_completion",
          filter: `handover_session_id=eq.${sessionId}`,
        },
        () => {
          // Refresh steps when any step changes
          fetchSessionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, fetchSessionData]);

  const advanceStep = async (completionData?: Record<string, any>) => {
    if (!sessionId || !session || !currentUserId) return false;

    const currentStep = steps.find(s => s.order === session.current_step_order);
    if (!currentStep) return false;

    const userRole = currentUserId === session.host_id ? 'host' : 'renter';
    
    // Resolve dynamic ownership based on handover type
    const resolvedOwner = currentStep.owner === "dynamic"
      ? (session.handover_type === "pickup" ? "renter" : "host")
      : currentStep.owner;

    // Check if it's user's turn
    const isMyTurn = resolvedOwner === "both" || resolvedOwner === userRole;
    if (!isMyTurn) {
      toast.error("Waiting for the other party to complete their step");
      return false;
    }

    // Check if user already completed their part in a "both" step
    if (resolvedOwner === "both") {
      if (userRole === 'host' && currentStep.host_completed) {
        toast.info("Waiting for renter to complete their part");
        return false;
      }
      if (userRole === 'renter' && currentStep.renter_completed) {
        toast.info("Waiting for host to complete their part");
        return false;
      }
    }

    const success = await completeHandoverStep(
      sessionId,
      currentStep.name,
      userRole,
      completionData
    );

    if (success) {
      // Data will be updated via real-time subscription
      return true;
    }
    return false;
  };

  const currentStep = steps.find(s => s.order === session?.current_step_order) || null;
  const userRole = session && currentUserId ? (currentUserId === session.host_id ? 'host' : 'renter') : null;
  
  // Resolve dynamic ownership
  const resolvedCurrentOwner = currentStep?.owner === "dynamic" && session
    ? (session.handover_type === "pickup" ? "renter" : "host")
    : currentStep?.owner;
  
  const isMyTurn = currentStep && userRole ? (resolvedCurrentOwner === "both" || resolvedCurrentOwner === userRole) : false;
  
  // Specific turn check for "both" steps
  const needsMyInput = isMyTurn && resolvedCurrentOwner === "both" 
    ? (userRole === 'host' ? !currentStep!.host_completed : !currentStep!.renter_completed)
    : isMyTurn;

  return {
    session,
    steps,
    currentStep,
    loading,
    error,
    userRole,
    isMyTurn: needsMyInput,
    advanceStep,
    refresh: fetchSessionData
  };
};
