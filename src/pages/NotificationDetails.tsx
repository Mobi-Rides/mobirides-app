import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navigation } from "@/components/Navigation";

const NotificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: notification, isLoading } = useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      console.log('Fetching notification details for ID:', id);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Notification Details</h1>
        
        {notification ? (
          <div className="space-y-4">
            <p className="text-gray-600">{notification.content}</p>
            <p className="text-sm text-gray-400">
              Received on: {new Date(notification.created_at).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <p className="text-gray-600">Notification not found</p>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default NotificationDetails;