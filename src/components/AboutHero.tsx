import ScrollAnimation from "@/components/ScrollAnimation";
import aboutHero from "@/assets/greenhouse-exterior-hq.jpg";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const AboutHero = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"]
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
  
  return (
    <section 
      className="py-12 sm:py-16 md:py-20 bg-background relative"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <ScrollAnimation>
            <div>
            <h2 className="font-inter text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-6" style={{ letterSpacing: '0.01em', lineHeight: '1.5' }}>
              Healing Buds: Advancing Global Cannabis Innovation
            </h2>
            <p className="font-inter text-base sm:text-lg text-foreground/80 leading-relaxed font-light">
              Committed to excellence in every product we create and championing worldwide cannabis acceptance through quality and integrity.
              </p>
            </div>
          </ScrollAnimation>
          
          <ScrollAnimation delay={0.2}>
            <div ref={imageRef} className="relative overflow-hidden rounded-2xl shadow-medium">
            <motion.img 
              style={{ y: imageY }}
              src={aboutHero} 
              alt="Cannabis cultivation facility with rows of plants" 
              className="rounded-2xl w-full h-auto scale-110"
            />
            {/* Decorative wave elements */}
            <svg 
              className="absolute -top-4 -right-4 w-24 h-24 text-secondary opacity-60" 
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M10 30 Q 30 10, 50 30 T 90 30" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                d="M10 50 Q 30 30, 50 50 T 90 50" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                d="M10 70 Q 30 50, 50 70 T 90 70" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
            </svg>
            <svg 
              className="absolute -bottom-4 -left-4 w-24 h-24 text-secondary opacity-60" 
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M10 30 Q 30 10, 50 30 T 90 30" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                d="M10 50 Q 30 30, 50 50 T 90 50" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              <path 
                d="M10 70 Q 30 50, 50 70 T 90 70" 
                stroke="currentColor" 
                strokeWidth="3" 
                fill="none"
              />
              </svg>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};

export default AboutHero;
