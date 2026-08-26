// Shared client-side form validation. Deliberately framework-free (no
// server-only imports) so it can run in both the auth dialog and the
// standalone /signup and /login pages.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Loose on purpose — accepts "+27 82 123 4567", "082 123 4567",
// "(011) 123-4567", etc. Just checks there's a plausible run of digits,
// not a specific country's numbering plan.
const PHONE_RE = /^\+?[0-9\s()-]+$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address, e.g. name@example.com.";
  return null;
}

export const PASSWORD_REQUIREMENTS = "At least 8 characters, with 1 number and 1 special character.";

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[0-9]/.test(password)) return "Password must include at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include at least one special character (e.g. ! @ # $).";
  return null;
}

// Phone is optional throughout the app — only validate format when the
// visitor actually enters something.
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  const digitCount = trimmed.replace(/\D/g, "").length;
  if (!PHONE_RE.test(trimmed) || digitCount < 7 || digitCount > 15) {
    return "Enter a valid phone number, e.g. +27 82 123 4567.";
  }
  return null;
}

export function validateFullName(name: string): string | null {
  if (!name.trim()) return "Full name is required.";
  return null;
}

// supabase-js surfaces a browser-level fetch failure (offline, DNS, CORS,
// the dev server not running) as a generic "Failed to fetch" — accurate
// but meaningless to a visitor. Give them something actionable instead.
export function friendlyAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/failed to fetch/i.test(message)) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }
  return message;
}
