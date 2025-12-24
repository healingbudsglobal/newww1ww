import { ChevronDown, MapPin, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNewsRegion, NewsRegion, regionOptions } from "@/hooks/useNewsRegion";

interface RegionSwitcherProps {
  showResetOption?: boolean;
}

const RegionSwitcher = ({ showResetOption = true }: RegionSwitcherProps) => {
  const { 
    activeRegion, 
    setRegion, 
    clearRegionOverride, 
    isManuallySelected,
    currentRegionOption 
  } = useNewsRegion();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="px-4 py-2 h-auto text-sm font-medium border-primary/30 bg-primary/5 hover:bg-primary/10 gap-2"
        >
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-lg">{currentRegionOption.flag}</span>
          <span>{currentRegionOption.label} News</span>
          <ChevronDown className="w-4 h-4 ml-1 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56 bg-card border-border">
        {regionOptions.map((region) => (
          <DropdownMenuItem
            key={region.code}
            onClick={() => setRegion(region.code)}
            className={`cursor-pointer gap-3 py-3 ${
              activeRegion === region.code ? 'bg-primary/10 text-primary' : ''
            }`}
          >
            <span className="text-xl">{region.flag}</span>
            <span className="font-medium">{region.label}</span>
            {activeRegion === region.code && (
              <Badge variant="secondary" className="ml-auto text-xs">
                Active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        {showResetOption && isManuallySelected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={clearRegionOverride}
              className="cursor-pointer gap-3 py-3 text-muted-foreground"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Use auto-detected region</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RegionSwitcher;
