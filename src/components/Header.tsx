import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import hbLogoWhite from "@/assets/hb-logo-white-new.png";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import EligibilityDialog from "./EligibilityDialog";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  onMenuStateChange?: (isOpen: boolean) => void;
}

const Header = ({ onMenuStateChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whatWeDoOpen, setWhatWeDoOpen] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);
  const [mobileWhatWeDoOpen, setMobileWhatWeDoOpen] = useState(false);
  const [mobileAboutUsOpen, setMobileAboutUsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const { t } = useTranslation('common');
  
  // Refs for click-outside detection
  const whatWeDoRef = useRef<HTMLDivElement>(null);
  const aboutUsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  
  // Scroll progress tracking
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Click outside handler
  const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
    const target = event.target as Node;
    
    // Close desktop dropdowns when clicking outside
    if (whatWeDoRef.current && !whatWeDoRef.current.contains(target)) {
      setWhatWeDoOpen(false);
    }
    if (aboutUsRef.current && !aboutUsRef.current.contains(target)) {
      setAboutUsOpen(false);
    }
  }, []);

  // Add click-outside listener
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    setMobileMenuOpen(false);
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;
  
  const isWhatWeDoActive = ['/what-we-do', '/cultivating-processing', '/manufacture-distribution', '/medical-clinics', '/online-pharmacy'].includes(location.pathname);
  const isAboutUsActive = ['/about-us', '/blockchain-technology'].includes(location.pathname);

  // Reset mobile dropdown states when menu closes
  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileWhatWeDoOpen(false);
      setMobileAboutUsOpen(false);
    }
  }, [mobileMenuOpen]);

  // Close dropdowns on route change
  useEffect(() => {
    setWhatWeDoOpen(false);
    setAboutUsOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Scroll Progress Bar with Background Track */}
      <div className="fixed top-0 left-0 right-0 sm:top-2 sm:left-2 sm:right-2 h-1 bg-primary/20 z-[60] sm:rounded-t-xl">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-secondary to-primary origin-left will-change-transform"
          style={{ 
            scaleX,
            transformOrigin: "0%"
          }}
        />
      </div>
      
      <header 
        ref={headerRef}
        className={cn(
          "fixed top-0 left-0 right-0 sm:top-2 sm:left-2 sm:right-2 z-50 backdrop-blur-xl rounded-none sm:rounded-xl transition-all duration-500 ease-out border-b sm:border",
          scrolled 
            ? "shadow-2xl border-white/20 sm:scale-[0.99]" 
            : "shadow-sm border-white/10"
        )}
        style={{ 
          backgroundColor: scrolled ? 'rgba(42, 61, 58, 0.98)' : 'rgba(42, 61, 58, 0.95)',
          transition: 'background-color 0.5s ease-out, transform 0.5s ease-out'
        }}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
          <div className={cn(
            "flex items-center justify-between transition-all duration-500 ease-out",
            scrolled ? "h-20 md:h-[88px]" : "h-24 md:h-28"
          )}>
            <Link to="/" className="flex items-center flex-shrink-0 group">
              <img 
                src={hbLogoWhite} 
                alt="Healing Buds Logo" 
                className={cn(
                  "w-auto object-contain transition-all duration-500 ease-out group-hover:scale-105",
                  scrolled ? "h-12 sm:h-14 md:h-16" : "h-14 sm:h-16 md:h-20"
                )}
              />
            </Link>
          
          {/* Desktop Navigation - Show on xl screens and up */}
          <nav className={cn(
            "hidden xl:flex items-center flex-1 justify-end transition-all duration-500 ease-out",
            scrolled ? "gap-0.5 xl:gap-1 2xl:gap-2" : "gap-1 xl:gap-2 2xl:gap-3"
          )}>
            <div 
              ref={whatWeDoRef}
              className="relative group"
              onMouseEnter={() => setWhatWeDoOpen(true)}
              onMouseLeave={() => setWhatWeDoOpen(false)}
            >
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhatWeDoOpen(!whatWeDoOpen);
                    setAboutUsOpen(false);
                  }}
                  className={cn(
                    "font-body flex items-center gap-1.5 font-semibold transition-all duration-300 ease-out relative rounded-lg hover:scale-105 whitespace-nowrap cursor-pointer select-none",
                    scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                    isWhatWeDoActive
                      ? "text-white bg-white/20" 
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {t('nav.whatWeDo')}
                  <ChevronDown className={cn("w-4 h-4 transition-transform duration-150 pointer-events-none", whatWeDoOpen && "rotate-180")} />
              </button>
              
              {/* Dropdown Menu - Linear style */}
              <AnimatePresence>
                {whatWeDoOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-card rounded-xl shadow-card border border-border/40 overflow-hidden z-[100]"
                  >
                    <Link
                      to="/cultivating-processing"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors border-b border-border"
                      onClick={() => setWhatWeDoOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.cultivating')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.cultivatingDesc')}</div>
                    </Link>
                    <Link
                      to="/manufacture-distribution"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors border-b border-border"
                      onClick={() => setWhatWeDoOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.manufacture')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.manufactureDesc')}</div>
                    </Link>
                    <Link
                      to="/medical-clinics"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors border-b border-border"
                      onClick={() => setWhatWeDoOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.clinics')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.clinicsDesc')}</div>
                    </Link>
                    <Link
                      to="/online-pharmacy"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors"
                      onClick={() => setWhatWeDoOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.pharmacy')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.pharmacyDesc')}</div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link 
              to="/research" 
              className={cn(
                "font-body font-semibold transition-all duration-300 ease-out rounded-lg hover:scale-105 whitespace-nowrap",
                scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                isActive("/research") 
                  ? "text-white bg-white/20" 
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {t('nav.research')}
            </Link>
            <Link 
              to="/the-wire" 
              className={cn(
                "font-body font-semibold transition-all duration-300 ease-out rounded-lg hover:scale-105 whitespace-nowrap",
                scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                isActive("/the-wire") || location.pathname.startsWith("/the-wire/")
                  ? "text-white bg-white/20" 
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {t('nav.theWire')}
            </Link>
            <div 
              ref={aboutUsRef}
              className="relative group"
              onMouseEnter={() => setAboutUsOpen(true)}
              onMouseLeave={() => setAboutUsOpen(false)}
            >
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAboutUsOpen(!aboutUsOpen);
                  setWhatWeDoOpen(false);
                }}
                className={cn(
                  "font-body flex items-center gap-1.5 font-semibold transition-all duration-300 ease-out relative rounded-lg hover:scale-105 whitespace-nowrap cursor-pointer select-none",
                  scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                  isAboutUsActive
                    ? "text-white bg-white/20" 
                    : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                {t('nav.aboutUs')}
                <ChevronDown className={cn("w-4 h-4 transition-transform duration-150 pointer-events-none", aboutUsOpen && "rotate-180")} />
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {aboutUsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-72 bg-card rounded-xl shadow-card border border-border/40 overflow-hidden z-[100]"
                  >
                    <Link
                      to="/about-us"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors border-b border-border"
                      onClick={() => setAboutUsOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.aboutHealing')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.aboutHealingDesc')}</div>
                    </Link>
                    <Link
                      to="/blockchain-technology"
                      className="block px-4 py-3 text-card-foreground hover:bg-muted transition-colors"
                      onClick={() => setAboutUsOpen(false)}
                    >
                      <div className="font-medium">{t('dropdown.blockchain')}</div>
                      <div className="text-sm text-muted-foreground">{t('dropdown.blockchainDesc')}</div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link 
              to="/shop" 
              className={cn(
                "font-body font-semibold transition-all duration-300 ease-out rounded-lg hover:scale-105 whitespace-nowrap",
                scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                isActive("/shop") || location.pathname.startsWith("/shop/")
                  ? "text-white bg-white/20" 
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {t('nav.shop')}
            </Link>
            <Link 
              to="/contact" 
              className={cn(
                "font-body font-semibold transition-all duration-300 ease-out rounded-lg hover:scale-105 whitespace-nowrap",
                scrolled ? "text-xs 2xl:text-sm px-3 py-2" : "text-sm 2xl:text-base px-4 py-2.5",
                isActive("/contact") 
                  ? "text-white bg-white/20" 
                  : "text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              {t('nav.contactUs')}
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher scrolled={scrolled} />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Desktop Action Buttons */}
            <div className="flex items-center gap-1.5 xl:gap-2 flex-shrink-0">
              <button
                onClick={() => setEligibilityDialogOpen(true)}
                className={cn(
                  "font-body font-bold px-3 xl:px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl relative z-10 whitespace-nowrap",
                  "bg-white/95 text-[#2A3D3A] hover:bg-white",
                  "border-2 border-white shadow-lg",
                  "text-[11px] lg:text-xs 2xl:text-sm"
                )}
              >
                <span className="hidden xl:inline">{t('nav.checkEligibility')}</span>
                <span className="xl:hidden">Eligibility</span>
              </button>
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={cn(
                      "font-body font-bold px-3 xl:px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl relative z-10 whitespace-nowrap",
                      "bg-primary text-white hover:bg-primary/90",
                      "border-2 border-primary shadow-lg flex items-center gap-1",
                      "text-[11px] lg:text-xs 2xl:text-sm"
                    )}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="hidden xl:inline">Patient Portal</span>
                    <span className="xl:hidden">Portal</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={cn(
                      "font-body font-bold px-3 xl:px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl relative z-10 whitespace-nowrap",
                      "bg-transparent text-white hover:bg-white/20",
                      "border-2 border-white/60 shadow-lg flex items-center gap-1",
                      "text-[11px] lg:text-xs 2xl:text-sm"
                    )}
                  >
                    <LogOut className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="hidden xl:inline">{t('nav.signOut')}</span>
                    <span className="xl:hidden">Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className={cn(
                    "font-body font-bold px-3 xl:px-4 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl relative z-10 whitespace-nowrap",
                    "bg-transparent text-white hover:bg-white/20",
                    "border-2 border-white/60 shadow-lg",
                    "text-[11px] lg:text-xs 2xl:text-sm"
                  )}
                >
                  <span className="hidden xl:inline">{t('nav.patientLogin')}</span>
                  <span className="xl:hidden">Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Eligibility Dialog */}
          <EligibilityDialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen} />

          {/* Mobile Menu Button & Theme Toggle */}
          <div className="xl:hidden flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              className={cn(
                "text-white p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center",
                "hover:bg-white/10 active:bg-white/20",
                scrolled && "p-2.5"
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className={cn("transition-all duration-300", scrolled ? "w-6 h-6" : "w-7 h-7")} />
              ) : (
                <Menu className={cn("transition-all duration-300", scrolled ? "w-6 h-6" : "w-7 h-7")} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Full Height Slide-in */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop - Darker for better layer separation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="xl:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Elevated menu surface with distinct background */}
              <motion.nav 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="xl:hidden overflow-hidden border-t border-white/20"
                style={{ backgroundColor: 'hsl(178 42% 22%)' }}
              >
                <div className="flex flex-col py-6 px-5 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
                  {/* Navigation Links */}
                  <div className="flex flex-col space-y-1">
                    {/* What We Do Section - Collapsible */}
                    <div className="space-y-1">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMobileWhatWeDoOpen(!mobileWhatWeDoOpen);
                        }}
                        className={cn(
                          "w-full font-semibold text-base py-4 px-5 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer touch-manipulation min-h-[56px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                          isWhatWeDoActive 
                            ? "text-white bg-white/25 border-l-4 border-white" 
                            : "text-white hover:bg-white/15 active:bg-white/20"
                        )}
                      >
                        {t('nav.whatWeDo')}
                        <ChevronDown className={cn("w-5 h-5 transition-transform duration-150 pointer-events-none text-white/80", mobileWhatWeDoOpen && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {mobileWhatWeDoOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden ml-3 pl-4 border-l-2 border-white/30"
                          >
                            <div className="space-y-1 py-2">
                              <Link 
                                to="/cultivating-processing" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/cultivating-processing")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.cultivating')}
                              </Link>
                              <Link 
                                to="/manufacture-distribution" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/manufacture-distribution")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.manufacture')}
                              </Link>
                              <Link 
                                to="/medical-clinics" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/medical-clinics")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.clinics')}
                              </Link>
                              <Link 
                                to="/online-pharmacy" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/online-pharmacy")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.pharmacy')}
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link 
                      to="/research" 
                      className={cn(
                        "text-base transition-all duration-150 py-4 px-5 rounded-xl touch-manipulation min-h-[56px] flex items-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        isActive("/research") 
                          ? "text-white font-semibold bg-white/25 border-l-4 border-white" 
                          : "text-white hover:bg-white/15 active:bg-white/20"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.research')}
                    </Link>

                    <Link 
                      to="/the-wire" 
                      className={cn(
                        "text-base transition-all duration-150 py-4 px-5 rounded-xl touch-manipulation min-h-[56px] flex items-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        isActive("/the-wire") || location.pathname.startsWith("/the-wire/") 
                          ? "text-white font-semibold bg-white/25 border-l-4 border-white" 
                          : "text-white hover:bg-white/15 active:bg-white/20"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.theWire')}
                    </Link>

                    {/* About Us Section - Collapsible */}
                    <div className="space-y-1">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMobileAboutUsOpen(!mobileAboutUsOpen);
                        }}
                        className={cn(
                          "w-full font-semibold text-base py-4 px-5 rounded-xl flex items-center justify-between transition-all duration-150 cursor-pointer touch-manipulation min-h-[56px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                          isAboutUsActive 
                            ? "text-white bg-white/25 border-l-4 border-white" 
                            : "text-white hover:bg-white/15 active:bg-white/20"
                        )}
                      >
                        {t('nav.aboutUs')}
                        <ChevronDown className={cn("w-5 h-5 transition-transform duration-150 pointer-events-none text-white/80", mobileAboutUsOpen && "rotate-180")} />
                      </button>
                      <AnimatePresence>
                        {mobileAboutUsOpen && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden ml-3 pl-4 border-l-2 border-white/30"
                          >
                            <div className="space-y-1 py-2">
                              <Link 
                                to="/about-us" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/about-us")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.aboutHealing')}
                              </Link>
                              <Link 
                                to="/blockchain-technology" 
                                className={cn(
                                  "block text-base py-3.5 px-4 rounded-lg transition-all duration-150 touch-manipulation min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                                  isActive("/blockchain-technology")
                                    ? "text-white font-medium bg-white/20"
                                    : "text-white/85 hover:text-white hover:bg-white/15 active:bg-white/20"
                                )}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                {t('dropdown.blockchain')}
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link 
                      to="/shop" 
                      className={cn(
                        "text-base transition-all duration-150 py-4 px-5 rounded-xl touch-manipulation min-h-[56px] flex items-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        isActive("/shop") || location.pathname.startsWith("/shop/") 
                          ? "text-white font-semibold bg-white/25 border-l-4 border-white" 
                          : "text-white hover:bg-white/15 active:bg-white/20"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.shop')}
                    </Link>

                    <Link 
                      to="/contact" 
                      className={cn(
                        "text-base transition-all duration-150 py-4 px-5 rounded-xl touch-manipulation min-h-[56px] flex items-center active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
                        isActive("/contact") 
                          ? "text-white font-semibold bg-white/25 border-l-4 border-white" 
                          : "text-white hover:bg-white/15 active:bg-white/20"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('nav.contactUs')}
                    </Link>
                  </div>

                  {/* Divider - more visible */}
                  <div className="my-6 border-t border-white/20" />

                  {/* Mobile CTAs inside menu */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEligibilityDialogOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full font-body font-semibold px-6 py-4 rounded-xl transition-all duration-150 ease-out active:scale-[0.97] shadow-md bg-white text-[#1C4F4D] text-base hover:bg-white/95 hover:shadow-lg touch-manipulation min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    >
                      {t('nav.checkEligibility')}
                    </button>
                    {user ? (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="w-full font-body font-semibold px-6 py-4 rounded-xl transition-all duration-150 ease-out active:scale-[0.97] shadow-md bg-white/20 border border-white/40 text-white text-base flex items-center justify-center gap-2 hover:bg-white/30 hover:border-white/60 touch-manipulation min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          Patient Portal
                        </Link>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full font-body font-semibold px-6 py-4 rounded-xl transition-all duration-150 ease-out active:scale-[0.97] shadow-md bg-white/10 border border-white/30 text-white text-base flex items-center justify-center gap-2 hover:bg-white/20 hover:border-white/50 touch-manipulation min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                        >
                          <LogOut className="w-5 h-5" />
                          {t('nav.signOut')}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-center w-full text-center font-body font-semibold px-6 py-4 rounded-xl transition-all duration-150 ease-out active:scale-[0.97] shadow-md bg-white/15 border border-white/35 text-white text-base hover:bg-white/25 hover:border-white/55 touch-manipulation min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                      >
                        {t('nav.patientLogin')}
                      </Link>
                    )}
                  </div>

                  {/* Divider - more visible */}
                  <div className="my-6 border-t border-white/20" />

                  {/* Bottom Section: Language & Theme */}
                  <div className="flex items-center justify-between gap-4 px-2">
                    <LanguageSwitcher scrolled={scrolled} />
                    <ThemeToggle variant="button" className="flex-1" />
                  </div>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>
        </div>
      </header>
    </>
  );
};

export default Header;
