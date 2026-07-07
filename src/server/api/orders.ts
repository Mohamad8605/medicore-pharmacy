import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { requireAuthUserId, isDemoRequest } from "./auth-helpers";
import { getDemoOrders, getDemoProfiles, saveDemoOrders, saveDemoProfiles } from "./demo-store";
import type { DemoItem } from "./demo-store";

function fmtDemoOrderSummary(o: {
  order: Database["public"]["Tables"]["orders"]["Row"];
  items: DemoItem[];
}) {
  return {
    id: o.order.id,
    total_price: o.order.total_price,
    status: o.order.status,
    delivery_method: o.order.delivery_method,
    created_at: o.order.created_at,
    order_items: o.items.map((i) => ({ quantity: i.quantity })),
  };
}

export const reserveStock = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const { medicationId, quantity } = ctx.data as unknown as {
    medicationId: string;
    quantity: number;
  };
  const { data: med, error: readErr } = await supabaseAdmin
    .from("medications")
    .select("stock")
    .eq("id", medicationId)
    .single();

  if (readErr) throw readErr;
  if (!med) throw new Error("Medication not found");
  if (med.stock < quantity)
    throw new Error(`Insufficient stock: only ${med.stock} available, requested ${quantity}`);

  const { error: updateErr } = await supabaseAdmin
    .from("medications")
    .update({ stock: med.stock - quantity })
    .eq("id", medicationId)
    .gte("stock", quantity);

  if (updateErr) throw updateErr;
});

export const releaseStock = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const { medicationId, quantity } = ctx.data as unknown as {
    medicationId: string;
    quantity: number;
  };
  const { data: med, error: readErr } = await supabaseAdmin
    .from("medications")
    .select("stock")
    .eq("id", medicationId)
    .single();

  if (readErr) throw readErr;
  if (!med) throw new Error("Medication not found");

  const { error: updateErr } = await supabaseAdmin
    .from("medications")
    .update({ stock: med.stock + quantity })
    .eq("id", medicationId);

  if (updateErr) throw updateErr;
});

type CheckAndReserveResult = {
  error?: string;
  remaining: number;
};

export const checkAndReserveStock = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const { medicationId, quantity } = ctx.data as unknown as {
    medicationId: string;
    quantity: number;
  };
  const { data: med, error: readErr } = await supabaseAdmin
    .from("medications")
    .select("id, stock, name")
    .eq("id", medicationId)
    .maybeSingle();

  if (readErr) return { remaining: 0, error: "Database error" } satisfies CheckAndReserveResult;
  if (!med) return { remaining: 0, error: "Medication not found" } satisfies CheckAndReserveResult;
  if (med.stock <= 0)
    return { remaining: 0, error: `${med.name} is out of stock` } satisfies CheckAndReserveResult;
  if (med.stock < quantity)
    return {
      remaining: med.stock,
      error: `Only ${med.stock} of "${med.name}" in stock`,
    } satisfies CheckAndReserveResult;

  const { error: updateErr } = await supabaseAdmin
    .from("medications")
    .update({ stock: med.stock - quantity })
    .eq("id", medicationId)
    .gte("stock", quantity);

  if (updateErr)
    return { remaining: 0, error: "Could not reserve stock" } satisfies CheckAndReserveResult;

  return { remaining: med.stock - quantity } satisfies CheckAndReserveResult;
});

export const fetchUserOrders = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const userId = await requireAuthUserId();
  const params = ctx.data as unknown as { page?: number; pageSize?: number };
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;

  if (isDemoRequest()) {
    const all = getDemoOrders().get(userId) ?? [];
    const from = (page - 1) * pageSize;
    const sliced = all.slice(from, from + pageSize).map(fmtDemoOrderSummary);
    return { orders: sliced, total: all.length };
  }

  const { count: total } = await supabaseAdmin
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const from = (page - 1) * pageSize;
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, total_price, status, delivery_method, created_at, order_items(quantity)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error("fetchUserOrders failed:", error.message);
    return { orders: [], total: 0 };
  }

  return { orders: data ?? [], total: total ?? 0 };
});

export const fetchOrderById = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const orderId = ctx.data as unknown as string;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const entry = (getDemoOrders().get(userId) ?? []).find((e) => e.order.id === orderId);
    if (!entry) return null;
    return {
      ...entry.order,
      order_items: entry.items.map((i) => ({
        medication_id: i.medication_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        medications: { name: i.medication_name },
      })),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(medication_id, quantity, unit_price, medications(name))")
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error("fetchOrderById failed:", error.message);
    return null;
  }

  return data;
});

