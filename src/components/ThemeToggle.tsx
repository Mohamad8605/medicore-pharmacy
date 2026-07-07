import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/ThemeContext";
import { useLanguage } from "@/lib/LanguageContext";
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={t("theme.toggle")}
      className="rounded-xl w-9 h-9"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </Button>
  );
}
