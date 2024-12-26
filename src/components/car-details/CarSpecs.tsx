interface CarSpecsProps {
  pricePerDay: number;
  transmission: string;
  seats: number;
}

export const CarSpecs = ({ pricePerDay, transmission, seats }: CarSpecsProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="font-semibold">BWP {pricePerDay}</p>
        <p className="text-muted-foreground">per day</p>
      </div>
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="font-semibold">{transmission}</p>
        <p className="text-muted-foreground">transmission</p>
      </div>
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="font-semibold">{seats}</p>
        <p className="text-muted-foreground">seats</p>
      </div>
    </div>
  );
};