import { useCallback, useRef, useState } from "react";
import { QrCode, Upload, CheckCircle2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
export function ERezeptScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image (PNG/JPG) or PDF of your prescription.");
      return;
    }
    setScanning(true);
    setFilename(file.name);
    window.setTimeout(() => {
      const fake = "RX-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      setToken(fake);
      setScanning(false);
      toast.success("Prescription received — sent to the pharmacy team.");
    }, 900);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <QrCode className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold leading-tight">Upload your prescription</h3>
          <p className="text-xs text-muted-foreground">
            Photo or PDF — reviewed by a pharmacist before dispatch
          </p>
        </div>
      </div>

      <label
        htmlFor="erezept-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 text-center transition",
          dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:bg-muted/50",
        ].join(" ")}
      >
        {scanning ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Checking document…</p>
          </>
        ) : token ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-primary" />
            <p className="text-sm font-medium">
              Reference: <span className="font-mono">{token}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" /> {filename}
            </p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop a file here or click to choose</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG or PDF · max 5 MB · end-to-end encrypted
            </p>
          </>
        )}
        <input
          ref={inputRef}
          id="erezept-file"
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
      </label>

      {token && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          onClick={() => {
            setToken(null);
            setFilename(null);
            inputRef.current?.click();
          }}
        >
          Upload another prescription
        </Button>
      )}
    </div>
  );
}
