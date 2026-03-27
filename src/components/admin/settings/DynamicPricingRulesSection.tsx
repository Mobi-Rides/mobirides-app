import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, TrendingUp, Calendar, MapPin } from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  type: 'surge' | 'discount';
  condition: string;
  multiplier: string;
  active: boolean;
}

export const DynamicPricingRulesSection = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pricingEnabled, setPricingEnabled] = useState(true);

  const [rules, setRules] = useState<PricingRule[]>([
    {
      id: '1',
      name: 'Weekend Surge',
      type: 'surge',
      condition: 'saturday_sunday',
      multiplier: '1.2',
      active: true,
    },
    {
      id: '2',
      name: 'Peak Hours',
      type: 'surge',
      condition: '8am_6pm',
      multiplier: '1.15',
      active: true,
    },
    {
      id: '3',
      name: 'Long-term Discount',
      type: 'discount',
      condition: '7_plus_days',
      multiplier: '0.9',
      active: true,
    },
  ]);

  const addRule = () => {
    const newRule: PricingRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      type: 'surge',
      condition: '',
      multiplier: '1.0',
      active: true,
    };
    setRules([...rules, newRule]);
    toast({ title: 'New pricing rule added' });
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast({ title: 'Pricing rule removed' });
  };

  const updateRule = (id: string, updates: Partial<PricingRule>) => {
    setRules(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Pricing rules saved',
        description: 'Dynamic pricing rules have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save rules. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Dynamic Pricing
          </CardTitle>
          <CardDescription>
            Enable and configure dynamic pricing based on demand and conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <Label>Enable Dynamic Pricing</Label>
              <p className="text-sm text-muted-foreground">
                Automatically adjust prices based on demand and conditions
              </p>
            </div>
            <Switch
              checked={pricingEnabled}
              onCheckedChange={setPricingEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pricing Rules
          </CardTitle>
          <CardDescription>
            Configure surge pricing and discount rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.active}
                      onCheckedChange={(checked) => updateRule(rule.id, { active: checked })}
                    />
                    <Input
                      value={rule.name}
                      onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                      className="w-48"
                      placeholder="Rule name"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Rule Type</Label>
                    <Select value={rule.type} onValueChange={(value) => updateRule(rule.id, { type: value as 'surge' | 'discount' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="surge">Surge (Price Increase)</SelectItem>
                        <SelectItem value="discount">Discount (Price Decrease)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={rule.condition} onValueChange={(value) => updateRule(rule.id, { condition: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saturday_sunday">Weekends (Sat-Sun)</SelectItem>
                        <SelectItem value="friday_evening">Friday Evening</SelectItem>
                        <SelectItem value="8am_6pm">Peak Hours (8AM-6PM)</SelectItem>
                        <SelectItem value="7_plus_days">Long-term (7+ days)</SelectItem>
                        <SelectItem value="30_plus_days">Monthly (30+ days)</SelectItem>
                        <SelectItem value="high_demand">High Demand Period</SelectItem>
                        <SelectItem value="low_demand">Low Demand Period</SelectItem>
                      </SelectContent>
                    </Select>
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
                        onChange={(e) => updateRule(rule.id, { multiplier: e.target.value })}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        {rule.type === 'surge' ? '× price' : '× price'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rule.type === 'surge'
                        ? `1.2 = 20% higher, 1.5 = 50% higher`
                        : `0.9 = 10% off, 0.8 = 20% off`}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addRule} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Pricing Rule
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => {
          setRules([
            {
              id: '1',
              name: 'Weekend Surge',
              type: 'surge',
              condition: 'saturday_sunday',
              multiplier: '1.2',
              active: true,
            },
          ]);
          toast({ title: 'Reset to default rules' });
        }}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving || !pricingEnabled}>
          {saving ? 'Saving...' : 'Save Rules'}
        </Button>
      </div>
    </div>
  );
};
