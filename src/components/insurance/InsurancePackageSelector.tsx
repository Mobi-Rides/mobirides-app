import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Shield, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { InsuranceService, PremiumCalculation } from '@/services/insuranceService';
import { cn } from '@/lib/utils';

interface InsurancePackageSelectorProps {
  dailyRentalAmount: number;
  startDate: Date;
  endDate: Date;
  selectedPackageId?: string;
  onPackageSelect: (packageId: string, totalPremium: number) => void;
  className?: string;
}

export const InsurancePackageSelector: React.FC<InsurancePackageSelectorProps> = ({
  dailyRentalAmount,
  startDate,
  endDate,
  selectedPackageId,
  onPackageSelect,
  className,
}) => {
  const [calculations, setCalculations] = useState<PremiumCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsuranceOptions();
  }, [dailyRentalAmount, startDate, endDate]);

  const loadInsuranceOptions = async () => {
    try {
      setLoading(true);
      const premiums = await InsuranceService.calculateAllPremiums(
        dailyRentalAmount,
        startDate,
        endDate
      );
      setCalculations(premiums);
      setError(null);
    } catch (err) {
      setError('Failed to load insurance options. Please try again.');
      console.error('Insurance loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `P ${amount.toFixed(2)}`;
  };

  const getPackageIcon = (packageName: string) => {
    if (packageName === 'no_coverage') {
      return <AlertTriangle className="h-6 w-6 text-destructive" />;
    }
    return <Shield className="h-6 w-6 text-primary" />;
  };

  const getPackageBadgeColor = (packageName: string): "destructive" | "secondary" | "default" | "outline" => {
    switch(packageName) {
      case 'no_coverage': return 'destructive';
      case 'basic': return 'secondary';
      case 'standard': return 'default';
      case 'premium': return 'default';
      default: return 'secondary';
    }
  };

  const getPackageGradient = (packageName: string) => {
    switch(packageName) {
      case 'no_coverage': return 'from-orange-50 to-red-50';
      case 'basic': return 'from-blue-50 to-cyan-50';
      case 'standard': return 'from-purple-50 to-pink-50';
      case 'premium': return 'from-amber-50 to-yellow-50';
      default: return 'from-gray-50 to-gray-100';
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Choose your protection level.</strong> All prices are based on{' '}
          {formatCurrency(dailyRentalAmount)}/day for {calculations[0]?.numberOfDays || 0} days.
          Claims require a P 150 admin fee.
        </AlertDescription>
      </Alert>

      {/* Insurance Packages */}
      <div className="grid gap-4 md:grid-cols-2">
        {calculations.map((calc) => (
          <Card
            key={calc.packageId}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              'bg-gradient-to-br',
              getPackageGradient(calc.packageName),
              selectedPackageId === calc.packageId && 'ring-2 ring-primary shadow-xl'
            )}
            onClick={() => onPackageSelect(calc.packageId, calc.totalPremium)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getPackageIcon(calc.packageName)}
                  <div>
                    <CardTitle className="text-xl">
                      {calc.displayName}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {calc.premiumPercentage === 0 
                        ? 'No insurance coverage'
                        : `${(calc.premiumPercentage * 100).toFixed(0)}% of rental amount`
                      }
                    </CardDescription>
                  </div>
                </div>
                
                {selectedPackageId === calc.packageId && (
                  <Badge variant={getPackageBadgeColor(calc.packageName)} className="gap-1">
                    <Check className="h-3 w-3" /> Selected
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2">
                {calc.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing Display */}
              <div className="bg-background/80 backdrop-blur p-4 rounded-lg">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <div className="text-3xl font-bold text-foreground">
                      {formatCurrency(calc.totalPremium)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(calc.premiumPerDay)}/day × {calc.numberOfDays} days
                    </div>
                  </div>
                  
                  {calc.coverageCap && (
                    <div className="text-right">
                      <div className="text-sm font-semibold">Coverage</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(calc.coverageCap)}
                      </div>
                    </div>
                  )}
                </div>

                {calc.excessAmount !== null && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <span className="text-muted-foreground">Excess per claim:</span>
                    <span className="font-medium">{formatCurrency(calc.excessAmount)}</span>
                  </div>
                )}
              </div>

              {/* Coverage Summary */}
              <div className="space-y-2">
                {calc.coversMinorDamage && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Minor damage (windscreen, windows, tyres)</span>
                  </div>
                )}
                {calc.coversMajorIncidents && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Major incidents (collision, theft, vandalism, fire)</span>
                  </div>
                )}
                {!calc.coversMinorDamage && !calc.coversMajorIncidents && (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive font-medium">No coverage - Full liability</span>
                  </div>
                )}
              </div>

              {/* Expandable Details */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details" className="border-none">
                  <AccordionTrigger className="text-sm hover:no-underline py-2">
                    View full coverage details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    {/* Features */}
                    {calc.features.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-2 text-green-700">
                          What's Covered
                        </h4>
                        <ul className="space-y-1">
                          {calc.features.map((feature, idx) => (
                            <li key={idx} className="text-xs flex gap-2">
                              <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Exclusions */}
                    {calc.exclusions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-2 text-destructive">
                          What's NOT Covered
                        </h4>
                        <ul className="space-y-1">
                          {calc.exclusions.slice(0, 5).map((exclusion, idx) => (
                            <li key={idx} className="text-xs flex gap-2">
                              <XCircle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{exclusion}</span>
                            </li>
                          ))}
                          {calc.exclusions.length > 5 && (
                            <li className="text-xs text-muted-foreground italic">
                              ...and {calc.exclusions.length - 5} more exclusions
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>

            <CardFooter>
              <Button
                variant={selectedPackageId === calc.packageId ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onPackageSelect(calc.packageId, calc.totalPremium);
                }}
              >
                {selectedPackageId === calc.packageId ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Selected
                  </>
                ) : (
                  'Select This Coverage'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs space-y-1">
          <p>
            <strong>Important:</strong> Insurance coverage begins at vehicle pickup and ends at drop-off.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Late returns covered for up to 2 hours with pre-approval (Premium only)</li>
            <li>All claims require P 150 administrative fee</li>
            <li>Police report required for theft, vandalism, fire, and third-party accidents</li>
            <li>Pre-existing damage must be documented during pickup inspection</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default InsurancePackageSelector;
