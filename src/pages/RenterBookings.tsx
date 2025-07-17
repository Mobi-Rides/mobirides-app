
import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { Booking } from "@/types/booking";
import { BookingPageLayout } from "@/components/booking/BookingPageLayout";
import { BookingLoadingState } from "@/components/booking/BookingLoadingState";

const RenterBookings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: bookings, isLoading, error } = useQuery({
        queryKey: ["renter-bookings"],
        queryFn: async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) {
                throw new Error("No active session found");
            }

            // Get bookings made by the renter
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
                        price_per_day,
                        owner_profile:profiles!cars_owner_id_fkey(full_name)
                    ), 
                    reviews!reviews_booking_id_fkey (id)
                `)
                .eq("renter_id", sessionData.session.user.id)
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
            <BookingPageLayout title="My Bookings (Renter)" isLoading={true}>
                <BookingLoadingState />
            </BookingPageLayout>
        );
    }

    return (
        <BookingPageLayout title="My Bookings (Renter)">
            <BookingTable
                bookings={bookings}
                onCancelBooking={async (bookingId: string) => {
                    try {
                        const { error } = await supabase
                            .from("bookings")
                            .update({ status: "cancelled" })
                            .eq("id", bookingId);

                        if (error) throw error;
                        
                        toast({
                            title: "Success",
                            description: "Booking cancelled successfully",
                            variant: "default",
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["renter-bookings"] });
                    } catch (error) {
                        toast({
                            title: "Error",
                            description: "Failed to cancel booking",
                            variant: "destructive",
                        });
                    }
                }}
                onApproveBooking={async () => {}}
                onDeclineBooking={async () => {}}
                onMessage={(otherUserId: string, bookingId: string) => {
                    // Navigate to message view
                }}
                isHost={false}
                showNetEarnings={false}
                selectedBookingIds={[]}
                toggleSelectBooking={() => {}}
                allSelected={false}
                toggleSelectAll={() => {}}
                viewMode="table"
            />
        </BookingPageLayout>
    );
};

export default RenterBookings;
