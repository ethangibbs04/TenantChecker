"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "destructive";
type ToastOptions = { title: string; description?: string; variant?: ToastVariant };
type ToastItem = Omit<ToastOptions, "variant"> & { id: string; variant: ToastVariant };

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, React.ReactNode> = {
  default: null,
  success: <CheckCircle2 className="size-3.5" aria-hidden="true" />,
  destructive: <XCircle className="size-3.5" aria-hidden="true" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, variant: "default", ...options }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((item) => item.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={5000}
            onOpenChange={(open) => !open && dismiss(t.id)}
            className={cn(
              "flex items-start gap-3 rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10",
              "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:slide-in-from-bottom-2 motion-safe:data-[state=open]:fade-in-0",
              "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0",
              "motion-safe:data-[swipe=end]:animate-out data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]"
            )}
          >
            {t.variant !== "default" && (
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full",
                  t.variant === "success" && "bg-success-100 text-success-600",
                  t.variant === "destructive" && "bg-destructive/10 text-destructive"
                )}
              >
                {VARIANT_ICON[t.variant]}
              </div>
            )}
            <div className="flex flex-1 flex-col gap-0.5">
              <ToastPrimitive.Title className="font-medium text-slate-900">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-slate-500">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="shrink-0 rounded-md text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="size-4" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed right-0 bottom-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none sm:right-4 sm:bottom-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
