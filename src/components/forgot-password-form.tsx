"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendlyAuthErrorMessage, validateEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({
  initialEmail = "",
  onSwitchToLogin,
}: {
  initialEmail?: string;
  onSwitchToLogin: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);
    if (emailValidation) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } catch (err) {
      setError(friendlyAuthErrorMessage(err));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-medium text-navy-900">Check your email</h2>
        {/* Deliberately noncommittal about whether the account exists —
            matches Supabase Auth's own anti-enumeration behavior server-side. */}
        <p className="text-sm text-slate-500">
          If an account exists for {email}, we&apos;ve sent a link to reset the password.
        </p>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="mt-2 text-left text-sm font-medium text-sky-600 hover:underline"
        >
          Back to log in
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">Reset your password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailError(validateEmail(email))}
            aria-invalid={!!emailError}
            required
          />
          {emailError && <p className="text-xs text-danger-600">{emailError}</p>}
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Remembered it?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-sky-600 hover:underline"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
