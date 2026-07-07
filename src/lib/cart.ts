import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartMedication {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  requires_prescription: boolean;
}

export interface CartItem {
  medication: CartMedication;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (med: CartMedication, qty?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, qty: number) => void;
  clear: () => void;
  revalidateStock: (stockMap: Record<string, number>) => string[];
  total: () => number;
  count: () => number;
  needsPrescription: () => boolean;
}

// Cart with localStorage persistence.
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (med, qty = 1) => {
        const s = get();
        const existing = s.items.find((i) => i.medication.id === med.id);
        let next: CartItem[];
        if (existing) {
          const prev = existing.quantity;
          const nextQty = Math.min(med.stock, prev + qty);
          next = s.items.map((i) => (i.medication.id === med.id ? { ...i, quantity: nextQty } : i));
        } else {
          const nextQty = Math.min(med.stock, qty);
          next = [...s.items, { medication: med, quantity: nextQty }];
        }
        set({ items: next });
      },
      remove: (id) => {
        set({ items: get().items.filter((i) => i.medication.id !== id) });
      },
      setQuantity: (id, qty) => {
        const s = get();
        const item = s.items.find((i) => i.medication.id === id);
        if (!item) return;
        const next = Math.max(1, Math.min(item.medication.stock, qty));
        set({
          items: s.items.map((i) => (i.medication.id === id ? { ...i, quantity: next } : i)),
        });
      },
      revalidateStock: (stockMap) => {
        const s = get();
        const removed: string[] = [];
        const next = s.items
          .map((item) => {
            const currentStock = stockMap[item.medication.id];
            if (currentStock === undefined) return item;
            if (currentStock <= 0) {
              removed.push(item.medication.name);
              return null;
            }
            const updatedMed = { ...item.medication, stock: currentStock };
            if (item.quantity > currentStock) {
              return { ...item, medication: updatedMed, quantity: currentStock };
            }
            if (item.medication.stock !== currentStock) {
              return { ...item, medication: updatedMed };
            }
            return item;
          })
          .filter(Boolean) as CartItem[];
        set({ items: next });
        return removed;
      },
      clear: () => {
        set({ items: [] });
      },
      total: () => get().items.reduce((sum, i) => sum + i.medication.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      needsPrescription: () => get().items.some((i) => i.medication.requires_prescription),
    }),
    { name: "mohamads-medicore-cart" },
  ),
);
