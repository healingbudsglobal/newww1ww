import { useState, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import BackToTop from "@/components/BackToTop";
import MobileBottomActions from "@/components/MobileBottomActions";
import { Plus } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import cultivationImage from "@/assets/greenhouse-exterior-hq.jpg";
import greenhouseRows from "@/assets/greenhouse-exterior-path.jpg";
import productionImage from "@/assets/water-irrigation-system.jpg";
import indoorCultivation from "@/assets/indoor-grow-facility.jpg";
import productionFacility from "@/assets/greenhouse-interior-infrastructure.jpg";
import researchLab from "@/assets/cannabis-jars-production.jpg";
import cannabisLineart1 from "@/assets/cannabis-lineart-1.png";
import cannabisLineart2 from "@/assets/cannabis-lineart-2.png";
import { Badge } from "@/components/ui/badge";

const CultivatingProcessing = () => {
  const [activeTab, setActiveTab] = useState<"southafrica" | "uk" | "thailand" | "portugal">("southafrica");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const toggleItem = (item: string) => {
    setExpandedItem(expandedItem === item ? null : item);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background pb-24 lg:pb-0">
        <Header onMenuStateChange={setMenuOpen} />
        <main className="pt-28 md:pt-32">
          {/* Hero Section with Staggered Animation */}
          <section className="bg-background py-16 md:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="max-w-5xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
              >
                <motion.h1 
                  className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  Cultivating & Processing
                </motion.h1>
                <motion.p 
                  className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl font-light"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Excellence in cultivation from South Africa to the world.
                </motion.p>
              </motion.div>
            </div>
          </section>

          {/* Hero Image with Parallax & Edge Fade */}
          <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
            <motion.div 
              ref={heroRef}
              className="relative h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <motion.img 
                src={cultivationImage}
                alt="Cannabis cultivation facility" 
                className="absolute inset-0 w-full h-full object-cover"
                style={{ y, opacity }}
              />
              {/* Animated edge fade vignette */}
              <motion.div 
                className="absolute inset-0 pointer-events-none z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.5 }}
                style={{
                  background: `
                    radial-gradient(ellipse 120% 80% at 50% 50%, transparent 40%, hsl(var(--background) / 0.3) 70%, hsl(var(--background) / 0.7) 100%),
                    linear-gradient(to bottom, transparent 60%, hsl(var(--background) / 0.5) 100%)
                  `
                }}
              />
              {/* Subtle animated glow on edges */}
              <motion.div 
                className="absolute inset-0 pointer-events-none z-10 rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  boxShadow: 'inset 0 0 60px 20px hsl(var(--background) / 0.4)'
                }}
              />
            </motion.div>
          </section>

          {/* Intro Section - Linear style */}
          <section className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid md:grid-cols-2 gap-16 md:gap-20 lg:gap-24 items-start max-w-7xl mx-auto">
                <ScrollAnimation>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground leading-[1.2] tracking-tight">
                    From seed to patient, we oversee every step of the cannabis journey. <span className="text-muted-foreground/70 font-normal">Our commitment to excellence begins at the source and extends through every stage of cultivation and processing.</span>
                  </h2>
                </ScrollAnimation>
                <ScrollAnimation delay={0.2}>
                  <div className="space-y-6 text-muted-foreground/80">
                    <p className="text-base md:text-lg leading-relaxed">
                      Our South African operations include a fully functional store and dispensary, alongside partner manufacturing facilities. We also operate partner factories in Thailand. Portugal serves as our main production, processing, and shipping hub—with UK operations launching soon, followed by Portugal going fully live.
                    </p>
                    <p className="text-base md:text-lg leading-relaxed">
                      Our approach combines traditional horticultural expertise with modern precision agriculture. By maintaining rigorous quality protocols and investing in sustainable growing practices, we ensure that every batch meets international medical cannabis standards while delivering consistent therapeutic profiles.
                    </p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {/* Why Partner With Us Section - Linear style */}
          <section className="py-20 md:py-32 relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
            {/* Subtle line art decorations */}
            <motion.img 
              src={cannabisLineart1} 
              alt="" 
              className="absolute -top-10 -left-10 w-48 md:w-64 h-auto opacity-[0.04] pointer-events-none"
              initial={{ opacity: 0, rotate: -10 }}
              whileInView={{ opacity: 0.04, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
            />
            <motion.img 
              src={cannabisLineart2} 
              alt="" 
              className="absolute -bottom-10 -right-10 w-48 md:w-64 h-auto opacity-[0.04] pointer-events-none rotate-180"
              initial={{ opacity: 0, rotate: 190 }}
              whileInView={{ opacity: 0.04, rotate: 180 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 }}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <ScrollAnimation>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 md:mb-20">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white tracking-tight">
                      Why choose us as your partner?
                    </h2>
                    <a 
                      href="/contact"
                      className="inline-flex items-center gap-2 text-white text-sm md:text-base border border-white/30 hover:bg-white/10 hover:border-white/50 px-6 md:px-7 py-2.5 md:py-3 rounded-lg transition-all duration-200 whitespace-nowrap font-medium backdrop-blur-sm"
                    >
                      Partner with us
                    </a>
                  </div>
                </ScrollAnimation>

                <div className="space-y-2">
                  {/* Expert cultivators */}
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200">
                    <button 
                      onClick={() => toggleItem('cultivators')}
                      className="w-full flex items-center justify-between p-6 md:p-7 text-left transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">Expert cultivators</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'cultivators' ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'cultivators' ? 'auto' : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-7 pb-6 md:pb-7">
                        <p className="text-white/70 text-base md:text-lg leading-relaxed">
                          Our multidisciplinary team brings together agricultural scientists, pharmaceutical specialists, and master growers with decades of combined experience. Operating state-licensed facilities across multiple jurisdictions, we've established ourselves as pioneers in regulated medical cannabis cultivation, setting benchmarks for quality and compliance.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Global reach, seamless supply */}
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200">
                    <button 
                      onClick={() => toggleItem('global')}
                      className="w-full flex items-center justify-between p-6 md:p-7 text-left transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">Global reach, seamless supply</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'global' ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'global' ? 'auto' : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-7 pb-6 md:pb-7">
                        <p className="text-white/70 text-base md:text-lg leading-relaxed">
                          With operational facilities spanning three continents and strategic partnerships in emerging markets, we ensure uninterrupted supply chains and rapid market access. Our multi-jurisdiction approach enables us to meet diverse regulatory requirements while maintaining consistent product quality worldwide.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Precision cultivation & innovation */}
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200">
                    <button 
                      onClick={() => toggleItem('precision')}
                      className="w-full flex items-center justify-between p-6 md:p-7 text-left transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">Precision cultivation & innovation</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'precision' ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'precision' ? 'auto' : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-7 pb-6 md:pb-7">
                        <p className="text-white/70 text-base md:text-lg leading-relaxed">
                          Our facilities utilize automated environmental controls, AI-powered growth monitoring, and precision irrigation systems. From clone selection to final cure, every variable is measured, tracked, and optimized to produce consistent cannabinoid profiles and terpene expressions across all production cycles.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Sustainable & standards-driven */}
                  <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200">
                    <button 
                      onClick={() => toggleItem('sustainable')}
                      className="w-full flex items-center justify-between p-6 md:p-7 text-left transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl font-medium text-white tracking-tight">Sustainable & standards-driven</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'sustainable' ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex-shrink-0"
                      >
                        <Plus className="w-5 h-5 md:w-6 md:h-6 text-white/70" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'sustainable' ? 'auto' : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 md:px-7 pb-6 md:pb-7">
                        <p className="text-white/70 text-base md:text-lg leading-relaxed">
                          Environmental stewardship drives our operations. We employ water reclamation systems, renewable energy sources, and organic pest management programs. All facilities maintain comprehensive certifications including Good Agricultural and Collection Practices (GACP) and operate under strict regulatory oversight.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Where We Cultivate Section - Linear style */}
          <section className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground text-center mb-16 md:mb-20 tracking-tight">
                  Our global cultivation network
                </h2>
              </ScrollAnimation>

              {/* Tabs - Linear style */}
              <ScrollAnimation variant="fade" delay={0.1}>
                <div className="flex justify-center gap-1 mb-12 md:mb-16 flex-wrap">
                  <button
                    onClick={() => setActiveTab("southafrica")}
                    className={`px-6 md:px-8 py-2.5 font-medium transition-all duration-200 rounded-lg ${
                      activeTab === "southafrica"
                        ? "text-foreground bg-foreground/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    South Africa
                  </button>
                  <button
                    onClick={() => setActiveTab("thailand")}
                    className={`px-6 md:px-8 py-2.5 font-medium transition-all duration-200 rounded-lg ${
                      activeTab === "thailand"
                        ? "text-foreground bg-foreground/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    Thailand
                  </button>
                  <button
                    onClick={() => setActiveTab("uk")}
                    className={`px-6 md:px-8 py-2.5 font-medium transition-all duration-200 rounded-lg ${
                      activeTab === "uk"
                        ? "text-foreground bg-foreground/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    United Kingdom
                  </button>
                  <button
                    onClick={() => setActiveTab("portugal")}
                    className={`px-6 md:px-8 py-2.5 font-medium transition-all duration-200 rounded-lg ${
                      activeTab === "portugal"
                        ? "text-foreground bg-foreground/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    Portugal
                  </button>
                </div>
              </ScrollAnimation>

              {/* Content - Linear style */}
              {activeTab === "southafrica" && (
                <ScrollAnimation>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">
                    <div className="order-2 md:order-1 space-y-6">
                      <div className="flex items-center gap-3">
                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">South Africa</h3>
                        <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 text-xs font-medium">Live</Badge>
                      </div>
                      <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                        Our flagship South African facility represents the cornerstone of our African operations. Leveraging the region's favorable climate and progressive regulatory framework, we've established a sophisticated cultivation center that serves as our primary launch market. The facility employs advanced greenhouse technology optimized for the local environment, ensuring year-round production of premium medical cannabis.
                      </p>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-card order-1 md:order-2 border border-border/30 hover-lift">
                      <img 
                        src={greenhouseRows} 
                        alt="South Africa cultivation facility" 
                        className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>
                </ScrollAnimation>
              )}

              {activeTab === "thailand" && (
                <ScrollAnimation>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">
                    <div className="order-2 md:order-1 space-y-6">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">Thailand</h3>
                      <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                        Our Thai operations leverage Thailand's progressive cannabis regulations and deep-rooted cultivation traditions. Through strategic partnerships with local manufacturing facilities, we tap into generations of expertise while implementing our rigorous quality standards. The region's tropical climate provides ideal growing conditions, enabling year-round production of premium cannabis cultivars for the Asian and global markets.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Factory Operations
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-card order-1 md:order-2 border border-border/30 hover-lift">
                      <img 
                        src={productionImage} 
                        alt="Thailand partner manufacturing facility" 
                        className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>
                </ScrollAnimation>
              )}

              {activeTab === "uk" && (
                <ScrollAnimation>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">
                    <div className="order-2 md:order-1 space-y-6">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">United Kingdom</h3>
                      <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                        Our UK facility serves the European medical market with GMP-certified production capabilities. Combining local agricultural expertise with our proven cultivation methodologies, we're positioned to meet the stringent regulatory requirements and growing market demands across Europe. The UK operations are launching soon, establishing a strong presence in one of the world's most regulated cannabis markets.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-card order-1 md:order-2 border border-border/30 hover-lift">
                      <img 
                        src={indoorCultivation} 
                        alt="UK cultivation facility" 
                        className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>
                </ScrollAnimation>
              )}

              {activeTab === "portugal" && (
                <ScrollAnimation>
                  <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-6xl mx-auto">
                    <div className="order-2 md:order-1 space-y-6">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">Portugal</h3>
                      <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                        Portugal serves as our main production, processing, and shipping hub for European markets. With EU-GMP certification and strategic location for continental distribution, the Portuguese facility is positioned to become the backbone of our European operations. Following the UK launch, Portugal will go fully live, providing seamless access to EU markets with premium medical cannabis products manufactured to the highest pharmaceutical standards.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          Coming Soon
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20">
                          EU Hub
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden shadow-card order-1 md:order-2 border border-border/30 hover-lift">
                      <img 
                        src={productionFacility} 
                        alt="Portugal EU production hub" 
                        className="w-full h-64 md:h-96 object-cover hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                  </div>
                </ScrollAnimation>
              )}
            </div>
          </section>

          {/* Processing Section */}
          <section className="py-16 md:py-24 bg-muted/20 relative overflow-hidden">
            {/* Subtle line art decorations */}
            <motion.img 
              src={cannabisLineart2} 
              alt="" 
              className="absolute top-1/4 -right-16 w-40 md:w-56 h-auto opacity-[0.03] pointer-events-none -rotate-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.03 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">Post-harvest excellence</h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-12 md:mb-16 leading-relaxed">
                  Every stage of our processing workflow is designed to preserve cannabinoid integrity and enhance therapeutic value. Our controlled-environment facilities ensure optimal conditions from harvest through final packaging.
                </p>
              </ScrollAnimation>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                <ScrollAnimation delay={0.1}>
                  <div className="group bg-background rounded-2xl overflow-hidden shadow-elegant hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 hover:border-border">
                    <div className="h-48 md:h-56 overflow-hidden bg-muted">
                      <img 
                        src={indoorCultivation} 
                        alt="Harvesting cannabis" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">Selective Harvesting</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Our cultivation specialists monitor trichome development and cannabinoid ratios to determine optimal harvest timing for each cultivar. Hand-trimming techniques preserve delicate trichome structures while removing excess plant material.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div className="group bg-background rounded-2xl overflow-hidden shadow-elegant hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 hover:border-border">
                    <div className="h-48 md:h-56 overflow-hidden bg-muted">
                      <img 
                        src={productionFacility} 
                        alt="Purification and refinement process" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">Controlled Curing & Drying</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Temperature and humidity-controlled drying rooms ensure gradual moisture reduction while preserving terpene profiles. Multi-week curing cycles in precision climate chambers enhance flavor complexity and product stability.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.3}>
                  <div className="group bg-background rounded-2xl overflow-hidden shadow-elegant hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 hover:border-border sm:col-span-2 lg:col-span-1">
                    <div className="h-48 md:h-56 overflow-hidden bg-muted">
                      <img 
                        src={researchLab} 
                        alt="Quality control testing" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <div className="p-6 md:p-8">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4 tracking-tight">Laboratory Testing</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Comprehensive testing protocols analyze potency, terpene profiles, moisture content, and screen for contaminants. Third-party laboratory verification provides independent quality assurance for every production batch.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="py-16 md:py-24 relative overflow-hidden" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
            {/* Subtle line art decoration */}
            <motion.img 
              src={cannabisLineart1} 
              alt="" 
              className="absolute top-8 right-8 w-32 md:w-44 h-auto opacity-[0.05] pointer-events-none rotate-12"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 0.05, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <ScrollAnimation>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">Stay informed</h2>
                  <p className="text-white/80 text-lg md:text-xl mb-10 md:mb-12 leading-relaxed">
                    Subscribe to receive updates on our expansion, product launches, and industry insights.
                  </p>
                </ScrollAnimation>
                
                <ScrollAnimation delay={0.2}>
                  <form className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="px-5 py-3.5 rounded-lg bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all duration-300"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="px-5 py-3.5 rounded-lg bg-white/10 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/50 transition-all duration-300"
                    />
                    <button
                      type="submit"
                      className="sm:col-span-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/40 hover:border-white/60 text-white rounded-lg transition-all duration-300 font-semibold hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Sign up
                    </button>
                  </form>
                </ScrollAnimation>
              </div>
            </div>
          </section>
        </main>
        <Footer />
        <BackToTop />
        <MobileBottomActions menuOpen={menuOpen} />
      </div>
    </PageTransition>
  );
};

export default CultivatingProcessing;
