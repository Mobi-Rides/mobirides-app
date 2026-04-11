import React from 'react';
import { PricingRuleType, PricingConditions } from '@/types/pricing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PricingRuleConditionFieldsProps {
  ruleType: PricingRuleType;
  conditions: PricingConditions;
  onConditionsChange: (conditions: PricingConditions) => void;
  onMultiplierChange?: (multiplier: number) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DESTINATION_DEFAULTS: Record<string, number> = {
  local: 1.0,
  out_of_zone: 1.5,
  cross_border: 2.0,
};

export const PricingRuleConditionFields: React.FC<PricingRuleConditionFieldsProps> = ({
  ruleType,
  conditions,
  onConditionsChange,
  onMultiplierChange,
}) => {
  switch (ruleType) {
    case PricingRuleType.DESTINATION:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium">Destination Type</Label>
          <Select
            value={conditions.destination_type || 'local'}
            onValueChange={(value: 'local' | 'out_of_zone' | 'cross_border') => {
              onConditionsChange({ ...conditions, destination_type: value });
              if (onMultiplierChange && DESTINATION_DEFAULTS[value]) {
                onMultiplierChange(DESTINATION_DEFAULTS[value]);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (&lt;90km from pickup) — 1.0×</SelectItem>
              <SelectItem value="out_of_zone">Out of Zone (&gt;90km) — 1.5×</SelectItem>
              <SelectItem value="cross_border">Cross-Border — 2.0×</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Destination multiplier is applied during booking Step 2 and shown as a line item in the price summary.
          </p>
        </div>
      );

    case PricingRuleType.SEASONAL:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium">Active Months</Label>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((month, idx) => {
              const monthNum = idx + 1;
              const selected = conditions.months?.includes(monthNum);
              return (
                <Badge
                  key={month}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = conditions.months || [];
                    const updated = selected
                      ? current.filter((m) => m !== monthNum)
                      : [...current, monthNum];
                    onConditionsChange({ ...conditions, months: updated });
                  }}
                >
                  {month.slice(0, 3)}
                </Badge>
              );
            })}
          </div>
        </div>
      );

    case PricingRuleType.WEEKEND:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium">Days of Week</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day, idx) => {
              const selected = conditions.days_of_week?.includes(idx);
              return (
                <Badge
                  key={day}
                  variant={selected ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = conditions.days_of_week || [];
                    const updated = selected
                      ? current.filter((d) => d !== idx)
                      : [...current, idx];
                    onConditionsChange({ ...conditions, days_of_week: updated });
                  }}
                >
                  {day}
                </Badge>
              );
            })}
          </div>
        </div>
      );

    case PricingRuleType.EARLY_BIRD:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium">Minimum Advance Booking Days</Label>
          <Input
            type="number"
            min="1"
            value={conditions.advance_booking_days || ''}
            onChange={(e) =>
              onConditionsChange({ ...conditions, advance_booking_days: parseInt(e.target.value) || 0 })
            }
            placeholder="e.g. 7"
            className="w-32"
          />
          <p className="text-xs text-muted-foreground">
            Discount applies when booking is made at least this many days in advance.
          </p>
        </div>
      );

    case PricingRuleType.LOYALTY:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Previous Bookings</Label>
              <Input
                type="number"
                min="0"
                value={conditions.min_bookings || ''}
                onChange={(e) =>
                  onConditionsChange({ ...conditions, min_bookings: parseInt(e.target.value) || 0 })
                }
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">User Tier</Label>
              <Select
                value={conditions.user_tier || ''}
                onValueChange={(value) => onConditionsChange({ ...conditions, user_tier: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );

    case PricingRuleType.DEMAND:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Demand Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={conditions.demand_threshold || ''}
                onChange={(e) =>
                  onConditionsChange({ ...conditions, demand_threshold: parseInt(e.target.value) || 0 })
                }
                placeholder="e.g. 80"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Location Radius (km)</Label>
              <Input
                type="number"
                min="1"
                value={conditions.location_radius || ''}
                onChange={(e) =>
                  onConditionsChange({ ...conditions, location_radius: parseInt(e.target.value) || 0 })
                }
                placeholder="e.g. 50"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Surge triggers when booked percentage exceeds threshold within radius.
          </p>
        </div>
      );

    case PricingRuleType.HOLIDAY:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <Label className="text-sm font-medium">Holiday Period</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={(conditions as any).start_date || ''}
                onChange={(e) =>
                  onConditionsChange({ ...conditions, start_date: e.target.value } as any)
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={(conditions as any).end_date || ''}
                onChange={(e) =>
                  onConditionsChange({ ...conditions, end_date: e.target.value } as any)
                }
              />
            </div>
          </div>
        </div>
      );

    case PricingRuleType.LOCATION:
      return (
        <div className="space-y-3 p-3 bg-muted/50 rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Regions</Label>
              <Input
                value={conditions.regions?.join(', ') || ''}
                onChange={(e) =>
                  onConditionsChange({
                    ...conditions,
                    regions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g. Gaborone, Francistown"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cities</Label>
              <Input
                value={conditions.cities?.join(', ') || ''}
                onChange={(e) =>
                  onConditionsChange({
                    ...conditions,
                    cities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g. Maun, Kasane"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};
