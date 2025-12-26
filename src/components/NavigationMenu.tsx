/**
 * NavigationMenu Component
 * 
 * Clean, modern desktop navigation with subtle hover effects.
 */

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavigationMenuProps {
  scrolled: boolean;
  onCloseAllDropdowns?: () => void;
}

const NavigationMenu = ({ scrolled }: NavigationMenuProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isShopActive = location.pathname === '/shop' || location.pathname.startsWith('/shop/');

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/eligibility', label: 'Eligibility' },
    { path: '/shop', label: 'Dispensary', isShop: true },
    { path: '/support', label: 'Support' },
  ];

  return (
    <nav className="hidden xl:flex items-center justify-center gap-1">
      {navItems.map((item) => {
        const active = item.isShop ? isShopActive : isActive(item.path);
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative px-4 py-2 rounded-lg font-medium transition-all duration-300",
              "text-sm",
              active
                ? "text-white bg-white/15"
                : "text-white/80 hover:text-white hover:bg-white/10"
            )}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavigationMenu;