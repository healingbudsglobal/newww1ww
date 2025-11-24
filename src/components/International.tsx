import ScrollAnimation from "@/components/ScrollAnimation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import InteractiveMap, { countries, type Country, type CountryStatus } from "./InteractiveMap";
import { MapPin, Building2, TrendingUp } from "lucide-react";

const International = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get countries in Stage-1 order
  const sortedCountries = Object.entries(countries)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([id, data]) => ({ id, ...data }));

  const getStatusColor = (status: CountryStatus) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20';
      case 'NEXT':
        return 'bg-blue-500/10 text-blue-600 border-blue-200 hover:bg-blue-500/20';
      case 'UPCOMING':
        return 'bg-slate-500/10 text-slate-600 border-slate-200 hover:bg-slate-500/20';
    }
  };

  return (
    <section className="bg-background py-16 sm:py-20 md:py-24">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        <div className="w-full max-w-7xl mx-auto">
          <ScrollAnimation>
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-pharma text-foreground mb-4 tracking-tight">
                Global Presence
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground font-body max-w-2xl mx-auto leading-relaxed">
                Strategic expansion across five countries, building a comprehensive medical cannabis network
              </p>
            </div>
          </ScrollAnimation>

          {/* Interactive Map */}
          <ScrollAnimation delay={0.1}>
            <div className="relative h-[450px] sm:h-[500px] md:h-[600px] mb-12 sm:mb-16">
              <InteractiveMap 
                selectedCountry={selectedCountry} 
                onCountrySelect={setSelectedCountry}
              />
            </div>
          </ScrollAnimation>

          {/* Country List - Stage-1 Order */}
          <ScrollAnimation delay={0.2}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {sortedCountries.map((country, idx) => (
                <button
                  key={country.id}
                  onClick={() => setSelectedCountry(selectedCountry === country.id ? null : country.id)}
                  className={`
                    group relative p-6 rounded-2xl border-2 transition-all duration-300
                    ${selectedCountry === country.id 
                      ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                      : 'border-border/40 bg-card hover:border-primary/40 hover:shadow-md hover:scale-[1.01]'
                    }
                  `}
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                        ${selectedCountry === country.id 
                          ? 'bg-primary/15 scale-110' 
                          : 'bg-muted group-hover:bg-primary/10'
                        }
                      `}>
                        <MapPin className={`w-6 h-6 ${selectedCountry === country.id ? 'text-primary' : 'text-muted-foreground'}`} strokeWidth={2} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-bold font-pharma text-foreground">
                          {country.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-body">
                          Stage {country.order}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`font-pharma font-semibold tracking-wide text-[10px] px-2.5 py-0.5 ${getStatusColor(country.status)}`}
                    >
                      {country.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/90 font-body leading-relaxed mb-4">
                    {country.description}
                  </p>

                  <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="font-body">{country.locations.length} Locations</span>
                    </div>
                    {country.status === 'LIVE' && (
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span className="font-body font-medium">Active</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollAnimation>

          {/* Legend */}
          <ScrollAnimation delay={0.3}>
            <div className="mt-12 p-6 rounded-2xl bg-muted/30 border border-border/30">
              <h4 className="text-sm font-bold font-pharma text-foreground mb-4 tracking-wide uppercase">
                Operation Types
              </h4>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/20">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#2C5F4F' }} />
                  <span className="text-sm text-foreground font-body font-medium">Operations & Sales</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/20">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#13303D' }} />
                  <span className="text-sm text-foreground font-body font-medium">Export Sales Only</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/20">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: '#6B7280' }} />
                  <span className="text-sm text-foreground font-body font-medium">Operations Only</span>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};

export default International;
