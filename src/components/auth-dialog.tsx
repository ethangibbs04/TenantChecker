"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { ROLE_LABEL } from "@/lib/roles";
import type { PostAuthChoice } from "@/lib/resolve-post-auth";

type Mode = "login" | "signup" | "choose-role" | "forgot-password";

const MODE_TITLE: Record<Mode, string> = {
  login: "Log in",
  signup: "Sign up",
  "choose-role": "Choose a dashboard",
  "forgot-password": "Reset your password",
};

type AuthDialogState = {
  open: boolean;
  mode: Mode;
  next: string;
  choice: PostAuthChoice | null;
  prefillEmail: string;
};

type AuthDialogContextValue = {
  openLogin: (next?: string) => void;
  openSignup: (next?: string) => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

const INITIAL_STATE: AuthDialogState = {
  open: false,
  mode: "login",
  next: "/",
  choice: null,
  prefillEmail: "",
};

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthDialogState>(INITIAL_STATE);

  const openLogin = useCallback(
    (next = "/") => setState({ ...INITIAL_STATE, open: true, mode: "login", next }),
    [],
  );
  const openSignup = useCallback(
    (next = "/") => setState({ ...INITIAL_STATE, open: true, mode: "signup", next }),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  // Only called when there's a genuine choice to make — see
  // resolveAmbiguousDestination, which resolves zero or one role straight
  // to a destination instead of handing back a "choice".
  const handleAmbiguousDestination = useCallback((choice: PostAuthChoice) => {
    setState((s) => ({ ...s, mode: "choose-role", choice }));
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
              onForgotPassword={(email) =>
                setState((s) => ({ ...s, mode: "forgot-password", prefillEmail: email }))
              }
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
          {state.mode === "forgot-password" && (
            <ForgotPasswordForm
              initialEmail={state.prefillEmail}
              onSwitchToLogin={() => setState((s) => ({ ...s, mode: "login" }))}
            />
          )}
          {state.mode === "choose-role" && state.choice && (
            <ChooseRolePanel choice={state.choice} onNavigate={close} />
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
            <Card className="transition-[transform,box-shadow] duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md">
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

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider");
  }
  return ctx;
}
