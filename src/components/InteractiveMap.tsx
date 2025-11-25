import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from './ui/button';

type LocationType = 'operations-sales' | 'export-only' | 'operations-only';

interface Location {
  name: string;
  coordinates: [number, number];
  type: LocationType;
}

type CountryStatus = 'LIVE' | 'NEXT' | 'UPCOMING';

interface Country {
  name: string;
  center: [number, number];
  zoom: number;
  locations: Location[];
  status: CountryStatus;
  order: number;
  description: string;
}

// MapLibre GL doesn't require an access token for basic usage

// Stage-1 Countries in exact chronological order
const countries: Record<string, Country> = {
  southAfrica: {
    name: 'South Africa',
    center: [24.9916, -28.4793],
    zoom: 5,
    status: 'LIVE',
    order: 1,
    description: 'Fully operational cultivation and distribution hub',
    locations: [
      { name: 'Cape Town', coordinates: [18.4241, -33.9249], type: 'operations-sales' },
      { name: 'Johannesburg', coordinates: [28.0473, -26.2041], type: 'operations-only' },
    ],
  },
  portugal: {
    name: 'Portugal',
    center: [-8.2245, 39.3999],
    zoom: 6,
    status: 'NEXT',
    order: 2,
    description: 'EU gateway for medical cannabis operations',
    locations: [
      { name: 'Lisbon', coordinates: [-9.1393, 38.7223], type: 'operations-sales' },
      { name: 'Porto', coordinates: [-8.6291, 41.1579], type: 'export-only' },
    ],
  },
  uk: {
    name: 'United Kingdom',
    center: [-3.4360, 55.3781],
    zoom: 5,
    status: 'UPCOMING',
    order: 3,
    description: 'Strategic UK market expansion',
    locations: [
      { name: 'London', coordinates: [-0.1276, 51.5074], type: 'operations-sales' },
      { name: 'Manchester', coordinates: [-2.2426, 53.4808], type: 'export-only' },
    ],
  },
  germany: {
    name: 'Germany',
    center: [10.4515, 51.1657],
    zoom: 6,
    status: 'UPCOMING',
    order: 4,
    description: 'European medical cannabis market leader',
    locations: [
      { name: 'Berlin', coordinates: [13.4050, 52.5200], type: 'operations-sales' },
      { name: 'Frankfurt', coordinates: [8.6821, 50.1109], type: 'export-only' },
    ],
  },
  usa: {
    name: 'United States',
    center: [-95.7129, 37.0902],
    zoom: 4,
    status: 'UPCOMING',
    order: 5,
    description: 'North American market expansion',
    locations: [
      { name: 'California', coordinates: [-119.4179, 36.7783], type: 'operations-sales' },
      { name: 'Colorado', coordinates: [-105.7821, 39.5501], type: 'operations-only' },
    ],
  },
};

type LayerFilter = 'all' | 'operations-sales' | 'export-only' | 'operations-only';

interface InteractiveMapProps {
  selectedCountry: string | null;
  onCountrySelect?: (countryId: string) => void;
}

