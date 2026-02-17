/**
 * NavigationMenu Component - Pharmaceutical Grade
 * 
 * Clean, premium desktop navigation with glassmorphism hover and animated underline.
 * Persistent cart icon with gold badge.
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
    "relative px-3 py-2 rounded-xl font-medium transition-all duration-300",
    "text-sm whitespace-nowrap flex-shrink-0 group",
    active
      ? "text-white bg-white/15 backdrop-blur-sm"
      : "text-white/90 hover:text-white hover:bg-white/10 hover:backdrop-blur-sm"
  );

  return (
    <nav className="hidden xl:flex items-center justify-center gap-1">
      {navItems.map((item) => {
        const active = item.isShop ? isShopActive : isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={linkClass(active)}
          >
            {item.label}
            {/* Animated underline - slides from left */}
            {active ? (
              <motion.span
                layoutId="nav-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--navbar-gold))]"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            ) : (
              <span className={cn(
                "absolute bottom-0 left-0 h-0.5 transition-all duration-300 bg-[hsl(var(--navbar-gold))]",
                "w-0 opacity-0 group-hover:w-full group-hover:opacity-60"
              )} />
            )}
          </Link>
        );
      })}

      {/* Cart button - always visible, dimmed when empty */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        className={cn(
          "relative px-3 py-2 rounded-xl font-medium transition-all duration-300",
          "text-sm whitespace-nowrap flex-shrink-0 group flex items-center gap-1.5",
          cartCount > 0
            ? "text-white hover:bg-white/10"
            : "text-white/40 hover:text-white/70 hover:bg-white/5"
        )}
      >
        <ShoppingCart className="w-4 h-4" />
        Cart
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[hsl(var(--navbar-gold))] text-[10px] font-bold flex items-center justify-center text-black"
            >
              {cartCount > 9 ? '9+' : cartCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </nav>
  );
};

export default NavigationMenu;
