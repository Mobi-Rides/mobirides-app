import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PricingRule, PricingRuleType, PricingConditions } from '@/types/pricing';

export const useDynamicPricingRules = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await (supabase as any)
        .from('dynamic_pricing_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (fetchError) throw fetchError;

      const mappedRules: PricingRule[] = (data || []).map((dbRule: any) => ({
        id: dbRule.id,
        name: dbRule.rule_name,
        type: dbRule.condition_type as PricingRuleType,
        is_active: dbRule.is_active,
        multiplier: dbRule.multiplier,
        conditions: (dbRule.condition_value as PricingConditions) || {},
        priority: dbRule.priority,
        created_at: dbRule.created_at || new Date().toISOString(),
        updated_at: dbRule.created_at || new Date().toISOString(),
      }));

      setRules(mappedRules);
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
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.rule_name = updates.name;
      if (updates.type !== undefined) dbUpdates.condition_type = updates.type;
      if (updates.conditions !== undefined) dbUpdates.condition_value = updates.conditions;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.multiplier !== undefined) dbUpdates.multiplier = updates.multiplier;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

      const { error: updateError } = await (supabase as any)
        .from('dynamic_pricing_rules')
        .update(dbUpdates)
        .eq('id', id);

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
      const dbInsert = {
        id: rule.id,
        rule_name: rule.name,
        condition_type: rule.type,
        condition_value: rule.conditions,
        is_active: rule.is_active,
        multiplier: rule.multiplier,
        priority: rule.priority,
      };

      const { error: insertError } = await (supabase as any)
        .from('dynamic_pricing_rules')
        .insert([dbInsert]);

      if (insertError) throw insertError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      console.error("Failed to add rule:", err);
      return { success: false, error: err };
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error: deleteError } = await (supabase as any)
        .from('dynamic_pricing_rules')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchRules();
      return { success: true };
    } catch (err) {
      console.error("Failed to delete rule:", err);
      return { success: false, error: err };
    }
  };

  return { rules, loading, error, updateRule, addRule, deleteRule, refresh: fetchRules };
};
