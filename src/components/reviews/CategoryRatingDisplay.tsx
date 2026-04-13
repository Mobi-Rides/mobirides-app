import { Star } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  cleanliness: "Cleanliness",
  accuracy: "Accuracy",
  communication: "Communication",
  value: "Value",
  punctuality: "Punctuality",
  car_care: "Car Care",
};

interface CategoryRatingDisplayProps {
  categoryAverages: Record<string, number>;
  reviewCount?: number;
}

export const CategoryRatingDisplay = ({
  categoryAverages,
}: CategoryRatingDisplayProps) => {
  const entries = Object.entries(categoryAverages).filter(
    ([, avg]) => avg > 0
  );

  if (entries.length === 0) return null;

  return (
    <div className="space-y-1">
      {entries.map(([key, avg]) => (
        <div
          key={key}
          className="flex items-center justify-between min-h-[32px] px-1"
        >
          <span className="text-xs font-medium text-muted-foreground">
            {CATEGORY_LABELS[key] || key}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = avg >= value;
                const half = !filled && avg >= value - 0.5;
                return (
                  <Star
                    key={value}
                    className={`h-3.5 w-3.5 ${
                      filled
                        ? "text-yellow-500 fill-yellow-500"
                        : half
                        ? "text-yellow-500 fill-yellow-500/50"
                        : "text-gray-300"
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs font-medium text-muted-foreground w-6 text-right">
              {avg.toFixed(1)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
