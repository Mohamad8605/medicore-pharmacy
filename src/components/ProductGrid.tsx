import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, ShoppingCart, ShieldAlert, BadgeCheck, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useMedications } from "@/hooks/use-medications";
import { useStockSync } from "@/lib/use-stock-sync";
import { addToCartWithCheck } from "@/lib/add-to-cart-with-check";

export function ProductGrid() {
  const { meds, loading, categories, filter } = useMedications();
  const ids = useMemo(() => meds.map((m) => m.id), [meds]);
  const stockMap = useStockSync(ids);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const fp = useFormatPrice();

  const filtered = useMemo(() => filter(query, category), [query, category, filter]);
  const displayed = useMemo(() => (showAll ? filtered : filtered.slice(0, 4)), [filtered, showAll]);

  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Featured medicines</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            All prices include VAT · Germany-wide delivery
          </p>
        </div>
        <div className="relative w-full md:w-72 lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicines…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 w-full rounded-xl"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={[
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition shadow-sm",
              category === c
                ? "border-primary bg-primary text-primary-foreground shadow-primary/20"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/50",
            ].join(" ")}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayed.map((p) => {
          const remaining = stockMap[p.id] ?? p.stock;
          return (
            <article
              key={p.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <Link to="/medications/$id" params={{ id: p.id }} className="group block min-w-0">
                <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                  {p.image_url && !failedImages.has(p.id) ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      onError={() => setFailedImages((prev) => new Set(prev).add(p.id))}
                    />
                  ) : (
                    <Pill className="h-14 w-14 text-primary/40" />
                  )}
                </div>
                <div className="mb-2 flex flex-wrap items-start gap-1.5">
                  {p.requires_prescription ? (
                    <Badge
                      variant="destructive"
                      className="gap-1 text-[10px] leading-none px-2 py-0.5"
                    >
                      <ShieldAlert className="h-2.5 w-2.5" />
                      <span className="hidden sm:inline">Prescription</span>
                      <span className="sm:hidden">Rx</span>
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-primary/10 text-primary text-[10px] leading-none px-2 py-0.5"
                    >
                      <BadgeCheck className="h-2.5 w-2.5" />
                      <span className="hidden sm:inline">OTC</span>
                      <span className="sm:hidden">OTC</span>
                    </Badge>
                  )}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none pt-0.5">
                    {p.category}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-semibold leading-snug break-words hyphens-auto transition-colors group-hover:text-primary">
                  {p.name}
                </h3>
              </Link>
              <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground flex-1 min-w-0 leading-relaxed">
                {p.description}
              </p>

              <div className="mt-4 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold tracking-tight text-primary">
                    {fp(Number(p.price))}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                    {remaining > 0 ? `${remaining} in stock` : "Out of stock"}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="gap-1 rounded-xl shrink-0 h-9 min-h-9 text-xs px-3 shadow-sm sm:h-10 sm:min-h-10 sm:gap-1.5 sm:px-4 sm:text-sm"
                  disabled={remaining === 0}
                  onClick={() => addToCartWithCheck(p, 1)}
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && filtered.length > 4 && !showAll && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="rounded-xl shadow-sm"
            onClick={() => setShowAll(true)}
          >
            See all {filtered.length} medicines
          </Button>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-2xl border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          No medicines match your search. Try a different keyword or category.
        </p>
      )}
      {loading && (
        <p className="rounded-2xl border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground">
          Loading medicines…
        </p>
      )}
    </section>
  );
}
