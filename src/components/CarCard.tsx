import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { CarImage } from "./car-card/CarImage";
import { CarInfo } from "./car-card/CarInfo";
import { CarSpecs } from "./car-card/CarSpecs";
import { CarActions } from "./car-card/CarActions";

interface CarCardProps {
  brand: string;
  model: string;
  price: number;
  image: string;
  rating: number;
  transmission: string;
  fuel: string;
  seats: number;
  location: string;
  year: number;
  id: string;
  isSaved?: boolean;
}

export const CarCard = ({
  brand,
  model,
  price,
  image,
  rating,
  transmission,
  fuel,
  seats,
  location,
  year,
  id,
  isSaved = false,
}: CarCardProps) => {
  const [isFavorite, setIsFavorite] = useState(isSaved);
  const navigate = useNavigate();

  useEffect(() => {
    setIsFavorite(isSaved);
  }, [isSaved]);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cars/${id}`);
  };

  const handleBookNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/book/${id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <Card className="overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg">
      <CarImage
        image={image}
        brand={brand}
        model={model}
        isFavorite={isFavorite}
        onFavoriteClick={handleFavoriteClick}
      />
      <div className="p-4">
        <CarInfo
          brand={brand}
          model={model}
          rating={rating}
          price={price}
          year={year}
          location={location}
        />
        <div className="space-y-2 mt-2">
          <CarSpecs
            transmission={transmission}
            fuel={fuel}
            seats={seats}
          />
        </div>
        <CarActions
          onViewDetails={handleViewDetails}
          onBookNow={handleBookNow}
        />
      </div>
    </Card>
  );
};