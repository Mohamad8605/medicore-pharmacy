import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { getEnvVar } from "./env";

export async function getAuthUserId(): Promise<string | null> {
  const request = getRequest();

  const authHeader = request?.headers?.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const SUPABASE_URL =
      getEnvVar("SUPABASE_URL") ||
      getEnvVar("VITE_SUPABASE_URL") ||
      getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const SUPABASE_ANON_KEY =
      getEnvVar("SUPABASE_PUBLISHABLE_KEY") ||
      getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY") ||
      getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const token = authHeader.replace("Bearer ", "");
      const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) return data.user.id;
    }
  }

  if (authHeader?.startsWith("Demo ")) {
    try {
      const raw = authHeader.replace("Demo ", "");
      const session = JSON.parse(raw);
      const uid = session?.user?.id;
      if (uid && typeof uid === "string") return uid;
    } catch {
      // bad token, skip
    }
  }

  return null;
}

function getDemoSessionPayload(): Record<string, unknown> | null {
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");
  if (!authHeader?.startsWith("Demo ")) return null;
  try {
    return JSON.parse(authHeader.replace("Demo ", ""));
  } catch {
    return null;
  }
}

export function isDemoRequest(): boolean {
  return getDemoSessionPayload() !== null;
}

export async function requireAuthUserId(): Promise<string> {
  const userId = await getAuthUserId();
  if (!userId) throw new Response("Unauthorized", { status: 401 });
  return userId;
}

export async function requireStaffRole(): Promise<string> {
  const userId = await requireAuthUserId();
  const demoPayload = getDemoSessionPayload();
  if (demoPayload) {
    const demoRoles = (demoPayload.roles ?? []) as string[];
    if (!demoRoles.includes("admin") && !demoRoles.includes("pharmacist")) {
      throw new Response("Forbidden", { status: 403 });
    }
    return userId;
  }
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roleList = (roles ?? []).map((r) => r.role);
  if (!roleList.includes("admin") && !roleList.includes("pharmacist")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return userId;
}

export async function requireAdminRole(): Promise<string> {
  const userId = await requireStaffRole();
  const demoPayload = getDemoSessionPayload();
  if (demoPayload) {
    const demoRoles = (demoPayload.roles ?? []) as string[];
    if (!demoRoles.includes("admin")) {
      throw new Response("Forbidden", { status: 403 });
    }
    return userId;
  }
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roleList = (roles ?? []).map((r) => r.role);
  if (!roleList.includes("admin")) {
    throw new Response("Forbidden", { status: 403 });
  }
  return userId;
}