type OrderInput = {
  total_price: number;
  delivery_method: "pickup" | "delivery";
  street: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
  prescription_path: string | null;
};

export const createOrder = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { total_price, delivery_method, street, city, postcode, notes, prescription_path } =
    ctx.data as unknown as OrderInput;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    if (!getDemoProfiles().has(userId)) {
      const req = getRequest();
      const raw = req?.headers?.get("authorization")?.replace("Demo ", "");
      let first = "Demo",
        last = "User";
      if (raw)
        try {
          const s = JSON.parse(raw);
          const m = s?.user?.user_metadata;
          if (m?.first_name) first = m.first_name;
          if (m?.last_name) last = m.last_name;
        } catch {
          // bad json, keep defaults
        }
      getDemoProfiles().set(userId, {
        id: userId,
        first_name: first,
        last_name: last,
        phone: null,
        street: null,
        city: null,
        postcode: null,
      });
      saveDemoProfiles();
    }

    const order: Database["public"]["Tables"]["orders"]["Row"] & {
      pharmacist_notes: string | null;
    } = {
      id: crypto.randomUUID(),
      user_id: userId,
      total_price,
      status: "pending" as const,
      delivery_method,
      street,
      city,
      postcode,
      notes,
      prescription_path,
      pharmacist_notes: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const existing = getDemoOrders().get(userId) ?? [];
    existing.push({ order, items: [] });
    getDemoOrders().set(userId, existing);
    saveDemoOrders();
    return order;
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      user_id: userId,
      total_price,
      delivery_method,
      street,
      city,
      postcode,
      notes,
      prescription_path,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
});

type OrderItemInput = Array<{
  order_id: string;
  medication_id: string;
  quantity: number;
  unit_price: number;
}>;

export const createOrderItems = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const items = ctx.data as unknown as OrderItemInput;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const ids = items.map((i) => i.medication_id);
    const { data: meds } = await supabaseAdmin.from("medications").select("id, name").in("id", ids);
    const nameMap = Object.fromEntries((meds ?? []).map((m) => [m.id, m.name]));
    const demoItems: DemoItem[] = items.map((i) => ({
      quantity: i.quantity,
      unit_price: i.unit_price,
      medication_id: i.medication_id,
      medication_name: nameMap[i.medication_id] ?? "Unknown",
    }));
    const existing = getDemoOrders().get(userId) ?? [];
    const entry = existing.find((e) => e.order.id === items[0]?.order_id);
    if (entry) {
      entry.items.push(...demoItems);
      saveDemoOrders();
    }
    return;
  }

  const { error: insertError } = await supabaseAdmin.from("order_items").insert(items);
  if (insertError) throw insertError;
});

export const checkMedicationStock = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const { medicationId } = ctx.data as unknown as { medicationId: string };
  const { data, error } = await supabaseAdmin
    .from("medications")
    .select("id, stock, name")
    .eq("id", medicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Medication not found");
  return data;
});

export const fetchMedicationStock = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const ids = ctx.data as unknown as string[];
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin.from("medications").select("id, stock").in("id", ids);
  if (error) throw error;
  return data ?? [];
});

export const getMedicationsByIds = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const ids = ctx.data as unknown as string[];
  if (!ids.length) return [];
  const { data, error } = await supabaseAdmin
    .from("medications")
    .select("id, name, price, stock, image_url, requires_prescription")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
});

export const validateStock = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const items = ctx.data as unknown as Array<{ medication_id: string; quantity: number }>;
  await requireAuthUserId();

  if (isDemoRequest()) return;

  const ids = items.map((i) => i.medication_id);
  const { data: meds, error } = await supabaseAdmin
    .from("medications")
    .select("id, name, stock")
    .in("id", ids);

  if (error) throw error;

  const map = Object.fromEntries((meds ?? []).map((m) => [m.id, m]));
  const shortages: string[] = [];

  for (const item of items) {
    const med = map[item.medication_id];
    if (!med) {
      shortages.push(`Medication ${item.medication_id} not found`);
    } else if (med.stock < item.quantity) {
      shortages.push(`"${med.name}" only ${med.stock} in stock, requested ${item.quantity}`);
    }
  }

  if (shortages.length > 0) {
    throw new Error(`Insufficient stock:\n${shortages.join("\n")}`);
  }
});

