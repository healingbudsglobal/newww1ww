import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  scrolled?: boolean;
}

const LanguageSwitcher = ({ scrolled }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "pt", label: "Português", flag: "🇵🇹" },
  ];

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem("i18nextLng", langCode);
    setIsOpen(false);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-1 font-medium transition-all duration-300 ease-out rounded-md hover:scale-105 flex-shrink-0",
          scrolled ? "text-xs xl:text-sm p-1.5" : "text-xs xl:text-sm p-1.5 xl:p-2",
          "text-white/70 hover:text-white hover:bg-white/5"
        )}
        aria-label="Change language"
      >
        <Globe className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
        <span className="text-[10px] xl:text-xs font-semibold uppercase">{currentLang.code}</span>
      </button>

      <div
        className={cn(
          "absolute top-full right-0 mt-2 w-36 bg-background rounded-xl shadow-card border border-border/40 overflow-hidden transition-all duration-150 z-50",
          isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1"
        )}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              "w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2",
              i18n.language === lang.code
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
