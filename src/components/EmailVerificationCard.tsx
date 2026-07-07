import { useState } from "react";
import { Mail, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resendVerification, updateEmail } from "@/lib/auth-service";
import { toast } from "sonner";

interface EmailVerificationCardProps {
  email: string;
  onBackToLogin: () => void;
}

export function EmailVerificationCard({ email, onBackToLogin }: EmailVerificationCardProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [updating, setUpdating] = useState(false);

  async function handleResend() {
    setSending(true);
    const { error } = await resendVerification(email);
    setSending(false);
    if (error) return toast.error(error);
    setSent(true);
    toast.success("Verification email sent. Check your inbox.");
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      return toast.error("Enter a valid email address.");
    }
    setUpdating(true);
    const { error } = await updateEmail(newEmail);
    setUpdating(false);
    if (error) return toast.error(error);
    toast.success("Verification sent to your new email.");
    setShowChangeEmail(false);
    setSent(true);
  }

  return (
    <Card className="w-full border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <CardTitle>Email not confirmed</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            Your account was created successfully, but your email address{" "}
            <strong className="font-semibold">{email}</strong> has not been verified yet.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Check your inbox and click the confirmation link. If you don't see it within a few
          minutes, check your spam folder.
        </p>

        {sent && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Verification email sent. Please check your inbox.
          </div>
        )}

        {showChangeEmail && (
          <div className="space-y-3 rounded-lg border p-4">
            <Label htmlFor="new-email">Enter a different email address</Label>
            <Input
              id="new-email"
              type="email"
              placeholder="your@email.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleChangeEmail} disabled={updating}>
                {updating ? "Updating…" : "Send verification"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowChangeEmail(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {!showChangeEmail && (
          <Button className="w-full gap-2" onClick={handleResend} disabled={sending}>
            <RefreshCw className={`h-4 w-4 ${sending ? "animate-spin" : ""}`} />
            {sending ? "Sending…" : "Resend Verification Email"}
          </Button>
        )}
        <div className="flex w-full justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setShowChangeEmail(true)}
            className="text-muted-foreground underline underline-offset-2 hover:text-primary"
          >
            Change email address
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-muted-foreground underline underline-offset-2 hover:text-primary"
          >
            Back to login
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
