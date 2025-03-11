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
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="container max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 h-16">
        <div className="grid grid-cols-5 h-full w-full">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center h-full transition-colors px-1",
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
        </div>
      </nav>
      <div className="absolute -top-3 right-8 bg-white dark:bg-gray-900 p-2 rounded-full border border-gray-200 dark:border-gray-800 shadow-md">
        <ThemeToggle />
      </div>
    </div>
  );
};
