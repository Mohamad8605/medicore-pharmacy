import { ShoppingCart, Truck, Trash2, Plus, Minus, ShieldAlert, BadgeCheck } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/lib/cart";
import { useFormatPrice } from "@/hooks/use-format-price";
import { SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/constants";
import { useStockStore } from "@/lib/stock-store";
import { reserveStock, releaseStock } from "@/lib/order-service";
import { toast } from "sonner";

export function CartDrawer() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const count = useCart((s) => s.count());
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const fp = useFormatPrice();
  const shipping = total < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function stockAction(
    id: string,
    action: () => Promise<void>,
    onSuccess: () => void,
    label: string,
  ) {
    const item = items.find((i) => i.medication.id === id);
    if (!item) return;
    try {
      await action();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`${label}: ${msg}`);
      return;
    }
    useStockStore.getState().refresh();
    onSuccess();
  }

  const handleRemove = (id: string) =>
    stockAction(
      id,
      () => releaseStock(id, items.find((i) => i.medication.id === id)!.quantity),
      () => remove(id),
      "Could not release stock",
    );

  const handleDecrease = (id: string) =>
    stockAction(
      id,
      () => releaseStock(id, 1),
      () => setQty(id, items.find((i) => i.medication.id === id)!.quantity - 1),
      "Could not release stock",
    );

  const handleIncrease = (id: string) =>
    stockAction(
      id,
      () => reserveStock(id, 1),
      () => setQty(id, items.find((i) => i.medication.id === id)!.quantity + 1),
      "Could not reserve stock",
    );

  const rxItems = items.filter((i) => i.medication.requires_prescription);
  const otcItems = items.filter((i) => !i.medication.requires_prescription);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative w-9 h-9" aria-label="Open cart">
          <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          {mounted && count > 0 && (
            <Badge className="absolute -right-1.5 -top-1.5 h-5 min-w-5 rounded-full px-1 text-[10px] leading-none">
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md max-w-full">
        <SheetHeader className="border-b p-4 sm:p-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Your cart
          </SheetTitle>
          <SheetDescription>
            {count === 0
              ? "No items in your cart yet."
              : `${count} item${count === 1 ? "" : "s"} in cart`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <CartGroup
                label="Prescription"
                icon={<ShieldAlert className="h-3.5 w-3.5" />}
                tone="destructive"
                items={rxItems}
                onRemove={handleRemove}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
                fp={fp}
              />
              <CartGroup
                label="Over the counter"
                icon={<BadgeCheck className="h-3.5 w-3.5" />}
                tone="primary"
                items={otcItems}
                onRemove={handleRemove}
                onDecrease={handleDecrease}
                onIncrease={handleIncrease}
                fp={fp}
              />
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t bg-muted/30 p-4 sm:p-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Truck className="mr-1 inline h-3.5 w-3.5" />
              Delivery
            </p>
            <p className="mb-3 sm:mb-4 text-xs text-muted-foreground">
              {total >= SHIPPING_THRESHOLD
                ? `Free delivery over €${SHIPPING_THRESHOLD}`
                : `€${SHIPPING_FEE} delivery · Free over €${SHIPPING_THRESHOLD}`}
            </p>
            <div className="space-y-1 text-xs sm:text-sm">
              <Row label="Subtotal" value={fp(total)} />
              <Row label="Delivery" value={shipping === 0 ? "Free" : fp(shipping)} />
              <Separator className="my-1.5 sm:my-2" />
              <Row label="Total (incl. VAT)" value={fp(total + shipping)} bold />
            </div>

            <Button
              className="mt-3 sm:mt-4 w-full rounded-xl"
              onClick={() => {
                setOpen(false);
                navigate({ to: "/checkout" });
              }}
            >
              Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={[
        "flex justify-between",
        bold ? "text-base font-semibold" : "text-muted-foreground",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}

function CartGroup({
  label,
  icon,
  tone,
  items,
  onRemove,
  onDecrease,
  onIncrease,
  fp,
}: {
  label: string;
  icon: React.ReactNode;
  tone: "destructive" | "primary";
  items: ReturnType<typeof useCart.getState>["items"];
  onRemove: (id: string) => void;
  onDecrease: (id: string) => void;
  onIncrease: (id: string) => void;
  fp: (value: number) => string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <Badge
        variant={tone === "destructive" ? "destructive" : "secondary"}
        className={tone === "primary" ? "mb-3 gap-1 bg-primary/10 text-primary" : "mb-3 gap-1"}
      >
        {icon}
        {label}
      </Badge>
      <ul className="space-y-2 sm:space-y-3">
        {items.map((i) => (
          <li key={i.medication.id} className="rounded-2xl border bg-card p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="break-words text-xs sm:text-sm font-medium leading-snug">
                  {i.medication.name}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                  {fp(i.medication.price)} · incl. VAT
                </p>
              </div>
              <button
                onClick={() => onRemove(i.medication.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center rounded-xl border bg-background">
                <button
                  className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] flex items-center justify-center disabled:opacity-30"
                  onClick={() => onDecrease(i.medication.id)}
                  disabled={i.quantity <= 1}
                  aria-label="Decrease"
                >
                  <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <span className="w-7 sm:w-8 text-center text-xs sm:text-sm tabular-nums">
                  {i.quantity}
                </span>
                <button
                  className="p-1.5 sm:p-2 min-w-[32px] sm:min-w-[36px] flex items-center justify-center disabled:opacity-30"
                  onClick={() => onIncrease(i.medication.id)}
                  disabled={i.quantity >= i.medication.stock}
                  aria-label="Increase"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm font-semibold shrink-0">
                {fp(i.medication.price * i.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
