
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PricingRule, PricingRuleType, PricingConditions } from '@/types/pricing';
import { Database } from '@/integrations/supabase/types';

type DbPricingRuleRow = Database['public']['Tables']['dynamic_pricing_rules']['Row'];
type DbPricingRuleInsert = Database['public']['Tables']['dynamic_pricing_rules']['Insert'];
type DbPricingRuleUpdate = Database['public']['Tables']['dynamic_pricing_rules']['Update'];

export const useDynamicPricingRules = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dynamic_pricing_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (fetchError) throw fetchError;
      
      const mappedRules: PricingRule[] = (data || []).map((dbRule: DbPricingRuleRow) => ({
        id: dbRule.id,
        name: dbRule.rule_name,
        type: dbRule.condition_type as PricingRuleType,
        is_active: dbRule.is_active,
        multiplier: dbRule.multiplier,
        conditions: (dbRule.condition_value as unknown) as PricingConditions,
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
      const dbUpdates: DbPricingRuleUpdate = {};
      if (updates.name !== undefined) dbUpdates.rule_name = updates.name;
      if (updates.type !== undefined) dbUpdates.condition_type = updates.type;
      if (updates.conditions !== undefined) dbUpdates.condition_value = updates.conditions as any;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;
      if (updates.multiplier !== undefined) dbUpdates.multiplier = updates.multiplier;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

      const { error: updateError } = await supabase
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
      const dbInsert: DbPricingRuleInsert = {
        id: rule.id,
        rule_name: rule.name,
        condition_type: rule.type,
        condition_value: rule.conditions as any,
        is_active: rule.is_active,
        multiplier: rule.multiplier,
        priority: rule.priority,
      };

      const { error: insertError } = await supabase
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

  return { rules, loading, error, updateRule, addRule, refresh: fetchRules };
};
