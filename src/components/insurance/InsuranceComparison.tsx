import { useState, useEffect } from 'react';
import { Check, X, Shield, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InsuranceService, PremiumCalculation } from '@/services/insuranceService';
import { cn } from '@/lib/utils';

interface InsuranceComparisonProps {
  /** Daily rental amount for the car */
  dailyRentalAmount: number;
  /** Rental start date */
  startDate: Date;
  /** Rental end date */
  endDate: Date;
  /** Currently selected package ID (if any) */
  selectedPackageId?: string | null;
  /** User ID for risk assessment */
  renterId?: string;
  /** Car ID for risk assessment */
  carId?: string;
  /** Callback when a package is selected */
  onSelectPackage: (packageId: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Insurance Comparison Component
 * Shows all insurance tiers side-by-side with benefits and pricing
 * Users can compare and select their preferred coverage
 */
export const InsuranceComparison = ({
  dailyRentalAmount,
  startDate,
  endDate,
  selectedPackageId,
  renterId,
  carId,
  onSelectPackage,
  isLoading = false,
  className
}: InsuranceComparisonProps) => {
  const [calculations, setCalculations] = useState<PremiumCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all package calculations
  useEffect(() => {
    const fetchCalculations = async () => {
      setLoading(true);
      setError(null);

      try {
        const premiums = await InsuranceService.calculateAllPremiums(
          dailyRentalAmount,
          startDate,
          endDate,
          renterId,
          carId
        );
        setCalculations(premiums);
      } catch (err) {
        console.error('Error calculating insurance premiums:', err);
        setError(err instanceof Error ? err.message : 'Failed to load insurance options');
      } finally {
        setLoading(false);
      }
    };

    if (dailyRentalAmount > 0) {
      fetchCalculations();
    }
  }, [dailyRentalAmount, startDate, endDate, renterId, carId]);

  if (loading || isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-lg font-semibold">Choose Your Coverage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded w-20 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('text-center py-8', className)}>
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <p className="text-destructive font-medium">Unable to load insurance options</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No insurance options available</p>
      </div>
    );
  }

  // Common benefits to compare across tiers
  const commonBenefits = [
    { key: 'coverage_cap', label: 'Coverage Cap', format: (v: number | null) => v ? `P ${v.toLocaleString()}` : 'N/A' },
    {
      key: 'excess', label: 'Excess', format: (v: number | null, pkg: PremiumCalculation) => {
        if (pkg.excessPercentage !== null) {
          return `${pkg.excessPercentage * 100}% of claim`;
        }
        return v ? `P ${v.toLocaleString()}` : 'N/A';
      }
    },
    { key: 'coversMinorDamage', label: 'Minor Damage', format: (v: boolean) => v ? 'Covered' : 'Not Covered', icon: true },
    { key: 'coversMajorIncidents', label: 'Major Incidents', format: (v: boolean) => v ? 'Covered' : 'Not Covered', icon: true },
  ];

  const getTierBadge = (packageName: string) => {
    const name = packageName.toLowerCase();
    if (name.includes('basic')) {
      return <Badge variant="secondary">Basic</Badge>;
    } else if (name.includes('standard')) {
      return <Badge variant="default">Standard</Badge>;
    } else if (name.includes('premium')) {
      return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">Premium</Badge>;
    }
    return <Badge variant="outline">{packageName}</Badge>;
  };

  const getRecommendedPackage = () => {
    // Simple recommendation: Premium if available, otherwise highest tier
    const premium = calculations.find(pkg =>
      pkg.packageName.toLowerCase().includes('premium')
    );
    return premium?.packageId || calculations[calculations.length - 1]?.packageId;
  };

  const recommendedPackageId = getRecommendedPackage();

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Your Coverage</h3>
        <Badge variant="outline" className="text-xs">
          {calculations[0]?.numberOfDays} {calculations[0]?.numberOfDays === 1 ? 'day' : 'days'}
        </Badge>
      </div>

      {/* Pricing Summary Bar */}
      <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Daily rental:</span>
        <span className="font-semibold">P {dailyRentalAmount.toLocaleString()}</span>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {calculations.map((pkg, index) => {
          const isSelected = pkg.packageId === selectedPackageId;
          const isRecommended = pkg.packageId === recommendedPackageId && !selectedPackageId;

          return (
            <Card
              key={pkg.packageId}
              className={cn(
                'relative transition-all duration-200',
                isSelected && 'ring-2 ring-primary',
                isRecommended && !isSelected && 'border-primary/50'
              )}
            >
              {/* Recommended Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                    Recommended
                  </Badge>
                </div>
              )}

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-xs">
                    Selected
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-base">{pkg.displayName || pkg.packageName}</CardTitle>
                  {getTierBadge(pkg.packageName)}
                </div>

                {/* Package Description */}
                {pkg.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

                {/* Price Display */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">P {pkg.totalPremium.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">total</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    P {pkg.premiumPerDay.toLocaleString()} / day × {pkg.numberOfDays} days
                  </div>
                  {pkg.isFlatDailyRate && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ Flat rate applied
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Benefits List */}
                <div className="space-y-2">
                  {commonBenefits.map((benefit) => {
                    let value: string | boolean = '';

                    if (benefit.key === 'excess') {
                      value = pkg.excessPercentage !== null
                        ? `${pkg.excessPercentage * 100}% of claim`
                        : pkg.excessAmount ? `P ${pkg.excessAmount.toLocaleString()}` : 'N/A';
                    } else if (benefit.key === 'coverage_cap') {
                      value = pkg.coverageCap ? `P ${pkg.coverageCap.toLocaleString()}` : 'N/A';
                    } else if (benefit.key === 'coversMinorDamage') {
                      value = pkg.coversMinorDamage;
                    } else if (benefit.key === 'coversMajorIncidents') {
                      value = pkg.coversMajorIncidents;
                    }

                    const isPositive = typeof value === 'boolean' ? value : !value?.toString().includes('Not');

                    return (
                      <div key={benefit.key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{benefit.label}</span>
                        {benefit.icon ? (
                          <div className={cn(
                            'flex items-center gap-1',
                            isPositive ? 'text-green-600' : 'text-red-500'
                          )}>
                            {isPositive ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                            <span className="text-xs">{value === true ? 'Covered' : value === false ? 'Not Covered' : value}</span>
                          </div>
                        ) : (
                          <span className={cn(
                            'font-medium',
                            isPositive ? 'text-green-600' : 'text-foreground'
                          )}>
                            {value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Custom Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Additional Benefits:</p>
                    <ul className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Select Button */}
                <Button
                  className={cn(
                    'w-full mt-4',
                    isSelected && 'bg-primary hover:bg-primary/90',
                    !isSelected && isRecommended && 'bg-primary hover:bg-primary/90'
                  )}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onSelectPackage(pkg.packageId)}
                >
                  {isSelected ? 'Selected' : isRecommended ? 'Select Recommended' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3">
        <Shield className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          All insurance packages are underwritten by PayU Botswana.
          Coverage begins when you pick up the vehicle and ends when you return it.
          Claims are subject to terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default InsuranceComparison;
