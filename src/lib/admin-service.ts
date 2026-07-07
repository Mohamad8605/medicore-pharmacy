import type { Json } from "@/integrations/supabase/types";
import {
  loadOrders as serverLoadOrders,
  updateOrderStatus as serverUpdateOrderStatus,
  getConfirmationSetting as serverGetConfirmationSetting,
  toggleConfirmation as serverToggleConfirmation,
  fetchAllMedications as serverFetchAllMedications,
  createMedication as serverCreateMedication,
  updateMedication as serverUpdateMedication,
  getAllSettings as serverGetAllSettings,
  updateSetting as serverUpdateSetting,
  getPublicSettings as serverGetPublicSettings,
} from "@/server/api/admin";

type ServerFn<TInput, TOutput> = (args: { data: TInput }) => Promise<TOutput>;

// Returns a paginated list of all orders. The filter can be "all", "pending", "confirmed", etc.
export async function loadOrders(filter: string, page = 1, pageSize = 10) {
  return await (
    serverLoadOrders as unknown as ServerFn<
      { filter: string; page: number; pageSize: number },
      { orders: Record<string, unknown>[]; total: number }
    >
  )({
    data: { filter, page, pageSize },
  });
}

// Advances an order from one status to the next (pending → confirmed → ready → completed).
export async function updateOrderStatus(id: string, status: string) {
  return await (
    serverUpdateOrderStatus as unknown as ServerFn<{ id: string; status: string }, void>
  )({
    data: { id, status },
  });
}

// Reads whether email confirmation is required before new users can sign in.
export async function getConfirmationSetting(): Promise<boolean> {
  return await (serverGetConfirmationSetting as unknown as () => Promise<boolean>)();
}

// Toggles the email confirmation requirement on or off from the admin settings panel.
export async function toggleConfirmation(checked: boolean) {
  return await (serverToggleConfirmation as unknown as ServerFn<boolean, void>)({ data: checked });
}

// Returns every medication including inactive ones. Used in the admin medication editor.
export async function fetchAllMedications() {
  return await (serverFetchAllMedications as unknown as () => Promise<Record<string, unknown>[]>)();
}

// Adds a new medication to the catalogue. Admin-only.
export async function createMedication(data: Record<string, unknown>) {
  return await (serverCreateMedication as unknown as ServerFn<Record<string, unknown>, void>)({
    data,
  });
}

// Updates a medication's name, price, stock, or active status. Admin-only.
export async function updateMedication(id: string, data: Record<string, unknown>) {
  return await (
    serverUpdateMedication as unknown as ServerFn<{ id: string } & Record<string, unknown>, void>
  )({
    data: { id, ...data },
  });
}

// Loads all app settings (confirmation toggle, store hours, etc.) for the admin panel.
export async function getAllSettings(): Promise<Record<string, Json>> {
  return await (serverGetAllSettings as unknown as () => Promise<Record<string, Json>>)();
}

// Persists a single setting change from the admin panel.
export async function updateSetting(key: string, value: Json) {
  return await (serverUpdateSetting as unknown as ServerFn<{ key: string; value: Json }, void>)({
    data: { key, value },
  });
}

// Returns settings visible to all users (e.g., store hours, announcement banner text).
export async function getPublicSettings(): Promise<Record<string, Json>> {
  return await (serverGetPublicSettings as unknown as () => Promise<Record<string, Json>>)();
}
