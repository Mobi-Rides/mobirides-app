import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuideStep {
  title: string;
  content: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface GuideContent {
  title: string;
  description: string;
  read_time: string;
  steps: GuideStep[];
}

export const useGuideContent = (role: 'renter' | 'host', section: string) => {
  return useQuery({
    queryKey: ['guide-content', role, section],
    queryFn: async (): Promise<GuideContent | null> => {
      const { data, error } = await supabase
        .from('guides')
        .select('title, description, read_time, content')
        .eq('role', role)
        .eq('section', section)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching row found
          return null;
        }
        console.error('Error fetching guide content:', error);
        throw error;
      }

      // Parse the JSON content and ensure it has the expected structure
      const content = data.content as any;
      const steps = content.steps || [];

      return {
        title: data.title,
        description: data.description || '',
        read_time: data.read_time || '5 min',
        steps: steps.map((step: any) => ({
          title: step.title || '',
          content: step.content || '',
          ...(step.action && { action: step.action })
        }))
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
};