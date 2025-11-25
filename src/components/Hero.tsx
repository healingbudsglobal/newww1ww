import React from "react";
import hbLogoSquare from "@/assets/hb-logo-square.png";
import { ChevronDown } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const Hero = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay failed:", error);
      });
    }
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative min-h-screen flex items-center overflow-hidden pt-28 sm:pt-36 md:pt-44 bg-background"
    >
      {/* Video Background with Parallax */}
      <motion.div 
        style={{ y: videoY }}
        className="absolute left-2 right-2 top-24 sm:top-28 md:top-32 bottom-4 rounded-2xl sm:rounded-3xl overflow-hidden z-0 shadow-2xl"
      >
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          loop 
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Enhanced gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F2A25]/60 to-[#13303D]/55" />
      </motion.div>
      
      <motion.div 
        style={{ y: contentY, opacity }}
        className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-24 md:py-32"
      >
        <div className="max-w-5xl text-left relative">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-pharma text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold text-white mb-6 sm:mb-8 leading-[1.1] tracking-tight drop-shadow-lg"
          >
            Welcome to{" "}
            <span className="block mt-3">Healing Buds</span>
          </motion.h1>
          
          {/* Transparent logo overlay - subtle without pulsing */}
          <motion.img 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            src={hbLogoSquare} 
            alt="" 
            className="hidden md:block absolute -right-8 md:right-4 lg:right-12 top-1/2 -translate-y-1/2 w-[380px] md:w-[480px] lg:w-[560px] h-auto pointer-events-none"
          />
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
            className="font-body text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-2xl font-light leading-relaxed drop-shadow-md"
          >
            Pioneering tomorrow's medical cannabis solutions
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1, ease: [0.25, 0.4, 0.25, 1] }}
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-white/80 hover:text-white transition-all duration-300 animate-bounce cursor-pointer"
        aria-label="Scroll to content"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.button>
    </section>
  );
};

export default Hero;
