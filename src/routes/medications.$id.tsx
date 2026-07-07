import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Pill, ShoppingCart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatPrice } from "@/hooks/use-format-price";
import { addToCartWithCheck } from "@/lib/add-to-cart-with-check";
import { fetchMedicationById } from "@/lib/medication-service";
import { useStockSync } from "@/lib/use-stock-sync";
import type { Database } from "@/integrations/supabase/types";

type Medication = Database["public"]["Tables"]["medications"]["Row"];

export const Route = createFileRoute("/medications/$id")({
  component: MedicationDetailPage,
});

function MedicationDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [med, setMed] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const fp = useFormatPrice();
  const stockMap = useStockSync(med ? [med.id] : []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMedicationById(id)
      .then((m) => {
        setMed(m);
        if (!m) setError("Medication not found");
      })
      .catch((err) => {
        console.error("Failed to load medication:", err);
        setError("Failed to load medication");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row">
          <Skeleton className="w-full aspect-[4/3] sm:aspect-[1/1] max-w-md rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );

  if (error || !med)
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Button
          variant="outline"
          className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          onClick={() => navigate({ to: "/medications" })}
        >
          <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to medications
        </Button>
        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-base sm:text-lg font-medium text-destructive">
            {error || "Medication not found"}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            The medication you are looking for does not exist or could not be loaded.
          </p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Button
        variant="outline"
        className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
        onClick={() => navigate({ to: "/medications" })}
      >
        <ArrowLeft className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back
      </Button>
      <div className="mt-4 sm:mt-6 grid gap-6 sm:gap-8 lg:grid-cols-2">
        <div className="flex w-full aspect-[4/3] sm:aspect-[1/1] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
          {med.image_url && !imageFailed ? (
            <img
              src={med.image_url}
              alt={med.name}
              className="h-full w-full object-cover"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <Pill className="h-24 w-24 sm:h-32 sm:w-32 text-primary/40" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{med.category}</Badge>
            {med.requires_prescription && <Badge>Prescription required</Badge>}
          </div>
          <h1 className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold break-words hyphens-auto">
            {med.name}
          </h1>
          <p className="mt-2 text-xs sm:text-base text-muted-foreground">{med.description}</p>
          <p className="mt-3 sm:mt-4 text-2xl sm:text-3xl font-bold text-primary">
            {fp(Number(med.price))}
          </p>
          <Card className="mt-6">
            <CardContent className="space-y-2 p-4 text-sm">
              {med.active_ingredient && (
                <p>
                  <strong>Active ingredient:</strong> {med.active_ingredient}
                </p>
              )}
              {med.dosage && (
                <p>
                  <strong>Dosage:</strong> {med.dosage}
                </p>
              )}
              {med.manufacturer && (
                <p>
                  <strong>Manufacturer:</strong> {med.manufacturer}
                </p>
              )}
              <p>
                <strong>Stock:</strong>{" "}
                {(stockMap[med.id] ?? med.stock) > 0 ? (
                  <span className="text-primary">{stockMap[med.id] ?? med.stock} available</span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
              </p>
            </CardContent>
          </Card>
          {med.side_effects && (
            <Card className="mt-4">
              <CardContent className="p-4 text-sm">
                <p className="font-medium">Side effects</p>
                <p className="mt-1 text-muted-foreground">{med.side_effects}</p>
              </CardContent>
            </Card>
          )}
          {med.description && (
            <Card className="mt-4">
              <CardContent className="prose prose-sm max-w-none p-4 text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h3: ({ children }) => (
                      <h3 className="mb-1 mt-4 text-base font-semibold text-foreground first:mt-0">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 leading-relaxed text-muted-foreground">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-2 list-disc space-y-0.5 pl-5 text-muted-foreground">
                        {children}
                      </ul>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-foreground">{children}</strong>
                    ),
                  }}
                >
                  {med.description}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Input
              type="number"
              min={1}
              max={stockMap[med.id] ?? med.stock}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
            <Button
              size="lg"
              className="w-full sm:w-auto"
              disabled={(stockMap[med.id] ?? med.stock) === 0}
              onClick={() => addToCartWithCheck(med, qty)}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
