"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { SignupForm } from "@/components/signup-form";

function SignupPageContent() {
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
      <SignupForm
        destination={destination}
        invite={invite ?? undefined}
        onSwitchToLogin={() => router.push(`/login${crossLinkQuery}`)}
      />
    </main>
  );
}

export default function SignupPage() {
  return (
    <>
      <AuthHeader />
      <Suspense>
        <SignupPageContent />
      </Suspense>
    </>
  );
}
