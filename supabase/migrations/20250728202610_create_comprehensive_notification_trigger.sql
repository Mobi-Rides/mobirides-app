-- Create comprehensive notification trigger system
-- First, add missing notification types to the enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'booking_request',
            'booking_confirmed', 
            'booking_cancelled',
            'booking_reminder',
            'message_received',
            'wallet_topup',
            'wallet_deduction',
            'handover_ready',
            'payment_received',
            'payment_failed'
        );
    ELSE
        -- Add new values to existing enum if they don't exist
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_topup';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wallet_deduction';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'handover_ready';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_received';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_failed';
    END IF;
END $$;

-- Function to create booking notifications
CREATE OR REPLACE FUNCTION public.create_booking_notification(
    p_booking_id UUID,
    p_notification_type TEXT,
    p_content TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_booking RECORD;
    v_host_id UUID;
    v_renter_id UUID;
    v_car_title TEXT;
    v_notification_enum notification_type;
BEGIN
    -- Get booking details
    SELECT b.*, c.brand, c.model, c.owner_id, b.renter_id
    INTO v_booking
    FROM bookings b
    JOIN cars c ON c.id = b.car_id
    WHERE b.id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    v_host_id := v_booking.owner_id;
    v_renter_id := v_booking.renter_id;
    v_car_title := v_booking.brand || ' ' || v_booking.model;
    
    -- Convert text to enum
    v_notification_enum := p_notification_type::notification_type;
    
    -- Create notification for host
    IF p_notification_type IN ('booking_request', 'booking_cancelled') THEN
        INSERT INTO notifications (
            user_id, 
            type, 
            content, 
            related_booking_id, 
            related_car_id,
            is_read
        ) VALUES (
            v_host_id,
            v_notification_enum,
            p_content,
            p_booking_id,
            v_booking.car_id,
            false
        );
    END IF;
    
    -- Create notification for renter
    IF p_notification_type IN ('booking_confirmed', 'booking_cancelled', 'booking_reminder') THEN
        INSERT INTO notifications (
            user_id, 
            type, 
            content, 
            related_booking_id, 
            related_car_id,
            is_read
        ) VALUES (
            v_renter_id,
            v_notification_enum,
            p_content,
            p_booking_id,
            v_booking.car_id,
            false
        );
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the main operation
        RAISE WARNING 'Failed to create booking notification: %', SQLERRM;
END;
$$;

-- Function to handle booking status changes
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_car_info TEXT;
    v_host_content TEXT;
    v_renter_content TEXT;
BEGIN
    -- Get car information
    SELECT brand || ' ' || model INTO v_car_info
    FROM cars 
    WHERE id = NEW.car_id;
    
    -- Handle booking confirmation
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
        v_renter_content := 'Your booking for ' || v_car_info || ' has been confirmed for ' || 
                           TO_CHAR(NEW.start_date, 'Mon DD') || ' - ' || TO_CHAR(NEW.end_date, 'Mon DD');
        
        PERFORM create_booking_notification(
            NEW.id,
            'booking_confirmed',
            v_renter_content
        );
    END IF;
    
    -- Handle booking cancellation
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status = 'cancelled' THEN
        v_host_content := 'Booking for your ' || v_car_info || ' has been cancelled';
        v_renter_content := 'Your booking for ' || v_car_info || ' has been cancelled';
        
        PERFORM create_booking_notification(
            NEW.id,
            'booking_cancelled',
            CASE WHEN TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN v_host_content ELSE v_renter_content END
        );
    END IF;
    
    -- Handle new booking requests
    IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
        v_host_content := 'New booking request for your ' || v_car_info || ' from ' || 
                         TO_CHAR(NEW.start_date, 'Mon DD') || ' - ' || TO_CHAR(NEW.end_date, 'Mon DD');
        
        PERFORM create_booking_notification(
            NEW.id,
            'booking_request',
            v_host_content
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS booking_status_notification_trigger ON bookings;
CREATE TRIGGER booking_status_notification_trigger
    AFTER INSERT OR UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_change();

-- Function to create wallet notifications
CREATE OR REPLACE FUNCTION public.create_wallet_notification(
    p_host_id UUID,
    p_type TEXT,
    p_amount NUMERIC,
    p_description TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_content TEXT;
    v_notification_type notification_type;
BEGIN
    -- Generate content based on type
    CASE p_type
        WHEN 'topup' THEN
            v_content := 'Your wallet has been topped up with P' || p_amount::TEXT;
            v_notification_type := 'wallet_topup';
        WHEN 'deduction' THEN
            v_content := 'P' || p_amount::TEXT || ' commission deducted from your wallet';
            v_notification_type := 'wallet_deduction';
        WHEN 'payment_received' THEN
            v_content := 'Payment of P' || p_amount::TEXT || ' received';
            v_notification_type := 'payment_received';
        ELSE
            v_content := COALESCE(p_description, 'Wallet transaction of P' || p_amount::TEXT);
            v_notification_type := 'wallet_deduction';
    END CASE;
    
    -- Create notification
    INSERT INTO notifications (
        user_id, 
        type, 
        content, 
        is_read
    ) VALUES (
        p_host_id,
        v_notification_type,
        v_content,
        false
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create wallet notification: %', SQLERRM;
END;
$$;

-- Add notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    booking_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'hourly', 'daily')),
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id)
);

-- Enable RLS on notification preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification preferences
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_notification_preferences_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_preferences_timestamp();