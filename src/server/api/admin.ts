import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireAuthUserId, requireStaffRole, requireAdminRole } from "./auth-helpers";
import { getDemoOrders, getDemoProfiles, saveDemoOrders } from "./demo-store";
import { DEMO_USERS } from "./demo-auth";
import type { DemoProfileEntry } from "./demo-store";
import type { Database, Json } from "@/integrations/supabase/types";

const STATUSES = [
  "pending",
  "confirmed",
  "in_preparation",
  "ready",
  "completed",
  "cancelled",
] as const;

type OrderRow = Database["public"]["Tables"]["orders"]["Row"] & {
  order_items: { id: string }[];
};
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export const loadOrders = createServerFn({ method: "GET" }).handler(async (ctx) => {
  const params = ctx.data as unknown as {
    filter: "all" | (typeof STATUSES)[number];
    page: number;
    pageSize: number;
  };
  const filter = params?.filter ?? "all";
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  await requireStaffRole();

  let countQ = supabaseAdmin.from("orders").select("*", { count: "exact", head: true });
  if (filter !== "all") countQ = countQ.eq("status", filter);
  const { count: dbCount } = await countQ;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabaseAdmin
    .from("orders")
    .select("*, order_items(id)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filter !== "all") q = q.eq("status", filter);

  const { data, error } = await q;
  if (error) throw error;

  const allDemoEntries = Array.from(getDemoOrders().values()).flat();
  const filteredDemo =
    filter === "all" ? allDemoEntries : allDemoEntries.filter((e) => e.order.status === filter);
  const totalDemo = filteredDemo.length;
  const demoPage = filteredDemo.slice(
    from - Math.max(0, to - (dbCount ?? 0)),
    to - Math.max(0, to - (dbCount ?? 0)) + 1,
  );
  const allDemoOrders = demoPage.map((e) => ({
    ...e.order,
    order_items: e.items.map(() => ({ id: "" })),
  }));

  const rows = [...((data ?? []) as OrderRow[]), ...allDemoOrders];

  const ids = Array.from(new Set(rows.map((r) => r.user_id)));

  const uuidRE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const realIds = ids.filter((id) => uuidRE.test(id));

  let pm: Record<string, ProfileRow> = {};
  if (realIds.length) {
    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id,first_name,last_name")
      .in("id", realIds);
    pm = Object.fromEntries((profs ?? []).map((p) => [p.id, p as unknown as ProfileRow]));
  }

  for (const [uid, dp] of getDemoProfiles()) {
    if (!pm[uid]) pm[uid] = dp as unknown as ProfileRow;
  }

  for (const u of DEMO_USERS) {
    if (!pm[u.id]) {
      pm[u.id] = {
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
      } as unknown as ProfileRow;
    }
  }

  return {
    orders: rows.map((r) => ({ ...r, profile: pm[r.user_id] ?? null })),
    total: (dbCount ?? 0) + totalDemo,
  };
});

export const updateOrderStatus = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { id, status } = ctx.data as unknown as { id: string; status: (typeof STATUSES)[number] };
  await requireStaffRole();

  for (const [, entries] of getDemoOrders()) {
    const entry = entries.find((e) => e.order.id === id);
    if (entry) {
      entry.order.status = status;
      saveDemoOrders();
      return;
    }
  }

  const patch: Database["public"]["Tables"]["orders"]["Update"] = { status };
  if (status === "completed") patch.completed_at = new Date().toISOString();

  const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", id);
  if (error) throw error;
});

export const getConfirmationSetting = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireAuthUserId();

  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", "require_email_confirmation")
    .maybeSingle();

  if (data?.value !== undefined) {
    return data.value === true || data.value === "true";
  }
  return true;
});

export const toggleConfirmation = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const checked = ctx.data as unknown as boolean;
  await requireStaffRole();

  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert({ key: "require_email_confirmation", value: checked }, { onConflict: "key" });

  if (error) throw error;
});

type MedicationInput = {
  name: string;
  description?: string | null;
  category: string;
  price: number;
  stock: number;
  active_ingredient?: string | null;
  dosage?: string | null;
  manufacturer?: string | null;
  side_effects?: string | null;
  image_url?: string | null;
  requires_prescription: boolean;
  is_active?: boolean;
};
export const fetchAllMedications = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaffRole();
  const { data, error } = await supabaseAdmin.from("medications").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as Database["public"]["Tables"]["medications"]["Row"][];
});

