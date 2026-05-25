import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDynamicPricingRules } from '@/hooks/useDynamicPricingRules';
import { usePlatformSettings } from '@/hooks/usePlatformSettings';
import { PricingRule, PricingRuleType } from '@/types/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { PricingRuleConditionFields } from './pricing/PricingRuleConditionFields';
import {
  getNextDurationRuleConditions,
  validateDurationRuleCandidate,
} from './pricing/durationRuleValidation';

const RULE_TYPE_LABELS: Record<PricingRuleType, string> = {
  [PricingRuleType.SEASONAL]: 'Seasonal',
  [PricingRuleType.DEMAND]: 'Demand-Based',
  [PricingRuleType.EARLY_BIRD]: 'Early Bird',
  [PricingRuleType.LOYALTY]: 'Loyalty',
  [PricingRuleType.WEEKEND]: 'Weekend',
  [PricingRuleType.HOLIDAY]: 'Holiday',
  [PricingRuleType.LOCATION]: 'Location',
  [PricingRuleType.DESTINATION]: 'Destination',
  [PricingRuleType.DURATION]: 'Duration',
};

export const DynamicPricingRulesSection = () => {
  const { toast } = useToast();
  
  // Platform Settings hook for enabling/disabling the global engine
  const { getSetting, updateSetting, loading: settingsLoading } = usePlatformSettings();
  
  // Supabase hooks for rule fetching/updating
  const { rules, loading: rulesLoading, error, updateRule, addRule, deleteRule, refresh } = useDynamicPricingRules();
  
  // Local state for local modifications
  const [localRules, setLocalRules] = useState<PricingRule[]>([]);
  const [deletedRuleIds, setDeletedRuleIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricingEnabled, setPricingEnabled] = useState(true);

  // Sync settings toggle
  useEffect(() => {
    const val = getSetting('dynamic_pricing_enabled', 'true');
    setPricingEnabled(val === 'true');
  }, [settingsLoading, getSetting]);

  // Sync pricing rules to local rules state on successful loading/updating
  useEffect(() => {
    if (!rulesLoading && rules) {
      setLocalRules(rules);
      setDeletedRuleIds([]);
      setIsDirty(false);
    }
  }, [rules, rulesLoading]);

  const handleTogglePricing = async (checked: boolean) => {
    setPricingEnabled(checked);
    try {
      const res = await updateSetting('dynamic_pricing_enabled', String(checked));
      if (res.success) {
        toast({
          title: checked ? 'Dynamic pricing enabled' : 'Dynamic pricing disabled',
          description: `The dynamic pricing engine has been ${checked ? 'enabled' : 'disabled'} successfully.`,
        });
      } else {
        throw res.error;
      }
    } catch (err) {
      console.error('Failed to toggle dynamic pricing:', err);
      toast({
        title: 'Error',
        description: 'Failed to update dynamic pricing toggle in platform settings.',
        variant: 'destructive',
      });
    }
  };

  const handleAddRule = () => {
    const newRule: PricingRule = {
      id: uuidv4(),
      name: 'New Rule',
      type: PricingRuleType.DESTINATION,
      is_active: true,
      multiplier: 1.0,
      conditions: {},
      priority: localRules.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const validationError = validateDurationRuleCandidate(localRules, newRule);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }
    
    setLocalRules([...localRules, newRule]);
    setIsDirty(true);
  };

  const handleDeleteRule = (id: string) => {
    const existingRule = rules.find((r) => r.id === id);
    if (existingRule) {
      setDeletedRuleIds((prev) => [...prev, id]);
    }
    setLocalRules(localRules.filter((r) => r.id !== id));
    setIsDirty(true);
  };

  const handleAddDurationRule = () => {
    const conditions = getNextDurationRuleConditions(localRules);
    if (!conditions) {
      toast({
        title: 'No available duration range',
        description: 'Edit or delete the existing open-ended duration rule before adding another one.',
        variant: 'destructive',
      });
      return;
    }

    const newRule: PricingRule = {
      id: uuidv4(),
      name: 'New Duration Rule',
      type: PricingRuleType.DURATION,
      is_active: true,
      multiplier: 0.9,
      conditions,
      priority: localRules.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const validationError = validateDurationRuleCandidate(localRules, newRule);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    setLocalRules([...localRules, newRule]);
    setIsDirty(true);
  };

  const handleUpdateRule = (id: string, updates: Partial<PricingRule>) => {
    setLocalRules((prevRules) => {
      const currentRule = prevRules.find((rule) => rule.id === id);
      if (!currentRule) return prevRules;

      const candidateRule: PricingRule = {
        ...currentRule,
        ...updates,
        conditions: updates.conditions ?? currentRule.conditions,
      };

      return prevRules.map((r) => (r.id === id ? candidateRule : r));
    });
    setIsDirty(true);
  };

  const handleDiscard = () => {
    setLocalRules(rules);
    setDeletedRuleIds([]);
    setIsDirty(false);
    toast({
      title: 'Changes discarded',
      description: 'All local changes have been reverted to saved settings.',
    });
  };

  const handleSaveAll = async () => {
    // 1. Batch validate all duration rules in localRules
    for (const rule of localRules) {
      const otherRules = localRules.filter((r) => r.id !== rule.id);
      const validationError = validateDurationRuleCandidate(otherRules, rule);
      if (validationError) {
        toast({
          title: `Validation error in "${rule.name}"`,
          description: validationError,
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      // 2. Perform deletions
      for (const id of deletedRuleIds) {
        await deleteRule(id);
      }

      // 3. Perform updates & insertions
      for (const localRule of localRules) {
        const isExisting = rules.some((r) => r.id === localRule.id);
        if (isExisting) {
          const dbRule = rules.find((r) => r.id === localRule.id);
          const hasChanged = JSON.stringify(dbRule) !== JSON.stringify(localRule);
          if (hasChanged) {
            await updateRule(localRule.id, localRule);
          }
        } else {
          await addRule(localRule);
        }
      }

      await refresh();
      toast({
        title: 'Rules saved successfully',
        description: 'All dynamic pricing rules have been saved and applied.',
      });
    } catch (err) {
      console.error('Error saving pricing rules:', err);
      toast({
        title: 'Save failed',
        description: 'An error occurred while saving rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (rulesLoading && localRules.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load pricing rules: {error.message}</p>
          <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dynamic Pricing
          </CardTitle>
          <CardDescription>
            Enable and configure dynamic pricing based on demand, destination, seasons, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Dynamic Pricing</Label>
              <p className="text-sm text-muted-foreground">
                Automatically adjust prices based on configured rules
              </p>
            </div>
            <Switch 
              checked={pricingEnabled} 
              onCheckedChange={handleTogglePricing} 
              disabled={settingsLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pricing Rules
            <Badge variant="secondary" className="ml-2">{localRules.length}</Badge>
          </CardTitle>
          <CardDescription>
            Configure surge pricing, discounts, and destination-based multipliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {localRules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pricing rules configured. Add your first rule below.
              </p>
            )}

            {localRules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg space-y-4 bg-card text-card-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => handleUpdateRule(rule.id, { is_active: checked })}
                    />
                    <Input
                      value={rule.name}
                      onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                      className="w-48"
                      placeholder="Rule name"
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select
                      value={rule.type}
                      onValueChange={(value) => {
                        const updates: Partial<PricingRule> = { type: value as PricingRuleType, conditions: {} };
                        if (value === PricingRuleType.DESTINATION) {
                          updates.conditions = { destination_type: 'local' };
                          updates.multiplier = 1.0;
                        } else if (value === PricingRuleType.DURATION) {
                          updates.multiplier = 0.9;
                        }
                        handleUpdateRule(rule.id, updates);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Input
                      type="number"
                      min="1"
                      value={rule.priority}
                      onChange={(e) => handleUpdateRule(rule.id, { priority: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price Multiplier</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.05"
                        min="0.5"
                        max="3"
                        value={rule.multiplier}
                        onChange={(e) => handleUpdateRule(rule.id, { multiplier: parseFloat(e.target.value) || 1 })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">× price</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rule.multiplier > 1
                        ? `${Math.round((rule.multiplier - 1) * 100)}% surcharge`
                        : rule.multiplier < 1
                        ? `${Math.round((1 - rule.multiplier) * 100)}% discount`
                        : 'No change'}
                    </p>
                  </div>
                </div>

                <PricingRuleConditionFields
                  ruleType={rule.type}
                  conditions={rule.conditions}
                  onConditionsChange={(conditions) => handleUpdateRule(rule.id, { conditions })}
                  onMultiplierChange={(multiplier) => handleUpdateRule(rule.id, { multiplier })}
                />
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={handleAddRule} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing Rule
              </Button>
              <Button variant="outline" onClick={handleAddDurationRule} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Duration Rule
              </Button>
            </div>

            {/* Unsaved Changes Banner */}
            {isDirty && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t mt-6 bg-amber-500/10 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">
                    You have unsaved rules. Save to persist changes to database.
                  </span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button variant="outline" onClick={handleDiscard} disabled={saving} className="w-full sm:w-auto">
                    Discard Changes
                  </Button>
                  <Button onClick={handleSaveAll} disabled={saving} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-500">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Rules
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
