-- Index for filtering by renter
CREATE INDEX IF NOT EXISTS idx_bookings_renter_id ON bookings(renter_id);

-- Index for filtering by car
CREATE INDEX IF NOT EXISTS idx_bookings_car_id ON bookings(car_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Full-text index for searching brand, model, location
CREATE INDEX IF NOT EXISTS idx_bookings_text_search ON bookings
USING GIN (
  to_tsvector('english', coalesce(location,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(model,''))
);
