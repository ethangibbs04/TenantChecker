# Tenantcheck Implementation Plan

Ordered build plan for the MVP. Each phase should be shippable and testable on its own before moving to the next. See `product_spec.md` for the product spec and the architecture rationale (schema, RLS strategy, stack validation) that shaped this plan.

**Stack**: Next.js (App Router, TS, Tailwind) + Supabase (Postgres/Auth/Storage) + PayFast + Resend (email).

**Live project**: Supabase project `TenantChecker` (`wqodoiavjwuowfkkrmjp`, eu-west-1), linked via `supabase link`. Schema lives in `supabase/migrations/`.

---

## Phase 0 — Foundations ✅ done

- [x] Next.js app scaffolded (`src/`, Tailwind, TypeScript).
- [x] Supabase project created and linked.
- [x] Core schema migrated: `profiles`, `user_roles`, `properties`, `checks`, `check_invites`, `consents`, `payments`, `application_forms`, `documents`, `audit_log`, `notifications`.
- [x] RLS policies enforcing the "withhold until Ship" rule — verified live against the real database (landlord/tenant blocked pre-ship, unlocked exactly at `COMPLETED`).
- [x] State-machine RPCs: `create_check`, `get_check_by_invite_token`, `accept_invite`, `submit_consent`, `mark_paid`, `submit_application`, `ship_check`.
- [x] Private `tenant-documents` storage bucket with matching object policies.

---

## Phase 1 — Auth & role-aware shell ✅ done

Goal: a logged-in user lands on the right dashboard, and dual landlord/tenant accounts work.

