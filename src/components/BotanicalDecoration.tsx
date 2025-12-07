import { cn } from "@/lib/utils";

interface BotanicalDecorationProps {
  variant?: 'leaf' | 'branch' | 'corner' | 'divider' | 'organic-wave' | 'cannabis-leaf';
  className?: string;
}

// Reusable botanical decoration component for consistent brand visuals
// Replaces generic wave shapes with organic, cannabis-inspired motifs
export const BotanicalDecoration = ({ variant = 'leaf', className }: BotanicalDecorationProps) => {
  // Organic wave - replaces generic wave decorations
  if (variant === 'organic-wave') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 400 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        {/* Organic curved line inspired by cannabis leaf curves */}
        <path 
          d="M0 40 C 50 20, 80 60, 130 35 S 180 55, 230 40 S 280 20, 330 45 S 370 30, 400 40" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M0 50 C 60 35, 90 65, 140 45 S 190 60, 240 48 S 290 35, 340 52 S 380 40, 400 50" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.2"
        />
        {/* Subtle leaf accents along the wave */}
        <path 
          d="M80 38 Q 75 28, 85 25" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
        <path 
          d="M200 42 Q 195 32, 205 28" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
        <path 
          d="M320 48 Q 315 38, 325 35" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
        {/* Small decorative dots */}
        <circle cx="85" cy="25" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="205" cy="28" r="2" fill="currentColor" opacity="0.2" />
        <circle cx="325" cy="35" r="2" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }

  // Cannabis leaf silhouette - elegant brand motif
  if (variant === 'cannabis-leaf') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized cannabis leaf - elegant and subtle */}
        {/* Main stem */}
        <path 
          d="M50 115 L50 60" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          opacity="0.4"
        />
        {/* Center leaflet */}
        <path 
          d="M50 60 Q 50 35, 50 15 Q 48 25, 45 35 Q 48 40, 50 45 Q 52 40, 55 35 Q 52 25, 50 15" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.35"
        />
        {/* Left leaflets */}
        <path 
          d="M50 65 Q 35 55, 15 40 Q 28 52, 40 58 Q 32 48, 20 35" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M50 75 Q 40 68, 25 60 Q 35 65, 42 70" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
        {/* Right leaflets */}
        <path 
          d="M50 65 Q 65 55, 85 40 Q 72 52, 60 58 Q 68 48, 80 35" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M50 75 Q 60 68, 75 60 Q 65 65, 58 70" 
          stroke="currentColor" 
          strokeWidth="1" 
          strokeLinecap="round"
          fill="none"
          opacity="0.25"
        />
        {/* Subtle details */}
        <circle cx="50" cy="15" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="15" cy="40" r="1.5" fill="currentColor" opacity="0.2" />
        <circle cx="85" cy="40" r="1.5" fill="currentColor" opacity="0.2" />
      </svg>
    );
  }

  if (variant === 'leaf') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main leaf stem */}
        <path 
          d="M60 100 Q 60 60, 60 20" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
        {/* Left leaf curves */}
        <path 
          d="M60 80 Q 30 70, 20 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M60 60 Q 35 50, 25 35" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M60 40 Q 40 32, 35 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Right leaf curves */}
        <path 
          d="M60 80 Q 90 70, 100 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <path 
          d="M60 60 Q 85 50, 95 35" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M60 40 Q 80 32, 85 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Small decorative circles */}
        <circle cx="20" cy="50" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="100" cy="50" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="60" cy="15" r="4" fill="currentColor" opacity="0.4" />
      </svg>
    );
  }

  if (variant === 'branch') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 200 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main branch */}
        <path 
          d="M10 40 Q 50 35, 100 40 T 190 40" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        {/* Small leaves along branch */}
        <path 
          d="M40 40 Q 35 25, 45 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M70 38 Q 75 55, 65 60" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M100 40 Q 95 25, 105 18" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M130 42 Q 135 58, 125 62" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        <path 
          d="M160 40 Q 155 25, 165 20" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        {/* Decorative dots */}
        <circle cx="45" cy="20" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="65" cy="60" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="105" cy="18" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="125" cy="62" r="2" fill="currentColor" opacity="0.3" />
        <circle cx="165" cy="20" r="2" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }

  if (variant === 'corner') {
    return (
      <svg 
        className={cn("text-primary", className)}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corner curve */}
        <path 
          d="M10 90 Q 10 50, 50 50 T 90 10" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
        {/* Small leaf accents */}
        <path 
          d="M25 70 Q 15 60, 20 50" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M50 50 Q 55 40, 65 42" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        <path 
          d="M70 30 Q 80 25, 85 15" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
        {/* Dots */}
        <circle cx="20" cy="50" r="3" fill="currentColor" opacity="0.25" />
        <circle cx="65" cy="42" r="2" fill="currentColor" opacity="0.25" />
        <circle cx="85" cy="15" r="2" fill="currentColor" opacity="0.25" />
      </svg>
    );
  }

  // Divider variant
  return (
    <svg 
      className={cn("text-primary", className)}
      viewBox="0 0 300 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central leaf */}
      <path 
        d="M150 35 Q 150 20, 150 5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path 
        d="M150 25 Q 135 18, 130 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path 
        d="M150 25 Q 165 18, 170 8" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* Lines extending outward */}
      <path 
        d="M120 20 L 30 20" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
      <path 
        d="M180 20 L 270 20" 
        stroke="currentColor" 
        strokeWidth="1" 
        strokeLinecap="round"
        fill="none"
        opacity="0.2"
      />
      {/* End dots */}
      <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="270" cy="20" r="2" fill="currentColor" opacity="0.3" />
      <circle cx="150" cy="5" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
};

export default BotanicalDecoration;
