import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Shield,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  DollarSign,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PolicyDetailsCardProps {
  /** Insurance package name */
  name: string;
  /** Package display name */
  displayName?: string;
  /** Detailed description */
  description?: string;
  /** Daily premium rate (P/day) */
  dailyPremiumRate: number;
  /** Total number of rental days */
  numberOfDays?: number;
  /** Total premium amount */
  totalPremium?: number;
  /** Coverage cap amount (P) */
  coverageCap?: number | null;
  /** Excess amount (P) or percentage */
  excessAmount?: number | null;
  /** Excess percentage (e.g., 0.20 = 20%) */
  excessPercentage?: number | null;
  /** Features/benefits included */
  features?: string[];
  /** Exclusions/not covered */
  exclusions?: string[];
  /** Whether minor damage is covered */
  coversMinorDamage?: boolean;
  /** Whether major incidents are covered */
  coversMajorIncidents?: boolean;
  /** Whether this is the selected package */
  isSelected?: boolean;
  /** Click handler for selecting this package */
  onSelect?: () => void;
  /** Click handler for viewing full policy terms */
  onViewTerms?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Policy Details Card Component
 * Displays comprehensive insurance policy information with expandable sections
 */
export const PolicyDetailsCard = ({
  name,
  displayName,
  description,
  dailyPremiumRate,
  numberOfDays = 1,
  totalPremium,
  coverageCap,
  excessAmount,
  excessPercentage,
  features = [],
  exclusions = [],
  coversMinorDamage = false,
  coversMajorIncidents = false,
  isSelected = false,
  onSelect,
  onViewTerms,
  className
}: PolicyDetailsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllExclusions, setShowAllExclusions] = useState(false);

  // Calculate total if not provided
  const calculatedTotal = totalPremium ?? (dailyPremiumRate * numberOfDays);

  // Determine tier level for badge color
  const getTierLevel = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('premium')) return 'premium';
    if (lowerName.includes('standard')) return 'standard';
    if (lowerName.includes('basic')) return 'basic';
    return 'standard';
  };

  const tierLevel = getTierLevel();

  const formatCurrency = (amount: number) => {
    return `P ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatExcess = () => {
    if (excessPercentage !== null && excessPercentage !== undefined) {
      return `${(excessPercentage * 100).toFixed(0)}% of approved claim`;
    }
    if (excessAmount !== null && excessAmount !== undefined) {
      return formatCurrency(excessAmount);
    }
    return 'N/A';
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200',
        isSelected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-primary text-xs shadow-md">
            ✓ Selected
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Header with Tier Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className={cn(
                'h-5 w-5',
                tierLevel === 'premium' && 'text-yellow-500',
                tierLevel === 'standard' && 'text-blue-500',
                tierLevel === 'basic' && 'text-gray-500'
              )} />
              <CardTitle className="text-lg">{displayName || name}</CardTitle>
            </div>

            {/* Tier Badge */}
            <Badge
              variant={tierLevel === 'premium' ? 'default' : tierLevel === 'standard' ? 'secondary' : 'outline'}
              className={cn(
                'text-xs',
                tierLevel === 'premium' && 'bg-gradient-to-r from-yellow-500 to-orange-500'
              )}
            >
              {tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1)} Coverage
            </Badge>
          </div>
        </div>

        {/* Description */}
        {description && (
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Section */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily Premium</span>
            <span className="font-semibold">{formatCurrency(dailyPremiumRate)}</span>
          </div>

          {numberOfDays > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{numberOfDays} days</span>
            </div>
          )}

          <div className="border-t pt-2 flex items-center justify-between">
            <span className="font-medium">Total Premium</span>
            <span className="text-xl font-bold text-primary">
              {formatCurrency(calculatedTotal)}
            </span>
          </div>
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Coverage Cap */}
          <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Coverage Cap</p>
              <p className="font-semibold text-sm">
                {coverageCap ? formatCurrency(coverageCap) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Excess */}
          <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Excess</p>
              <p className="font-semibold text-sm">{formatExcess()}</p>
            </div>
          </div>

          {/* Minor Damage */}
          <div className={cn(
            'flex items-start gap-2 p-2 rounded-lg',
            coversMinorDamage ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
          )}>
            {coversMinorDamage ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Minor Damage</p>
              <p className={cn(
                'font-semibold text-sm',
                coversMinorDamage ? 'text-green-600' : 'text-red-500'
              )}>
                {coversMinorDamage ? 'Covered' : 'Not Covered'}
              </p>
            </div>
          </div>

          {/* Major Incidents */}
          <div className={cn(
            'flex items-start gap-2 p-2 rounded-lg',
            coversMajorIncidents ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
          )}>
            {coversMajorIncidents ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Major Incidents</p>
              <p className={cn(
                'font-semibold text-sm',
                coversMajorIncidents ? 'text-green-600' : 'text-red-500'
              )}>
                {coversMajorIncidents ? 'Covered' : 'Not Covered'}
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        {features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              What's Included
            </h4>
            <ul className="space-y-1.5">
              {features.slice(0, isExpanded ? undefined : 4).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
              {features.length > 4 && (
                <li className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>Show Less</>
                    ) : (
                      <>+{features.length - 4} more benefits</>
                    )}
                  </Button>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Exclusions List */}
        {exclusions.length > 0 && (
          <Collapsible open={showAllExclusions} onOpenChange={setShowAllExclusions}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-7 text-muted-foreground hover:text-destructive"
              >
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {exclusions.length} Exclusions
                </span>
                {showAllExclusions ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ul className="space-y-1.5 bg-red-50/50 dark:bg-red-950/10 rounded-lg p-3">
                {exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-1" />
                    <span>{exclusion}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onSelect && (
            <Button
              className="flex-1"
              variant={isSelected ? "secondary" : "default"}
              onClick={onSelect}
            >
              {isSelected ? 'Selected' : 'Select Package'}
            </Button>
          )}
          {onViewTerms && (
            <Button variant="outline" size="icon" onClick={onViewTerms}>
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Terms Link */}
        <p className="text-xs text-center text-muted-foreground">
          By selecting, you agree to the{' '}
          <button
            onClick={onViewTerms}
            className="text-primary hover:underline"
          >
            Insurance Terms & Conditions
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default PolicyDetailsCard;
