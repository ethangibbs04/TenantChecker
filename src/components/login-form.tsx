"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveAmbiguousDestination, type PostAuthChoice } from "@/lib/resolve-post-auth";
import { friendlyAuthErrorMessage, validateEmail } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  destination,
  onSwitchToSignup,
  onSuccess,
  onAmbiguousDestination,
}: {
  destination: string;
  onSwitchToSignup: () => void;
  onSuccess?: () => void;
  /** When set (the auth dialog), a plain login with no specific destination
   * resolves roles client-side and hands them back instead of navigating,
   * so the dialog can show a "choose a dashboard" step in place. Omitted on
   * the standalone /login page, which keeps the old behavior of just
   * navigating to "/" and letting it redirect server-side. */
  onAmbiguousDestination?: (choice: PostAuthChoice) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailValidation = validateEmail(email);
    setEmailError(emailValidation);
    if (emailValidation) return;

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
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

    if (destination === "/" && onAmbiguousDestination) {
      const resolved = await resolveAmbiguousDestination();
      if (resolved.type === "choice") {
        onAmbiguousDestination(resolved.choice);
        return;
      }
      onSuccess?.();
      router.push(resolved.to);
      router.refresh();
      return;
    }

    onSuccess?.();
    router.push(destination);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">Log in</h2>
        <p className="mt-1 text-sm text-slate-500">Welcome back to Tenantcheck.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailError(validateEmail(email))}
            aria-invalid={!!emailError}
            required
          />
          {emailError && <p className="text-xs text-danger-600">{emailError}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        No account yet?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-medium text-sky-600 hover:underline"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