export const createMedication = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireStaffRole();
  const input = ctx.data as unknown as MedicationInput;
  const { error } = await supabaseAdmin.from("medications").insert(input);
  if (error) throw error;
});

export const updateMedication = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireStaffRole();
  const { id, ...data } = ctx.data as unknown as { id: string } & MedicationInput;
  const { error } = await supabaseAdmin.from("medications").update(data).eq("id", id);
  if (error) throw error;
});

type ProfileWithRoles = Database["public"]["Tables"]["profiles"]["Row"] & { roles: string[] };

export const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdminRole();
  const [profilesRes, rolesRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("user_roles").select("user_id, role"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roleMap: Record<string, string[]> = {};
  for (const r of rolesRes.data ?? []) {
    if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
    roleMap[r.user_id].push(r.role);
  }

  const seen = new Set<string>();
  const dbUsers = (profilesRes.data ?? [])
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .map((p) => ({
      ...p,
      roles: roleMap[p.id] ?? [],
    })) as ProfileWithRoles[];

  const dbIds = new Set(dbUsers.map((u) => u.id));

  for (const demo of DEMO_USERS) {
    if (dbIds.has(demo.id)) continue;
    if (demo.roles.length === 0) continue;
    if (!demo.roles.includes("admin") && !demo.roles.includes("pharmacist")) continue;
    const demoProfile = getDemoProfiles().get(demo.id) as DemoProfileEntry | undefined;
    const now = new Date().toISOString();
    dbUsers.push({
      id: demo.id,
      first_name: demoProfile?.first_name ?? demo.first_name,
      last_name: demoProfile?.last_name ?? demo.last_name,
      phone: demoProfile?.phone ?? demo.phone ?? null,
      street: demoProfile?.street ?? null,
      city: demoProfile?.city ?? null,
      postcode: demoProfile?.postcode ?? null,
      created_at: now,
      updated_at: now,
      roles: demo.roles,
    } as ProfileWithRoles);
  }

  return dbUsers;
});
export const updateUserRole = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const adminUserId = await requireAdminRole();
  const { userId, role, action } = ctx.data as unknown as {
    userId: string;
    role: "admin" | "pharmacist" | "patient";
    action: "add" | "remove";
  };

  if (action === "add") {
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role });
    if (error) throw error;
  } else {
    if (role === "patient") {
      const { count } = await supabaseAdmin
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "patient");
      if (count && count <= 1) {
        throw new Response("Cannot remove the last patient role", { status: 400 });
      }
    }
    if (role === "admin" && userId === adminUserId) {
      throw new Response("Cannot remove your own admin role", { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) throw error;
  }
});

export const createUser = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireAdminRole();
  const { email, password, role } = ctx.data as unknown as {
    email: string;
    password: string;
    role: string;
  };
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: data.user.id }, { onConflict: "id", ignoreDuplicates: true });

  if (role) {
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: data.user.id, role: role as "admin" | "pharmacist" | "patient" },
        { onConflict: "user_id, role", ignoreDuplicates: true },
      );
  }
  return data.user;
});

export const deleteUser = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireAdminRole();
  const { userId } = ctx.data as unknown as { userId: string };

  await supabaseAdmin.auth.admin.deleteUser(userId);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("id", userId);
});

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const updateUserProfile = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireAdminRole();
  const { userId, ...updates } = ctx.data as unknown as { userId: string } & ProfileUpdate;
  const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
});

export const getAllSettings = createServerFn({ method: "GET" }).handler(async () => {
  await requireStaffRole();
  const { data, error } = await supabaseAdmin.from("app_settings").select("*");
  if (error) throw error;
  const map: Record<string, Json> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value as Json;
  }
  return map;
});

export const updateSetting = createServerFn({ method: "POST" }).handler(async (ctx) => {
  await requireStaffRole();
  const { key, value } = ctx.data as unknown as { key: string; value: Json };
  const { error } = await supabaseAdmin
    .from("app_settings")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw error;
});

export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const keys = [
    "pharmacy_hours",
    "announcement_enabled",
    "announcement_message",
    "announcement_type",
    "delivery_fee",
    "free_shipping_minimum",
    "estimated_delivery_days",
  ];
  const { data, error } = await supabaseAdmin.from("app_settings").select("*").in("key", keys);
  if (error) throw error;
  const map: Record<string, Json> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value as Json;
  }
  return map;
});
