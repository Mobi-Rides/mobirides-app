import React, { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookingTable } from "@/components/booking/BookingTable";
import { format } from "date-fns";
import { Booking } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const COMMISSION_RATE = 0.15;

const HostBookings = () => {
    const navigate = useNavigate();
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
            // Get bookings for those cars
            const { data, error } = await supabase
                .from("bookings")
                .select(`*, cars (brand, model, image_url, owner_id, location, price_per_day), reviews!reviews_booking_id_fkey (id)`)
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
            <div className="min-h-screen bg-background">
                <div className="container py-4 space-y-4">
                    <div className="px-4 py-4 mb-4 flex items-center gap-4">
                        <Button variant="ghost" size="icon" disabled>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-xl md:text-2xl text-left font-semibold">
                            My Bookings (Host)
                        </h1>
                    </div>
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
                <Navigation />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container py-4 space-y-4">
                <div className="px-4 py-4 mb-4 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-xl md:text-2xl text-left font-semibold">
                        My Bookings (Host)
                    </h1>
                </div>
                <div className="px-4">
                    <BookingTable
                        bookings={bookings}
                        onCancelBooking={() => {}}
                        showNetEarnings={true}
                    />
                </div>
            </div>
            <Navigation />
        </div>
    );
};

export default HostBookings; 