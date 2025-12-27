import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import EligibilityDialog from "./EligibilityDialog";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MobileBottomActionsProps {
  menuOpen?: boolean;
}

const MobileBottomActions = ({ menuOpen = false }: MobileBottomActionsProps) => {
  const [eligibilityDialogOpen, setEligibilityDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('common');

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: t('nav.signOut'),
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  return (
    <>
      {/* Fixed Bottom Action Bar - Mobile and Tablet - Hidden when menu is open */}
      <AnimatePresence>
        {!menuOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[60]"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 8px), 8px)' }}
          >
          <div className="mx-3 mb-2 rounded-2xl bg-[hsl(178,48%,16%)] backdrop-blur-xl border border-white/30 shadow-2xl">
            <div className="px-4 py-4">
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEligibilityDialogOpen(true)}
                  className="flex-1 font-body font-semibold px-5 py-4 rounded-xl transition-all duration-300 ease-out active:scale-[0.96] shadow-lg bg-white/95 text-[hsl(178,48%,16%)] hover:bg-white border border-white/80 text-base cta-uniform relative z-10 touch-manipulation min-h-[56px]"
                >
                  {t('nav.checkEligibility')}
                </button>
                {user ? (
                  <button 
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 font-body font-semibold px-5 py-4 rounded-xl transition-all duration-300 ease-out active:scale-[0.96] shadow-lg bg-white/20 text-white hover:bg-white/30 border border-white/40 flex items-center justify-center gap-2 text-base cta-uniform relative z-10 touch-manipulation min-h-[56px]"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('nav.signOut')}
                  </button>
                ) : (
                  <Link 
                    to="/auth"
                    className="flex-1 font-body font-semibold px-5 py-4 rounded-xl transition-all duration-300 ease-out active:scale-[0.96] shadow-lg bg-white/20 text-white hover:bg-white/30 border border-white/40 text-center text-base cta-uniform relative z-10 touch-manipulation min-h-[56px] flex items-center justify-center"
                  >
                    {t('nav.patientLogin')}
                  </Link>
                )}
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Eligibility Dialog */}
      <EligibilityDialog open={eligibilityDialogOpen} onOpenChange={setEligibilityDialogOpen} />
    </>
  );
};

export default MobileBottomActions;
