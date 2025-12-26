import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface Particle {
  id: number;
  // Turbulence keyframes for wavy path
  xPath: number[];
  yPath: number[];
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  blur: number;
}

interface Wisp {
  id: number;
  xPath: number[];
  yPath: number[];
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

interface SmokeParticlesProps {
  isActive: boolean;
  particleCount?: number;
  color?: string;
}

export const SmokeParticles = ({ 
  isActive, 
  particleCount = 18,
  color = "hsl(var(--primary))"
}: SmokeParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wisps, setWisps] = useState<Wisp[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const wispIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wispIdRef = useRef(0);

  // Generate burst particles on activation
  useEffect(() => {
    if (isActive) {
      setIsFadingOut(false);
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
        // Smoke rises upward with turbulent horizontal drift
        const baseX = (Math.random() - 0.5) * 30;
        const riseHeight = -(Math.random() * 90 + 60);
        
        // Create wavy turbulence path with 5 keyframes
        const turbulence1 = (Math.random() - 0.5) * 25;
        const turbulence2 = (Math.random() - 0.5) * 35;
        const turbulence3 = (Math.random() - 0.5) * 20;
        
        return {
          id: i,
          xPath: [0, baseX + turbulence1, baseX - turbulence2, baseX + turbulence3, baseX + (Math.random() - 0.5) * 40],
          yPath: [0, riseHeight * 0.25, riseHeight * 0.5, riseHeight * 0.75, riseHeight],
          size: Math.random() * 45 + 28,
          duration: Math.random() * 2.2 + 1.8,
          delay: Math.random() * 0.3,
          rotation: (Math.random() - 0.5) * 120,
          blur: Math.random() * 1.5 + 0.5,
        };
      });
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, particleCount]);

  // Continuous wisps while active
  useEffect(() => {
    if (isActive) {
      // Generate initial wisps
      const initialWisps: Wisp[] = Array.from({ length: 4 }, () => createWisp());
      setWisps(initialWisps);

      // Continuously spawn new wisps
      wispIntervalRef.current = setInterval(() => {
        setWisps(prev => {
          // Remove old wisps (keep last 8)
          const trimmed = prev.slice(-8);
          return [...trimmed, createWisp()];
        });
      }, 400);
    } else {
      // Fade out - stop spawning but let existing wisps finish
      if (wispIntervalRef.current) {
        clearInterval(wispIntervalRef.current);
        wispIntervalRef.current = null;
      }
      setIsFadingOut(true);
      // Clear wisps after fade animation
      const fadeTimer = setTimeout(() => {
        setWisps([]);
        setIsFadingOut(false);
      }, 1500);
      return () => clearTimeout(fadeTimer);
    }

    return () => {
      if (wispIntervalRef.current) {
        clearInterval(wispIntervalRef.current);
      }
    };
  }, [isActive]);

  const createWisp = (): Wisp => {
    wispIdRef.current += 1;
    // Wisps rise upward with gentle swaying turbulence
    const baseX = (Math.random() - 0.5) * 20;
    const riseHeight = -(Math.random() * 70 + 35);
    
    // Wavy path for organic movement
    const sway1 = (Math.random() - 0.5) * 18;
    const sway2 = (Math.random() - 0.5) * 22;
    
    return {
      id: wispIdRef.current,
      xPath: [0, baseX + sway1, baseX - sway2, baseX + sway1 * 0.5],
      yPath: [0, riseHeight * 0.35, riseHeight * 0.7, riseHeight],
      size: Math.random() * 32 + 20,
      duration: Math.random() * 2.4 + 2.2,
      delay: 0,
      rotation: (Math.random() - 0.5) * 80,
    };
  };

  return (
    <>
      {/* Continuous subtle wisps */}
      <AnimatePresence>
        {(isActive || isFadingOut) && wisps.map((wisp) => (
          <motion.div
            key={`wisp-${wisp.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: wisp.size,
              height: wisp.size,
              background: `radial-gradient(ellipse at 50% 50%, 
                rgba(255,255,255,0.5) 0%, 
                rgba(200,210,205,0.35) 25%,
                rgba(180,190,185,0.2) 50%, 
                transparent 80%)`,
              filter: "blur(1.5px)",
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0, 
              scale: 0.6,
              rotate: 0,
            }}
            animate={{ 
              x: wisp.xPath,
              y: wisp.yPath,
              opacity: isFadingOut ? [0.5, 0] : [0, 0.55, 0.5, 0],
              scale: [0.6, 1.0, 1.3, 1.5],
              rotate: wisp.rotation,
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5 }
            }}
            transition={{ 
              duration: wisp.duration,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.3, 0.65, 1],
            }}
          />
        ))}
      </AnimatePresence>

      {/* Burst particles on hover start */}
      <AnimatePresence>
        {isActive && particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: particle.size,
              height: particle.size,
              background: `radial-gradient(ellipse at 45% 45%, 
                rgba(255,255,255,0.75) 0%, 
                rgba(220,225,222,0.55) 20%,
                rgba(180,190,185,0.35) 45%, 
                rgba(150,160,155,0.15) 65%,
                transparent 80%)`,
              filter: `blur(${particle.blur}px)`,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0.8, 
              scale: 0.4,
              rotate: 0,
            }}
            animate={{ 
              x: particle.xPath,
              y: particle.yPath,
              opacity: [0.8, 0.7, 0.55, 0.3, 0], 
              scale: [0.4, 0.8, 1.1, 1.4, 1.7],
              rotate: particle.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: particle.duration, 
              delay: particle.delay,
              ease: [0.4, 0, 0.15, 1],
              times: [0, 0.2, 0.45, 0.7, 1],
            }}
          />
        ))}
      </AnimatePresence>
    </>
  );
};
