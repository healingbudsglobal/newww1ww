import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import { Stethoscope, Shield, Zap, Award, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import medicalProductsImage from "@/assets/medical-products-hq.jpg";
import inhalerImage from "@/assets/news-inhaler.jpg";
import researchLabImage from "@/assets/research-lab-hq.jpg";

const MedicalDevices = () => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24">
          {/* Hero Section with Parallax */}
          <section ref={heroRef} className="relative h-[400px] overflow-hidden">
            <motion.img 
              src={medicalProductsImage}
              alt="Medical cannabis devices" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ y, opacity }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
            <div className="relative container mx-auto px-3 sm:px-4 lg:px-6 h-full flex flex-col justify-center">
              <ScrollAnimation>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-3">
                  Medical Devices
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                  Advanced delivery systems for precise medical cannabis administration across global markets
                </p>
              </ScrollAnimation>
            </div>
          </section>

          {/* Intro Section */}
          <section className="py-16 md:py-20 bg-background">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start max-w-6xl mx-auto">
                <ScrollAnimation>
                  <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                    Innovation meets precision in our medical device portfolio, designed to deliver cannabis-based medicines with accuracy and reliability
                  </h2>
                </ScrollAnimation>
                <ScrollAnimation delay={0.2}>
                  <div className="space-y-4">
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      Our medical devices are engineered to pharmaceutical standards, ensuring consistent dosing and optimal patient outcomes across South Africa, the United Kingdom, Thailand, and Portugal. From inhalers to vaporizers, each device undergoes rigorous testing and quality control.
                    </p>
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      We partner with leading medical device manufacturers to bring cutting-edge technology to the medical cannabis sector, bridging the gap between traditional pharmaceuticals and cannabis therapeutics.
                    </p>
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      Our commitment to innovation drives continuous improvement in device design, user experience, and therapeutic effectiveness across all markets we serve.
                    </p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {/* Why Choose Our Devices Section */}
          <section className="py-16 md:py-20 bg-[#0a3d3d]">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 md:mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Why choose our devices?
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Precision dosing */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('precision')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Stethoscope className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Precision dosing technology</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'precision' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'precision' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Our devices deliver exact dosages every time, ensuring consistent therapeutic effects and eliminating guesswork. Advanced metering technology guarantees patient safety and treatment efficacy.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Clinical validation */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('clinical')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Shield className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Clinically validated & approved</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'clinical' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'clinical' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          All devices undergo extensive clinical trials and regulatory approval processes. We meet the highest medical device standards including CE marking and FDA guidelines where applicable.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* User-friendly design */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('design')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Zap className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">User-friendly design</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'design' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'design' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Intuitive interfaces and ergonomic designs make our devices accessible to all patients. Simple operation reduces the learning curve and improves medication adherence.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Quality assurance */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('quality')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Award className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Rigorous quality assurance</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'quality' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'quality' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Every device batch is tested for performance, safety, and reliability. Our quality control processes ensure consistent manufacturing standards and long-term device durability.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Device Portfolio Section */}
          <section className="py-16 md:py-20 bg-muted/30">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <ScrollAnimation>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 md:mb-4">Our device portfolio</h2>
                <p className="text-base md:text-lg text-muted-foreground/80 max-w-3xl mb-12 md:mb-16">
                  A comprehensive range of medical devices designed for various administration routes and patient needs across our international markets.
                </p>
              </ScrollAnimation>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                <ScrollAnimation delay={0.1}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={inhalerImage} 
                        alt="Medical cannabis inhaler" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Inhalers</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Metered-dose inhalers providing precise cannabinoid delivery directly to the respiratory system for rapid therapeutic effect.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={medicalProductsImage} 
                        alt="Medical vaporizer devices" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Vaporizers</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Medical-grade vaporization systems with temperature control for optimal cannabinoid extraction and patient comfort.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.3}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={researchLabImage} 
                        alt="Transdermal delivery systems" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Delivery Systems</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Advanced transdermal patches and sublingual applicators for controlled, sustained cannabinoid release.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="py-16 md:py-20 bg-[#0a3d3d]">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <div className="max-w-4xl mx-auto">
                <ScrollAnimation>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 md:mb-4">Stay in the loop</h2>
                  <p className="text-white/80 text-base md:text-lg mb-8 md:mb-10">
                    Sign up to be kept up-to-date with the latest updates on Curaleaf International.
                  </p>
                </ScrollAnimation>
                
                <ScrollAnimation delay={0.2}>
                  <form className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      className="px-4 py-3 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                    />
                    <button
                      type="submit"
                      className="sm:col-span-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded transition-all font-semibold"
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
      </div>
    </PageTransition>
  );
};

export default MedicalDevices;
