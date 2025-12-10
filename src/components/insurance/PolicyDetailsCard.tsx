type Props = {
  name: string;
  description?: string;
  coveragePercentage: number;
  baseRate: number;
};

export const PolicyDetailsCard = ({ name, description, coveragePercentage, baseRate }: Props) => {
  return (
    <div className="p-4 border rounded-md">
      <div className="font-medium">{name}</div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
      <div className="text-sm">Coverage: {coveragePercentage}%</div>
      <div className="text-sm">Base rate: BWP {baseRate.toFixed(2)}</div>
    </div>
  );
};