const InteractiveMap = ({ selectedCountry, onCountrySelect }: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeLayer, setActiveLayer] = useState<LayerFilter>('all');

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Custom branded style with design system colors
    const style = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap Contributors',
          maxzoom: 19
        }
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: {
            'background-color': 'hsl(171, 12%, 94%)' // Muted background
          }
        },
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 22,
          paint: {
            'raster-opacity': 0.65, // Subtle map tiles
            'raster-saturation': -0.4, // Desaturated
            'raster-contrast': -0.1,
            'raster-brightness-min': 0.3,
            'raster-brightness-max': 0.9
          }
        },
        {
          id: 'brand-overlay',
          type: 'background',
          paint: {
            'background-color': 'hsl(178, 48%, 33%)', // Secondary green overlay
            'background-opacity': 0.08
          }
        }
      ]
    };
    
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style as any,
      center: [20, 20],
      zoom: 2,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: false,
        showCompass: false,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsLoaded(true);
      
      map.current?.easeTo({
        zoom: 2,
        duration: 1200,
      });
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current || !isLoaded) return;

    const country = selectedCountry ? countries[selectedCountry] : null;
    
    if (country) {
      map.current.flyTo({
        center: country.center,
        zoom: country.zoom,
        duration: 1500,
        essential: true,
        curve: 1.42,
      });
    } else {
      map.current.flyTo({
        center: [20, 20],
        zoom: 2,
        duration: 1500,
      });
    }

    // Remove old markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for all or selected country
    const countriesToShow = selectedCountry 
      ? [countries[selectedCountry]]
      : Object.values(countries);

    countriesToShow.forEach((countryData) => {
      countryData.locations.forEach((location, idx) => {
        // Filter by active layer
        if (activeLayer !== 'all' && location.type !== activeLayer) return;

        const el = document.createElement('div');
        el.className = 'marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.cursor = 'pointer';
        el.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        el.style.border = '3px solid white';
        
        // Premium color mapping with brand colors
        const colorMap: Record<LocationType, string> = {
          'operations-sales': 'hsl(164, 80%, 38%)',    // Vibrant darker green for contrast
          'export-only': 'hsl(178, 48%, 33%)',         // Secondary Green
          'operations-only': 'hsl(171, 12%, 66%)',     // Light Gray
        };
        
        el.style.backgroundColor = colorMap[location.type];
        
        // Staggered entrance animation
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'scale(1)';
        }, idx * 120);
        
        el.style.opacity = '0';
        el.style.transform = 'scale(0)';
        
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.6) translateY(-4px)';
          el.style.boxShadow = `0 0 40px ${colorMap[location.type]}, 0 12px 32px rgba(0,0,0,0.3)`;
          el.style.zIndex = '1000';
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
          el.style.zIndex = 'auto';
        });
        
        el.addEventListener('click', () => {
          if (onCountrySelect) {
            const countryId = Object.keys(countries).find(
              key => countries[key].name === countryData.name
            );
            if (countryId) onCountrySelect(countryId);
          }
        });

        const typeLabels: Record<LocationType, string> = {
          'operations-sales': 'Operations & Sales',
          'export-only': 'Export Sales Only',
          'operations-only': 'Operations Only',
        };

        const marker = new maplibregl.Marker(el)
          .setLngLat(location.coordinates)
          .setPopup(
            new maplibregl.Popup({ 
              offset: 35, 
              className: 'map-popup',
              closeButton: false,
            })
              .setHTML(`
                <div style="padding: 12px; font-family: Helvetica, Arial, sans-serif;">
                  <div style="font-weight: 600; font-size: 16px; margin-bottom: 4px; color: #1F2937;">${countryData.name}</div>
                  <div style="font-size: 14px; color: #6B7280; margin-bottom: 6px;">${location.name}</div>
                  <div style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px;">${typeLabels[location.type]}</div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
                    <span style="font-size: 11px; color: #10B981; font-weight: 600; letter-spacing: 0.5px;">${countryData.status}</span>
                  </div>
                </div>
              `)
          )
          .addTo(map.current!);

        markers.current.push(marker);
      });
    });
  }, [selectedCountry, isLoaded, activeLayer]);

  return (
    <div className="relative w-full h-full">
      {/* Layer Toggle Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-border/20 p-2">
        <div className="flex flex-col gap-1">
          <Button
            size="sm"
            variant={activeLayer === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveLayer('all')}
            className="justify-start text-xs font-pharma font-semibold"
          >
            All Locations
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'operations-sales' ? 'default' : 'ghost'}
            onClick={() => setActiveLayer('operations-sales')}
            className="justify-start text-xs font-pharma"
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 border-2" 
              style={{ 
                backgroundColor: activeLayer === 'operations-sales' ? 'white' : 'hsl(164, 80%, 38%)',
                borderColor: activeLayer === 'operations-sales' ? 'white' : 'hsl(164, 80%, 38%)'
              }} 
            />
            Operations & Sales
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'export-only' ? 'default' : 'ghost'}
            onClick={() => setActiveLayer('export-only')}
            className="justify-start text-xs font-pharma"
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 border-2" 
              style={{ 
                backgroundColor: activeLayer === 'export-only' ? 'white' : 'hsl(178, 48%, 33%)',
                borderColor: activeLayer === 'export-only' ? 'white' : 'hsl(178, 48%, 33%)'
              }} 
            />
            Export Only
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'operations-only' ? 'default' : 'ghost'}
            onClick={() => setActiveLayer('operations-only')}
            className="justify-start text-xs font-pharma"
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 border-2" 
              style={{ 
                backgroundColor: activeLayer === 'operations-only' ? 'white' : 'hsl(171, 12%, 66%)',
                borderColor: activeLayer === 'operations-only' ? 'white' : 'hsl(171, 12%, 66%)'
              }} 
            />
            Operations Only
          </Button>
        </div>
      </div>

      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.05)',
          border: '1px solid hsla(var(--border), 0.2)'
        }}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-background rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-pharma text-lg tracking-wide animate-pulse">
              Loading global map...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export { countries };
export type { Country, CountryStatus };
export default InteractiveMap;
