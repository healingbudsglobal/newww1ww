import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "button";
}

const ThemeToggle = ({ className, variant = "icon" }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (variant === "button") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "flex items-center gap-2 w-full px-4 py-3 text-left text-sm transition-colors",
          "hover:bg-white/10 text-white/80 hover:text-white",
          className
        )}
      >
        {theme === "dark" ? (
          <>
            <Sun className="w-4 h-4" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-1.5 xl:p-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0",
        "text-white/70 hover:text-white hover:bg-white/10",
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
      ) : (
        <Moon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
      )}
    </button>
  );
};

export default ThemeToggle;
