-- Add role-based notification policies after notifications system overhaul
-- This migration adds detailed role_target validation for the new notification structure

-- Drop the basic policies from the overhaul migration
DROP POLICY IF EXISTS "users_view_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "hosts_view_car_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_view_booking_notifications" ON public.notifications;

-- Create enhanced notification policies with role_target validation

-- Policy 1: Users can view system-wide notifications
CREATE POLICY "users_view_system_wide_notifications"
ON public.notifications FOR SELECT
USING (
    auth.uid() = user_id 
    AND role_target = 'system_wide'
);

-- Policy 2: Hosts can view host-only notifications for their cars
CREATE POLICY "hosts_view_host_only_notifications"
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
CREATE POLICY "renters_view_renter_only_notifications"
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

-- Add comments for clarity
COMMENT ON POLICY "users_view_system_wide_notifications" ON public.notifications IS 
'Allows users to view notifications with system_wide role_target';

COMMENT ON POLICY "hosts_view_host_only_notifications" ON public.notifications IS 
'Allows car owners to view host-only notifications related to their cars or bookings';

COMMENT ON POLICY "renters_view_renter_only_notifications" ON public.notifications IS 
'Allows renters to view renter-only notifications related to their bookings';