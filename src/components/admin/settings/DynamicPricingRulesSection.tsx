import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDynamicPricingRules } from '@/hooks/useDynamicPricingRules';
import { PricingRuleType } from '@/types/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, TrendingUp, Calendar, Loader2 } from 'lucide-react';
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
  const { rules, loading, error, updateRule, addRule, deleteRule } = useDynamicPricingRules();
  const [pricingEnabled, setPricingEnabled] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const handleAddRule = async () => {
    const newRule = {
      id: uuidv4(),
      name: 'New Rule',
      type: PricingRuleType.DESTINATION,
      is_active: true,
      multiplier: 1.0,
      conditions: {},
      priority: rules.length + 1,
    };
    const validationError = validateDurationRuleCandidate(rules, newRule);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    const result = await addRule(newRule);
    if (result.success) {
      toast({ title: 'New pricing rule created' });
    } else {
      toast({ title: 'Failed to create rule', variant: 'destructive' });
    }
  };

  const handleDeleteRule = async (id: string) => {
    const result = await deleteRule(id);
    if (result.success) {
      toast({ title: 'Pricing rule deleted' });
    } else {
      toast({ title: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const handleAddDurationRule = async () => {
    const conditions = getNextDurationRuleConditions(rules);
    if (!conditions) {
      toast({
        title: 'No available duration range',
        description: 'Edit or delete the existing open-ended duration rule before adding another one.',
        variant: 'destructive',
      });
      return;
    }

    const newRule = {
      id: uuidv4(),
      name: 'New Duration Rule',
      type: PricingRuleType.DURATION,
      is_active: true,
      multiplier: 0.9,
      conditions,
      priority: rules.length + 1,
    };

    const validationError = validateDurationRuleCandidate(rules, newRule);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    const result = await addRule(newRule);
    if (result.success) {
      toast({ title: 'Duration pricing rule created' });
    } else {
      toast({ title: 'Failed to create duration rule', variant: 'destructive' });
    }
  };

  const handleUpdateRule = async (id: string, updates: Record<string, any>) => {
    const currentRule = rules.find((rule) => rule.id === id);
    if (!currentRule) return;

    const candidateRule = {
      ...currentRule,
      ...updates,
      conditions: updates.conditions ?? currentRule.conditions,
    };

    const validationError = validateDurationRuleCandidate(rules, candidateRule);
    if (validationError) {
      toast({ title: validationError, variant: 'destructive' });
      return;
    }

    setSavingId(id);
    const result = await updateRule(id, updates);
    setSavingId(null);
    if (!result.success) {
      toast({ title: 'Failed to update rule', variant: 'destructive' });
    }
  };

  if (loading) {
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
            <Switch checked={pricingEnabled} onCheckedChange={setPricingEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pricing Rules
            <Badge variant="secondary" className="ml-2">{rules.length}</Badge>
          </CardTitle>
          <CardDescription>
            Configure surge pricing, discounts, and destination-based multipliers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No pricing rules configured. Add your first rule below.
              </p>
            )}

            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg space-y-4">
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
                    {savingId === rule.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
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
                        const updates: Record<string, any> = { type: value, conditions: {} };
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleAddRule} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing Rule
              </Button>
              <Button variant="outline" onClick={handleAddDurationRule} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Duration Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
