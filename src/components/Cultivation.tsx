import ScrollAnimation from "@/components/ScrollAnimation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import cultivationImage from "@/assets/cultivation-contrast-hq.jpg";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const Cultivation = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  
  return (
    <section className="bg-background py-12 sm:py-16 md:py-20 px-2">
      <div className="max-w-[1920px] mx-auto px-2">
        <ScrollAnimation>
          <div ref={imageRef} className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl group">
          <motion.img 
            style={{ y: imageY }}
            src={cultivationImage} 
            alt="Indoor cannabis cultivation facility with advanced lighting" 
            className="w-full h-[450px] sm:h-[400px] md:h-[500px] object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent sm:from-background/80 sm:via-background/40" />
          
          <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-16">
            <h2 className="font-pharma text-2xl sm:text-4xl md:text-5xl font-semibold text-foreground mb-3 sm:mb-6 max-w-2xl drop-shadow-sm tracking-tight leading-tight">
              Production & Processing Excellence
            </h2>
            <p className="font-body text-foreground/90 text-xs sm:text-base md:text-lg leading-relaxed max-w-2xl mb-4 sm:mb-8 drop-shadow-sm">
              Our state-of-the-art facilities across Canada and Portugal span more than 30,000 square meters dedicated to pharmaceutical-grade cannabis production. From seed selection through harvesting and processing, we maintain rigorous oversight at every production stage. Each batch undergoes comprehensive testing, precise trimming, controlled drying and curing, and careful packaging to ensure consistent quality that meets stringent third-party standards.
            </p>
            <Link 
              to="/what-we-do" 
              className="font-body text-primary hover:text-primary/80 font-semibold text-sm sm:text-lg transition-all inline-flex items-center gap-2 group/link"
            >
              Discover our production standards 
              <span className="transition-transform group-hover/link:translate-x-1">→</span>
            </Link>
          </div>

          {/* Navigation arrows - hidden on mobile */}
          <div className="hidden sm:flex absolute bottom-8 right-8 gap-3">
            <button className="w-12 h-12 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/10 flex items-center justify-center text-primary transition-all backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 rounded-full border-2 border-primary/30 hover:border-primary hover:bg-primary/10 flex items-center justify-center text-primary transition-all backdrop-blur-sm">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default Cultivation;
