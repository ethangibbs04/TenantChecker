"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { claimLandlordRole } from "@/app/actions";
import { ROLE_LABEL } from "@/lib/roles";
import type { PostAuthChoice } from "@/lib/resolve-post-auth";

type Mode = "login" | "signup" | "choose-role" | "claim-landlord";

const MODE_TITLE: Record<Mode, string> = {
  login: "Log in",
  signup: "Sign up",
  "choose-role": "Choose a dashboard",
  "claim-landlord": "Welcome to Tenantcheck",
};

type AuthDialogState = {
  open: boolean;
  mode: Mode;
  next: string;
  choice: PostAuthChoice | null;
};

type AuthDialogContextValue = {
  openLogin: (next?: string) => void;
  openSignup: (next?: string) => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

const INITIAL_STATE: AuthDialogState = { open: false, mode: "login", next: "/", choice: null };

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthDialogState>(INITIAL_STATE);

  const openLogin = useCallback(
    (next = "/") => setState({ open: true, mode: "login", next, choice: null }),
    [],
  );
  const openSignup = useCallback(
    (next = "/") => setState({ open: true, mode: "signup", next, choice: null }),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const handleAmbiguousDestination = useCallback((choice: PostAuthChoice) => {
    setState((s) => ({
      ...s,
      mode: choice.roles.length === 0 ? "claim-landlord" : "choose-role",
      choice,
    }));
  }, []);

  return (
    <AuthDialogContext.Provider value={{ openLogin, openSignup }}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) =>
          setState((s) => (open ? { ...s, open } : { ...INITIAL_STATE }))
        }
      >
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">{MODE_TITLE[state.mode]}</DialogTitle>
          {state.mode === "login" && (
            <LoginForm
              destination={state.next}
              onSwitchToSignup={() => setState((s) => ({ ...s, mode: "signup" }))}
              onSuccess={close}
              onAmbiguousDestination={handleAmbiguousDestination}
            />
          )}
          {state.mode === "signup" && (
            <SignupForm
              destination={state.next}
              onSwitchToLogin={() => setState((s) => ({ ...s, mode: "login" }))}
              onSuccess={close}
              onAmbiguousDestination={handleAmbiguousDestination}
            />
          )}
          {state.mode === "choose-role" && state.choice && (
            <ChooseRolePanel choice={state.choice} onNavigate={close} />
          )}
          {state.mode === "claim-landlord" && state.choice && (
            <ClaimLandlordPanel onSubmit={close} />
          )}
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

function ChooseRolePanel({
  choice,
  onNavigate,
}: {
  choice: PostAuthChoice;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">
          Choose a dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {choice.userLabel}. You have more than one role — pick
          which one to open.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {choice.roles.map((r) => (
          <Link key={r} href={`/${r}`} onClick={onNavigate}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between">
                <span className="font-medium text-slate-900">
                  {ROLE_LABEL[r]} dashboard
                </span>
                <ArrowRight className="size-4 text-slate-400" aria-hidden="true" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ClaimLandlordPanel({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div>
        <h2 className="font-display text-2xl font-medium text-navy-900">
          Welcome to Tenantcheck
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Set up your landlord account to start vetting tenants.
        </p>
      </div>
      <form action={claimLandlordRole} onSubmit={onSubmit}>
        <Button type="submit" size="lg" className="w-full">
          Continue as a landlord
        </Button>
      </form>
    </div>
  );
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider");
  }
  return ctx;
}
