import type { Database } from "@/integrations/supabase/types";
import {
  fetchUserOrders as serverFetchUserOrders,
  fetchOrderById as serverFetchOrderById,
  createOrder as serverCreateOrder,
  createOrderItems as serverCreateOrderItems,
  uploadPrescription as serverUploadPrescription,
  cancelOrder as serverCancelOrder,
  deleteOrder as serverDeleteOrder,
  getPrescriptionSignedUrl as serverGetPrescriptionSignedUrl,
  checkMedicationStock as serverCheckMedicationStock,
  fetchMedicationStock as serverFetchMedicationStock,
  getMedicationsByIds as serverGetMedicationsByIds,
  validateStock as serverValidateStock,
  reserveStock as serverReserveStock,
  releaseStock as serverReleaseStock,
  checkAndReserveStock as serverCheckAndReserveStock,
  updateOrder as serverUpdateOrder,
} from "@/server/api/orders";

type ServerFn<TInput, TOutput> = (args: { data: TInput }) => Promise<TOutput>;
type OrderInput = {
  total_price: number;
  delivery_method: "pickup" | "delivery";
  street: string | null;
  city: string | null;
  postcode: string | null;
  notes: string | null;
  prescription_path: string | null;
};

type OrderItemInput = Array<{
  order_id: string;
  medication_id: string;
  quantity: number;
  unit_price: number;
}>;

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

// Paginated order list for the current user. Returns orders and a total count for the UI.
export async function fetchUserOrders(page = 1, pageSize = 20) {
  return await (
    serverFetchUserOrders as unknown as ServerFn<
      { page: number; pageSize: number },
      { orders: Record<string, unknown>[]; total: number }
    >
  )({ data: { page, pageSize } });
}

// Single order lookup. Used on the order detail page.
export async function fetchOrderById(orderId: string) {
  return await (
    serverFetchOrderById as unknown as ServerFn<string, Record<string, unknown> | null>
  )({
    data: orderId,
  });
}

// Places a new order with address, delivery method, and prescription path.
export async function createOrder(order: OrderInput) {
  return await (serverCreateOrder as unknown as ServerFn<OrderInput, OrderRow>)({
    data: order,
  });
}

// Inserts line items after the order header is created.
export async function createOrderItems(items: OrderItemInput) {
  return await (serverCreateOrderItems as unknown as ServerFn<OrderItemInput, void>)({
    data: items,
  });
}

// Encodes the file to base64 and sends it to the server for Supabase Storage upload.
export async function uploadPrescription(
  file: File,
): Promise<{ path: string | null; error?: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  type UploadInput = { fileName: string; fileBase64: string };
  return await (
    serverUploadPrescription as unknown as ServerFn<
      UploadInput,
      { path: string | null; error?: string }
    >
  )({
    data: { fileName: file.name, fileBase64: base64 },
  });
}

// Returns stock info for a single medication. Null means the medication does not exist.
export async function checkMedicationStock(medicationId: string) {
  return await (
    serverCheckMedicationStock as unknown as ServerFn<
      { medicationId: string },
      { id: string; stock: number; name: string } | null
    >
  )({ data: { medicationId } });
}

type StockCheckInput = Array<{ medication_id: string; quantity: number }>;

// Batch stock lookup. Used at checkout to validate all cart items at once.
export async function fetchMedicationStock(ids: string[]) {
  return await (
    serverFetchMedicationStock as unknown as ServerFn<
      string[],
      Array<{ id: string; stock: number }>
    >
  )({ data: ids });
}

type CartMedicationData = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  requires_prescription: boolean;
};

// Builds the cart detail view: fetches name, price, and image for each item.
export async function getMedicationsByIds(ids: string[]) {
  return await (serverGetMedicationsByIds as unknown as ServerFn<string[], CartMedicationData[]>)({
    data: ids,
  });
}

// Server-side stock validation before checkout confirms quantities are still available.
export async function validateStock(items: StockCheckInput) {
  return await (serverValidateStock as unknown as ServerFn<StockCheckInput, void>)({
    data: items,
  });
}

// Deducts stock after an order is confirmed. Runs inside a server transaction.
export async function reserveStock(medicationId: string, quantity: number) {
  return await (
    serverReserveStock as unknown as ServerFn<{ medicationId: string; quantity: number }, void>
  )({ data: { medicationId, quantity } });
}

// Restores stock when an order is cancelled.
export async function releaseStock(medicationId: string, quantity: number) {
  return await (
    serverReleaseStock as unknown as ServerFn<{ medicationId: string; quantity: number }, void>
  )({ data: { medicationId, quantity } });
}

type CheckAndReserveResult = {
  error?: string;
  remaining: number;
};

// Atomic check-and-reserve: validates stock then deducts it in one server call.
export async function checkAndReserveStock(medicationId: string, quantity: number) {
  return await (
    serverCheckAndReserveStock as unknown as ServerFn<
      { medicationId: string; quantity: number },
      CheckAndReserveResult
    >
  )({ data: { medicationId, quantity } });
}

// Cancels a pending order. Server-side enforces ownership and status checks.
export async function cancelOrder(orderId: string) {
  return await (serverCancelOrder as unknown as ServerFn<string, boolean>)({ data: orderId });
}

// Hard-deletes an order. Admin-only, used from the staff dashboard.
export async function deleteOrder(orderId: string) {
  return await (serverDeleteOrder as unknown as ServerFn<string, boolean>)({ data: orderId });
}

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

// Updates order details (address, items, notes). Used during checkout editing.
export async function updateOrder(input: UpdateOrderInput) {
  return await (serverUpdateOrder as unknown as ServerFn<UpdateOrderInput, void>)({ data: input });
}

// Generates a short-lived URL for viewing an uploaded prescription in the browser.
export async function getPrescriptionSignedUrl(path: string) {
  return await (serverGetPrescriptionSignedUrl as unknown as ServerFn<string, string | null>)({
    data: path,
  });
}
