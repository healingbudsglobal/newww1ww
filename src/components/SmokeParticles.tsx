import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";

interface Particle {
  id: number;
  xPath: number[];
  yPath: number[];
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  rotationEnd: number;
  blur: number;
  swirlIntensity: number;
}

interface Wisp {
  id: number;
  xPath: number[];
  yPath: number[];
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  rotationEnd: number;
  swirlIntensity: number;
}

interface SmokeParticlesProps {
  isActive: boolean;
  particleCount?: number;
  spawnRate?: number; // ms between wisp spawns
  density?: 'light' | 'medium' | 'heavy';
  color?: string;
}

const densityConfig = {
  light: { particleMultiplier: 0.6, maxWisps: 5, spawnRate: 600 },
  medium: { particleMultiplier: 1, maxWisps: 8, spawnRate: 400 },
  heavy: { particleMultiplier: 1.5, maxWisps: 12, spawnRate: 250 },
};

export const SmokeParticles = ({ 
  isActive, 
  particleCount = 18,
  spawnRate,
  density = 'medium',
  color = "hsl(var(--primary))"
}: SmokeParticlesProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wisps, setWisps] = useState<Wisp[]>([]);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const wispIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wispIdRef = useRef(0);

  const config = densityConfig[density];
  const effectiveSpawnRate = spawnRate ?? config.spawnRate;
  const effectiveParticleCount = Math.round(particleCount * config.particleMultiplier);

  // Generate burst particles on activation
  useEffect(() => {
    if (isActive) {
      setIsFadingOut(false);
      const newParticles: Particle[] = Array.from({ length: effectiveParticleCount }, (_, i) => {
        const baseX = (Math.random() - 0.5) * 35;
        const riseHeight = -(Math.random() * 100 + 70);
        
        // Create wavy turbulence path with 5 keyframes
        const turbulence1 = (Math.random() - 0.5) * 30;
        const turbulence2 = (Math.random() - 0.5) * 40;
        const turbulence3 = (Math.random() - 0.5) * 25;
        
        return {
          id: i,
          xPath: [0, baseX + turbulence1, baseX - turbulence2, baseX + turbulence3, baseX + (Math.random() - 0.5) * 45],
          yPath: [0, riseHeight * 0.25, riseHeight * 0.5, riseHeight * 0.75, riseHeight],
          size: Math.random() * 50 + 32,
          duration: Math.random() * 2.5 + 2,
          delay: Math.random() * 0.35,
          rotation: (Math.random() - 0.5) * 60,
          rotationEnd: (Math.random() - 0.5) * 180 + (Math.random() > 0.5 ? 120 : -120),
          blur: Math.random() * 2 + 0.5,
          swirlIntensity: Math.random() * 0.4 + 0.3,
        };
      });
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isActive, effectiveParticleCount]);

  // Continuous wisps while active
  useEffect(() => {
    if (isActive) {
      const initialWisps: Wisp[] = Array.from({ length: Math.ceil(config.maxWisps / 2) }, () => createWisp());
      setWisps(initialWisps);

      wispIntervalRef.current = setInterval(() => {
        setWisps(prev => {
          const trimmed = prev.slice(-config.maxWisps);
          return [...trimmed, createWisp()];
        });
      }, effectiveSpawnRate);
    } else {
      if (wispIntervalRef.current) {
        clearInterval(wispIntervalRef.current);
        wispIntervalRef.current = null;
      }
      setIsFadingOut(true);
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
  }, [isActive, effectiveSpawnRate, config.maxWisps]);

  const createWisp = (): Wisp => {
    wispIdRef.current += 1;
    const baseX = (Math.random() - 0.5) * 25;
    const riseHeight = -(Math.random() * 80 + 40);
    
    const sway1 = (Math.random() - 0.5) * 22;
    const sway2 = (Math.random() - 0.5) * 28;
    
    return {
      id: wispIdRef.current,
      xPath: [0, baseX + sway1, baseX - sway2, baseX + sway1 * 0.5],
      yPath: [0, riseHeight * 0.35, riseHeight * 0.7, riseHeight],
      size: Math.random() * 38 + 24,
      duration: Math.random() * 2.6 + 2.4,
      delay: 0,
      rotation: (Math.random() - 0.5) * 40,
      rotationEnd: (Math.random() - 0.5) * 160 + (Math.random() > 0.5 ? 100 : -100),
      swirlIntensity: Math.random() * 0.3 + 0.2,
    };
  };

  // Swirl SVG shape
  const SwirlShape = ({ size, intensity }: { size: number; intensity: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="smokeGradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="25%" stopColor="rgba(230,235,232,0.55)" />
          <stop offset="50%" stopColor="rgba(200,210,205,0.35)" />
          <stop offset="75%" stopColor="rgba(170,180,175,0.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="smokeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>
      {/* Main swirl body */}
      <path
        d={`M 50 50 
            Q ${45 - intensity * 20} ${30 - intensity * 10}, ${35 - intensity * 15} ${45}
            Q ${25 - intensity * 10} ${55 + intensity * 5}, ${40} ${65 + intensity * 10}
            Q ${55 + intensity * 15} ${75 + intensity * 5}, ${65 + intensity * 10} ${55}
            Q ${75 + intensity * 5} ${40 - intensity * 5}, ${55} ${35 - intensity * 10}
            Q ${45} ${30}, 50 50`}
        fill="url(#smokeGradient)"
        filter="url(#smokeBlur)"
      />
      {/* Secondary swirl tendril */}
      <ellipse
        cx={55 + intensity * 10}
        cy={40 - intensity * 5}
        rx={15 + intensity * 8}
        ry={10 + intensity * 5}
        fill="url(#smokeGradient)"
        filter="url(#smokeBlur)"
        opacity="0.6"
        transform={`rotate(${-25 + intensity * 20} 55 40)`}
      />
    </svg>
  );

  return (
    <>
      {/* Subtle shadow layer beneath smoke */}
      <AnimatePresence>
        {(isActive || isFadingOut) && wisps.slice(0, 3).map((wisp) => (
          <motion.div
            key={`shadow-${wisp.id}`}
            className="absolute pointer-events-none"
            style={{
              width: wisp.size * 0.8,
              height: wisp.size * 0.3,
              background: `radial-gradient(ellipse at 50% 50%, 
                rgba(0,0,0,0.08) 0%, 
                rgba(0,0,0,0.04) 40%,
                transparent 70%)`,
              filter: "blur(4px)",
              borderRadius: "50%",
            }}
            initial={{ 
              x: 0, 
              y: 8, 
              opacity: 0, 
              scale: 0.5,
            }}
            animate={{ 
              x: wisp.xPath.map(x => x * 0.3),
              y: 8,
              opacity: isFadingOut ? [0.3, 0] : [0, 0.35, 0.3, 0],
              scale: [0.5, 0.8, 1, 1.2],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: wisp.duration * 0.8,
              ease: [0.4, 0, 0.2, 1],
              times: [0, 0.3, 0.65, 1],
            }}
          />
        ))}
      </AnimatePresence>

      {/* Continuous subtle wisps */}
      <AnimatePresence>
        {(isActive || isFadingOut) && wisps.map((wisp) => (
          <motion.div
            key={`wisp-${wisp.id}`}
            className="absolute pointer-events-none"
            style={{
              width: wisp.size,
              height: wisp.size,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0, 
              scale: 0.5,
              rotate: wisp.rotation,
            }}
            animate={{ 
              x: wisp.xPath,
              y: wisp.yPath,
              opacity: isFadingOut ? [0.5, 0] : [0, 0.6, 0.5, 0],
              scale: [0.5, 0.9, 1.2, 1.5],
              rotate: wisp.rotationEnd,
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.5 }
            }}
            transition={{ 
              duration: wisp.duration,
              ease: [0.4, 0, 0.15, 1],
              times: [0, 0.3, 0.65, 1],
            }}
          >
            <SwirlShape size={wisp.size} intensity={wisp.swirlIntensity} />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Burst particles on hover start */}
      <AnimatePresence>
        {isActive && particles.map((particle) => (
          <motion.div
            key={`particle-${particle.id}`}
            className="absolute pointer-events-none"
            style={{
              width: particle.size,
              height: particle.size,
              filter: `blur(${particle.blur}px)`,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0.8, 
              scale: 0.35,
              rotate: particle.rotation,
            }}
            animate={{ 
              x: particle.xPath,
              y: particle.yPath,
              opacity: [0.8, 0.7, 0.5, 0.25, 0], 
              scale: [0.35, 0.7, 1.0, 1.4, 1.8],
              rotate: particle.rotationEnd,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: particle.duration, 
              delay: particle.delay,
              ease: [0.4, 0, 0.1, 1],
              times: [0, 0.2, 0.45, 0.7, 1],
            }}
          >
            <SwirlShape size={particle.size} intensity={particle.swirlIntensity} />
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
};