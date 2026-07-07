import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertCircle, Lock, Eye, EyeOff, FlaskConical } from "lucide-react";
import { EmailVerificationCard } from "@/components/EmailVerificationCard";
import { signIn, demoSignIn, sendPasswordReset } from "@/lib/auth-service";
import type { AuthFailure } from "@/lib/auth-service";
import { useAuth, setDemoSession, clearDemoSessionGlobal, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: LoginPage,
});

type LoginView = "form" | "email_not_confirmed" | "rate_limited" | "suspended";

const DEMO_USERS = [
  {
    label: "Admin – Sarah Müller",
    email: "admin@medicore.com",
    pw: "Admin123!",
    role: "admin",
    color: "bg-red-100 hover:bg-red-200 text-red-800 border-red-300",
  },
  {
    label: "Patient – Anna Svensson",
    email: "patient@medicore.com",
    pw: "Patient123!",
    role: "patient",
    color: "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300",
  },
  {
    label: "Pharmacist – Erik Johansson",
    email: "pharmacist@medicore.com",
    pw: "Pharmacist123!",
    role: "pharmacist",
    color: "bg-green-100 hover:bg-green-200 text-green-800 border-green-300",
  },
];

// Login page with email form, forgot-password link, and three demo buttons.
function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, isDemo, signOut } = useAuth();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/" });
  }, [authLoading, user, navigate]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [view, setView] = useState<LoginView>("form");
  const [failure, setFailure] = useState<AuthFailure | null>(null);
  const [resettingPw, setResettingPw] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFailure(null);

    try {
      const result = await signIn(email, password);
      if (result.failure) {
        const demo = await demoSignIn(email, password);
        if (!demo.failure && demo.user) {
          const storageKey = `demo-uuid-${email}`;
          let stableId = localStorage.getItem(storageKey);
          if (!stableId) {
            stableId = crypto.randomUUID();
            localStorage.setItem(storageKey, stableId);
          }
          setDemoSession({ ...demo.user, id: stableId }, (demo.roles ?? []) as Role[]);
          toast.success("Signed in (demo mode)");
          setTimeout(() => navigate({ to: "/" }), 0);
          return;
        }
        setFailure(result.failure);
        if (result.failure.kind === "email_not_confirmed") {
          setView("email_not_confirmed");
        } else if (result.failure.kind === "rate_limited") {
          setView("rate_limited");
        } else if (result.failure.kind === "suspended") {
          setView("suspended");
        } else {
          setView("form");
        }
        return;
      }
      toast.success("Signed in");
      setTimeout(() => navigate({ to: "/" }), 0);
    } catch (err) {
      console.error("Sign in error:", err);
      setFailure({
        kind: "unknown",
        message: "Could not connect. Please try again.",
        logMessage: `sign-in error: ${err}`,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(email: string, password: string) {
    setDemoLoading(email);
    setFailure(null);
    setView("form");
    try {
      if (user) clearDemoSessionGlobal();

      const result = await demoSignIn(email, password);
      if (result.failure) {
        setFailure(result.failure);
        return;
      }
      if (result.user) {
        const storageKey = `demo-uuid-${email}`;
        let stableId = localStorage.getItem(storageKey);
        if (!stableId) {
          stableId = crypto.randomUUID();
          localStorage.setItem(storageKey, stableId);
        }
        setDemoSession({ ...result.user, id: stableId }, (result.roles ?? []) as Role[]);
        toast.success("Signed in (demo mode)");
        setTimeout(() => navigate({ to: "/" }), 0);
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setFailure({
        kind: "unknown",
        message: "Could not connect. Please try again.",
        logMessage: `demo sign-in error: ${err}`,
      });
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      return toast.error("Enter your email address first.");
    }
    setResettingPw(true);
    const { error } = await sendPasswordReset(email);
    setResettingPw(false);
    if (error) return toast.error(error);
    toast.success("Password reset link sent. Check your email.");
  }

  if (view === "email_not_confirmed") {
    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <EmailVerificationCard
          email={email}
          onBackToLogin={() => {
            setView("form");
            setFailure(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Card className="w-full min-w-0 rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary shrink-0" />
            <CardTitle className="text-lg sm:text-xl">Welcome back</CardTitle>
          </div>
          <CardDescription>Sign in to your account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {user && isDemo ? (
            <div className="mb-6 rounded-lg border bg-muted/50 p-4 text-sm break-words hyphens-auto">
              <p className="font-medium">
                Signed in as <span className="text-primary">{user.email}</span>
              </p>
              <p className="mt-1 text-muted-foreground">
                Pick another demo user below to switch, or{" "}
                <button onClick={() => signOut()} className="underline hover:text-primary">
                  sign out
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {failure && (
                  <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive break-words hyphens-auto">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p>{failure.message}</p>
                      {failure.kind === "invalid_password" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Did you mean to{" "}
                          <Link
                            to="/register"
                            className="text-primary underline underline-offset-2"
                          >
                            create a new account
                          </Link>
                          ?
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resettingPw}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-primary"
                  >
                    {resettingPw ? "Sending reset link…" : "Forgot password?"}
                  </button>
                </div>

                <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-muted-foreground break-words hyphens-auto">
                No account?{" "}
                <Link
                  to="/register"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Create one
                </Link>
              </p>
            </>
          )}

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Demo access</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(u.email, u.pw)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all disabled:opacity-50 ${u.color}`}
              >
                <FlaskConical className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{u.label}</div>
                  <div className="text-xs opacity-75">{u.role}</div>
                </div>
                {demoLoading === u.email && (
                  <span className="text-xs animate-pulse">Signing in…</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
