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
        return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-300/50 shadow-emerald-200/50';
      case 'NEXT':
        return 'bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 shadow-primary/20';
      case 'UPCOMING':
        return 'bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-600 dark:text-slate-400 border-slate-300/50 shadow-slate-200/50';
    }
  };

  return (
    <div className="px-2 mt-8">
      <section className="relative py-16 sm:py-20 md:py-24 overflow-hidden rounded-2xl sm:rounded-3xl" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
        {/* Botanical decoration - left */}
        <div className="absolute top-20 left-0 opacity-5 pointer-events-none">
          <svg width="150" height="300" viewBox="0 0 150 300" fill="none">
            <path d="M75 25 Q115 65 75 105 Q35 65 75 25" stroke="currentColor" strokeWidth="1" fill="none" className="text-white"/>
            <path d="M75 65 Q135 125 75 185 Q15 125 75 65" stroke="currentColor" strokeWidth="1" fill="none" className="text-white"/>
            <path d="M75 25 L75 275" stroke="currentColor" strokeWidth="1" className="text-white"/>
          </svg>
        </div>
        
        {/* Botanical decoration - right */}
        <div className="absolute bottom-20 right-0 opacity-5 pointer-events-none rotate-180">
          <svg width="150" height="300" viewBox="0 0 150 300" fill="none">
            <path d="M75 25 Q115 65 75 105 Q35 65 75 25" stroke="currentColor" strokeWidth="1" fill="none" className="text-white"/>
            <path d="M75 65 Q135 125 75 185 Q15 125 75 65" stroke="currentColor" strokeWidth="1" fill="none" className="text-white"/>
            <path d="M75 25 L75 275" stroke="currentColor" strokeWidth="1" className="text-white"/>
          </svg>
        </div>
        
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none" />
      
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="w-full max-w-7xl mx-auto">
            <ScrollAnimation>
              <div className="text-center mb-14 sm:mb-18 relative z-10">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold font-jakarta text-white mb-5 tracking-tight drop-shadow-lg" style={{ letterSpacing: '-0.02em' }}>
                  Global Presence
                </h2>
                <p className="text-lg sm:text-xl text-white/80 font-jakarta max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                  Strategic expansion across three countries, building a comprehensive medical cannabis network
                </p>
              </div>
            </ScrollAnimation>

            {/* Interactive Map */}
            <ScrollAnimation delay={0.1}>
              <div className="relative h-[450px] sm:h-[500px] md:h-[600px] mb-14 sm:mb-18 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <InteractiveMap 
                  selectedCountry={selectedCountry} 
                  onCountrySelect={setSelectedCountry}
                />
              </div>
            </ScrollAnimation>

            {/* Country List - Stage-1 Order */}
            <ScrollAnimation delay={0.2}>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 relative z-10">
                {sortedCountries.map((country, idx) => (
                  <button
                    key={country.id}
                    onClick={() => setSelectedCountry(selectedCountry === country.id ? null : country.id)}
                    className={`
                      group relative p-6 rounded-2xl border transition-all duration-500 overflow-hidden text-left
                      ${selectedCountry === country.id 
                        ? 'border-primary/60 shadow-2xl scale-[1.02] bg-gradient-to-br from-card via-card to-primary/5' 
                        : 'border-border/30 bg-gradient-to-br from-card to-card/95 hover:border-primary/50 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1'
                      }
                    `}
                    style={{
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    {/* Card gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 ${
                      selectedCountry === country.id 
                        ? 'from-primary/10 via-transparent to-secondary/10 opacity-100' 
                        : 'from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100'
                    }`} />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg
                            ${selectedCountry === country.id 
                              ? 'bg-gradient-to-br from-primary to-primary/80 scale-110' 
                              : 'bg-gradient-to-br from-muted to-muted/80 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:scale-105'
                            }
                          `}>
                            <MapPin 
                              className={`w-7 h-7 transition-all duration-500 ${
                                selectedCountry === country.id 
                                  ? 'text-white' 
                                  : 'text-muted-foreground group-hover:text-primary'
                              }`} 
                              strokeWidth={2.5} 
                            />
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-semibold font-jakarta text-foreground mb-0.5 group-hover:text-primary transition-colors duration-300">
                              {country.name}
                            </h3>
                            <p className="text-xs text-muted-foreground font-jakarta font-medium uppercase tracking-wider">
                              Stage {country.order}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`font-jakarta font-bold tracking-wider text-[10px] px-3 py-1 rounded-full border-2 shadow-lg transition-all duration-300 ${getStatusColor(country.status)}`}
                        >
                          {country.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground font-jakarta leading-relaxed mb-5 min-h-[60px]">
                        {country.description}
                      </p>

                      <div className="flex flex-wrap gap-3 text-xs">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 text-foreground transition-all duration-300 group-hover:bg-muted group-hover:shadow-md">
                          <Building2 className="w-4 h-4 text-primary" />
                          <span className="font-jakarta font-semibold">{country.locations.length} Locations</span>
                        </div>
                        {country.status === 'LIVE' && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/15 to-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300/50 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-jakarta font-bold">Active</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollAnimation>

            {/* Legend */}
            <ScrollAnimation delay={0.3}>
              <div className="mt-14 p-6 rounded-2xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 backdrop-blur-sm shadow-lg relative z-10 overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />
                
                <div className="relative z-10">
                  <h4 className="text-sm font-semibold font-jakarta text-foreground mb-5 tracking-wide uppercase flex items-center gap-2">
                    <div className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full" />
                    Operation Types
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                      <div className="w-5 h-5 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'hsl(82, 55%, 62%)' }} />
                      <span className="text-sm text-foreground font-jakarta font-medium">Operations & Sales</span>
                    </div>
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                      <div className="w-5 h-5 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'hsl(88, 48%, 58%)' }} />
                      <span className="text-sm text-foreground font-jakarta font-medium">Export Sales Only</span>
                    </div>
                    <div className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-card to-card/80 border border-border/30 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                      <div className="w-5 h-5 rounded-full shadow-md group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'hsl(85, 42%, 70%)' }} />
                      <span className="text-sm text-foreground font-jakarta font-medium">Operations Only</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </div>
  );
};

export default International;
