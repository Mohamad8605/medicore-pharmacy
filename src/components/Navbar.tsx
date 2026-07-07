import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Pill, User as UserIcon, LogOut, LayoutDashboard, Search, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/CartDrawer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/lib/LanguageContext";
import { SearchOverlay } from "@/components/SearchOverlay";

export function Navbar() {
  const { user, isStaff, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navLinks = (
    <>
      <Link to="/" onClick={() => setMobileOpen(false)}>
        {t("nav.home")}
      </Link>
      <Link to="/medications" onClick={() => setMobileOpen(false)}>
        {t("nav.medications")}
      </Link>
      <Link to="/about" onClick={() => setMobileOpen(false)}>
        {t("nav.about")}
      </Link>
      <Link to="/faq" onClick={() => setMobileOpen(false)}>
        {t("nav.faq")}
      </Link>
      <Link to="/contact" onClick={() => setMobileOpen(false)}>
        {t("nav.contact")}
      </Link>
      {user && (
        <Link to="/orders" onClick={() => setMobileOpen(false)}>
          {t("nav.orders")}
        </Link>
      )}
      {isStaff && (
        <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-1">
          <LayoutDashboard className="h-4 w-4" />
          {t("nav.dashboard")}
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur w-full max-w-full">
      <div className="flex h-16 items-center justify-between px-3 sm:px-4 max-w-full">
        <Link
          to="/"
          className="flex items-center gap-1 sm:gap-2 font-semibold text-primary min-w-0 shrink-0"
        >
          <Pill className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
          <span className="sm:hidden text-sm truncate max-w-[90px]">MediCore</span>
          <span className="hidden sm:inline text-sm md:text-lg truncate">
            Mohamad's MediCore Pharmacy
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:gap-6 lg:flex">{navLinks}</nav>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            aria-label={lang === "de" ? "Switch to English" : "Switch to German"}
            className="rounded-xl text-xs font-bold w-9 h-9 hidden lg:inline-flex"
          >
            {lang === "de" ? "EN" : "DE"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav.search")}
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <CartDrawer />
          {user ? (
            <>
              <Link to="/profile" aria-label="Profile">
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="w-9 h-9 hidden sm:inline-flex"
              >
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button className="rounded-xl h-9 text-sm px-4">{t("nav.signIn")}</Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-9 h-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out lg:hidden ${
          mobileOpen ? "max-h-[28rem]" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col border-t bg-card px-3 pb-3 pt-2 shadow-lg">
          {[
            { to: "/", label: t("nav.home") },
            { to: "/medications", label: t("nav.medications") },
            { to: "/about", label: t("nav.about") },
            { to: "/faq", label: t("nav.faq") },
            { to: "/contact", label: t("nav.contact") },
            ...(user ? [{ to: "/orders", label: t("nav.orders") }] : []),
            ...(isStaff
              ? [
                  {
                    to: "/admin",
                    label: (
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t("nav.dashboard")}
                      </span>
                    ),
                  },
                ]
              : []),
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t mx-3 mt-2 pt-2">
            <button
              onClick={() => {
                setLang(lang === "de" ? "en" : "de");
                setMobileOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors"
            >
              <span className="grid h-6 w-6 place-items-center rounded-md border text-xs font-bold shrink-0">
                {lang === "de" ? "EN" : "DE"}
              </span>
              <span className="break-words">{lang === "de" ? "English" : "German"}</span>
            </button>
          </div>
        </nav>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
