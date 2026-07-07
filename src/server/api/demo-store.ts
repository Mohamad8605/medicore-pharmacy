import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "@/integrations/supabase/types";

export interface DemoItem {
  quantity: number;
  unit_price: number;
  medication_id: string;
  medication_name: string;
}

export interface DemoOrderEntry {
  order: Database["public"]["Tables"]["orders"]["Row"];
  items: DemoItem[];
}

export interface DemoProfileEntry {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  postcode: string | null;
}

const DATA_DIR = join(process.cwd(), ".demo-data");
const ORDERS_PATH = join(DATA_DIR, "orders.json");
const PROFILES_PATH = join(DATA_DIR, "profiles.json");

function loadJSON<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function saveJSON(path: string, data: unknown) {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("demo data save failed:", e);
  }
}

const savedOrders = loadJSON<[string, DemoOrderEntry[]][]>(ORDERS_PATH);
const ordersMap: Map<string, DemoOrderEntry[]> = new Map(savedOrders ?? []);

const savedProfiles = loadJSON<[string, DemoProfileEntry][]>(PROFILES_PATH);
const profilesMap: Map<string, DemoProfileEntry> = new Map(savedProfiles ?? []);

function persistOrders() {
  saveJSON(ORDERS_PATH, Array.from(ordersMap.entries()));
}

function persistProfiles() {
  saveJSON(PROFILES_PATH, Array.from(profilesMap.entries()));
}

export function getDemoOrders(): Map<string, DemoOrderEntry[]> {
  return ordersMap;
}

export function getDemoProfiles(): Map<string, DemoProfileEntry> {
  return profilesMap;
}

export function saveDemoOrders() {
  persistOrders();
}

export function saveDemoProfiles() {
  persistProfiles();
}
