import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SearchFilters } from "@/components/SearchFilters";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SearchFilters as Filters } from "@/components/SearchFilters";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Filters) => void;
}

export const Header = ({ searchQuery, onSearchChange, onFiltersChange }: HeaderProps) => {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .single();

      return data;
    }
  });

  const { data: notificationCount } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { messages: 0, notifications: 0 };

      const [messagesResponse, notificationsResponse] = await Promise.all([
        supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('receiver_id', user.id)
          .eq('status', 'sent'),
        supabase
          .from('notifications')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('is_read', false)
      ]);

      return {
        messages: messagesResponse.count || 0,
        notifications: notificationsResponse.count || 0
      };
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const totalNotifications = (notificationCount?.messages || 0) + (notificationCount?.notifications || 0);

  const avatarUrl = profile?.avatar_url 
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl 
    : null;

  return (
    <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <img
          src="/lovable-uploads/9bb8c367-3153-4561-870a-faadfe15b30c.png"
          alt="Mobirides Logo"
          className="h-14 w-14 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Gaborone, Botswana</h1>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          onClick={() => navigate("/cars/add")}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="relative">
          <button 
            className="w-13 h-13 rounded-full bg-gray-100 flex items-center justify-center"
            onClick={() => navigate("/profile")}
          >
            {avatarUrl ? (
              <Avatar className="h-13 w-13">
                <AvatarImage src={avatarUrl} alt="Profile" />
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-xl">🔔</span>
            )}
          </button>
          {totalNotifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalNotifications}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-primary"
          />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SearchFilters onFiltersChange={onFiltersChange} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};