type UploadInput = {
  fileName: string;
  fileBase64: string;
};

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];
const MAX_PRESCRIPTION_SIZE = 5 * 1024 * 1024;

const MAGIC_BYTES: Record<string, Uint8Array> = {
  "\xff\xd8\xff": new Uint8Array([0xff, 0xd8, 0xff]),
  "\x89PNG\r\n\x1a\n": new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "%PDF": new Uint8Array([0x25, 0x50, 0x44, 0x46]),
};

export const uploadPrescription = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { fileName, fileBase64 } = ctx.data as unknown as UploadInput;
  const userId = await requireAuthUserId();
  const ext = fileName.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(fileBase64, "base64");

  if (buffer.length > MAX_PRESCRIPTION_SIZE) {
    return { path: null, error: "File size exceeds the 5 MB limit" };
  }

  const extLower = `.${ext?.toLowerCase() ?? ""}`;
  if (!ALLOWED_EXTENSIONS.includes(extLower)) {
    return { path: null, error: "Only JPG, PNG and PDF files are allowed" };
  }

  const header = new Uint8Array(buffer.subarray(0, 8));
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng =
    header[0] === 0x89 &&
    header[1] === 0x50 &&
    header[2] === 0x4e &&
    header[3] === 0x47 &&
    header[4] === 0x0d &&
    header[5] === 0x0a &&
    header[6] === 0x1a &&
    header[7] === 0x0a;
  const isPdf =
    header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;

  if (!isJpeg && !isPng && !isPdf) {
    return { path: null, error: "File content does not match any allowed format (JPG, PNG, PDF)" };
  }
  if (isDemoRequest()) {
    return { path: `demo/${path}` };
  }

  const { error } = await supabaseAdmin.storage
    .from("prescriptions")
    .upload(path, buffer, { contentType: "application/octet-stream" });

  if (error) return { path: null, error: error.message };
  return { path };
});

export const getPrescriptionSignedUrl = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const path = ctx.data as unknown as string;
  await requireAuthUserId();
  if (isDemoRequest() || path.startsWith("demo/")) return null;
  const { data } = await supabaseAdmin.storage.from("prescriptions").createSignedUrl(path, 3600);

  return data?.signedUrl ?? null;
});

export const cancelOrder = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const orderId = ctx.data as unknown as string;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const existing = getDemoOrders().get(userId) ?? [];
    const entry = existing.find((e) => e.order.id === orderId);
    if (!entry) throw new Error("Order not found");
    if (entry.order.user_id !== userId) throw new Error("You can only cancel your own orders");
    if (entry.order.status !== "pending") throw new Error("Only pending orders can be cancelled");

    for (const item of entry.items) {
      const { data: med } = await supabaseAdmin
        .from("medications")
        .select("stock")
        .eq("id", item.medication_id)
        .single();
      if (med) {
        await supabaseAdmin
          .from("medications")
          .update({ stock: med.stock + item.quantity })
          .eq("id", item.medication_id);
      }
    }

    entry.order.status = "cancelled";
    saveDemoOrders();
    return true;
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) throw new Error("Order not found");
  if (order.user_id !== userId) throw new Error("You can only cancel your own orders");
  if (order.status !== "pending") throw new Error("Only pending orders can be cancelled");

  const { data: orderItems, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("medication_id, quantity")
    .eq("order_id", orderId);

  if (itemsErr) throw itemsErr;

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId);

  if (error) throw error;

  for (const item of orderItems ?? []) {
    const { data: med } = await supabaseAdmin
      .from("medications")
      .select("stock")
      .eq("id", item.medication_id)
      .single();
    if (med) {
      await supabaseAdmin
        .from("medications")
        .update({ stock: med.stock + item.quantity })
        .eq("id", item.medication_id);
    }
  }

  return true;
});

export const deleteOrder = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const orderId = ctx.data as unknown as string;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const existing = getDemoOrders().get(userId) ?? [];
    const entry = existing.find((e) => e.order.id === orderId);
    if (!entry) throw new Error("Order not found");
    if (entry.order.user_id !== userId) throw new Error("You can only delete your own orders");
    if (entry.order.status !== "cancelled") throw new Error("Only cancelled orders can be deleted");

    const updated = existing.filter((e) => e.order.id !== orderId);
    getDemoOrders().set(userId, updated);
    saveDemoOrders();
    return true;
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) throw new Error("Order not found");
  if (order.user_id !== userId) throw new Error("You can only delete your own orders");
  if (order.status !== "cancelled") throw new Error("Only cancelled orders can be deleted");

  const { error } = await supabaseAdmin.from("orders").delete().eq("id", orderId);
  if (error) throw error;
  return true;
});

