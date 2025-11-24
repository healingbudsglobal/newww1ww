import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import { ShoppingCart, Clock, Shield, HeartPulse, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import medicalProductsImage from "@/assets/medical-products-hq.jpg";
import researchLabImage from "@/assets/research-lab-hq.jpg";
import productionFacility from "@/assets/production-facility-hq.jpg";

const OnlinePharmacy = () => {
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
              alt="Online medical cannabis pharmacy" 
              className="absolute inset-0 w-full h-full object-cover"
              style={{ y, opacity }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background" />
            <div className="relative container mx-auto px-3 sm:px-4 lg:px-6 h-full flex flex-col justify-center">
              <ScrollAnimation>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-3">
                  Online Medical Cannabis Pharmacy
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                  Convenient, secure access to prescribed medical cannabis across South Africa, UK, Thailand, and Portugal
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
                    Access your prescribed medical cannabis safely and conveniently through our fully licensed online pharmacy platform
                  </h2>
                </ScrollAnimation>
                <ScrollAnimation delay={0.2}>
                  <div className="space-y-4">
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      Our online pharmacy combines cutting-edge technology with pharmaceutical excellence to deliver medical cannabis directly to patients across South Africa, the United Kingdom, Thailand, and Portugal. Every order is processed by qualified pharmacists and delivered with complete discretion.
                    </p>
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      We work exclusively with licensed healthcare providers to ensure that every patient receives the right product, at the right dose, with comprehensive guidance and support throughout their treatment journey.
                    </p>
                    <p className="text-base md:text-lg text-muted-foreground/80 leading-relaxed">
                      Our platform is designed for ease of use while maintaining the highest standards of privacy, security, and regulatory compliance in each jurisdiction we serve.
                    </p>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </section>

          {/* Why Choose Our Pharmacy Section */}
          <section className="py-16 md:py-20 bg-[#0a3d3d]">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 md:mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Why choose our pharmacy?
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Convenience */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('convenience')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <ShoppingCart className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Convenient home delivery</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'convenience' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'convenience' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Receive your prescribed medical cannabis directly to your door in discreet, secure packaging. No need to visit a physical pharmacy - order online and we'll handle the rest with fast, reliable delivery services.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Fast processing */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('fast')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Clock className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Fast prescription processing</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'fast' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'fast' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Our qualified pharmacists review and process prescriptions quickly, ensuring you receive your medication without unnecessary delays. Most orders are dispatched within 24-48 hours.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Secure platform */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('secure')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Shield className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Secure & compliant platform</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'secure' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'secure' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Your personal and medical information is protected with bank-level encryption. Our platform is fully compliant with healthcare data regulations and pharmaceutical standards.
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Patient support */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => toggleItem('support')}
                      className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <HeartPulse className="w-8 h-8 text-white" strokeWidth={2} />
                        </div>
                        <h3 className="text-xl md:text-2xl font-semibold text-white">Dedicated patient support</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedItem === 'support' ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedItem === 'support' ? 'auto' : 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                          Our team of experienced pharmacists and patient care specialists are available to answer questions, provide guidance on medication usage, and support you throughout your treatment.
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16 md:py-20 bg-muted/30">
            <div className="container mx-auto px-3 sm:px-4 lg:px-6">
              <ScrollAnimation>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-3 md:mb-4">How it works</h2>
                <p className="text-base md:text-lg text-muted-foreground/80 max-w-3xl mb-12 md:mb-16">
                  Getting your prescribed medical cannabis is simple with our streamlined online process, available across South Africa, the UK, Thailand, and Portugal.
                </p>
              </ScrollAnimation>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                <ScrollAnimation delay={0.1}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={researchLabImage} 
                        alt="Upload prescription" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <div className="text-3xl font-bold text-teal-primary mb-3">01</div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Upload prescription</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Create an account and securely upload your valid medical cannabis prescription from your healthcare provider.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.2}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={productionFacility} 
                        alt="Pharmacist review" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <div className="text-3xl font-bold text-teal-primary mb-3">02</div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Pharmacist review</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Our qualified pharmacists verify your prescription and prepare your order with care and precision.
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation delay={0.3}>
                  <div className="bg-background rounded-xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
                    <div className="h-48 md:h-56 overflow-hidden">
                      <img 
                        src={medicalProductsImage} 
                        alt="Secure delivery" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 md:p-6">
                      <div className="text-3xl font-bold text-teal-primary mb-3">03</div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 md:mb-3">Secure delivery</h3>
                      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                        Receive your medication in discreet packaging with tracked delivery, ensuring safe arrival at your doorstep.
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

export default OnlinePharmacy;
