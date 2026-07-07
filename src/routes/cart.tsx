import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight, AlertCircle } from "lucide-react";
import { useFormatPrice } from "@/hooks/use-format-price";
import { useStockStore } from "@/lib/stock-store";
import { reserveStock, releaseStock } from "@/lib/order-service";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQuantity, remove, total, count, needsPrescription } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fp = useFormatPrice();

  const handleRemove = async (id: string) => {
    const item = items.find((i) => i.medication.id === id);
    if (!item) return;
    try {
      await releaseStock(id, item.quantity);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not release stock: ${msg}`);
      return;
    }
    useStockStore.getState().refresh();
    remove(id);
  };

  const handleDecrease = async (id: string) => {
    const item = items.find((i) => i.medication.id === id);
    if (!item) return;
    try {
      await releaseStock(id, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not release stock: ${msg}`);
      return;
    }
    useStockStore.getState().refresh();
    setQuantity(id, item.quantity - 1);
  };

  const handleIncrease = async (id: string) => {
    const item = items.find((i) => i.medication.id === id);
    if (!item) return;
    try {
      await reserveStock(id, 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Could not reserve stock: ${msg}`);
      return;
    }
    useStockStore.getState().refresh();
    setQuantity(id, item.quantity + 1);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingCart className="mx-auto h-20 w-20 text-muted-foreground/40" />
        <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
        <Link to="/medications" className="mt-6 inline-block">
          <Button>Browse medications</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold">Shopping cart ({count()})</h1>
      {needsPrescription() && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Cart contains prescription medications. Upload required at checkout.
          </AlertDescription>
        </Alert>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="space-y-3 sm:space-y-4 lg:col-span-2">
          {items.map((it) => (
            <Card key={it.medication.id}>
              <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold break-words hyphens-auto leading-snug">
                    {it.medication.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {fp(it.medication.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleDecrease(it.medication.id)}
                    disabled={it.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={it.quantity}
                    onChange={(e) => setQuantity(it.medication.id, parseInt(e.target.value) || 1)}
                    className="w-16 sm:w-20 text-center h-8 sm:h-9 text-sm"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleIncrease(it.medication.id)}
                    disabled={it.quantity >= it.medication.stock}
                    aria-label="Increase quantity"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between sm:text-right sm:flex-col sm:items-end">
                  <p className="text-sm sm:text-base font-semibold text-primary">
                    {fp(it.medication.price * it.quantity)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-destructive sm:h-auto sm:text-sm"
                    onClick={() => handleRemove(it.medication.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{fp(total())}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery</span>
              <span>At checkout</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-primary">{fp(total())}</span>
            </div>
            <Button
              className="w-full sm:w-auto"
              size="lg"
              onClick={() => navigate({ to: user ? "/checkout" : "/login" })}
            >
              Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Link to="/medications">
              <Button variant="outline" className="w-full sm:w-auto">
                Continue shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
