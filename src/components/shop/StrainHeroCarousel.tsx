/**
 * StrainHeroCarousel - Animated marquee of featured strains
 * Auto-scrolling glassmorphism cards with strain details.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

const categoryColors: Record<string, string> = {
  sativa: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  indica: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  hybrid: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

function StrainCard({ strain }: { strain: { id: string; name: string; category: string; thcContent: number; cbdContent: number; retailPrice: number } }) {
  const navigate = useNavigate();
  const cat = strain.category?.toLowerCase() || 'hybrid';
  const colorClass = categoryColors[cat] || categoryColors.hybrid;

  return (
    <button
      onClick={() => navigate(`/shop/${strain.id}`)}
      className={cn(
        "flex-shrink-0 w-[220px] p-4 rounded-2xl cursor-pointer",
        "bg-white/[0.07] backdrop-blur-md border border-white/10",
        "hover:bg-white/[0.12] hover:scale-[1.03] hover:shadow-lg hover:shadow-primary/10",
        "transition-all duration-300 text-left group"
      )}
    >
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", colorClass)}>
            {cat}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white truncate group-hover:text-[hsl(var(--navbar-gold))] transition-colors">
          {strain.name}
        </h3>
        <div className="flex gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
            THC {strain.thcContent}%
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
            CBD {strain.cbdContent}%
          </span>
        </div>
      </div>
    </button>
  );
}

export function StrainHeroCarousel() {
  const { products, isLoading } = useProducts();
  const featured = products?.slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="flex-shrink-0 w-[220px] h-[110px] rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (featured.length === 0) return null;

  // Duplicate for infinite scroll
  const items = [...featured, ...featured];

  return (
    <section className="py-6 overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 text-center"
        >
          Featured Cultivars
        </motion.p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
          {items.map((strain, i) => (
            <StrainCard key={`${strain.id}-${i}`} strain={strain} />
          ))}
        </div>
      </div>
    </section>
  );
}
