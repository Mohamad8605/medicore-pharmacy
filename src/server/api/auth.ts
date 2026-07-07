import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { categorizeAuthError, type AuthFailure } from "@/lib/auth-types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getEnvVar } from "./env";
import { requireAuthUserId } from "./auth-helpers";

// Server-side anon client with no session persistence.
function createAnonClient() {
  const SUPABASE_URL =
    getEnvVar("SUPABASE_URL") ||
    getEnvVar("VITE_SUPABASE_URL") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const SUPABASE_ANON_KEY =
    getEnvVar("SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("VITE_SUPABASE_PUBLISHABLE_KEY") ||
    getEnvVar("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Response("Missing Supabase configuration", { status: 500 });
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export type { AuthFailure };
type SignUpInput = {
  email: string;
  password: string;
  options?: { emailRedirectTo?: string; data?: Record<string, string> };
};

// Creates a new user via Supabase Admin API.
export const signUp = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { email, password, options } = ctx.data as unknown as SignUpInput;

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: options?.data,
  });

  if (createError) return { error: createError.message };

  const supabase = createAnonClient();
  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: options?.emailRedirectTo },
  });

  if (resendError) {
    console.error("Failed to send confirmation email:", resendError);
  }

  return { user: created.user, session: null };
});

// Authenticates a user with email/password.
export const signIn = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const { email, password } = ctx.data as unknown as { email: string; password: string };
  const supabase = createAnonClient();
  const { data: result, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const failure = categorizeAuthError(error, email);
    return { failure };
  }

  return { user: result.user, session: result.session };
});
// Resends the confirmation email.
export const resendVerification = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const email = ctx.data as unknown as string;

  const { error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "signup",
    email,
    password: crypto.randomUUID(),
    options: { redirectTo: `${process.env.APP_URL || "http://localhost:8080"}/` },
  });

  if (linkError) return { error: linkError.message };

  const supabase = createAnonClient();
  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${process.env.APP_URL || "http://localhost:8080"}/` },
  });

  if (resendError) {
    console.error("Failed to resend confirmation email:", resendError);
  }

  return {};
});

// Sends a password reset email.
export const sendPasswordReset = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const email = ctx.data as unknown as string;
  const supabase = createAnonClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.APP_URL || "http://localhost:8080"}/login`,
  });
  if (error) return { error: error.message };
  return {};
});

// Updates the user's email.
export const updateEmail = createServerFn({ method: "POST" }).handler(async (ctx) => {
  const newEmail = ctx.data as unknown as string;
  const supabase = createAnonClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { error: error.message };
  return {};
});

// Fetches the current user's roles.
export const getUserRoles = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireAuthUserId().catch(() => null);
  if (!userId) return [] as string[];
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return ((roles ?? []) as { role: string }[]).map((r) => r.role);
});