- [x] Install `@supabase/ssr` + `@supabase/supabase-js`; server/browser/middleware Supabase clients (`src/lib/supabase/`).
- [x] `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (gitignored).
- [x] Sign up / log in pages (`/signup`, `/login`, email+password) + `/auth/callback` for the PKCE email-confirm redirect + `/logout`.
- [x] Landlord role claim: no role yet → home page shows "Continue as a landlord" → server action inserts `user_roles(role='landlord')` (relies on the `user_roles_self_signup_landlord` RLS policy — tenants instead get their role from `accept_invite()` in Phase 3, so this path is landlord-only by construction).
- [x] Home page (`src/app/page.tsx`) routes by role: 0 roles → claim-landlord prompt, 1 role → redirect to `/{role}`, 2+ roles → dashboard chooser.
- [x] `/landlord`, `/tenant`, `/admin` each have a server-component layout that checks the required role via `getCurrentUserAndRoles()` and redirects if absent — enforced in the layout, not just hidden nav. Shared `DashboardNav` shows the active role and switch links for multi-role users.
- [x] Verified end-to-end with a real headless-browser run (signup → role claim → dashboard → logout) against the live Supabase project, zero console errors; test user cleaned up afterward.

## Phase 2 — Landlord: properties & check initiation

- [ ] Properties list page (`/landlord/properties`) — table backed by `properties` (RLS already scopes to `landlord_id`).
- [ ] "Add property" form → insert into `properties`.
- [ ] Property detail page → history of `checks` for that property (join on `property_id`), per the user's requirement that clicking a property shows past tenant checks.
- [ ] "Start a Tenantcheck" flow: pick/create a property, enter tenant name/email/phone → call `create_check()` RPC → get back a check id + invite token.
- [ ] Landlord checks dashboard: pipeline/tracker UI showing `status` per check (the "parcel tracker" view from the spec) — poll or use Supabase Realtime on `checks` for live updates.
- [ ] Make per-check pricing explicit in the UI before creation, since payment is required even for a repeat property (flagged in the architecture review as a support-ticket risk).

## Phase 3 — Tenant: invite, consent, payment gate

- [ ] Public invite landing page `/invite/[token]` → `get_check_by_invite_token()` (works for anon users, no login required to preview).
- [ ] Tenant signup/login from the invite page → `accept_invite(token)` RPC links `tenant_id` and grants the `tenant` role.
- [ ] POPIA consent screen: render the current consent text, capture signature/checkbox → `submit_consent(check_id, version, text)`.
- [ ] Payment step: after consent, generate a PayFast payment request (amount, `m_payment_id` = check id) and redirect to PayFast.
- [ ] PayFast ITN webhook route (Next.js API route or Supabase Edge Function): verify signature/source per PayFast docs, then call `mark_paid()` using the **service role** key (this RPC's `execute` is already revoked from `authenticated`/`anon` in the migration).
- [ ] Handle payment failure/cancel redirects back to the landlord/tenant with a clear retry path.

## Phase 4 — Tenant: to-do list & application form

- [ ] Tenant dashboard `/tenant` → "To-Do" list derived from `checks.status` for all checks linked to this tenant (not from notifications, per the UX note that dashboards must not depend on message delivery).
- [ ] Application form (multi-step, matches whatever fields the vetting package needs) → save drafts to `application_forms.form_data`, final submit → `submit_application()`.
- [ ] Document upload widget for `id_copy` / `payslip` / `bank_statement` → upload to `tenant-documents/{check_id}/{document_type}/...`, then insert a `documents` row (storage policy only allows this while `status = 'AWAITING_APPLICATION'`).
- [ ] Client-side file validation (type/size) before upload; note server-side malware scanning as a follow-up (Phase 8).

## Phase 5 — Admin: processing & shipping

- [ ] Admin dashboard `/admin` listing checks by status, prioritizing `PROCESSING`.
- [ ] Per-check admin view: download submitted application form + (manually fetched) TPN credit check for the admin's own manual LLM workflow.
- [ ] Upload UI for `credit_check` and `ai_recommendation` documents (admin-only insert policy already in place).
- [ ] "Ship" button → `ship_check()`, with a confirmation modal (near-irreversible action per the UX review) — surface the RPC's validation errors (missing credit check / AI recommendation) directly in the UI.
- [ ] Seed the first real admin user: `insert into user_roles (user_id, role) values ('<uid>', 'admin')` run manually via the Supabase SQL editor (no self-serve admin signup, by design).

## Phase 6 — Delivery & landlord package view

- [ ] Landlord "completed" view: list `documents` where `is_package_document = true` for a `COMPLETED` check (RLS already restricts this correctly) — render via short-lived signed URLs, generated server-side.
- [ ] Download-all / view package UI.
- [ ] Log every document view/download via `log_audit()` from the server route that mints the signed URL (not from the client), satisfying the POPIA accountability gap flagged in the architecture review.

## Phase 7 — Notifications (email first)

- [ ] Wire Resend (or Postmark) for transactional email.
- [ ] Trigger points: consent requested, payment requested, application requested, check completed — call from the same server-side code path as the relevant RPC call, and log to `notifications`.
- [ ] `pg_cron` job to flag stale `AWAITING_CONSENT` / `AWAITING_PAYMENT` checks past their invite expiry as `EXPIRED`, with a reminder email a day or two before expiry.
- [ ] WhatsApp integration deferred — revisit once email flow is stable and business verification (Twilio/Meta Cloud API) is in progress.

## Phase 8 — Hardening & launch prep

- [ ] Retention/deletion policy: decide and implement a purge job for documents/PII past a defined window post-`COMPLETED`.
- [ ] Malware scanning on tenant uploads before admin ever opens them.
- [ ] Review TPN's usage agreement for re-storage/redistribution constraints on credit report data.
- [ ] Production environment vars in Vercel; separate Supabase project (or at minimum separate keys/branch) for production vs. any future staging work.
- [ ] Basic uptime/error monitoring (e.g. Vercel + Sentry) before real tenants' PII flows through the system.
- [ ] Rotate the Supabase access token used to link this repo during setup, and confirm no secrets are committed anywhere in the repo.

---

## Working agreement

- Build and verify one phase at a time — each phase should be testable against the real Supabase project before starting the next.
- Any change to `checks.status` must go through an existing (or new) `SECURITY DEFINER` RPC, never a direct client `UPDATE` — this is the load-bearing assumption behind the RLS model.
- New document types or visibility rules require updating both the `documents` RLS policies **and** the mirrored `storage.objects` policies in the same migration.
