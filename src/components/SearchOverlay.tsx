import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingCart, ShieldAlert, BadgeCheck, Pill, X } from "lucide-react";
import { useMedications } from "@/hooks/use-medications";
import { useStockSync } from "@/lib/use-stock-sync";
import { addToCartWithCheck } from "@/lib/add-to-cart-with-check";
import { useFormatPrice } from "@/hooks/use-format-price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { meds, loading, filter } = useMedications();
  const ids = useMemo(() => meds.map((m) => m.id), [meds]);
  const stockMap = useStockSync(ids);
  const [q, setQ] = useState("");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const fp = useFormatPrice();

  const filtered = useMemo(() => filter(q, "All"), [q, filter]);

  useEffect(() => {
    if (open) {
      setQ("");
      setFailedImages(new Set());
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            placeholder="Search medications by name or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-block">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted sm:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading medications…</p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No medications match your search.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((m) => {
                const remaining = stockMap[m.id] ?? m.stock;
                return (
                  <li key={m.id}>
                    <div className="flex items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 transition hover:bg-muted">
                      <Link
                        to="/medications/$id"
                        params={{ id: m.id }}
                        onClick={onClose}
                        className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                          {m.image_url && !failedImages.has(m.id) ? (
                            <img
                              src={m.image_url}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={() => setFailedImages((prev) => new Set(prev).add(m.id))}
                            />
                          ) : (
                            <Pill className="h-5 w-5" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="truncate font-medium break-words">{m.name}</span>
                            {m.requires_prescription ? (
                              <Badge
                                variant="destructive"
                                className="shrink-0 gap-1 px-1.5 py-0 text-[10px]"
                              >
                                <ShieldAlert className="h-2.5 w-2.5" />
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="shrink-0 gap-1 bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
                              >
                                <BadgeCheck className="h-2.5 w-2.5" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{m.category}</p>
                        </div>
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-semibold">{fp(Number(m.price))}</p>
                          <p className="text-xs text-muted-foreground">
                            {remaining > 0 ? `${remaining} in stock` : "Out of stock"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-xl h-10"
                          disabled={remaining === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCartWithCheck(m, 1);
                            onClose();
                          }}
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
