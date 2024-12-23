import { useState } from "react";
import { Search } from "lucide-react";
import { CarCard } from "@/components/CarCard";
import { BrandFilter } from "@/components/BrandFilter";
import { Navigation } from "@/components/Navigation";

const brands = [
  { name: "Honda", logo: "/placeholder.svg" },
  { name: "Toyota", logo: "/placeholder.svg" },
  { name: "VW", logo: "/placeholder.svg" },
  { name: "Mercedes", logo: "/placeholder.svg" },
];

const cars = [
  {
    brand: "Honda",
    model: "Fit Hybrid",
    price: 300,
    image: "/placeholder.svg",
    rating: 4.7,
    transmission: "Auto",
    fuel: "Petrol",
    seats: 5,
  },
  {
    brand: "Toyota",
    model: "Vitz",
    price: 400,
    image: "/placeholder.svg",
    rating: 4.5,
    transmission: "Manual",
    fuel: "Petrol",
    seats: 5,
  },
  {
    brand: "Toyota",
    model: "Hilux GD6",
    price: 800,
    image: "/placeholder.svg",
    rating: 4.8,
    transmission: "Auto",
    fuel: "Diesel",
    seats: 5,
  },
];

const Index = () => {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCars = cars.filter((car) => {
    const matchesBrand = !selectedBrand || car.brand === selectedBrand;
    const matchesSearch =
      !searchQuery ||
      car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBrand && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Gaborone, Botswana</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl">🔔</span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Brands</h2>
            <button className="text-primary text-sm">See All</button>
          </div>
          <BrandFilter
            brands={brands}
            selectedBrand={selectedBrand}
            onSelectBrand={setSelectedBrand}
          />
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Popular Cars</h2>
            <button className="text-primary text-sm">See All</button>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {filteredCars.map((car, index) => (
              <CarCard key={index} {...car} />
            ))}
          </div>
        </section>
      </main>

      <Navigation />
    </div>
  );
};

export default Index;