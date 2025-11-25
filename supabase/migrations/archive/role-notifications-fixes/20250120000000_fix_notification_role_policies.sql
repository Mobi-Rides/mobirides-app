-- Fix notification RLS policies to properly validate role_target field
-- This migration adds role-based validation for notifications

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Create enhanced notification policies with role validation
-- Policy 1: Users can view system-wide notifications
CREATE POLICY "Users can view system-wide notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id 
    AND role_target = 'system_wide'
);

-- Policy 2: Hosts can view host-only notifications for their cars
CREATE POLICY "Hosts can view host-only notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id 
    AND role_target = 'host_only'
    AND (
        -- For car-related notifications, check if user owns the car
        (related_car_id IS NOT NULL AND auth.uid() = (
            SELECT owner_id FROM public.cars WHERE id = related_car_id
        ))
        OR
        -- For booking-related notifications, check if user owns the car being booked
        (related_booking_id IS NOT NULL AND auth.uid() = (
            SELECT c.owner_id 
            FROM public.cars c 
            JOIN public.bookings b ON c.id = b.car_id 
            WHERE b.id = related_booking_id
        ))
        OR
        -- For general host notifications without specific car/booking context
        (related_car_id IS NULL AND related_booking_id IS NULL)
    )
);

-- Policy 3: Renters can view renter-only notifications for their bookings
CREATE POLICY "Renters can view renter-only notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id 
    AND role_target = 'renter_only'
    AND (
        -- For booking-related notifications, check if user is the renter
        (related_booking_id IS NOT NULL AND auth.uid() = (
            SELECT renter_id FROM public.bookings WHERE id = related_booking_id
        ))
        OR
        -- For general renter notifications without specific booking context
        (related_booking_id IS NULL)
    )
);

-- Policy 4: Users can update their own notifications (regardless of role)
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Policy 5: Allow inserting notifications (for system/backend use)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true); -- This allows the backend to create notifications

-- Add comments for clarity
COMMENT ON POLICY "Users can view system-wide notifications" ON public.notifications IS 
'Allows users to view notifications with system_wide role_target';

COMMENT ON POLICY "Hosts can view host-only notifications" ON public.notifications IS 
'Allows car owners to view host-only notifications related to their cars or bookings';

COMMENT ON POLICY "Renters can view renter-only notifications" ON public.notifications IS 
'Allows renters to view renter-only notifications related to their bookings';

COMMENT ON POLICY "Users can update their own notifications" ON public.notifications IS 
'Allows users to update their own notifications (e.g., mark as read)';

COMMENT ON POLICY "System can insert notifications" ON public.notifications IS 
'Allows the backend system to create notifications for users';