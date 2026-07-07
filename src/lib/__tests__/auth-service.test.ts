import { describe, it, expect } from "vitest";
import { categorizeAuthError } from "@/lib/auth-types";
import type { AuthError } from "@supabase/supabase-js";

function makeAuthError(message: string, status?: number): AuthError {
  return { name: "AuthError", message, status: status ?? 400 } as AuthError;
}

describe("categorizeAuthError", () => {
  it("flags unconfirmed email attempts", () => {
    const result = categorizeAuthError(makeAuthError("email not confirmed"), "a@b.com");
    expect(result.kind).toBe("email_not_confirmed");
  });

  it("also catches 'email not verified' messages", () => {
    const result = categorizeAuthError(makeAuthError("email not verified"), "a@b.com");
    expect(result.kind).toBe("email_not_confirmed");
  });

  it("detects wrong password from login credentials error", () => {
    const result = categorizeAuthError(makeAuthError("invalid login credentials"), "a@b.com");
    expect(result.kind).toBe("invalid_password");
  });

  it("recognizes rate limit messages", () => {
    const result = categorizeAuthError(makeAuthError("rate limit exceeded"));
    expect(result.kind).toBe("rate_limited");
  });

  it("handles 429 status code as rate limited", () => {
    const result = categorizeAuthError(makeAuthError("Too many requests", 429));
    expect(result.kind).toBe("rate_limited");
  });

  it("marks accounts mentioned as suspended", () => {
    const result = categorizeAuthError(makeAuthError("account suspended"));
    expect(result.kind).toBe("suspended");
  });

  it("treats disabled accounts as suspended", () => {
    const result = categorizeAuthError(makeAuthError("account disabled"));
    expect(result.kind).toBe("suspended");
  });

  it("treats locked accounts as suspended", () => {
    const result = categorizeAuthError(makeAuthError("account locked"));
    expect(result.kind).toBe("suspended");
  });

  it("falls back to 'unknown' for unexpected errors", () => {
    const result = categorizeAuthError(makeAuthError("some random error"));
    expect(result.kind).toBe("unknown");
    expect(result.message).toBe("some random error");
  });

  it("gives a clear message for known failure types", () => {
    const result = categorizeAuthError(makeAuthError("invalid login credentials"));
    expect(result.message).toContain("Incorrect email or password");
  });

  it("matches case-insensitively", () => {
    const upper = categorizeAuthError(makeAuthError("EMAIL NOT CONFIRMED"));
    expect(upper.kind).toBe("email_not_confirmed");

    const mixed = categorizeAuthError(makeAuthError("Invalid Login Credentials"));
    expect(mixed.kind).toBe("invalid_password");
  });

  it("handles a null or undefined message gracefully", () => {
    const noMsg = categorizeAuthError({ name: "AuthError", status: 400 } as AuthError);
    expect(noMsg.kind).toBe("unknown");
    expect(noMsg.message).toContain("Something went wrong");
  });

  it("logs the email in the logMessage field when provided", () => {
    const result = categorizeAuthError(
      makeAuthError("invalid login credentials"),
      "test@example.com",
    );
    expect(result.logMessage).toContain("test@example.com");
  });
});
