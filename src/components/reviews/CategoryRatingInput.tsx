import { Star } from "lucide-react";

interface Category {
  key: string;
  label: string;
}

interface CategoryRatingInputProps {
  categories: Category[];
  ratings: Record<string, number>;
  onChange: (ratings: Record<string, number>) => void;
}

export const CategoryRatingInput = ({
  categories,
  ratings,
  onChange,
}: CategoryRatingInputProps) => {
  const handleRate = (categoryKey: string, value: number) => {
    onChange({ ...ratings, [categoryKey]: value });
  };

  return (
    <div className="space-y-1">
      {categories.map((category) => (
        <div
          key={category.key}
          className="flex items-center justify-between min-h-[44px] px-1"
        >
          <span className="text-sm font-medium text-muted-foreground">
            {category.label}
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="p-1 touch-manipulation"
                onClick={() => handleRate(category.key, value)}
              >
                <Star
                  className={`h-5 w-5 transition-colors ${
                    value <= (ratings[category.key] || 0)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
