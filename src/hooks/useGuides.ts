import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GuideSection {
  id: string;
  title: string;
  description: string;
  section: string;
  read_time: string;
  is_popular: boolean;
  sort_order: number;
}

export const useGuides = (role: 'renter' | 'host') => {
  return useQuery({
    queryKey: ['guides', role],
    queryFn: async (): Promise<GuideSection[]> => {
      const { data, error } = await supabase
        .from('guides')
        .select('id, title, description, section, read_time, is_popular, sort_order')
        .eq('role', role)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching guides:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
};

export const usePopularGuides = () => {
  return useQuery({
    queryKey: ['guides', 'popular'],
    queryFn: async (): Promise<GuideSection[]> => {
      const { data, error } = await supabase
        .from('guides')
        .select('id, title, description, section, read_time, is_popular, sort_order')
        .eq('is_popular', true)
        .order('sort_order', { ascending: true })
        .limit(4);

      if (error) {
        console.error('Error fetching popular guides:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
};

export const useSearchGuides = (query: string, role?: 'renter' | 'host') => {
  return useQuery({
    queryKey: ['guides', 'search', query, role],
    queryFn: async (): Promise<GuideSection[]> => {
      let supabaseQuery = supabase
        .from('guides')
        .select('id, title, description, section, read_time, is_popular, sort_order');

      if (role) {
        supabaseQuery = supabaseQuery.eq('role', role);
      }

      if (query.trim()) {
        supabaseQuery = supabaseQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      const { data, error } = await supabaseQuery
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error searching guides:', error);
        throw error;
      }

      return data || [];
    },
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
};