import { Heart } from "lucide-react";

interface CarImageProps {
  image: string;
  brand: string;
  model: string;
  isFavorite: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
}

export const CarImage = ({
  image,
  brand,
  model,
  isFavorite,
  onFavoriteClick,
}: CarImageProps) => {
  return (
    <div className="relative">
      <img
        src={image}
        alt={`${brand} ${model}`}
        className="w-full h-48 object-cover"
      />
      <button
        onClick={onFavoriteClick}
        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
      >
        <Heart
          className={`w-5 h-5 ${
            isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
          }`}
        />
      </button>
    </div>
  );
};