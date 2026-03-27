import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Check, Plus, Trash2 } from 'lucide-react';

interface InsurancePackage {
  id: string;
  name: string;
  dailyRate: string;
  coveragePercent: string;
  maxCoverage: string;
  excess: string;
  active: boolean;
  features: string[];
}

export const InsuranceSettingsSection = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState(true);

  const [packages, setPackages] = useState<InsurancePackage[]>([
    {
      id: '1',
      name: 'Basic',
      dailyRate: '49',
      coveragePercent: '50',
      maxCoverage: '25000',
      excess: '5000',
      active: true,
      features: ['Third Party Liability', 'Basic Theft Cover'],
    },
    {
      id: '2',
      name: 'Standard',
      dailyRate: '99',
      coveragePercent: '75',
      maxCoverage: '50000',
      excess: '2500',
      active: true,
      features: ['Third Party Liability', 'Standard Theft Cover', 'Accident Damage', 'Roadside Assistance'],
    },
    {
      id: '3',
      name: 'Premium',
      dailyRate: '149',
      coveragePercent: '90',
      maxCoverage: '100000',
      excess: '1500',
      active: true,
      features: ['Third Party Liability', 'Full Theft Cover', 'Accident Damage', 'Roadside Assistance', 'Personal Effects Cover', 'Rental Gap Cover'],
    },
  ]);

  const addPackage = () => {
    const newPackage: InsurancePackage = {
      id: Date.now().toString(),
      name: 'New Package',
      dailyRate: '0',
      coveragePercent: '0',
      maxCoverage: '0',
      excess: '0',
      active: true,
      features: [],
    };
    setPackages([...packages, newPackage]);
    toast({ title: 'New insurance package added' });
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter(p => p.id !== id));
    toast({ title: 'Insurance package removed' });
  };

  const updatePackage = (id: string, updates: Partial<InsurancePackage>) => {
    setPackages(packages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Insurance settings saved',
        description: 'Insurance packages have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
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
            <Shield className="h-5 w-5" />
            Insurance System
          </CardTitle>
          <CardDescription>
            Configure insurance packages and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-0.5">
              <Label>Enable Insurance System</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to purchase insurance for bookings
              </p>
            </div>
            <Switch
              checked={insuranceEnabled}
              onCheckedChange={setInsuranceEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Packages</CardTitle>
          <CardDescription>
            Configure available insurance tiers and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={pkg.active}
                      onCheckedChange={(checked) => updatePackage(pkg.id, { active: checked })}
                    />
                    <Input
                      value={pkg.name}
                      onChange={(e) => updatePackage(pkg.id, { name: e.target.value })}
                      className="w-32"
                      placeholder="Package name"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePackage(pkg.id)}
                    disabled={packages.length <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Daily Rate (BWP)</Label>
                    <Input
                      type="number"
                      value={pkg.dailyRate}
                      onChange={(e) => updatePackage(pkg.id, { dailyRate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Coverage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={pkg.coveragePercent}
                      onChange={(e) => updatePackage(pkg.id, { coveragePercent: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Max Coverage (BWP)</Label>
                    <Input
                      type="number"
                      value={pkg.maxCoverage}
                      onChange={(e) => updatePackage(pkg.id, { maxCoverage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Excess (BWP)</Label>
                    <Input
                      type="number"
                      value={pkg.excess}
                      onChange={(e) => updatePackage(pkg.id, { excess: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Features (comma-separated)</Label>
                  <Input
                    value={pkg.features.join(', ')}
                    onChange={(e) => updatePackage(pkg.id, {
                      features: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                    })}
                    placeholder="Feature 1, Feature 2, ..."
                  />
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addPackage}>
              <Plus className="h-4 w-4 mr-2" />
              Add Insurance Package
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Summary</CardTitle>
          <CardDescription>
            Overview of configured insurance packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Package</th>
                  <th className="text-right py-2">Daily Rate</th>
                  <th className="text-right py-2">Coverage</th>
                  <th className="text-right py-2">Max</th>
                  <th className="text-right py-2">Excess</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b">
                    <td className="py-2 font-medium">{pkg.name}</td>
                    <td className="text-right py-2">BWP {pkg.dailyRate}</td>
                    <td className="text-right py-2">{pkg.coveragePercent}%</td>
                    <td className="text-right py-2">BWP {parseInt(pkg.maxCoverage).toLocaleString()}</td>
                    <td className="text-right py-2">BWP {parseInt(pkg.excess).toLocaleString()}</td>
                    <td className="text-center py-2">
                      {pkg.active ? (
                        <Check className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <span className="text-gray-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => {
          setPackages([
            {
              id: '1',
              name: 'Basic',
              dailyRate: '49',
              coveragePercent: '50',
              maxCoverage: '25000',
              excess: '5000',
              active: true,
              features: ['Third Party Liability', 'Basic Theft Cover'],
            },
            {
              id: '2',
              name: 'Standard',
              dailyRate: '99',
              coveragePercent: '75',
              maxCoverage: '50000',
              excess: '2500',
              active: true,
              features: ['Third Party Liability', 'Standard Theft Cover', 'Accident Damage', 'Roadside Assistance'],
            },
            {
              id: '3',
              name: 'Premium',
              dailyRate: '149',
              coveragePercent: '90',
              maxCoverage: '100000',
              excess: '1500',
              active: true,
              features: ['Third Party Liability', 'Full Theft Cover', 'Accident Damage', 'Roadside Assistance', 'Personal Effects Cover', 'Rental Gap Cover'],
            },
          ]);
          toast({ title: 'Reset to default packages' });
        }}>
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={saving || !insuranceEnabled}>
          {saving ? 'Saving...' : 'Save Packages'}
        </Button>
      </div>
    </div>
  );
};
