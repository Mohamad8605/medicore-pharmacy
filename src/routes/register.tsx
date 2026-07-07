import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { signUp } from "@/lib/auth-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check, X, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

type Rule = { id: string; label: string; test: (pw: string) => boolean };

const RULES: Rule[] = [
  { id: "len", label: "At least 6 characters", test: (p) => p.length >= 6 },
  { id: "lower", label: "One lowercase letter (a–z)", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "num", label: "One number (0–9)", test: (p) => /\d/.test(p) },
  { id: "special", label: "One special character (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function strengthFromScore(score: number): { label: string; tone: string; pct: number } {
  if (score <= 2) return { label: "Weak", tone: "bg-destructive", pct: 25 };
  if (score === 3) return { label: "Medium", tone: "bg-amber-500", pct: 50 };
  if (score === 4 || score === 5) return { label: "Strong", tone: "bg-emerald-500", pct: 80 };
  return { label: "Very strong", tone: "bg-emerald-600", pct: 100 };
}

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Mohamad's MediCore Pharmacy GmbH online" }] }),
  component: RegisterPage,
});

const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

type View = "form" | "check_email";

function RegisterPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<View>("form");

  const ruleResults = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(form.password) })),
    [form.password],
  );
  const score = ruleResults.filter((r) => r.passed).length;
  const strength = strengthFromScore(score);
  const allPassed = score === RULES.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submitForm = form;
    const parsed = schema.safeParse(submitForm);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    if (!RULES.every((r) => r.test(form.password)))
      return toast.error("Please meet all password requirements before continuing.");
    setLoading(true);
    const { error } = await signUp(submitForm.email, form.password, {
      emailRedirectTo: `${window.location.origin}/`,
      data: { first_name: form.firstName, last_name: form.lastName, phone: form.phone },
    });
    setLoading(false);
    if (error) return toast.error(error);
    setView("check_email");
  }

  if (view === "check_email") {
    return (
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Card className="w-full border-primary/20 rounded-2xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle>Check your inbox</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground break-words hyphens-auto">
              We sent a confirmation link to{" "}
              <strong className="text-foreground">{form.email}</strong>.
            </p>
            <div className="rounded-lg bg-muted p-4 text-sm break-words hyphens-auto">
              <p className="font-medium">Next steps:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                <li>Open the email from Mohamad's MediCore Pharmacy GmbH online</li>
                <li>Click the confirmation link</li>
                <li>Sign in with your new account</li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground break-words hyphens-auto">
              Didn't receive the email? Check your spam folder or verify you entered the correct
              address. You can also{" "}
              <Link to="/login" className="text-primary underline underline-offset-2">
                try signing in
              </Link>{" "}
              — if your email is not confirmed, you'll be given options to resend it.
            </p>
            <div className="flex gap-3">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  Go to sign in <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <Card className="min-w-0 rounded-2xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Create your account</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 grid place-items-center w-9 h-9 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div
                id="password-requirements"
                className="rounded-lg border bg-muted/40 p-3 space-y-3"
                aria-live="polite"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Password strength</span>
                    <span className="font-medium">{form.password ? strength.label : "—"}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full transition-all ${form.password ? strength.tone : "bg-transparent"}`}
                      style={{ width: `${form.password ? strength.pct : 0}%` }}
                    />
                  </div>
                </div>

                <ul className="space-y-1.5 text-sm">
                  {ruleResults.map((r) => (
                    <li key={r.id} className="flex items-start gap-2">
                      {r.passed ? (
                        <Check
                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600"
                          aria-hidden
                        />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" aria-hidden />
                      )}
                      <span className={r.passed ? "text-foreground" : "text-muted-foreground"}>
                        {r.label}
                        {r.id === "len" && !r.passed && form.password.length > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (add {6 - form.password.length} more)
                          </span>
                        )}
                      </span>
                      <span className="sr-only">
                        {r.passed ? "requirement met" : "requirement not met"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto" disabled={loading || !allPassed}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground break-words hyphens-auto">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
