
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, MapPin, Bookmark, CalendarClock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  activeIndex: number;
}

export const Navigation = () => {
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const items: NavigationItem[] = [
    { path: "/", label: "Home", icon: <Home className="w-5 h-5" />, activeIndex: 0 },
    { path: "/map", label: "Map", icon: <MapPin className="w-5 h-5" />, activeIndex: 1 },
    { path: "/saved-cars", label: "Saved", icon: <Bookmark className="w-5 h-5" />, activeIndex: 2 },
    { path: "/bookings", label: "Bookings", icon: <CalendarClock className="w-5 h-5" />, activeIndex: 3 },
    { path: "/profile", label: "Profile", icon: <User className="w-5 h-5" />, activeIndex: 4 },
  ];

  useEffect(() => {
    const currentItem = items.find((item) => location.pathname === item.path);
    if (currentItem) {
      setActiveIndex(currentItem.activeIndex);
    }
  }, [location.pathname]);

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 h-16 flex items-center justify-between px-6 z-50">
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            "flex flex-col items-center px-2 py-1 rounded-lg transition-colors",
            activeIndex === item.activeIndex
              ? "text-primary dark:text-primary"
              : "text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
          )}
          onClick={() => setActiveIndex(item.activeIndex)}
        >
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
      <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-white dark:bg-gray-900 p-2 rounded-full border border-gray-200 dark:border-gray-800">
        <ThemeToggle />
      </div>
    </div>
  );
};
