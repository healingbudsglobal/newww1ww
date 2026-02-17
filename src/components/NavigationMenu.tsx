/**
 * NavigationMenu Component - Pharmaceutical Grade
 * 
 * Clean, premium desktop navigation with subtle gold hover accents.
 * Text-only links (no icons) for maximum horizontal space.
 */

import { Link, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/context/ShopContext";
import { motion, AnimatePresence } from "framer-motion";


interface NavigationMenuProps {
  scrolled: boolean;
  onCloseAllDropdowns?: () => void;
  isDark?: boolean;
}

const NavigationMenu = ({ scrolled, isDark = true }: NavigationMenuProps) => {
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useShop();

  const isActive = (path: string) => location.pathname === path;
  const isShopActive = location.pathname === '/shop' || location.pathname.startsWith('/shop/');

  const navItems = [
    { path: '/about', label: 'About Us' },
    { path: '/research', label: 'Research' },
    { path: '/the-wire', label: 'The Wire' },
    { path: '/eligibility', label: 'Eligibility' },
    { path: '/shop', label: 'Strains', isShop: true },
    { path: '/support', label: 'Support' },
  ];

  const linkClass = (active: boolean) => cn(
    "relative px-2.5 py-2 rounded-lg font-medium transition-all duration-300",
    "text-sm whitespace-nowrap flex-shrink-0 group",
    active
      ? "text-white bg-white/15 border-b-2 border-[#EAB308]"
      : "text-white/90 hover:text-white hover:bg-white/10"
  );

  return (
    <nav className="hidden xl:flex items-center justify-center gap-0.5">
      {navItems.map((item) => {
        const active = item.isShop ? isShopActive : isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={linkClass(active)}
          >
            {item.label}
            {active && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[hsl(var(--navbar-gold))]" />
            )}
            <span className={cn(
              "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-300 bg-[hsl(var(--navbar-gold))]",
              active ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-3/4 group-hover:opacity-60"
            )} />
          </Link>
        );
      })}

      {/* Cart button - only visible when items in cart */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCartOpen(true)}
            className={cn(
              "relative px-2.5 py-2 rounded-lg font-medium transition-all duration-300",
              "text-sm whitespace-nowrap flex-shrink-0 group flex items-center gap-1.5",
              "text-white/90 hover:text-white hover:bg-white/10"
            )}
          >
            <ShoppingCart className="w-4 h-4" />
            Cart
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--navbar-gold))] text-[10px] font-bold flex items-center justify-center text-black">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavigationMenu;
