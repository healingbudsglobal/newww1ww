import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, ShieldCheck, Truck, HeartPulse } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Cart } from '@/components/shop/Cart';
import { CartButton } from '@/components/shop/CartButton';
import { RestrictedRegionGate } from '@/components/shop/RestrictedRegionGate';
import { useShop } from '@/context/ShopContext';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Medical Grade',
    description: 'All products are pharmaceutical-grade quality',
  },
  {
    icon: Leaf,
    title: 'Lab Tested',
    description: 'Third-party tested for purity and potency',
  },
  {
    icon: Truck,
    title: 'Discreet Delivery',
    description: 'Secure and confidential shipping',
  },
  {
    icon: HeartPulse,
    title: 'Patient Support',
    description: 'Dedicated medical support team',
  },
];

const countries = [
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export default function Shop() {
  const { countryCode, setCountryCode, drGreenClient, isEligible } = useShop();
  const geoLocation = useGeoLocation();
  const { t } = useTranslation('shop');

  // Auto-detect country on mount
  useEffect(() => {
    const supportedCountries = ['PT', 'ZA', 'TH', 'GB'];
    if (supportedCountries.includes(geoLocation.countryCode) && !drGreenClient) {
      setCountryCode(geoLocation.countryCode);
    }
  }, [geoLocation.countryCode, setCountryCode, drGreenClient]);

  return (
    <>
      <SEOHead
        title={`${t('title')} | Dr. Green - Premium Strains`}
        description="Browse our selection of pharmaceutical-grade medical cannabis strains. Lab-tested, doctor-approved products for qualified patients."
        keywords="medical cannabis, CBD, THC, strains, pharmaceutical grade, Portugal, medical marijuana, dispensary"
      />

      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section */}
        <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container mx-auto px-4 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
                <span className="text-primary">Strains</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 px-2">
                {t('subtitle')}
              </p>

              {/* Country selector */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Showing products for:
                </span>
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[160px] sm:w-[180px] bg-background/50 backdrop-blur-sm text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Eligibility status */}
              {drGreenClient && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
                    isEligible
                      ? 'bg-primary/10 text-primary'
                      : 'bg-yellow-500/10 text-yellow-600'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  {isEligible
                    ? 'Verified Medical Patient'
                    : 'Verification Pending'}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-6 sm:py-8 border-y border-border/50 bg-muted/20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start sm:items-center gap-2 sm:gap-3"
                >
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-xs sm:text-sm">
                      {benefit.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Products - gated by region restrictions */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <RestrictedRegionGate countryCode={countryCode}>
              <ProductGrid />
            </RestrictedRegionGate>
          </div>
        </section>

        {/* Floating cart button (mobile) */}
        <div className="fixed bottom-24 right-4 z-50 md:hidden">
          <CartButton />
        </div>

        {/* Cart drawer */}
        <Cart />

        <Footer />
      </div>
    </>
  );
}
