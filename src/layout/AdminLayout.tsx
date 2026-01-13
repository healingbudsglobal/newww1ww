/**
 * AdminLayout Component
 * 
 * Dedicated layout for admin pages with sidebar navigation.
 * CRM-style high-density layout for management UX.
 */

import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/hooks/useTenant";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "next-themes";

import {
  LayoutDashboard,
  FileText,
  Leaf,
  RefreshCw,
  Database,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  User,
  Package,
  Users,
  ShoppingCart,
  Bug
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
  { to: "/admin/strains", label: "Strains", icon: Leaf },
  { to: "/admin/strain-sync", label: "Strain Sync", icon: RefreshCw },
  { to: "/admin/strain-knowledge", label: "Knowledge Base", icon: Database },
];

const secondaryNavItems: NavItem[] = [
  { to: "/debug", label: "Debug Panel", icon: Bug },
];

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isLoading } = useUserRole();
  const { tenant } = useTenant();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="w-64 border-r border-border bg-card p-4">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md p-8"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You do not have administrator privileges to access this area.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate("/")}>
              Return Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const NavLink = ({ item, collapsed = false }: { item: NavItem; collapsed?: boolean }) => {
    const active = isActive(item.to);
    const Icon = item.icon;

    const linkContent = (
      <Link
        to={item.to}
        onClick={() => setMobileMenuOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          active
            ? "bg-primary text-primary-foreground font-medium shadow-sm"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0", active && "text-primary-foreground")} />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {linkContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
            {item.badge && ` (${item.badge})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Logo Area */}
        <div className={cn(
          "flex items-center border-b border-border",
          sidebarCollapsed ? "h-16 justify-center px-2" : "h-16 px-4"
        )}>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-sm leading-tight">Admin Portal</span>
                <span className="text-xs text-muted-foreground">{tenant.name}</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-border" />

          {/* Secondary Nav */}
          {secondaryNavItems.map((item) => (
            <NavLink key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* User Section */}
        <div className={cn(
          "border-t border-border p-3",
          sidebarCollapsed && "flex flex-col items-center gap-2"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.email?.split('@')[0] || 'Admin'}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          )}

          <div className={cn(
            "flex gap-2",
            sidebarCollapsed ? "flex-col" : "flex-row"
          )}>
            <ThemeToggle isDark={isDark} />
            
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={sidebarCollapsed ? "right" : "top"}>
                Sign Out
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "mt-2 w-full text-muted-foreground hover:text-foreground",
              sidebarCollapsed && "px-0"
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-4">
        <Link to="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Admin Portal</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-card border-r border-border flex flex-col"
            >
              {/* Mobile Logo */}
              <div className="h-16 flex items-center px-4 border-b border-border">
                <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-foreground">Admin Portal</span>
                </Link>
              </div>

              {/* Mobile Nav */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink key={item.to} item={item} />
                ))}
                <div className="my-4 border-t border-border" />
                {secondaryNavItems.map((item) => (
                  <NavLink key={item.to} item={item} />
                ))}
              </nav>

              {/* Mobile User */}
              <div className="border-t border-border p-4">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email?.split('@')[0] || 'Admin'}
                    </p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "flex-1 min-h-screen",
        "lg:pt-0 pt-16" // Account for mobile header
      )}>
        {/* Page Header */}
        {(title || description) && (
          <div className="border-b border-border bg-card/50 px-6 py-4 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {title && (
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
