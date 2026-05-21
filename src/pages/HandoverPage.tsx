import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HandoverProvider } from "@/contexts/HandoverProvider";
import { EnhancedHandoverSheet } from "@/components/handover/EnhancedHandoverSheet";
import { HandoverErrorBoundary } from "@/components/handover/HandoverErrorBoundary";
import { Navigation } from "@/components/Navigation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BarLoader } from "react-spinners";
import CustomMapbox from "@/components/map/CustomMapbox";
import { getMapboxToken } from "@/utils/mapbox";
import { useTheme } from "@/contexts/ThemeContext";

const HandoverPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { theme } = useTheme();

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [mapToken, setMapToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) { setNotFound(true); setIsLoading(false); return; }

    const fetchSession = supabase
      .from("handover_sessions")
      .select("booking_id")
      .eq("id", sessionId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return; }
        setBookingId(data.booking_id);
      });

    const fetchToken = getMapboxToken().then(token => setMapToken(token || ""));

    Promise.all([fetchSession, fetchToken]).finally(() => setIsLoading(false));
  }, [sessionId]);

  const mapStyle =
    theme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground mb-3">Loading handover session...</p>
        <BarLoader color="#7c3aed" width={100} />
      </div>
    );
  }

  if (notFound || !bookingId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <p className="text-sm text-destructive font-medium">Handover session not found</p>
        <p className="text-xs text-muted-foreground mt-1">
          This session may have expired or been completed.
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HandoverProvider>
        <div className="flex flex-col h-screen bg-background">
          <main className="flex-1 relative overflow-hidden">
            {mapToken && (
              <CustomMapbox
                mapbox_token={mapToken}
                longitude={25.90859}
                latitude={-24.65451}
                onlineHosts={[]}
                mapStyle={mapStyle}
                isHandoverMode={true}
                bookingId={bookingId}
                dpad={true}
                locationToggle={true}
              />
            )}
            <HandoverErrorBoundary>
              <EnhancedHandoverSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                bookingId={bookingId}
              />
            </HandoverErrorBoundary>
          </main>
          <Navigation />
        </div>
      </HandoverProvider>
    </ErrorBoundary>
  );
};

export default HandoverPage;
