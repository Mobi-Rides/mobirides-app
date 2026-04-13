import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, Loader2, AlertTriangle, Info } from 'lucide-react';

interface InsurancePackage {
  id: string;
  name: string;
  dailyRate: number;
  coverageCap: number;
  excessPercentage: number;
  targetSegment: string;
  internationalCapUsd: number;
  active: boolean;
  features: string[];
}

const SLA_DEFAULTS: InsurancePackage[] = [
  {
    id: 'no-coverage',
    name: 'No Coverage',
    dailyRate: 0,
    coverageCap: 0,
    excessPercentage: 100,
    targetSegment: 'Budget-conscious renters accepting full liability',
    internationalCapUsd: 0,
    active: true,
    features: [],
  },
  {
    id: 'basic',
    name: 'Basic',
    dailyRate: 80,
    coverageCap: 8000,
    excessPercentage: 20,
    targetSegment: 'Short-term city rentals',
    internationalCapUsd: 8000,
    active: true,
    features: ['Collision Damage Waiver', 'Basic Theft Protection'],
  },
  {
    id: 'standard',
    name: 'Standard',
    dailyRate: 150,
    coverageCap: 20000,
    excessPercentage: 15,
    targetSegment: 'Multi-day and weekend trips',
    internationalCapUsd: 8000,
    active: true,
    features: ['Collision Damage Waiver', 'Theft Protection', 'Windscreen & Glass Cover', 'Roadside Assistance'],
  },
  {
    id: 'premium',
    name: 'Premium',
    dailyRate: 250,
    coverageCap: 50000,
    excessPercentage: 10,
    targetSegment: 'Long-term and cross-border rentals',
    internationalCapUsd: 8000,
    active: true,
    features: ['Full Collision Damage Waiver', 'Comprehensive Theft Protection', 'Windscreen & Glass Cover', 'Roadside Assistance', 'Personal Effects Cover', 'Rental Gap Cover'],
  },
];

const COVERAGE_INCLUSIONS = [
  'Accidental collision damage to the rental vehicle',
  'Theft or attempted theft of the vehicle',
  'Windscreen, glass, and mirror damage (Standard & Premium)',
  'Fire and natural disaster damage',
  'Roadside assistance and towing (Standard & Premium)',
];

const COVERAGE_EXCLUSIONS = [
  'Third-party liability (handled separately)',
  'Damage due to driver negligence or intoxication',
  'Mechanical/electrical failure not caused by accident',
  'Personal belongings (except Premium tier)',
  'Damage to tyres/undercarriage from misuse',
  'Cross-border incidents without prior declaration',
];

