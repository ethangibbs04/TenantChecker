"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveAmbiguousDestination, type PostAuthChoice } from "@/lib/resolve-post-auth";
import {
  PASSWORD_REQUIREMENTS,
  friendlyAuthErrorMessage,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FieldErrors = {
  fullName?: string;
  phone?: string;
  email?: string;
  password?: string;
};

export function SignupForm({
  destination,
  invite,
  onSwitchToLogin,
  onSuccess,
  onAmbiguousDestination,
}: {
  destination: string;
  invite?: string;
  onSwitchToLogin: () => void;
  onSuccess?: () => void;
  /** See LoginForm — same in-dialog "choose a dashboard"/"claim landlord"
   * hand-off, only used when the auth dialog renders this form. */
  onAmbiguousDestination?: (choice: PostAuthChoice) => void;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  function validate(): FieldErrors {
    return {
      fullName: validateFullName(fullName) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);

    let data: Awaited<ReturnType<ReturnType<typeof createClient>["auth"]["signUp"]>>["data"];
    try {
      const supabase = createClient();
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
        },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }
      data = result.data;
    } catch (err) {
      setError(friendlyAuthErrorMessage(err));
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      // mailer_autoconfirm is on (dev) — we already have a session.
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
      return;
    }

    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-2xl font-medium text-navy-900">
          Check your email
        </h2>
        <p className="text-sm text-slate-500">
          We sent a confirmation link to {email}. Click it to activate your
          account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">
          {invite ? "Create your account" : "Create your landlord account"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Start vetting tenants in minutes.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-full-name">Full name</Label>
          <Input
            id="signup-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            onBlur={() => setFieldErrors((f) => ({ ...f, fullName: validateFullName(fullName) ?? undefined }))}
            aria-invalid={!!fieldErrors.fullName}
            required
          />
          {fieldErrors.fullName && <p className="text-xs text-danger-600">{fieldErrors.fullName}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-phone">Phone</Label>
          <Input
            id="signup-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setFieldErrors((f) => ({ ...f, phone: validatePhone(phone) ?? undefined }))}
            aria-invalid={!!fieldErrors.phone}
            placeholder="+27 82 123 4567"
          />
          {fieldErrors.phone && <p className="text-xs text-danger-600">{fieldErrors.phone}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setFieldErrors((f) => ({ ...f, email: validateEmail(email) ?? undefined }))}
            aria-invalid={!!fieldErrors.email}
            required
          />
          {fieldErrors.email && <p className="text-xs text-danger-600">{fieldErrors.email}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setFieldErrors((f) => ({ ...f, password: validatePassword(password) ?? undefined }))}
            aria-invalid={!!fieldErrors.password}
            minLength={8}
            required
          />
          <p className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p>
          {fieldErrors.password && <p className="text-xs text-danger-600">{fieldErrors.password}</p>}
        </div>
        {error && <p className="text-sm text-danger-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
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
