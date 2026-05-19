-- Add renter_terms_accepted_at and host_terms_accepted_at fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS renter_terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS host_terms_accepted_at TIMESTAMP WITH TIME ZONE;