export const InsuranceSettingsSection = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);
  const [packages, setPackages] = useState<InsurancePackage[]>(SLA_DEFAULTS);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('insurance_packages')
        .select('*')
        .order('daily_rate', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: InsurancePackage[] = data.map((row: any) => ({
          id: row.id,
          name: row.name || row.tier_name || 'Unknown',
          dailyRate: row.daily_rate || 0,
          coverageCap: row.coverage_amount || row.max_coverage || 0,
          excessPercentage: row.excess_percentage || 0,
          targetSegment: row.target_segment || '',
          internationalCapUsd: row.international_cap_usd || 8000,
          active: row.is_active !== false,
          features: row.features || [],
        }));
        // Prepend "No Coverage" if not present
        const hasNoCoverage = mapped.some((p) => p.name === 'No Coverage');
        setPackages(hasNoCoverage ? mapped : [SLA_DEFAULTS[0], ...mapped]);
      }
    } catch (err) {
      console.error('Failed to fetch insurance packages:', err);
      // Keep SLA defaults as fallback
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = (id: string, updates: Partial<InsurancePackage>) => {
    setPackages(packages.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save editable packages (skip "No Coverage" which is read-only)
      const editablePackages = packages.filter((p) => p.id !== 'no-coverage');
      for (const pkg of editablePackages) {
        const upsertData = {
          name: pkg.name,
          daily_rate: pkg.dailyRate,
          coverage_amount: pkg.coverageCap,
          excess_percentage: pkg.excessPercentage,
          target_segment: pkg.targetSegment,
          international_cap_usd: pkg.internationalCapUsd,
          is_active: pkg.active,
          features: pkg.features,
        };

        const { error } = await (supabase as any)
          .from('insurance_packages')
          .update(upsertData)
          .eq('id', pkg.id);

        if (error) throw error;
      }

      toast({
        title: 'Insurance settings saved',
        description: 'Packages updated per SLA v1.1 terms.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Error saving',
        description: 'Failed to save insurance settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToSLA = () => {
    setPackages(SLA_DEFAULTS);
    toast({ title: 'Reset to SLA v1.1 defaults' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Damage Protection System
          </CardTitle>
          <CardDescription>
            Pay-U underwritten damage protection — SLA v1.1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Damage Protection</Label>
              <p className="text-sm text-muted-foreground">
                Offer protection tiers to renters during booking
              </p>
            </div>
            <Switch checked={insuranceEnabled} onCheckedChange={setInsuranceEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* SLA Terms Card (Read-Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            SLA v1.1 Terms
          </CardTitle>
          <CardDescription>
            Contractual terms with Pay-U — read-only reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Revenue Split</p>
              <p className="text-sm font-semibold">90% Pay-U / 10% MobiRides</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Admin Fee per Claim</p>
              <p className="text-sm font-semibold">P150 BWP</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">International Cap</p>
              <p className="text-sm font-semibold">$8,000 USD</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Auto-Approval Threshold</p>
              <p className="text-sm font-semibold">≤ P500 BWP</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Claim Reporting</p>
              <p className="font-medium">Within 24 hours</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Initial Review</p>
              <p className="font-medium">Within 48 hours</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Payout Processing</p>
              <p className="font-medium">Within 24 hours post-approval</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protection Tiers */}
      <Card>
        <CardHeader>
          <CardTitle>Protection Tiers</CardTitle>
          <CardDescription>
            Configure daily rates, coverage caps, and excess percentages per SLA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packages.map((pkg) => {
              const isNoCoverage = pkg.id === 'no-coverage';
              return (
                <div
                  key={pkg.id}
                  className={`p-4 border rounded-lg space-y-4 ${isNoCoverage ? 'opacity-75 bg-muted/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={pkg.active}
                        onCheckedChange={(checked) => updatePackage(pkg.id, { active: checked })}
                        disabled={isNoCoverage}
                      />
                      <span className="font-medium">{pkg.name}</span>
                      {isNoCoverage && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Full renter liability
                        </Badge>
                      )}
                    </div>
                  </div>

                  {!isNoCoverage && (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Daily Rate (BWP)</Label>
                          <Input
                            type="number"
                            value={pkg.dailyRate}
                            onChange={(e) =>
                              updatePackage(pkg.id, { dailyRate: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Coverage Cap (BWP)</Label>
                          <Input
                            type="number"
                            value={pkg.coverageCap}
                            onChange={(e) =>
                              updatePackage(pkg.id, { coverageCap: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Excess (% of claim)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={pkg.excessPercentage}
                            onChange={(e) =>
                              updatePackage(pkg.id, { excessPercentage: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Intl. Cap (USD)</Label>
                          <Input
                            type="number"
                            value={pkg.internationalCapUsd}
                            onChange={(e) =>
                              updatePackage(pkg.id, { internationalCapUsd: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Target Segment</Label>
                        <Input
                          value={pkg.targetSegment}
                          onChange={(e) => updatePackage(pkg.id, { targetSegment: e.target.value })}
                          placeholder="e.g. Short-term city rentals"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Features (comma-separated)</Label>
                        <Input
                          value={pkg.features.join(', ')}
                          onChange={(e) =>
                            updatePackage(pkg.id, {
                              features: e.target.value.split(',').map((f) => f.trim()).filter(Boolean),
                            })
                          }
                          placeholder="Feature 1, Feature 2, ..."
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Coverage Inclusions / Exclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Coverage Inclusions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {COVERAGE_INCLUSIONS.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Coverage Exclusions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {COVERAGE_EXCLUSIONS.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tier</th>
                  <th className="text-right py-2">Daily Rate</th>
                  <th className="text-right py-2">Coverage Cap</th>
                  <th className="text-right py-2">Excess</th>
                  <th className="text-right py-2">Intl. Cap</th>
                  <th className="text-left py-2 pl-4">Target</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b">
                    <td className="py-2 font-medium">{pkg.name}</td>
                    <td className="text-right py-2">
                      {pkg.dailyRate > 0 ? `P${pkg.dailyRate}/day` : '—'}
                    </td>
                    <td className="text-right py-2">
                      {pkg.coverageCap > 0 ? `P${pkg.coverageCap.toLocaleString()}` : '—'}
                    </td>
                    <td className="text-right py-2">{pkg.excessPercentage}%</td>
                    <td className="text-right py-2">
                      {pkg.internationalCapUsd > 0 ? `$${pkg.internationalCapUsd.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2 pl-4 text-xs text-muted-foreground">{pkg.targetSegment || '—'}</td>
                    <td className="text-center py-2">
                      {pkg.active ? (
                        <Check className="h-4 w-4 text-primary inline" />
                      ) : (
                        <span className="text-muted-foreground text-xs">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={handleResetToSLA}>
          Reset to SLA v1.1 Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving || !insuranceEnabled}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Packages'
          )}
        </Button>
      </div>
    </div>
  );
};
