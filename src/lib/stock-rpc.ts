import { supabase } from "@/integrations/supabase/client";

function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  if (err && typeof err === "object" && "message" in err)
    return new Error(String((err as { message: unknown }).message));
  return new Error(String(err));
}

// Deducts stock with an optimistic guard against overselling.
export async function reserveStockRPC(medicationId: string, quantity: number) {
  const { data: med, error: readErr } = await supabase
    .from("medications")
    .select("stock")
    .eq("id", medicationId)
    .single();

  if (readErr) throw toError(readErr);
  if (!med) throw new Error("Medication not found");
  if (med.stock < quantity)
    throw new Error(`Insufficient stock: only ${med.stock} available, requested ${quantity}`);

  const newStock = med.stock - quantity;
  const { error: updateErr } = await supabase
    .from("medications")
    .update({ stock: newStock })
    .eq("id", medicationId)
    .gte("stock", quantity);

  if (updateErr) throw toError(updateErr);
}

// Adds stock back when an item is removed from cart or an order is cancelled.
export async function releaseStockRPC(medicationId: string, quantity: number) {
  const { data: med, error: readErr } = await supabase
    .from("medications")
    .select("stock")
    .eq("id", medicationId)
    .single();

  if (readErr) throw toError(readErr);
  if (!med) throw new Error("Medication not found");

  const newStock = med.stock + quantity;
  const { error: updateErr } = await supabase
    .from("medications")
    .update({ stock: newStock })
    .eq("id", medicationId);

  if (updateErr) throw toError(updateErr);
}
