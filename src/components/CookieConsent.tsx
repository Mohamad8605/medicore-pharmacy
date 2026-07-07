import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "pharmacy.cookie-consent.v1";
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const respond = (choice: "accepted" | "declined") => {
    window.localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-foreground">
            We use strictly necessary cookies to keep you signed in and remember your basket.
            Optional analytics help us improve the site. Read our{" "}
            <a href="/faq" className="underline underline-offset-2">
              privacy notice
            </a>{" "}
            for details.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 md:ml-auto">
          <Button
            variant="outline"
            size="default"
            className="h-10"
            onClick={() => respond("declined")}
          >
            Only necessary
          </Button>
          <Button size="default" className="h-10" onClick={() => respond("accepted")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
