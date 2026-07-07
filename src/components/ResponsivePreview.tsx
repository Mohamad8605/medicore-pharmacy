import { useState, useEffect, useCallback, useRef } from "react";
import { Monitor, Tablet, Smartphone, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type DeviceType = "desktop" | "tablet" | "mobile";

interface DeviceOption {
  key: DeviceType;
  label: string;
  width: number;
  icon: typeof Monitor;
}

const DEVICES: DeviceOption[] = [
  { key: "desktop", label: "Desktop", width: 1280, icon: Monitor },
  { key: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { key: "mobile", label: "Mobile", width: 375, icon: Smartphone },
];

const STORAGE_KEY = "medi-core-responsive-preview";
const PREVIEW_PARAM = "preview";

function isInsidePreview(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has(PREVIEW_PARAM);
}

function loadDevice(): DeviceType | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "desktop" || stored === "tablet" || stored === "mobile") return stored;
  return null;
}

function buildPreviewUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(PREVIEW_PARAM, "1");
  return url.toString();
}

export function ResponsivePreviewProvider({ children }: { children: React.ReactNode }) {
  const [device, setDeviceState] = useState<DeviceType | null>(loadDevice);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const insidePreview = isInsidePreview();

  const setDevice = useCallback((d: DeviceType | null) => {
    setDeviceState(d);
    if (typeof window !== "undefined") {
      if (d) window.localStorage.setItem(STORAGE_KEY, d);
      else window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!device) return;
    const handler = () => setDevice(loadDevice());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [device, setDevice]);

  const activeDevice = DEVICES.find((d) => d.key === device);

  if (insidePreview) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {device && activeDevice && (
        <div className="fixed inset-0 z-50 flex flex-col bg-muted/80">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b bg-background px-2 py-2 sm:px-4">
            <span className="text-xs font-medium text-muted-foreground">Preview:</span>
            {DEVICES.map((d) => {
              const Icon = d.icon;
              return (
                <Button
                  key={d.key}
                  variant={device === d.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDevice(d.key)}
                  className="gap-1 text-xs sm:gap-1.5"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{d.label} </span>
                  {d.width}px
                </Button>
              );
            })}
            <div className="hidden sm:block h-4 w-px bg-border" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (iframeRef.current) {
                  iframeRef.current.src = buildPreviewUrl();
                }
              }}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reload</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDevice(null)}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit preview</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
          <div className="flex flex-1 items-start justify-center overflow-auto p-4">
            <iframe
              ref={iframeRef}
              src={buildPreviewUrl()}
              title="Responsive preview"
              style={{ width: activeDevice.width, maxWidth: "100%" }}
              className="h-[calc(100vh-5rem)] rounded-2xl border-2 border-border bg-background shadow-2xl"
            />
          </div>
        </div>
      )}
      <div className={device ? "hidden" : ""}>{children}</div>
      {!device && (
        <button
          onClick={() => setDevice("mobile")}
          className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-xs font-medium shadow-lg hover:bg-accent"
          title="Responsive preview"
        >
          <Smartphone className="h-4 w-4" />
          Preview
        </button>
      )}
    </div>
  );
}
