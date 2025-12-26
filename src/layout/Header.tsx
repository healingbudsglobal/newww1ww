/**
 * Header Component - Modern Full-Width Design
 * 
 * Clean, modern header that sits flush at the top with no gaps.
 * Uses glass morphism effect with smooth scroll transitions.
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, useScroll, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import hbLogoWhite from "@/assets/hb-logo-white-new.png";
import EligibilityDialog from "@/components/EligibilityDialog";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import NavigationMenu from "@/components/NavigationMenu";
import NavigationOverlay from "@/components/NavigationOverlay";

interface HeaderProps {
  onMenuStateChange?: (isOpen: boolean) => void;
}

const Header = ({ onMenuStateChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const headerRef = useRef<HTMLElement>(null);
  
  // Scroll progress tracking
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Notify parent of menu state changes
  useEffect(() => {
    onMenuStateChange?.(mobileMenuOpen);
  }, [mobileMenuOpen, onMenuStateChange]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-white/10 z-[100]">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 origin-left"
          style={{ scaleX }}
        />
      </div>

      {/* Main Header */}
      <header 
        ref={headerRef}
        className={cn(
          "fixed top-2 left-3 right-3 sm:left-4 sm:right-4 z-50",
          "transition-all duration-500 ease-out",
          "rounded-xl",
          scrolled 
            ? "bg-[#1a3835]/95 backdrop-blur-xl shadow-2xl shadow-black/20 border border-white/10" 
            : "bg-[#1f4340] border border-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid Layout */}
          <div className={cn(
            "grid grid-cols-[auto_1fr_auto] items-center gap-6",
            "transition-all duration-500 ease-out",
            scrolled ? "h-16" : "h-20"
          )}>
            
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center flex-shrink-0 group"
            >
              <img 
                src={hbLogoWhite} 
                alt="Healing Buds" 
                className={cn(
                  "w-auto object-contain transition-all duration-500 group-hover:opacity-90",
                  scrolled ? "h-9 sm:h-10" : "h-11 sm:h-12"
                )}
              />
            </Link>
          
            {/* Center Navigation */}
            <NavigationMenu scrolled={scrolled} />
            
            {/* Right Actions - Desktop */}
            <div className="hidden xl:flex items-center gap-3 flex-shrink-0">
              <LanguageSwitcher scrolled={scrolled} />
              <ThemeToggle />

              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setEligibilityDialogOpen(true)}
                  className={cn(
                    "font-medium px-4 py-2 rounded-lg transition-all duration-300",
                    "bg-emerald-500 text-white hover:bg-emerald-400",
                    "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40",
                    "text-sm whitespace-nowrap"
                  )}
                >
                  {t('nav.checkEligibility')}
                </button>
                
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      className={cn(
                        "font-medium px-4 py-2 rounded-lg transition-all duration-300",
                        "bg-white/10 text-white hover:bg-white/20",
                        "border border-white/20 hover:border-white/30",
                        "text-sm flex items-center gap-2"
                      )}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Portal
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                      title={t('nav.signOut')}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    className={cn(
                      "font-medium px-4 py-2 rounded-lg transition-all duration-300",
                      "bg-white/10 text-white hover:bg-white/20",
                      "border border-white/20 hover:border-white/30",
                      "text-sm"
                    )}
                  >
                    {t('nav.patientLogin')}
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="xl:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                className={cn(
                  "text-white p-2 rounded-lg transition-all duration-300",
                  "hover:bg-white/10 active:bg-white/20",
                  "min-h-[44px] min-w-[44px] flex items-center justify-center"
                )}
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <NavigationOverlay
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
        onEligibilityClick={() => setEligibilityDialogOpen(true)}
        scrolled={scrolled}
      />

      {/* Eligibility Dialog */}
      <EligibilityDialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen} />
    </>
  );
};

export default Header;