
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PricingRule } from '@/types/pricing';

export const useDynamicPricingRules = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await (supabase
        .from('dynamic_pricing_rules' as any)
        .select('*')
        .order('priority', { ascending: false }) as any);

      if (fetchError) throw fetchError;
      setRules((data as unknown as PricingRule[]) || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const updateRule = async (id: string, updates: Partial<PricingRule>) => {
    try {
      const { error: updateError } = await (supabase
        .from('dynamic_pricing_rules' as any)
        .update(updates)
        .eq('id', id) as any);

      if (updateError) throw updateError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      console.error("Failed to update rule:", err);
      return { success: false, error: err };
    }
  };

  const addRule = async (rule: Omit<PricingRule, 'created_at' | 'updated_at'>) => {
    try {
      const { error: insertError } = await (supabase
        .from('dynamic_pricing_rules' as any)
        .insert([rule]) as any);

      if (insertError) throw insertError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      console.error("Failed to add rule:", err);
      return { success: false, error: err };
    }
  };

  return { rules, loading, error, updateRule, addRule, refresh: fetchRules };
};
