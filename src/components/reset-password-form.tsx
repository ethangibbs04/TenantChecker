"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_REQUIREMENTS, friendlyAuthErrorMessage, validatePassword } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Rendered only once the page's server component has confirmed a recovery
// session exists (see reset-password/page.tsx) — the update itself just
// needs the session already on the (shared, cookie-based) browser client.
export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): boolean {
    const pwError = validatePassword(password);
    const cfError = password !== confirmPassword ? "Passwords don't match." : null;
    setPasswordError(pwError);
    setConfirmError(cfError);
    return !pwError && !cfError;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

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
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-display text-2xl font-medium text-navy-900">Password updated</h2>
          <p className="mt-1 text-sm text-slate-500">You can now continue to your account.</p>
        </div>
        <Button
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">Set a new password</h2>
        <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordError(validatePassword(password))}
            aria-invalid={!!passwordError}
            minLength={8}
            required
          />
          <p className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p>
          {passwordError && <p className="text-xs text-danger-600">{passwordError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reset-confirm-password">Confirm new password</Label>
          <Input
            id="reset-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() =>
              setConfirmError(password !== confirmPassword ? "Passwords don't match." : null)
            }
            aria-invalid={!!confirmError}
            required
          />
          {confirmError && <p className="text-xs text-danger-600">{confirmError}</p>}
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
