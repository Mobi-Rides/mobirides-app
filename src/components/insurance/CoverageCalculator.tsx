type Props = {
  premium: number | null;
  totalWithoutInsurance: number;
};

export const CoverageCalculator = ({ premium, totalWithoutInsurance }: Props) => {
  const total = premium !== null ? totalWithoutInsurance + premium : totalWithoutInsurance;
  return (
    <div className="space-y-2">
      <h4 className="font-medium">Coverage Calculator</h4>
      <div className="text-sm space-y-1 p-4 bg-primary/5 rounded-md">
        <div className="flex justify-between">
          <span>Rental total</span>
          <span>BWP {totalWithoutInsurance.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Insurance premium</span>
          <span>BWP {(premium ?? 0).toFixed(2)}</span>
        </div>
        <div className="border-t border-border pt-2 mt-2 flex justify-between">
          <span className="font-medium text-primary">Grand total</span>
          <span className="font-medium text-primary">BWP {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

