import {
  fetchActiveMedications as serverFetchActiveMedications,
  fetchMedicationById as serverFetchMedicationById,
} from "@/server/api/medications";
import type { Database } from "@/integrations/supabase/types";

type Medication = Database["public"]["Tables"]["medications"]["Row"];
type ServerFn<TInput, TOutput> = (args: { data: TInput }) => Promise<TOutput>;

// Returns all active medications for the catalogue page. Inactive items are hidden from customers.
export async function fetchActiveMedications(): Promise<Medication[]> {
  return await (serverFetchActiveMedications as unknown as () => Promise<Medication[]>)();
}

// Single medication detail. Returns null if the ID does not exist or the item is inactive.
export async function fetchMedicationById(id: string): Promise<Medication | null> {
  return await (serverFetchMedicationById as unknown as ServerFn<string, Medication | null>)({
    data: id,
  });
}
