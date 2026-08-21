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

## Phase 2 — Landlord: properties & check initiation ✅ done

- [x] Properties list page (`/landlord/properties`) — read-only history view, table backed by `properties` (RLS already scopes to `landlord_id`). No standalone "add property" entry point — landlords never create a bare property.
- [x] Property detail page (`/landlord/properties/[id]`) → history of `checks` for that property.
- [x] **Redesigned per feedback**: "Buy a Tenantcheck" (`/landlord/checks/new`, prefillable via `?property=`) is a single form — tenant details (name/phone/email) on top, property details below. Picking an existing property from a dropdown hides the new-property fields and reuses that row (so property history stays intact instead of fragmenting into one row per purchase); leaving it on "+ Add a new property" creates one inline. One `buyTenantcheck()` server action handles both paths, then calls `create_check()`.
- [x] Landlord dashboard (`/landlord`) + check detail page (`/landlord/checks/[id]`) — visual pipeline tracker (`StatusTracker` component) showing the 5-step status per check.
- [x] Per-check pricing (R350.00) shown explicitly before creation and on the check detail page's payment row.
- [x] Invite link surfaced on the check detail page (copy-to-clipboard) — added since email/WhatsApp automation is Phase 7; also added the `check_invites` landlord SELECT policy this needed (it had zero SELECT policies before).
- [x] **Two real bugs found and fixed via new migrations while building this:**
  - `create_check()`/`accept_invite()` never created the `payments`/`application_forms` rows that `mark_paid()`/`submit_application()` later `UPDATE` — those RPCs would have silently no-opped in Phase 3–4.
  - `create_check()`'s `gen_random_bytes()` call broke under RLS/`search_path` restriction (pgcrypto lives in the `extensions` schema, not `public`) — fixed by schema-qualifying it.
  - `audit_log.actor_id` / `checks.shipped_by` had no `ON DELETE` behavior, which blocked deleting almost any user (and is a POPIA right-to-erasure problem) — changed to `ON DELETE SET NULL`.
