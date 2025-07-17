-- Add missing database indexes for performance optimization

-- Index for filtering bookings by car and status
CREATE INDEX IF NOT EXISTS idx_bookings_car_status ON bookings(car_id, status);

-- Index for filtering bookings by renter and status  
CREATE INDEX IF NOT EXISTS idx_bookings_renter_status ON bookings(renter_id, status);

-- Index for sorting bookings by creation date
CREATE INDEX IF NOT EXISTS idx_bookings_created_at_desc ON bookings(created_at DESC);

-- Index for filtering cars by owner and availability
CREATE INDEX IF NOT EXISTS idx_cars_owner_available ON cars(owner_id, is_available);

-- Index for filtering notifications by user, read status, and date
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date ON notifications(user_id, is_read, created_at DESC);

-- Index for filtering messages by receiver and status
CREATE INDEX IF NOT EXISTS idx_messages_receiver_status ON messages(receiver_id, status);

-- Index for filtering wallet transactions by wallet and date
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_date ON wallet_transactions(wallet_id, created_at DESC);

-- Index for filtering cars by location (for geospatial queries)
CREATE INDEX IF NOT EXISTS idx_cars_location ON cars(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for filtering bookings by date range
CREATE INDEX IF NOT EXISTS idx_bookings_date_range ON bookings(start_date, end_date);

-- Index for car images primary flag
CREATE INDEX IF NOT EXISTS idx_car_images_primary ON car_images(car_id, is_primary);