import { useEffect, useRef } from "react";
import { fetchMedicationStock } from "./order-service";
import { useStockStore } from "./stock-store";

// Polls stock every 30s and on tab focus.
export function useStockSync(ids: string[], intervalMs = 30_000) {
  const epoch = useStockStore((s) => s.epoch);
  const setMultiple = useStockStore((s) => s.setMultiple);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      const currentIds = idsRef.current.filter(Boolean);
      if (!currentIds.length) return;
      try {
        const rows = await fetchMedicationStock(currentIds);
        if (!mounted) return;
        const map: Record<string, number> = {};
        for (const row of rows) {
          map[row.id] = row.stock;
        }
        setMultiple(map);
      } catch {
        // network error — keep the last known stock values
      }
    };

    fetch();
    const id = setInterval(fetch, intervalMs);

    const onFocus = () => {
      fetch();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      mounted = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [intervalMs, epoch, setMultiple]);

  return useStockStore((s) => s.stockMap);
}