- [x] Verified end-to-end with two real headless-browser runs: (1) the original flow — signup → add property → start a check → tracker/payment/invite-link all correct → check shows up in dashboard + property history (10/10). (2) after the redesign — confirms `/landlord/properties/new` is gone, the unified form has both sections, buying two checks against the same reused property produces exactly one property row with both tenants in its history (10/10, only "failure" was the test's own intentional 404 check). No leftover test data in either run.

## Phase 3 — Tenant: invite, consent, payment gate ✅ done

- [x] Public invite landing page (`/invite/[token]`) → `get_check_by_invite_token()`, works for anon visitors. Logged-in users get a "Continue as {email}" confirmation (not silent auto-accept, to avoid a landlord accidentally accepting their tenant's invite on a shared session) → `accept_invite()` → redirects to consent.
- [x] Login/signup carry an `?invite=` param through signup/email-confirm/login and land back on `/invite/[token]` afterward, so the accept happens in one place regardless of auth path.
- [x] POPIA consent screen (`/tenant/checks/[id]/consent`) — draft placeholder text (`src/lib/consent.ts`, clearly marked "pending legal review" per your call), checkbox required → `submit_consent()`.
- [x] Payment step (`/landlord/checks/[id]/pay`) — builds a signed PayFast payment form server-side (`src/lib/payfast.ts`, algorithm mirrored byte-for-byte from PayFast's own PHP SDK, including its trailing-`&` quirk) and posts to PayFast's sandbox using their public shared test merchant, per your call. **Corrected mid-build**: this was first built on the tenant side, which contradicts the spec's own step 3 ("the system notifies the landlord... with a link to make the payment") — moved to the landlord, using the landlord's own name/email as the PayFast payer. Tenant now sees a passive "waiting on your landlord" message with no payment action.
- [x] PayFast ITN webhook (`/api/payfast/notify`) — verifies the signature, checks `payment_status = COMPLETE`, calls `mark_paid()` via a service-role client (`src/lib/supabase/service.ts`). IP allowlisting and PayFast's server-to-server `query/validate` round-trip are deliberately deferred to Phase 8 (see note there).
- [x] Return/cancel pages (`/landlord/checks/[id]/pay/return`, `.../cancel`) plus a tenant check-status page; tenant dashboard shows a real to-do list (consent action only — payment is landlord-side).
- [x] **Six real bugs found and fixed via new migrations, all caught by actually driving the flow rather than by inspection** (the payment-gate persona mix-up above is a seventh, functional/requirements bug rather than a migration one):
  - `payments` and `properties` had zero RLS SELECT policies for tenants — the payment page (at the time still tenant-side) silently computed a R0.00 amount (payments row invisible under RLS) and PayFast rejected the form. Added tenant-scoped SELECT policies on both (kept after the move to landlord-side payment — harmless read access, and the tenant consent page still needs the property-label read).
  - `mark_paid()` called `log_audit()` with its arguments in the wrong order (`null` landed in the NOT NULL `action` column), so every real PayFast ITN silently 500'd. Only surfaced by completing an actual sandbox payment and watching the webhook fail.
  - A broader sweep: `consents.tenant_id`, `payments.landlord_id`, `application_forms.tenant_id`, and `documents.uploaded_by` all had the default `NO ACTION` delete behavior, blocking deletion of almost any real user (found while cleaning up test accounts). Changed to `ON DELETE SET NULL` (dropping `NOT NULL` where needed) — same reasoning as the earlier `audit_log`/`checks.shipped_by` fix: these records should survive account deletion, not block it.
- [x] Verified twice with genuine end-to-end runs — not mocked: real signup, real invite accept, real consent, a **real PayFast sandbox payment actually completed** (via a temporary Cloudflare quick tunnel so PayFast's servers could reach the local ITN webhook), confirmed the webhook fired and `mark_paid()` ran, check status advanced to `AWAITING_APPLICATION`, and both tenant and landlord UIs reflected it correctly. First run (11/11) was against the tenant-pays version before the correction; re-run (13/13) against the corrected landlord-pays flow, additionally asserting the tenant sees no payment action at all. Tunnel torn down and all test data cleaned up both times.

## Phase 4 — Tenant: to-do list & application form ✅ done

- [x] Tenant dashboard (`/tenant`) and check-status page now have a real next-action per status, ending in "Fill out application" for `AWAITING_APPLICATION` → `/tenant/checks/[id]/application`.
- [x] Application form (`src/lib/application-form.ts` defines the field set — 19 fields across personal/employment/rental-history/household/emergency-contact, single scrollable page rather than a wizard; first draft, flagged for revision once real business requirements on required fields exist). "Save draft" writes `application_forms.form_data` directly (tenant's existing RLS `UPDATE` policy covers it); "Submit" calls `submit_application()`.
- [x] Document upload widget for `id_copy` / `payslip` / `bank_statement` — uploads to `tenant-documents/{check_id}/{document_type}/{timestamp}.{ext}` via a server action using the authenticated server client (so both storage RLS and the `documents` insert policy apply normally), then inserts the `documents` row.
- [x] Client-side file validation (type: PDF/JPG/PNG, size: 10MB max) enforced in the server action (source of truth, not just UI); malware scanning still deferred to Phase 8.
- [x] **Real gap closed before it shipped** (caught by reasoning about the flow, not by a failing test): `submit_application()` only checked the check's status, not that the three required documents actually existed — a tenant could otherwise submit with zero supporting documents and nothing downstream would catch it. Added the same existence checks `ship_check()` already does for its own required documents. Submit button is also disabled client-side until all three are uploaded, but the RPC is the actual enforcement.
- [x] Verified end-to-end in a real browser: uploaded three real files (a minimal valid PDF + two PNGs) through the actual upload flow, confirmed the submit button is disabled until all three are present, filled and saved a draft, reloaded the page and confirmed the draft persisted, submitted, and confirmed in the database that `application_forms.status = 'submitted'`, all three `documents` rows exist, and `checks.status = 'PROCESSING'`. 14/14 assertions passed.
- [x] **Extra RLS verification** (SQL-level, mirroring the Phase 0 smoke test technique): confirmed the landlord genuinely cannot read the submitted `application_forms` row or the uploaded `documents` while the check is `PROCESSING` — both return zero rows under the landlord's role, exactly matching the spec's "withhold until Ship" requirement.

## Phase 5 — Admin: processing & shipping ✅ done

- [x] Admin dashboard (`/admin`) listing every check (RLS: `is_admin()` already granted full `checks` visibility) — sorted with `PROCESSING` first (oldest first within that group, so nothing sits in the queue indefinitely), everything else behind it, with a "Needs review" badge on `PROCESSING` rows.
- [x] Per-check admin view (`/admin/checks/[id]`) — read-only render of the submitted application form (all 19 fields), plus a list of the tenant's uploaded documents (`id_copy`/`payslip`/`bank_statement`) as short-lived (5 min) signed-URL downloads, generated server-side, for the admin's own manual TPN + LLM workflow outside the app.
- [x] Upload UI for `credit_check` and `ai_recommendation` (`AdminDocumentUploader` + `uploadAdminDocument()` server action) — no new migration needed, the admin-only insert policies on `documents` and `storage.objects` were already in place from Phase 0.
- [x] "Ship" button (`ShipButton`) → `ship_check()`, with a confirmation modal (near-irreversible per the UX review, only enabled once both admin documents exist client-side) — RPC validation errors (missing credit check / AI recommendation, wrong status, non-admin caller) are caught and surfaced verbatim in the UI.
- [x] Extracted the tenant/admin upload-row markup that would otherwise have been duplicated verbatim into a shared `DocumentUploadRow` component (`src/components/document-upload-row.tsx`), parameterized by label + upload action; both `DocumentUploader` (tenant) and `AdminDocumentUploader` now use it.
- [x] Seeding the first real admin user is still the documented manual step (`insert into user_roles ... role = 'admin'` via the Supabase SQL editor, no self-serve admin signup) — not something to automate by design. Verified the RLS/RPC surface an admin depends on works correctly by seeding one via the service role in the test run below, same effect as the manual SQL-editor step.
- [x] Verified end-to-end against the live Supabase project — no headless browser available this session, so driven at the same RPC/RLS layer the app's server components and actions use (real test landlord/tenant/admin accounts, real signed URLs, real storage uploads, real `ship_check()` call), 26/26 assertions passed: admin RLS visibility into checks/application_forms/documents, signed URL generation *and* actual file download, `ship_check()` correctly rejecting a premature ship and succeeding once both documents exist, non-admins blocked from writing `credit_check`/`ai_recommendation` to storage, `is_package_document` flags set on both admin-uploaded docs, the landlord immediately able to see them post-ship, and a second `ship_check()` call on the now-`COMPLETED` check correctly rejected. `npm run build`, `tsc --noEmit`, and `eslint` all clean. All test users/checks/properties/storage objects deleted afterward — confirmed zero leftover `phase5-*` rows.

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
- [ ] Swap PayFast's shared public sandbox credentials for real merchant `merchant_id`/`merchant_key`/passphrase (sandbox, then live) — currently in `.env.local` only.
- [ ] Harden the PayFast ITN webhook (`/api/payfast/notify`): add source-IP allowlisting against PayFast's published ranges, and call their `query/validate` server-to-server endpoint as a second integrity check beyond the signature — both skipped for now (documented in the Phase 3 notes) since they'd have blocked local tunnel testing.
- [ ] `mark_paid()` currently trusts the ITN's `amount` and overwrites the pending payment row with it — add a check that it matches the expected amount before accepting, so a forged/tampered notification can't mark an underpaid transaction as paid.
- [ ] Get the placeholder POPIA consent text (`src/lib/consent.ts`) legally reviewed before real tenants see it.

---

## Working agreement

- Build and verify one phase at a time — each phase should be testable against the real Supabase project before starting the next.
- Any change to `checks.status` must go through an existing (or new) `SECURITY DEFINER` RPC, never a direct client `UPDATE` — this is the load-bearing assumption behind the RLS model.
- New document types or visibility rules require updating both the `documents` RLS policies **and** the mirrored `storage.objects` policies in the same migration.
