import { useState, useEffect } from 'react';
import { Check, X, Shield, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { InsuranceService, PremiumCalculation } from '@/services/insuranceService';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InsuranceComparisonProps {
  /** Daily rental amount for the car */
  dailyRentalAmount: number;
  /** Rental start date */
  startDate: Date;
  /** Rental end date */
  endDate: Date;
  /** Currently selected package ID */
  selectedPackageId?: string | null;
  /** Callback when a package is selected */
  onSelectPackage: (packageId: string) => void;
  /** Car ID for risk assessment */
  carId?: string;
  /** Renter ID for risk assessment */
  renterId?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * InsuranceComparison Component
 * Displays a side-by-side comparison of insurance tiers with dynamic pricing
 */
export const InsuranceComparison = ({
  dailyRentalAmount,
  startDate,
  endDate,
  selectedPackageId,
  onSelectPackage,
  carId,
  renterId,
  className,
}: InsuranceComparisonProps) => {
  const [calculations, setCalculations] = useState<PremiumCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPremiums = async () => {
      try {
        setIsLoading(true);
        const results = await InsuranceService.calculateAllPremiums(
          dailyRentalAmount,
          startDate,
          endDate,
          renterId,
          carId
        );
        setCalculations(results);
      } catch (error) {
        console.error('Error calculating premiums:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPremiums();
  }, [dailyRentalAmount, startDate, endDate, renterId, carId]);

  const commonBenefits = [
    { key: 'excess', label: 'Excess', tooltip: 'The amount you pay out of pocket before insurance covers the rest.' },
    { key: 'coverage_cap', label: 'Coverage Cap', tooltip: 'The maximum amount the insurance will pay for a claim.' },
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
      return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none">Premium</Badge>;
    } else if (name.includes('no_coverage') || name.includes('none')) {
      return <Badge variant="outline" className="text-muted-foreground">No Coverage</Badge>;
    }
    return <Badge variant="outline">{packageName}</Badge>;
  };

  const getRecommendedPackage = () => {
    // Filter out no_coverage from recommendations
    const paidPackages = calculations.filter(pkg => 
      !pkg.packageName.toLowerCase().includes('no_coverage') && 
      !pkg.packageName.toLowerCase().includes('none')
    );
    
    // Simple recommendation: Premium if available, otherwise highest tier
    const premium = paidPackages.find(pkg =>
      pkg.packageName.toLowerCase().includes('premium')
    );
    return premium?.packageId || (paidPackages.length > 0 ? paidPackages[paidPackages.length - 1]?.packageId : null);
  };

  const recommendedPackageId = getRecommendedPackage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground animate-pulse">Calculating insurance premiums...</p>
      </div>
    );
  }

  if (calculations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-4" />
          <h3 className="font-semibold">Insurance Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            We couldn't load insurance packages for this booking. Please try again or contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find 'no coverage' package for comparison baseline
  const noCoveragePkg = calculations.find(pkg => 
    pkg.packageName.toLowerCase().includes('no_coverage') || 
    pkg.packageName.toLowerCase().includes('none')
  );

  // Filter out 'no coverage' from the main grid to keep it clean
  const displayPackages = calculations.filter(pkg => 
    !pkg.packageName.toLowerCase().includes('no_coverage') && 
    !pkg.packageName.toLowerCase().includes('none')
  );

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose Your Coverage</h3>
        <Badge variant="outline" className="text-xs">
          {calculations[0]?.numberOfDays} {calculations[0]?.numberOfDays === 1 ? 'day' : 'days'}
        </Badge>
      </div>

      {/* Comparison Summary Bar */}
      {noCoveragePkg && (
        <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Daily Rental Rate</span>
            <span className="font-semibold text-lg">P {dailyRentalAmount.toLocaleString()}</span>
          </div>
          <div className="space-y-1 sm:text-right border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4">
            <span className="text-muted-foreground block text-xs uppercase tracking-wider font-medium">Total without Insurance</span>
            <span className="font-semibold text-lg">P {(dailyRentalAmount * noCoveragePkg.numberOfDays).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className={cn(
        "grid gap-4",
        displayPackages.length === 1 ? "grid-cols-1" : 
        displayPackages.length === 2 ? "grid-cols-1 md:grid-cols-2" : 
        "grid-cols-1 lg:grid-cols-3"
      )}>
        {displayPackages.map((pkg) => {
          const isSelected = pkg.packageId === selectedPackageId;
          const isRecommended = pkg.packageId === recommendedPackageId && !selectedPackageId;

          return (
            <Card
              key={pkg.packageId}
              className={cn(
                'relative transition-all duration-200',
                isSelected && 'ring-2 ring-primary border-primary',
                isRecommended && !isSelected && 'border-primary/50'
              )}
            >
              {/* Recommended Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] border-none">
                    Recommended
                  </Badge>
                </div>
              )}

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-white text-[10px] border-none">
                    Selected
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <CardTitle className="text-base">{pkg.displayName || pkg.packageName}</CardTitle>
                  {getTierBadge(pkg.packageName)}
                </div>

                {pkg.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {pkg.description}
                  </p>
                )}

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
                <div className="space-y-2">
                  {commonBenefits.map((benefit) => {
                    let value: string | boolean = '';

                    if (benefit.key === 'excess') {
                      value = pkg.excessPercentage !== null
                        ? `${(pkg.excessPercentage * 100).toFixed(0)}% of claim`
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
                        <span className="text-muted-foreground flex items-center">
                          {benefit.label}
                          {benefit.tooltip && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="ml-1 h-3 w-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{benefit.tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
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

                {/* Additional Features */}
                {pkg.features && pkg.features.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Benefits:</p>
                    <ul className="space-y-1">
                      {pkg.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <Check className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-start">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          All insurance packages are underwritten by PayU Botswana. Coverage begins at vehicle pickup and ends at return.
          Subject to terms and conditions.
        </p>
      </div>
    </div>
  );
};

export default InsuranceComparison;
