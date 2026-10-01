"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { LoginForm } from "@/components/login-form";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const next = searchParams.get("next");
  const destination = invite ? `/invite/${invite}` : (next ?? "/");
  const crossLinkQuery = invite
    ? `?invite=${invite}`
    : next
      ? `?next=${encodeURIComponent(next)}`
      : "";

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <LoginForm
        destination={destination}
        onSwitchToSignup={() => router.push(`/signup${crossLinkQuery}`)}
        onForgotPassword={(email) =>
          router.push(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`)
        }
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <>
      <AuthHeader />
      <Suspense>
        <LoginPageContent />
      </Suspense>
    </>
  );
}
