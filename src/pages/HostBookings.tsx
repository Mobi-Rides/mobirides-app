
import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { Booking } from "@/types/booking";
import { BookingPageLayout } from "@/components/booking/BookingPageLayout";
import { BookingLoadingState } from "@/components/booking/BookingLoadingState";

const HostBookings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: bookings, isLoading, error } = useQuery({
        queryKey: ["host-bookings"],
        queryFn: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                throw new Error("No active session found");
            }

            // Get cars owned by the user
            const { data: cars, error: carsError } = await supabase
                .from("cars")
                .select("id")
                .eq("owner_id", sessionData.session.user.id);

            if (carsError) throw carsError;
            if (!cars.length) return [];

            const carIds = cars.map(car => car.id);

            // Get bookings for those cars with all necessary joins
            const { data, error } = await supabase
                .from("bookings")
                .select(`
                    *, 
                    cars (
                        brand, 
                        model, 
                        image_url, 
                        owner_id, 
                        location, 
                        price_per_day
                    ), 
                    renter:profiles!renter_id (
                        full_name
                    ),
                    reviews!reviews_booking_id_fkey (id)
                `)
                .in("car_id", carIds)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as unknown as Booking[];
        },
        retry: 2
    });

    useEffect(() => {
        if (error) {
            toast({
                title: "Error loading bookings",
                description: "Please try again later or contact support",
                variant: "destructive",
            });
        }
    }, [error, toast]);

    if (isLoading) {
        return (
            <BookingPageLayout title="My Bookings (Host)" isLoading={true}>
                <BookingLoadingState />
            </BookingPageLayout>
        );
    }

    return (
        <BookingPageLayout title="My Bookings (Host)">
            <BookingTable
                bookings={bookings}
                onCancelBooking={async (bookingId: string) => {
                    console.warn("Cancel booking not implemented for host view");
                }}
                onApproveBooking={async (bookingId: string) => {
                    try {
                        const { error } = await supabase
                            .from("bookings")
                            .update({ status: "confirmed" })
                            .eq("id", bookingId);

                        if (error) throw error;
                        
                        toast({
                            title: "Booking approved",
                            variant: "default",
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
                    } catch (error) {
                        toast({
                            title: "Error",
                            description: "Failed to approve booking",
                            variant: "destructive",
                        });
                    }
                }}
                onDeclineBooking={async (bookingId: string) => {
                    try {
                        const { error } = await supabase
                            .from("bookings")
                            .update({ status: "cancelled" })
                            .eq("id", bookingId);

                        if (error) throw error;
                        
                        toast({
                            title: "Booking declined",
                            variant: "default",
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
                    } catch (error) {
                        toast({
                            title: "Error",
                            description: "Failed to decline booking",
                            variant: "destructive",
                        });
                    }
                }}
                onMessage={(otherUserId: string, bookingId: string) => {
                    // Navigate to message view
                }}
                isHost={true}
                showNetEarnings={true}
                selectedBookingIds={[]}
                toggleSelectBooking={() => {}}
                allSelected={false}
                toggleSelectAll={() => {}}
                viewMode="table"
            />
        </BookingPageLayout>
    );
};

export default HostBookings;
