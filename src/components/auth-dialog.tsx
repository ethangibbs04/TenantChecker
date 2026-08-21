"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";

type Mode = "login" | "signup";

type AuthDialogState = {
  open: boolean;
  mode: Mode;
  next: string;
};

type AuthDialogContextValue = {
  openLogin: (next?: string) => void;
  openSignup: (next?: string) => void;
};

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthDialogState>({
    open: false,
    mode: "login",
    next: "/",
  });

  const openLogin = useCallback(
    (next = "/") => setState({ open: true, mode: "login", next }),
    [],
  );
  const openSignup = useCallback(
    (next = "/") => setState({ open: true, mode: "signup", next }),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  return (
    <AuthDialogContext.Provider value={{ openLogin, openSignup }}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => setState((s) => ({ ...s, open }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">
            {state.mode === "login" ? "Log in" : "Sign up"}
          </DialogTitle>
          {state.mode === "login" ? (
            <LoginForm
              destination={state.next}
              onSwitchToSignup={() => setState((s) => ({ ...s, mode: "signup" }))}
              onSuccess={close}
            />
          ) : (
            <SignupForm
              destination={state.next}
              onSwitchToLogin={() => setState((s) => ({ ...s, mode: "login" }))}
              onSuccess={close}
            />
          )}
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) {
    throw new Error("useAuthDialog must be used within AuthDialogProvider");
  }
  return ctx;
}
