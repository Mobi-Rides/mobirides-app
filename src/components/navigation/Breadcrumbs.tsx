import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
  className?: string;
  items?: { label: string; path: string }[];
}

export const Breadcrumbs = ({ className, items }: BreadcrumbProps) => {
  const location = useLocation();

  // If items are provided, use them. Otherwise, generate from location
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);

  // Helper to generate breadcrumbs from path
  function generateBreadcrumbs(path: string) {
    const paths = path.split("/").filter(Boolean);
    
    // Skip if root
    if (paths.length === 0) return [];

    return paths.map((segment, index) => {
      const path = `/${paths.slice(0, index + 1).join("/")}`;
      
      // Format label: "car-details" -> "Car Details"
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return {
        label,
        path,
        isLast: index === paths.length - 1
      };
    });
  }

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <Link 
        to="/" 
        className="flex items-center hover:text-foreground transition-colors"
        title="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
          
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground truncate max-w-[200px]">
              {item.label}
            </span>
          ) : (
            <Link 
              to={item.path}
              className="hover:text-foreground transition-colors truncate max-w-[150px]"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};
