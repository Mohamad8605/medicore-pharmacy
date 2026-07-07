import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getPublicSettings } from "@/lib/admin-service";

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [banner, setBanner] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    getPublicSettings()
      .then((settings) => {
        if (settings.announcement_enabled && settings.announcement_message) {
          setBanner({
            message: settings.announcement_message as string,
            type: (settings.announcement_type as string) || "info",
          });
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || !banner) return null;

  const colors =
    banner.type === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-800"
      : banner.type === "alert"
        ? "bg-red-50 border-red-200 text-red-800"
        : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div className={`${colors} relative border-b px-4 py-2.5 text-center text-sm`}>
      <span className="block pr-6 break-words">{banner.message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:opacity-70"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
