import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  signUp as serverSignUp,
  signIn as serverSignIn,
  resendVerification as serverResendVerification,
  sendPasswordReset as serverSendPasswordReset,
  updateEmail as serverUpdateEmail,
  getUserRoles as serverGetUserRoles,
} from "@/server/api/auth";
import { demoSignIn as serverDemoSignIn } from "@/server/api/demo-auth";
import { getConfirmationSetting as serverGetConfirmationSetting } from "@/server/api/admin";
import { categorizeAuthError, type AuthFailure, type AuthFailureKind } from "./auth-types";
export type { AuthFailure, AuthFailureKind };
export { categorizeAuthError };

type ServerFn<TInput, TOutput> = (args: { data: TInput }) => Promise<TOutput>;

function sfn<TInput, TOutput>(fn: unknown): ServerFn<TInput, TOutput> {
  return fn as ServerFn<TInput, TOutput>;
}

type SignUpInput = {
  email: string;
  password: string;
  options?: {
    emailRedirectTo?: string;
    data?: Record<string, string>;
  };
};

type AuthResult = {
  user?: User;
  session?: unknown;
  error?: string;
  failure?: AuthFailure;
};

// Registers a new user and sets up the client session.
export async function signUp(
  email: string,
  password: string,
  options?: {
    emailRedirectTo?: string;
    data?: Record<string, string>;
  },
): Promise<{ user?: User; error?: string }> {
  const result = await sfn<SignUpInput, AuthResult>(serverSignUp)({
    data: {
      email,
      password,
      options: {
        emailRedirectTo: options?.emailRedirectTo ?? `${window.location.origin}/`,
        data: options?.data,
      },
    },
  });
  if (result.error) return { error: result.error };
  if (result.session) {
    await supabase.auth.setSession(
      result.session as Parameters<typeof supabase.auth.setSession>[0],
    );
  }
  return { user: result.user };
}

// Signs in with email/password. Returns a typed failure on error.
export async function signIn(
  email: string,
  password: string,
): Promise<{ user?: User; failure?: AuthFailure }> {
  const result = await sfn<{ email: string; password: string }, AuthResult>(serverSignIn)({
    data: { email, password },
  });

  if (result.failure) {
    return { failure: result.failure };
  }

  if (result.session) {
    await supabase.auth.setSession(
      result.session as Parameters<typeof supabase.auth.setSession>[0],
    );
  }

  return { user: result.user };
}

type DemoSignInResult = {
  user?: User;
  roles?: string[];
  failure?: AuthFailure;
  demo?: boolean;
};

// Demo login — skips Supabase, uses a local JSON file.
// Three accounts: admin, pharmacist, patient.
export async function demoSignIn(email: string, password: string): Promise<DemoSignInResult> {
  return await sfn<{ email: string; password: string }, DemoSignInResult>(serverDemoSignIn)({
    data: { email, password },
  });
}

// Resends the verification email for people who never got theirs.
export async function resendVerification(email: string): Promise<{ error?: string }> {
  return await sfn<string, { error?: string }>(serverResendVerification)({
    data: email,
  });
}

// Fetches user roles from the server. Returns empty on failure so the UI doesn't crash.
export async function getUserRoles(): Promise<string[]> {
  try {
    return await sfn<void, string[]>(serverGetUserRoles as unknown as ServerFn<void, string[]>)({
      data: undefined,
    });
  } catch {
    return [];
  }
}

// Sends a password reset email via Supabase.
export async function sendPasswordReset(email: string): Promise<{ error?: string }> {
  return await sfn<string, { error?: string }>(serverSendPasswordReset)({
    data: email,
  });
}

// Changes the email. Only works when logged in.
export async function updateEmail(newEmail: string): Promise<{ error?: string }> {
  return await sfn<string, { error?: string }>(serverUpdateEmail)({
    data: newEmail,
  });
}

const CACHE_TTL_MS = 60_000;
let _cachedConfirmationSetting: { value: boolean; expiresAt: number } | null = null;

// Reads the email confirmation setting. Cached for 60s to avoid hammering the server.
export async function isEmailConfirmationRequired(): Promise<boolean> {
  if (_cachedConfirmationSetting && Date.now() < _cachedConfirmationSetting.expiresAt) {
    return _cachedConfirmationSetting.value;
  }
  try {
    const value = await sfn<void, boolean>(
      serverGetConfirmationSetting as unknown as ServerFn<void, boolean>,
    )({ data: undefined });
    _cachedConfirmationSetting = { value, expiresAt: Date.now() + CACHE_TTL_MS };
    return value;
  } catch {
    _cachedConfirmationSetting = { value: true, expiresAt: Date.now() + CACHE_TTL_MS };
    return true;
  }
}
