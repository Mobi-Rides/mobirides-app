import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  Car,
  CreditCard,
  ClipboardCheck,
  Settings,
  Home,
  MessageSquare,
  UserCog,
  Shield,
  TrendingUp,
  Tag,
  FileText
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Overview", url: "/admin", icon: BarChart3 },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Cars", url: "/admin/cars", icon: Car },
  { title: "Bookings", url: "/admin/bookings", icon: CreditCard },
  { title: "Transactions", url: "/admin/transactions", icon: CreditCard },
  { title: "Promo Codes", url: "/admin/promo-codes", icon: Tag },
  { title: "Verifications", url: "/admin/verifications", icon: ClipboardCheck },
  { title: "Insurance Claims", url: "/admin/claims", icon: FileText },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Admin Management", url: "/admin/management", icon: UserCog },
  { title: "Audit Logs", url: "/admin/audit", icon: Shield },
];

const appMenuItems = [
  { title: "Main App", url: "/", icon: Home },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin" || currentPath === "/admin/";
    }
    return currentPath === path;
  };

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={getNavClassName}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {appMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};