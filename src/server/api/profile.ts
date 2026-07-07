import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { requireAuthUserId, isDemoRequest } from "./auth-helpers";
import { getDemoProfiles, saveDemoProfiles } from "./demo-store";
export const fetchProfile = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireAuthUserId();

  if (isDemoRequest()) {
    const demoProfiles = getDemoProfiles();
    const saved = demoProfiles.get(userId);
    if (saved) {
      return {
        id: userId,
        email: userId,
        first_name: saved.first_name,
        last_name: saved.last_name,
        phone: saved.phone,
        street: saved.street,
        city: saved.city,
        postcode: saved.postcode,
        role: null,
        created_at: new Date().toISOString(),
      };
    }
    return {
      id: userId,
      email: userId,
      first_name: "Demo",
      last_name: "User",
      phone: null,
      street: null,
      city: null,
      postcode: null,
      role: null,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("fetchProfile error:", error.message);
    return null;
  }

  return data;
});

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const updateProfile = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const updates = ctx.data as unknown as ProfileUpdate;
  const userId = await requireAuthUserId();
  if (isDemoRequest()) {
    const demoProfiles = getDemoProfiles();
    const existing = demoProfiles.get(userId);
    demoProfiles.set(userId, {
      id: userId,
      first_name: updates.first_name ?? existing?.first_name ?? "Demo",
      last_name: updates.last_name ?? existing?.last_name ?? "User",
      phone: updates.phone ?? existing?.phone ?? null,
      street: updates.street ?? existing?.street ?? null,
      city: updates.city ?? existing?.city ?? null,
      postcode: updates.postcode ?? existing?.postcode ?? null,
    });
    saveDemoProfiles();
    return { error: null };
  }

  const { error } = await supabaseAdmin.from("profiles").update(updates).eq("id", userId);

  if (error) {
    console.error("updateProfile error:", error.message);
    return { error: error.message };
  }

  return { error: null };
});
