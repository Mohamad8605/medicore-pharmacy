import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Pill, ShoppingCart, ShieldAlert, BadgeCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useMedications } from "@/hooks/use-medications";
import { useStockSync } from "@/lib/use-stock-sync";
import { addToCartWithCheck } from "@/lib/add-to-cart-with-check";
import { Route as ParentRoute } from "@/routes/medications";

function MedicationsPage() {
  const { category: urlCategory } = ParentRoute.useSearch();
  const navigate = useNavigate();
  const { meds, loading, categories, filter } = useMedications();
  const ids = useMemo(() => meds.map((m) => m.id), [meds]);
  const stockMap = useStockSync(ids);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(urlCategory ?? "all");
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const fp = useFormatPrice();

  const filtered = useMemo(
    () => filter(q, category === "all" ? "All" : category),
    [q, category, filter],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Medications</h1>
      <p className="mt-1 text-sm sm:text-base text-muted-foreground">
        Browse our catalog of {meds.length} products.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 min-w-0 w-full sm:w-auto sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 w-full rounded-xl"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            navigate({ to: ".", search: v === "all" ? {} : { category: v }, replace: true });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories
              .filter((c) => c !== "All")
              .map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-full overflow-hidden min-w-0 rounded-2xl">
              <Skeleton className="aspect-[4/3] w-full rounded-none shrink-0" />
              <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-16 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => {
            return (
              <Card
                key={m.id}
                className="flex flex-col h-full overflow-hidden min-w-0 rounded-2xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <Link to="/medications/$id" params={{ id: m.id }}>
                  <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
                    {m.image_url && !failedImages.has(m.id) ? (
                      <img
                        src={m.image_url}
                        alt={m.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                        onError={() => setFailedImages((prev) => new Set(prev).add(m.id))}
                      />
                    ) : (
                      <Pill className="h-16 w-16 text-primary/40" />
                    )}
                  </div>
                </Link>
                <CardContent className="flex flex-col flex-1 p-4 min-w-0">
                  <div className="mb-2 flex flex-wrap items-start gap-1.5">
                    {m.requires_prescription ? (
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
                  </div>
                  <Link
                    to="/medications/$id"
                    params={{ id: m.id }}
                    className="text-sm sm:text-base font-semibold hover:text-primary break-words hyphens-auto leading-snug transition-colors"
                  >
                    {m.name}
                  </Link>
                  <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground">{m.category}</p>
                  <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-muted-foreground flex-1 min-w-0 leading-relaxed">
                    {m.description}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-base sm:text-lg font-bold text-primary">
                        {fp(Number(m.price))}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground whitespace-nowrap">
                        {(stockMap[m.id] ?? m.stock) > 0
                          ? `${stockMap[m.id] ?? m.stock} in stock`
                          : "Out of stock"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-9 min-h-9 text-xs px-3 shadow-sm sm:h-10 sm:min-h-10 sm:text-sm sm:px-4 rounded-xl"
                      disabled={(stockMap[m.id] ?? m.stock) === 0}
                      onClick={() => addToCartWithCheck(m, 1)}
                    >
                      <ShoppingCart className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-10">
              No medications match your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/medications/")({
  component: MedicationsPage,
});