type UpdateOrderInput = {
  orderId: string;
  items: Array<{ medication_id: string; quantity: number; unit_price: number }>;
  total_price: number;
  delivery_method: "pickup" | "delivery";
  street: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
};

export const updateOrder = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { orderId, items, total_price, delivery_method, street, city, postcode, notes } =
    ctx.data as unknown as UpdateOrderInput;
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const existing = getDemoOrders().get(userId) ?? [];
    const entry = existing.find((e) => e.order.id === orderId);
    if (!entry) throw new Error("Order not found");
    if (entry.order.user_id !== userId) throw new Error("You can only edit your own orders");
    if (entry.order.status !== "pending") throw new Error("Only pending orders can be edited");

    const ids = items.map((i) => i.medication_id);
    const { data: meds } = await supabaseAdmin.from("medications").select("id, name").in("id", ids);
    const nameMap = Object.fromEntries((meds ?? []).map((m) => [m.id, m.name]));

    entry.items = items.map((i) => ({
      quantity: i.quantity,
      unit_price: i.unit_price,
      medication_id: i.medication_id,
      medication_name: nameMap[i.medication_id] ?? "Unknown",
    }));
    entry.order.total_price = total_price;
    entry.order.delivery_method = delivery_method;
    entry.order.street = street;
    entry.order.city = city;
    entry.order.postcode = postcode;
    entry.order.notes = notes;
    saveDemoOrders();
    return;
  }

  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr || !order) throw new Error("Order not found");
  if (order.user_id !== userId) throw new Error("You can only edit your own orders");
  if (order.status !== "pending") throw new Error("Only pending orders can be edited");

  const { data: oldItems, error: itemsErr } = await supabaseAdmin
    .from("order_items")
    .select("medication_id, quantity")
    .eq("order_id", orderId);

  if (itemsErr) throw itemsErr;

  const newMap = new Map(items.map((i) => [i.medication_id, i.quantity]));
  const oldMap = new Map((oldItems ?? []).map((i) => [i.medication_id, i.quantity]));

  for (const [medId, newQty] of newMap) {
    const oldQty = oldMap.get(medId) ?? 0;
    const diff = newQty - oldQty;
    if (diff > 0) {
      const { data: med, error: readErr } = await supabaseAdmin
        .from("medications")
        .select("stock")
        .eq("id", medId)
        .single();
      if (readErr) throw readErr;
      if (!med || med.stock < diff) {
        const item = items.find((i) => i.medication_id === medId);
        throw new Error(
          `Insufficient stock for "${item ? "item" : medId}": need ${diff} more, only ${med?.stock ?? 0} available`,
        );
      }
      const { error: updateErr } = await supabaseAdmin
        .from("medications")
        .update({ stock: med.stock - diff })
        .eq("id", medId)
        .gte("stock", diff);
      if (updateErr) throw updateErr;
    } else if (diff < 0) {
      const releaseQty = -diff;
      const { data: med } = await supabaseAdmin
        .from("medications")
        .select("stock")
        .eq("id", medId)
        .single();
      if (med) {
        await supabaseAdmin
          .from("medications")
          .update({ stock: med.stock + releaseQty })
          .eq("id", medId);
      }
    }
  }

  for (const [medId, oldQty] of oldMap) {
    if (!newMap.has(medId)) {
      const { data: med } = await supabaseAdmin
        .from("medications")
        .select("stock")
        .eq("id", medId)
        .single();
      if (med) {
        await supabaseAdmin
          .from("medications")
          .update({ stock: med.stock + oldQty })
          .eq("id", medId);
      }
    }
  }

  const { error: deleteItemsErr } = await supabaseAdmin
    .from("order_items")
    .delete()
    .eq("order_id", orderId);
  if (deleteItemsErr) throw deleteItemsErr;

  const newItems = items.map((i) => ({
    order_id: orderId,
    medication_id: i.medication_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));
  const { error: insertErr } = await supabaseAdmin.from("order_items").insert(newItems);
  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      total_price,
      delivery_method,
      street,
      city,
      postcode,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (updateErr) throw updateErr;
});
