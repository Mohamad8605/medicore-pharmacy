import { useRef, useState } from "react";
import { Upload, CheckCircle2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export function PrescriptionUploadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please upload an image (PNG/JPG) or PDF of your prescription.");
      return;
    }
    setScanning(true);
    setFilename(file.name);
    setTimeout(() => {
      const fake = "RX-" + Math.random().toString(36).slice(2, 10).toUpperCase();
      setToken(fake);
      setScanning(false);
      toast.success("Prescription received — sent to the pharmacy team.");
    }, 900);
  };

  const handleReset = () => {
    setToken(null);
    setFilename(null);
    inputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload your prescription</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {scanning ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Checking document…</p>
            </div>
          ) : token ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <p className="text-sm font-medium">
                Reference: <span className="font-mono">{token}</span>
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" /> {filename}
              </p>
              <Button variant="outline" className="mt-2" onClick={handleReset}>
                Upload another prescription
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Upload className="h-6 w-6" />
              </span>
              <p className="text-center text-sm text-muted-foreground">
                Accepted formats: PNG, JPG, PDF
              </p>
              <Button className="rounded-xl" onClick={() => inputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose file
              </Button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
