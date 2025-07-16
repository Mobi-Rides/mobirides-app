-- Add comprehensive car specifications to the cars table
-- This migration adds detailed vehicle specifications and amenities fields

-- Add engine and performance specifications
ALTER TABLE cars ADD COLUMN IF NOT EXISTS engine_size TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS horsepower TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS max_speed TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS acceleration TEXT;

-- Add fuel and efficiency specifications
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_efficiency TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS mileage INTEGER;

-- Add physical specifications
ALTER TABLE cars ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS doors INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS length TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS width TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS trunk_capacity TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ground_clearance TEXT;

-- Add warranty and maintenance information
ALTER TABLE cars ADD COLUMN IF NOT EXISTS warranty TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS maintenance_history TEXT;

-- Add comments to document the new fields
COMMENT ON COLUMN cars.engine_size IS 'Engine displacement in liters (e.g., 2.0)';
COMMENT ON COLUMN cars.horsepower IS 'Engine power output in horsepower';
COMMENT ON COLUMN cars.max_speed IS 'Maximum speed in km/h';
COMMENT ON COLUMN cars.acceleration IS '0-100 km/h acceleration time in seconds';
COMMENT ON COLUMN cars.fuel_efficiency IS 'Fuel consumption in L/100km';
COMMENT ON COLUMN cars.mileage IS 'Current odometer reading in kilometers';
COMMENT ON COLUMN cars.color IS 'Vehicle exterior color';
COMMENT ON COLUMN cars.doors IS 'Number of doors (2-6)';
COMMENT ON COLUMN cars.weight IS 'Vehicle weight in kg';
COMMENT ON COLUMN cars.length IS 'Vehicle length in mm';
COMMENT ON COLUMN cars.width IS 'Vehicle width in mm';
COMMENT ON COLUMN cars.height IS 'Vehicle height in mm';
COMMENT ON COLUMN cars.trunk_capacity IS 'Trunk/boot capacity in liters';
COMMENT ON COLUMN cars.ground_clearance IS 'Ground clearance in mm';
COMMENT ON COLUMN cars.warranty IS 'Warranty period in months';
COMMENT ON COLUMN cars.maintenance_history IS 'Text description of maintenance history';

-- Add constraints for numeric fields
ALTER TABLE cars ADD CONSTRAINT cars_doors_check CHECK (doors >= 2 AND doors <= 6);
ALTER TABLE cars ADD CONSTRAINT cars_mileage_check CHECK (mileage >= 0);
ALTER TABLE cars ADD CONSTRAINT cars_seats_check CHECK (seats >= 2 AND seats <= 15); 