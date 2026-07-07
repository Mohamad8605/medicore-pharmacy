import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react";

export type Language = "de" | "en";
const translations: Record<Language, Record<string, string>> = {
  de: {
    "nav.home": "Start",
    "nav.medications": "Arzneimittel",
    "nav.about": "Über uns",
    "nav.faq": "FAQ",
    "nav.contact": "Kontakt",
    "nav.orders": "Bestellungen",
    "nav.dashboard": "Dashboard",
    "nav.signIn": "Anmelden",
    "nav.search": "Arzneimittel suchen",
    "lang.label": "Sprache",
    "theme.toggle": "Design wechseln",
    "footer.tagline":
      "Ihre Versandapotheke aus Berlin. Geprüft, sicher und schnell – mit persönlicher pharmazeutischer Beratung.",
    "footer.service": "Service",
    "footer.legal": "Rechtliches",
    "footer.contact": "Kontakt",
    "footer.medications": "Arzneimittel",
    "footer.faq": "Häufige Fragen",
    "footer.support": "Kundenservice",
    "footer.tracking": "Bestellung verfolgen",
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",
    "footer.terms": "AGB",
    "footer.withdrawal": "Widerrufsbelehrung",
    "footer.hours": "Mo–Fr 8–20 Uhr, Sa 9–18 Uhr",
    "footer.legalLine": "Pflichtangaben nach §5 TMG · Aufsichtsbehörde: Apothekerkammer Berlin",
  },
  en: {
    "nav.home": "Home",
    "nav.medications": "Medicines",
    "nav.about": "About",
    "nav.faq": "FAQ",
    "nav.contact": "Contact",
    "nav.orders": "Orders",
    "nav.dashboard": "Dashboard",
    "nav.signIn": "Sign in",
    "nav.search": "Search medicines",
    "lang.label": "Language",
    "theme.toggle": "Toggle theme",
    "footer.tagline":
      "Your online pharmacy from Berlin. Certified, secure and fast — with personal pharmacist advice.",
    "footer.service": "Service",
    "footer.legal": "Legal",
    "footer.contact": "Contact",
    "footer.medications": "Medicines",
    "footer.faq": "FAQ",
    "footer.support": "Customer service",
    "footer.tracking": "Track order",
    "footer.imprint": "Imprint",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.withdrawal": "Right of withdrawal",
    "footer.hours": "Mon–Fri 8 am–8 pm, Sat 9 am–6 pm",
    "footer.legalLine":
      "Mandatory information per §5 TMG · Supervisory authority: Berlin Chamber of Pharmacists",
  },
};

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
}

const fallbackLanguageContext: LanguageContextValue = {
  lang: "en",
  setLang: () => undefined,
  t: (key: string) => translations.en[key] ?? key,
};

const LanguageContext = createContext<LanguageContextValue>(fallbackLanguageContext);

// Language provider: checks localStorage first, then the browser's accept-language header.
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("apotheke-lang") as Language | null;
    if (stored === "de" || stored === "en") setLangState(stored);
    else {
      const nav = window.navigator.language?.toLowerCase() ?? "en";
      setLangState(nav.startsWith("de") ? "de" : "en");
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("apotheke-lang", l);

      document.documentElement.lang = l;
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: string) => translations[lang][key] ?? translations.en[key] ?? key,
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

// Shortcut hook for language context.
export function useLanguage() {
  return useContext(LanguageContext);
}
