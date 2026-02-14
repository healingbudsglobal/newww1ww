/**
 * AdminLayout Component
 * 
 * Dedicated layout for admin pages with sidebar navigation.
 * Earthy green palette with modern 2026 design aesthetic.
 */

import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useTenant } from "@/hooks/useTenant";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { EnvironmentSelector } from "@/components/admin/EnvironmentSelector";

import {
  LayoutDashboard,
  Leaf,
  RefreshCw,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
  User,
  Users,
  ShoppingCart,
  Bug,
  ExternalLink
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
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/strains", label: "Strains", icon: Leaf },
  { to: "/admin/strain-sync", label: "Strain Sync", icon: RefreshCw },
];

const secondaryNavItems: NavItem[] = [
  { to: "/admin/team", label: "Team & Access", icon: Shield },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/tools", label: "Developer Tools", icon: Bug },
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

  useEffect(() => {
    if (!isLoading && !user) {
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      navigate(`/auth?redirect=${returnUrl}`, { replace: true });
    }
  }, [isLoading, user, location.pathname, location.search, navigate]);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--admin-parchment))] dark:bg-background flex">
        <div className="w-64 bg-[hsl(var(--admin-forest))] p-4">
          <Skeleton className="h-10 w-32 mb-8 bg-white/10" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full bg-white/10" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have administrator privileges.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate("/")}>Return Home</Button>
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
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          active
            ? "bg-white/15 text-white font-medium shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-sm"
            : "text-white/60 hover:text-white hover:bg-white/8"
        )}
      >
        <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", active ? "text-white" : "text-white/50 group-hover:text-white/80")} />
        {!collapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[hsl(var(--admin-gold))]/20 text-[hsl(var(--admin-gold))] rounded-full">
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
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return linkContent;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--admin-parchment))] dark:bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col transition-all duration-300 relative",
          sidebarCollapsed ? "w-[72px]" : "w-64"
        )}
        style={{
          background: 'linear-gradient(180deg, hsl(var(--admin-forest)), hsl(var(--admin-forest-deep)))',
        }}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-white/10",
          sidebarCollapsed ? "h-16 justify-center px-2" : "h-16 px-4"
        )}>
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--admin-fir))] flex items-center justify-center flex-shrink-0 shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-white text-sm leading-tight">Admin Portal</span>
                <span className="text-xs text-white/40">{tenant.name}</span>
              </div>
            )}
          </Link>
        </div>

        {/* Accent bar */}
        <div className="h-0.5 bg-gradient-to-r from-[hsl(var(--admin-fir))] via-[hsl(var(--admin-sage))] to-transparent" />

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}
          <div className="my-4 border-t border-white/10" />
          {secondaryNavItems.map((item) => (
            <NavLink key={item.to} item={item} collapsed={sidebarCollapsed} />
          ))}
        </nav>

        {/* User Section */}
        <div className={cn("border-t border-white/10 p-3", sidebarCollapsed && "flex flex-col items-center gap-2")}>
          {!sidebarCollapsed && (
            <>
              <Link
                to="/"
                className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors mb-3"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Back to Website</span>
              </Link>
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-3">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-fir))]/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
                  <p className="text-xs text-white/40">Administrator</p>
                </div>
              </div>
            </>
          )}
          {sidebarCollapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to="/" className="flex items-center justify-center p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors mb-2">
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Back to Website</TooltipContent>
            </Tooltip>
          )}

          <div className={cn("flex gap-2", sidebarCollapsed ? "flex-col" : "flex-row")}>
            <ThemeToggle isDark={isDark} />
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/50 hover:text-red-400 hover:bg-white/5">
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={sidebarCollapsed ? "right" : "top"}>Sign Out</TooltipContent>
            </Tooltip>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("mt-2 w-full text-white/40 hover:text-white hover:bg-white/5", sidebarCollapsed && "px-0")}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4 mr-2" />Collapse</>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50">
        <div className="h-1 bg-gradient-to-r from-[hsl(var(--admin-forest))] via-[hsl(var(--admin-fir))] to-[hsl(var(--admin-sage))]" />
        <div className="h-14 bg-[hsl(var(--admin-forest))] flex items-center justify-between px-4">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--admin-fir))] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">Admin</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white/80 hover:bg-white/10">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 z-50 flex flex-col"
              style={{ background: 'linear-gradient(180deg, hsl(var(--admin-forest)), hsl(var(--admin-forest-deep)))' }}
            >
              <div className="h-1 bg-gradient-to-r from-[hsl(var(--admin-fir))] via-[hsl(var(--admin-sage))] to-transparent" />
              <div className="h-14 flex items-center px-4 border-b border-white/10">
                <Link to="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                  <div className="w-7 h-7 rounded-lg bg-[hsl(var(--admin-fir))] flex items-center justify-center">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-white">Admin Portal</span>
                </Link>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => <NavLink key={item.to} item={item} />)}
                <div className="my-4 border-t border-white/10" />
                {secondaryNavItems.map((item) => <NavLink key={item.to} item={item} />)}
              </nav>
              <div className="border-t border-white/10 p-4">
                <Link to="/" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-colors mb-3">
                  <ExternalLink className="w-4 h-4" /><span className="text-sm">Back to Website</span>
                </Link>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-fir))]/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.email?.split('@')[0] || 'Admin'}</p>
                    <p className="text-xs text-white/40">Administrator</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />Sign Out
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn("flex-1 min-h-screen", "lg:pt-0 pt-[60px]")}>
        <div className="border-b border-[hsl(var(--admin-soft-green))]/20 bg-white/60 dark:bg-card/50 backdrop-blur-sm px-6 py-5 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div>
              {title && (
                <h1 className="text-2xl lg:text-3xl font-bold text-[hsl(var(--admin-forest))] dark:text-foreground tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-[hsl(var(--admin-sage))] dark:text-muted-foreground mt-1 text-sm">{description}</p>
              )}
            </div>
            <EnvironmentSelector />
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
