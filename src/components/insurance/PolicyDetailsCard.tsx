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
  Info,
  Download,
  PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PolicyDetailsCardProps {
  /** Full policy object for existing policies */
  policy?: {
    id: string;
    policy_number: string;
    status: string;
    start_date: string;
    end_date: string;
    package_name: string;
    premium_paid: number;
    coverage_cap: number;
    excess: number;
    claim_eligibility: boolean;
    document_url?: string;
    vehicle_info?: string;
  };
  /** Fallback properties for package selection view */
  name?: string;
  displayName?: string;
  description?: string;
  dailyPremiumRate?: number;
  numberOfDays?: number;
  totalPremium?: number;
  coverageCap?: number | null;
  excessAmount?: number | null;
  excessPercentage?: number | null;
  features?: string[];
  exclusions?: string[];
  coversMinorDamage?: boolean;
  coversMajorIncidents?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewTerms?: () => void;
  onDownloadPDF?: () => void;
  onFileClaim?: () => void;
  className?: string;
}

/**
 * Policy Details Card Component
 * Displays comprehensive insurance policy information with expandable sections
 */
export const PolicyDetailsCard = ({
  policy,
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
  onDownloadPDF,
  onFileClaim,
  className
}: PolicyDetailsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllExclusions, setShowAllExclusions] = useState(false);

  // Derived properties from policy or fallbacks
  const pName = policy?.package_name || name || 'Standard';
  const pDisplayName = displayName || pName;
  const pTotalPremium = policy?.premium_paid || totalPremium || (dailyPremiumRate ? dailyPremiumRate * numberOfDays : 0);
  const pCoverageCap = policy?.coverage_cap || coverageCap;
  const pExcess = policy?.excess !== undefined ? policy.excess : excessAmount;
  const pStatus = policy?.status || (isSelected ? 'selected' : 'available');

  // Determine tier level for badge color
  const getTierLevel = () => {
    const lowerName = pName.toLowerCase();
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
    if (pExcess !== null && pExcess !== undefined) {
      return formatCurrency(pExcess);
    }
    return 'N/A';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'outline' | 'secondary' | 'destructive'; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      expired: { variant: 'secondary', label: 'Expired' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
      claimed: { variant: 'outline', label: 'Claimed' },
      selected: { variant: 'default', label: 'Selected' },
      available: { variant: 'outline', label: 'Available' },
    };

    const config = variants[status.toLowerCase()] || { variant: 'outline', label: status };
    return (
      <Badge variant={config.variant as any} className="capitalize">
        {config.label}
      </Badge>
    );
  };

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 overflow-hidden',
        isSelected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      {/* Background Tier Gradient for Active Policies */}
      {policy && (
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10 rounded-full",
          tierLevel === 'premium' ? "bg-yellow-500" : tierLevel === 'standard' ? "bg-blue-500" : "bg-gray-500"
        )} />
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Shield className={cn(
                'h-5 w-5',
                tierLevel === 'premium' && 'text-yellow-500',
                tierLevel === 'standard' && 'text-blue-500',
                tierLevel === 'basic' && 'text-gray-500'
              )} />
              <CardTitle className="text-lg">
                {policy ? `Policy #${policy.policy_number}` : pDisplayName}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              {getStatusBadge(pStatus)}
              {policy && (
                <Badge variant="outline" className={cn(
                  tierLevel === 'premium' && 'border-yellow-500 text-yellow-700 bg-yellow-50',
                  tierLevel === 'standard' && 'border-blue-500 text-blue-700 bg-blue-50'
                )}>
                  {pName}
                </Badge>
              )}
            </div>
          </div>
          
          {policy?.document_url && (
            <Button variant="ghost" size="icon" onClick={onDownloadPDF} title="Download Certificate">
              <Download className="h-5 w-5" />
            </Button>
          )}
        </div>

        {description && !policy && (
          <CardDescription className="mt-2 line-clamp-2">
            {description}
          </CardDescription>
        )}

        {policy && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(policy.start_date), 'MMM dd, yyyy')} - {format(new Date(policy.end_date), 'MMM dd, yyyy')}</span>
            </div>
            {policy.vehicle_info && (
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>{policy.vehicle_info}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price Section */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {policy ? 'Premium Paid' : 'Daily Premium'}
            </span>
            <span className="font-semibold">
              {policy ? formatCurrency(policy.premium_paid) : dailyPremiumRate ? formatCurrency(dailyPremiumRate) : 'N/A'}
            </span>
          </div>

          {!policy && numberOfDays > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span>{numberOfDays} days</span>
            </div>
          )}

          {!policy && (
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="font-medium">Total Premium</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(pTotalPremium)}
              </span>
            </div>
          )}
        </div>

        {/* Key Benefits Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Coverage Cap */}
          <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
            <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Coverage Cap</p>
              <p className="font-semibold text-sm">
                {pCoverageCap ? formatCurrency(pCoverageCap) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Excess */}
          <div className="flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Excess</p>
              <p className="font-semibold text-sm">{formatExcess()}</p>
            </div>
          </div>

          {!policy && (
            <>
              {/* Minor Damage */}
              <div className={cn(
                'flex items-start gap-2 p-2 rounded-lg border',
                coversMinorDamage ? 'bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30' : 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
              )}>
                {coversMinorDamage ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Minor Damage</p>
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
                'flex items-start gap-2 p-2 rounded-lg border',
                coversMajorIncidents ? 'bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900/30' : 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
              )}>
                {coversMajorIncidents ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Major Incidents</p>
                  <p className={cn(
                    'font-semibold text-sm',
                    coversMajorIncidents ? 'text-green-600' : 'text-red-500'
                  )}>
                    {coversMajorIncidents ? 'Covered' : 'Not Covered'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Features List (Expandable) */}
        {features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              What's Included
            </h4>
            <ul className="space-y-1.5">
              {features.slice(0, isExpanded ? undefined : 3).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
              {features.length > 3 && (
                <li className="text-center pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-primary"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <span className="flex items-center gap-1"><ChevronUp className="h-3 w-3" /> Show Less</span>
                    ) : (
                      <span className="flex items-center gap-1"><ChevronDown className="h-3 w-3" /> +{features.length - 3} more benefits</span>
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
                className="w-full justify-between text-xs h-7 text-muted-foreground hover:text-destructive px-2"
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
                  <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="h-3 w-3 text-red-400 shrink-0 mt-0.5" />
                    <span>{exclusion}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onSelect && !policy && (
            <Button
              className="flex-1"
              variant={isSelected ? "secondary" : "default"}
              onClick={onSelect}
            >
              {isSelected ? 'Selected' : 'Select Package'}
            </Button>
          )}
          
          {policy && (
            <>
              {policy.claim_eligibility && (
                <Button 
                  className="flex-1 gap-2" 
                  variant="default" 
                  onClick={onFileClaim}
                >
                  <PlusCircle className="h-4 w-4" />
                  File a Claim
                </Button>
              )}
              {policy.document_url && (
                <Button 
                  variant="outline" 
                  className={cn("gap-2", !policy.claim_eligibility && "flex-1")}
                  onClick={onDownloadPDF}
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
              )}
            </>
          )}
          
          {onViewTerms && (
            <Button variant="outline" size="icon" onClick={onViewTerms} title="View Terms">
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Terms Link */}
        <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
          Claims are subject to terms and conditions. 
          <button
            onClick={onViewTerms}
            className="text-primary hover:underline ml-1 not-italic"
          >
            Read T&Cs
          </button>
        </p>
      </CardContent>
    </Card>
  );
};

export default PolicyDetailsCard;

