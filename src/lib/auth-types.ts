import type { AuthError } from "@supabase/supabase-js";

export type AuthFailureKind =
  | "invalid_password"
  | "email_not_confirmed"
  | "rate_limited"
  | "suspended"
  | "unknown";

export interface AuthFailure {
  kind: AuthFailureKind;
  message: string;
  logMessage: string;
}

// Turns Supabase auth errors into user-friendly messages.
// Uses text matching because Supabase error codes change between versions.
export function categorizeAuthError(error: AuthError, email?: string): AuthFailure {
  const msg = error.message?.toLowerCase() ?? "";
  const status = (error as { status?: number }).status;

  if (msg.includes("email not confirmed") || msg.includes("email not verified")) {
    return {
      kind: "email_not_confirmed",
      message: "Your email address has not been verified yet.",
      logMessage: `unconfirmed email login attempt: ${email}`,
    };
  }

  if (msg.includes("invalid login credentials")) {
    return {
      kind: "invalid_password",
      message: "Incorrect email or password. Please try again.",
      logMessage: `invalid credentials for: ${email}`,
    };
  }

  if (msg.includes("rate limit") || status === 429) {
    return {
      kind: "rate_limited",
      message: "Too many attempts. Please wait a moment before trying again.",
      logMessage: `rate limited: ${email}`,
    };
  }

  if (msg.includes("suspended") || msg.includes("disabled") || msg.includes("locked")) {
    return {
      kind: "suspended",
      message: "This account has been suspended. Contact support for help.",
      logMessage: `suspended account: ${email}`,
    };
  }

  return {
    kind: "unknown",
    message: error.message || "Something went wrong. Please try again.",
    logMessage: `unexpected auth error for ${email}: ${error.message}`,
  };
}
