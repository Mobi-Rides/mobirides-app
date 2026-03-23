import { CheckCircle2, XCircle } from "lucide-react";

type Props = {
  name: string;
  description?: string;
  coveragePercentage: number;
  baseRate: number;
  coverageCap?: number | null;
  excessAmount?: number | null;
  features?: string[];
  exclusions?: string[];
};

export const PolicyDetailsCard = ({
  name, description, coveragePercentage, baseRate,
  coverageCap, excessAmount, features = [], exclusions = []
}: Props) => {
  return (
    <div className="p-4 border rounded-md space-y-3">
      <div>
        <div className="font-medium">{name}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Daily rate: </span>
          <span className="font-medium">BWP {baseRate.toFixed(2)}</span>
        </div>
        {coveragePercentage > 0 && (
          <div>
            <span className="text-muted-foreground">Premium: </span>
            <span className="font-medium">{(coveragePercentage * 100).toFixed(0)}% of rental</span>
          </div>
        )}
        {coverageCap != null && (
          <div>
            <span className="text-muted-foreground">Coverage cap: </span>
            <span className="font-medium">BWP {coverageCap.toFixed(2)}</span>
          </div>
        )}
        {excessAmount != null && (
          <div>
            <span className="text-muted-foreground">Excess: </span>
            <span className="font-medium">BWP {excessAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      {features.length > 0 && (
        <div className="space-y-1">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}
      {exclusions.length > 0 && (
        <div className="space-y-1">
          {exclusions.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <XCircle className="h-3 w-3 text-red-400 shrink-0" />
              <span>{e}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
