import { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const REGIONS = [
  { code: 'ZA', label: '🇿🇦 South Africa (Live)', status: 'live' },
  { code: 'PT', label: '🇵🇹 Portugal (Coming Soon)', status: 'coming_soon' },
  { code: 'GB', label: '🇬🇧 United Kingdom (Coming Soon)', status: 'coming_soon' },
  { code: 'GLOBAL', label: '🌍 Global Portal', status: 'redirect' },
];

export const RegionSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentRegion = new URLSearchParams(window.location.search).get('simulate_region')?.toUpperCase() || 'ZA';
  const currentLabel = REGIONS.find(r => r.code === currentRegion)?.label || 'ZA';

  const switchRegion = (regionCode: string) => {
    const url = new URL(window.location.href);
    if (regionCode === 'ZA') {
      url.searchParams.delete('simulate_region');
    } else {
      url.searchParams.set('simulate_region', regionCode);
    }
    window.location.href = url.toString();
  };

  return (
    <div className="fixed top-20 right-4 z-[9999]">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-400 text-black border-yellow-600 shadow-lg gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-bold">DEV: {currentRegion}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-white dark:bg-gray-900 border shadow-xl z-[9999]"
        >
          {REGIONS.map((region) => (
            <DropdownMenuItem
              key={region.code}
              onClick={() => switchRegion(region.code)}
              className={`cursor-pointer ${currentRegion === region.code ? 'bg-primary/10 font-semibold' : ''}`}
            >
              {region.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default RegionSwitcher;
