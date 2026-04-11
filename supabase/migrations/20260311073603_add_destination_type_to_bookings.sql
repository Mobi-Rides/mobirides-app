-- Add destination_type to bookings if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'destination_type'
    ) THEN
        ALTER TABLE public.bookings ADD COLUMN destination_type TEXT DEFAULT 'local';
        -- Add check constraint to ensure it's one of the allowed values
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_destination_type_check 
            CHECK (destination_type IN ('local', 'out_of_zone', 'cross_border'));
    END IF;
END $$;
