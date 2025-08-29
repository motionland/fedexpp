"use client";

import {
  useState,
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  ClipboardList,
  Users,
  FileText,
  Settings,
  HelpCircle,
  BarChart,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Truck,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type React from "react";

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultOpen);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    const storedState = localStorage.getItem("sidebarCollapsed");
    if (storedState !== null) {
      setIsCollapsed(JSON.parse(storedState));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

const menuItems = [
  {
    title: "Overview",
    href: "/",
    icon: Package,
    requiredPermission: "view_dashboard",
  },
  {
    title: "Tracking List",
    href: "/dashboard/tracking",
    icon: ClipboardList,
    badge: "3",
    requiredPermission: "view_dashboard", // Maps to view_dashboard permission
  },
  {
    title: "Reports",
    href: "/dashboard/reports",
    icon: BarChart,
    requiredPermission: "view_reports",
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
    badge: "New",
    requiredPermission: "manage_users",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    requiredPermission: "edit_settings", // Maps to existing edit_settings permission
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
    requiredPermission: "view_dashboard", // Maps to view_dashboard permission
  },
  {
    title: "Historical Reports",
    href: "/dashboard/historical-reports",
    icon: FileText,
    requiredPermission: "view_reports",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  if (!mounted) return null;
  if (!user) return <div>Loading sidebar...</div>; // Menampilkan loading jika user belum tersedia

  // 🔥 Filter menu based on user permissions
  const filteredMenuItems = menuItems.filter((item) =>
    hasPermission(item.requiredPermission)
  );

  return (
    <TooltipProvider>
      <div
        className={cn(
          "sticky h-screen top-0 flex flex-col border-r transition-all duration-300 ease-in-out bg-[#00573F] text-white",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        <div className="border-b border-white/10 px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-white"
            >
              {isCollapsed ? (
                <Package className="h-6 w-6" />
              ) : (
                <>
                  <Package className="h-6 w-6" />
                  <span>Receiving Logs</span>
                </>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto text-white hover:bg-white/10"
              onClick={toggleSidebar}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isCollapsed && (
            <span className="pl-10 mt-1 text-sm font-normal text-white/80">
              Kasandra Health
            </span>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2 p-4">
            {filteredMenuItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className={cn(
                      "justify-start gap-2 text-white hover:bg-white/10",
                      pathname === item.href && "bg-[#004432]",
                      isCollapsed && "justify-center"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className="flex-1 text-left">{item.title}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span
                          className={cn(
                            "ml-auto rounded px-1.5 py-0.5 text-xs",
                            item.badge === "New"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted-foreground/20 text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent
                    side="right"
                    className="flex items-center gap-4"
                  >
                    {item.title}
                    {item.badge && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-xs",
                          item.badge === "New"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t border-white/10 p-4">
          {!isCollapsed && user && (
            <div className="mb-2 text-sm text-white/80">
              <p>Logged in as: {user.username}</p>
              <p>Role: {user.role}</p>
            </div>
          )}
          <div className={!isCollapsed ? "flex gap-2" : "block"}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="flex-1 text-white hover:bg-white/10"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  {!isCollapsed && (
                    <span className="ml-2">
                      {theme === "light" ? "Dark" : "Light"}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === "light"
                  ? "Switch to Dark Mode"
                  : "Switch to Light Mode"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logout}
                  className="flex-1 text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  {!isCollapsed && <span className="ml-2">Logout</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
