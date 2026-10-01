"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

function ForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <ForgotPasswordForm initialEmail={email} onSwitchToLogin={() => router.push("/login")} />
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader />
      <Suspense>
        <ForgotPasswordPageContent />
      </Suspense>
    </>
  );
}
