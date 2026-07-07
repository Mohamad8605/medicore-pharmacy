import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { fetchMedicationStock } from "@/lib/order-service";
import { toast } from "sonner";

export function CartStockSync() {
  const items = useCart((s) => s.items);
  const revalidateStock = useCart((s) => s.revalidateStock);
  const notified = useRef(new Set<string>());

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    const ids = items.map((i) => i.medication.id);
    fetchMedicationStock(ids).then((rows) => {
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const row of rows) {
        map[row.id] = row.stock;
      }
      const removed = revalidateStock(map);
      for (const name of removed) {
        if (!notified.current.has(name)) {
          notified.current.add(name);
          toast.error(`"${name}" is no longer in stock and was removed from your cart`);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [items, revalidateStock]);

  return null;
}
