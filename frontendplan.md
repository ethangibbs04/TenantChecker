# Tenantcheck Frontend Transformation Plan

## Status

**Done: Phases 0, 1, 2, 6.** Design tokens, primitives (`Button`/`Input`/`Card`/`Badge`/`Dialog`/`DropdownMenu`/`Sheet`), the dashboard shell + nav, and the full public marketing site (Home/Product/About/Contact, `MarketingHeader`, `SiteFooter`, the `AuthDialog` login/signup modal, and the gated + role-aware "Buy Tenantcheck" flow) are all built, verified (`tsc`/`eslint`/`next build` clean), and — for the auth flow — live-tested end-to-end against the real hosted Supabase project. Sections 1–4 below have been updated to reflect what actually shipped, not just what was planned.

**Next: Phase 3 (landlord dashboard).** Nothing in Phases 3–5 or 7 has been touched yet — `landlord/page.tsx`, `landlord/checks/[id]/page.tsx`, `properties/*`, and `buy-tenantcheck-form.tsx` are all still on the original bare styling. Pick up at Phase 3 in Section 5.

---

## Context & Findings

**Stack (confirmed from repo):** Next.js 16 (App Router), React 19, Tailwind v4 (CSS-first `@theme` config in `src/app/globals.css` — no `tailwind.config.js`), Supabase (auth + Postgres), `@react-pdf/renderer`, Resend (email), PayFast (payments, ZAR). Fonts already wired via `next/font/google` (Geist / Geist Mono) in `src/app/layout.tsx`, but `globals.css` currently overrides `body` to `font-family: Arial, Helvetica, sans-serif` — Geist is loaded but unused. `<html>` metadata is still the default `"Create Next App"` title.

**Current UI state:** Three role-scoped layouts (`landlord`, `tenant`, `admin`) all share one `DashboardNav` component and an identical `flex min-h-screen flex-col` shell. Styling throughout is raw default-Tailwind: black/white buttons, `border` boxes, `text-neutral-*`, no design tokens, no component library, no elevation/shadow system, no status-color system beyond ad hoc `red-`/`green-` utility classes.

**Brand source:** [privatelandlord.co.za](https://www.privatelandlord.co.za/) — parent agency "Private Landlord, The Letting Specialist." Extracted directly from their site CSS/logo:

| Token | Hex | Usage on live site |
|---|---|---|
| Navy (primary) | `#013068` / `#012F68` | Header/footer background, wordmark |
| Sky blue (accent) | `#41ACFA` / `#068FFF` / `#0061B2` | Key icon, links, buttons, highlight bar |
| Gold (rare accent) | `#D88D13` | Sparse — used 2×, likely a highlight/CTA accent |
| Logo | Thin-tracked serif-adjacent wordmark "PRIVATELANDLORD," key icon mark, navy field with a sky-blue base bar |

This reads as **corporate-professional, modern-traditional** — not startup-minimal, not flashy.

**Modernization stance:** per client feedback, the source site and logo are ~10 years old and should be treated as **loose color inspiration only, not a restyle target.** We are not porting the 2010s aesthetic (thin-tracked serif wordmark, ornate key icon, boxy CMS-template layout) into Tenantcheck. Instead: keep the navy/sky family because it's recognizable and on-brand for the parent agency, but refine the actual hex values toward something richer and more premium (deeper navy, more electric sky, tinted shadows instead of gray, real motion), and design a **new, modern wordmark/mark for Tenantcheck** rather than reusing the old logo file. Tenantcheck is presented to users as its own product (see `product_spec.md`) distinct from the parent "Private Landlord" agency brand, which makes a clean, independent, contemporary identity the right call anyway — no need to wait on a client-supplied logo asset to start Phase 0.

**Decisions locked in with the user:**
- Palette derived from the existing Private Landlord brand (above), not invented from scratch.
- Components built on **shadcn/ui + Radix primitives** (Tailwind-native, full code ownership, accessible out of the box) rather than a black-box UI kit.
- **Light mode only for v1** — but tokens are structured so dark mode is a follow-up, not a rewrite.
- Original roadmap prioritized the **landlord dashboard** first; superseded once the site was live enough to expose the gap — the client asked for the **public marketing site first** (Phase 6, pulled forward, see Section 5), so visitors could browse before signing up. Landlord dashboard (Phase 3) is next now that the public site is done.
- **Auth is a centered modal with a blurred backdrop**, not a page navigation — client decision, see Section 3's "Public marketing site" subsection. `/login`/`/signup` pages still exist as fallbacks (invite flow, email confirmation).
- **"Buy Tenantcheck" is gated on auth**, with the destination preserved through signup so the visitor lands on the purchase page, not the homepage — see Section 3.

**Guardrail for every phase below:** this is a presentation-layer pass only. Server actions (`actions.ts` files), Supabase queries, `route.ts` handlers, and data-fetching signatures do not change. Components are restyled and, where needed, split into a server component (data) + small client component (interactivity) — the same pattern already used in `login/page.tsx` and `document-upload-row.tsx`. No prop contracts change unless explicitly noted.

---

## 1. Design System & Aesthetics

### Color tokens (Tailwind v4 `@theme`, in `src/app/globals.css`) — ✅ shipped

Shipped structure differs slightly from the original proposal below: Phase 0 ran `npx shadcn@latest init` (Radix base, Nova preset) first, which generates its own token file (imports `shadcn/tailwind.css`, defines shadcn's semantic tokens — `--primary`, `--card`, `--ring`, `--sidebar-*`, `--chart-*`, a `--radius` scale — as OKLCH grayscale placeholders). Rather than fight that scaffold, the brand tokens were layered onto it: our navy/sky/gold/slate/semantic scale lives in `:root` under its own names (`--navy-700`, `--sky-500`, etc.), and shadcn's semantic tokens are **remapped onto them** (`--primary: var(--navy-700)`, `--ring: var(--sky-500)`, `--destructive: var(--danger-600)`, and so on) so every shadcn component is on-brand automatically with zero per-component overrides. A `.dark` block exists with the same remapping inverted (navy-950 background, sky-400 primary) but isn't exposed in the UI yet — flipping dark mode on later is a values swap, not a rewrite, per the original decision. Full file: `src/app/globals.css`. Representative excerpt:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  /* shadcn semantic tokens, resolved via the :root remap below */
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  /* ...plus --color-card, --color-ring, --color-sidebar-*, --radius-*, etc. */

  /* Tenantcheck brand scale, exposed as real utilities (bg-navy-700, text-sky-500, ...) */
  --color-navy-950: var(--navy-950); /* ...through --color-navy-50 */
  --color-sky-600: var(--sky-600);   /* ...through --color-sky-100 */
  --color-slate-950: var(--slate-950); /* ...through --color-slate-50 */
  --color-success-600: var(--success-600); /* + warning/danger/info */

  /* Tinted shadow scale — overrides Tailwind's default flat-gray shadow-sm/md/lg globally */
  --shadow-sm: 0 1px 2px hsl(var(--shadow-color) / 0.06);
  --shadow-md: 0 4px 16px -4px hsl(var(--shadow-color) / 0.12);
  --shadow-lg: 0 12px 32px -8px hsl(var(--shadow-color) / 0.18);
}

:root {
  --navy-700: #123868; /* brand primary */
  --sky-500: #1e93ff;  /* primary accent, links, focus */
  --gold-500: #d88d13; /* rare "premium" highlight only */
  --shadow-color: 210 60% 15%;
  --gradient-brand: linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 55%, var(--sky-600) 100%);
  --ease-premium: cubic-bezier(0.16, 1, 0.3, 1);

  /* shadcn semantic tokens remapped onto the brand palette */
  --primary: var(--navy-700);
  --ring: var(--sky-500);
  --destructive: var(--danger-600);
  --background: var(--slate-50);
  /* ...card, popover, secondary, muted, accent, border, input follow the same pattern */

  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-fraunces), Georgia, serif;
}
```

Usage rule: **navy for primary actions and headers, sky for links/focus/secondary actions, gold only for a single "premium package" or "featured" touch** (e.g. a completed-package highlight border) — never for status colors, which stay in the semantic success/warning/danger family so they read correctly regardless of brand refresh. The tinted shadow scale and brand gradient are the single highest-leverage "premium" detail in this whole plan — flat gray shadows are what make free-tier SaaS UIs feel cheap; a shadow with a hint of the brand navy in it is what makes a UI feel designed.

### Typography — ✅ shipped

- **UI/body font:** keep Geist (already loaded, zero extra cost) as `--font-sans` for all dashboard chrome, tables, forms, buttons — dashboards live and die on data density and legibility, not personality.
- **Display font:** add one self-hosted serif via `next/font/google` — **Fraunces**, set to a light/medium optical size — as `--font-display`, used *only* for page-level `<h1>`s on the landing page, login/signup, and dashboard section titles. Deliberately *not* Playfair Display, which is what the outdated parent site already uses and reads as classic-traditional; Fraunces has the same warmth and "premium real estate" credibility but a softer, more contemporary character (it's the serif of choice for a lot of current premium/modern brands) — this is where the "modern" half of the brief actually shows up against an otherwise clean SaaS UI, without turning the whole app into a magazine layout.
- Scale (Tailwind defaults are fine, just apply consistently):
  - `text-3xl font-display` — page hero (marketing/landing only)
  - `text-2xl font-display font-medium` — dashboard page titles (e.g. "Your Tenantchecks")
  - `text-lg font-semibold` — card/section headers
  - `text-sm` — body/table default
  - `text-xs text-slate-500` — meta/secondary

### Elevation & shape — ✅ shipped (as the `Card`/`Badge`/`Button` primitives; not yet applied to Phase 3+ pages)

- Replace bare `border` boxes with a two-tier system: `rounded-lg border border-slate-200 bg-white shadow-sm` for resting cards, `shadow-md` on hover/focus for interactive cards.
- Standardize radius: `rounded-lg` (8px) for cards/inputs/buttons, `rounded-full` for badges/avatars/pills. Stop mixing bare `rounded` (4px) and `rounded-full` inconsistently as `StatusTracker` and `DashboardNav` currently do.

### Motion, depth & micro-interactions — partially shipped

`tailwindcss-animate`, the tinted shadow scale, hover-lift on `Card`, and `--ease-premium` are live wherever the built primitives/pages are used. **Still open:** `StatusTracker`'s animated fill, and route-level `loading.tsx` skeletons — neither exists yet anywhere in `src/app/**`, confirmed unchanged since Phase 0. Both are still the highest-leverage "feels smooth" items available for Phase 3+.

This is the difference between "restyled" and "premium" — a UI with the right colors but no motion still feels like a template. Concrete, cheap-to-implement rules, all pure CSS/Tailwind, no animation library needed:

- **One easing curve everywhere:** `--ease-premium: cubic-bezier(0.16, 1, 0.3, 1)` (defined above) on every transition — hover, focus, open/close. Mixing default `ease`/`linear` across components is what makes an interface feel inconsistent even when the colors are right.
- **Hover lift on anything clickable that isn't a plain text link:** cards, buttons, checks-list items get `transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md`. Subtle — 2px, not a bounce.
- **Press feedback:** `active:scale-[0.98]` on buttons so clicks feel physically acknowledged, not just color-swapped.
- **`tailwindcss-animate`** (installed automatically by `shadcn init`, already the standard pairing) drives all Radix open/close states — dropdown, sheet, dialog get `animate-in fade-in-0 zoom-in-95` / `animate-out fade-out-0` for free. Use these, don't hand-roll opacity transitions.
- **Status changes animate, not jump-cut:** when `StatusTracker` advances a step, the fill transition (`transition-colors duration-300`) plus a brief scale-pulse on the newly active step communicates progress instead of a silent re-render.
- **Route-level loading skeletons:** none of the current routes have a `loading.tsx` (confirmed — none exist under `src/app/**`), so every navigation currently either shows nothing or a blank flash while the server component fetches from Supabase. Add a `loading.tsx` per data-fetching route segment (`landlord/`, `landlord/checks/[id]/`, `tenant/`, `admin/`) using shadcn's `Skeleton` component shaped to match the eventual layout (card-grid skeleton, stepper skeleton, etc.) — this single change is one of the highest-impact "feels smooth" fixes available, independent of anything else in this plan.
- **Brand gradient, used sparingly:** `--gradient-brand` (navy → sky) reserved for exactly two places — the landing-page hero background and the primary CTA button's hover state (`hover:bg-[image:var(--gradient-brand)]`). Using it everywhere cheapens it; using it nowhere wastes the palette work above.
- **Sticky header with scroll blur:** `AppHeader` (Section 3) goes `sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200` so content scrolling underneath it reads as depth rather than the header just sitting flat on top.

---

## 2. Layout Standardization

**Current problem:** every page (`landlord/page.tsx`, `landlord/checks/[id]/page.tsx`, `tenant/*`, `admin/*`) hand-rolls its own `flex flex-col gap-8` div with no shared width constraint, and the three `*/layout.tsx` files are byte-for-byte duplicates.

**Target structure:**

1. **Shared dashboard shell — ✅ shipped.** `src/components/dashboard-shell.tsx` exists and all three `layout.tsx` files (`landlord`, `tenant`, `admin`) call it exactly as sketched below (landlord also passes `navItems` for its "Dashboard"/"Properties" links). Owns the nav + a `<main>` with the standardized responsive container: `mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8`.
   ```tsx
   // src/app/landlord/layout.tsx
   export default async function LandlordLayout({ children }) {
     const { user, roles } = await getCurrentUserAndRoles();
     if (!user) redirect("/login");
     if (!roles.includes("landlord")) redirect("/");
     return <DashboardShell activeRole="landlord" roles={roles}>{children}</DashboardShell>;
   }
   ```

2. **Page-header pattern — ✅ component shipped, not yet applied.** `src/components/page-header.tsx` exists (built in Phase 1, used so far only on the marketing Home page) but **no dashboard page uses it yet** — `landlord/page.tsx` still has its own hand-rolled title/actions row. First thing to swap in during Phase 3.

3. **Grid system for cards — ⏳ not started.** The checks list (`landlord/page.tsx`) is still the original `<ul className="flex flex-col gap-4">` of full-width rows, untouched since before Phase 0. Still the plan: a responsive grid (`grid gap-4 sm:grid-cols-2 xl:grid-cols-3`) for the overview, single-column `max-w-3xl` for the detail page.

4. **Sidebar decision:** given only 3 roles and ~4-6 nav items per role, a persistent left sidebar is unnecessary weight for v1 — stick with a polished top header (below) rather than adding a sidebar shell. Revisit only if the admin panel grows past ~6 sections.

---

## 3. Navigation Architecture — ✅ shipped

Rebuilt `src/components/dashboard-nav.tsx` (was: plain text logo, a role-label pill, inline `underline` links, no mobile handling) into a proper app header — `dashboard-nav.tsx` is deleted:

- **Left:** the Tenantcheck wordmark (`src/components/logo.tsx` — CSS/SVG, `font-display` + a monoline checkmark-shield glyph, `dark`/`light` variants for use on light vs. navy backgrounds) + a `Badge` showing the active role.
- **Right (desktop ≥ md):** a **user account dropdown menu** (`src/components/user-menu.tsx`, shadcn `DropdownMenu` on Radix), triggered by an initials avatar circle. Contents: user email, "Switch to {role}" entries (only if `roles.length > 1`), "Log out" (posts to the existing `/logout` route action via a hidden form + `requestSubmit()` — no backend change).
- **Right (mobile < md):** `src/components/mobile-nav.tsx` — a `Sheet`/slide-over triggered by a hamburger button, same menu contents stacked vertically.
- **Active-state affordance:** done — landlord's `AppHeader` now takes an explicit `navItems` prop (`Dashboard`, `Properties`), highlighted via `bg-sky-100 text-sky-700` when the current path matches. The redundant "Properties" button that used to live in `landlord/page.tsx`'s own header row was removed.
- **Auth pages** (`login`, `signup`) get `src/components/auth-header.tsx` — wordmark only, no account menu.

Components: `src/components/app-header.tsx` (replaces `dashboard-nav.tsx`), `user-menu.tsx`, `mobile-nav.tsx`, `dashboard-shell.tsx` (Section 2) renders `AppHeader`.

### Public marketing site — ✅ shipped (client decision, pulled forward from the original Phase 6 scope)

The client wants the site to work like a normal SaaS marketing site, not an auth wall: visitors can browse Home, Product, About, and Contact without an account, and only hit a login/signup gate when they take an account-specific action (buying a Tenantcheck). This needed a **third header variant**, separate from `AppHeader` (dashboard) and the minimal `AuthHeader` (login/signup):

- **`MarketingHeader`** (`src/components/marketing-header.tsx`) — logo on the left; nav (`Home`, `Product`, `About Us`, `Contact` — `Home` added per a later client request, pointing at `/`, alongside the logo link which also goes there); `Log in` (outline button) + `Sign up` (primary button) on the far right. Same sticky/blurred-on-scroll treatment as `AppHeader`. Mobile: hamburger → `Sheet` with the same links stacked, plus the two auth buttons. Used on `/`, `/product`, `/about`, `/contact`.
- **`SiteFooter`** (`src/components/site-footer.tsx`) — dark-navy footer (logo in its `light` variant, quick links including `Home` + login/signup, copyright) on the same four public pages.
- **Auth as a modal, not a page** (client decision, superseding the original "navigate to `/login`" plan): clicking Log in / Sign up anywhere on the public site opens `AuthDialog` (`src/components/auth-dialog.tsx`, a `Dialog`-based `AuthDialogProvider` + `useAuthDialog()` context mounted once in the root layout) centered over the page with a blurred/dimmed backdrop (bumped from shadcn's default subtle blur to `backdrop-blur-sm` + `bg-navy-950/30` so it actually reads as "blurred," per the client's explicit ask). Switching "Log in" ↔ "Sign up" swaps the dialog's content in place, no close/reopen. `/login` and `/signup` **still exist** as real pages — required for the tenant invite flow (`/invite/[token]` links straight to `/signup?invite=...`), the Supabase email-confirmation callback, and direct/bookmarked navigation. The dialog and the two pages share the same `LoginForm`/`SignupForm` components (`src/components/login-form.tsx`, `signup-form.tsx`), so there's one copy of the form logic, not two.
- **Gated "Buy Tenantcheck" CTA:** `BuyTenantcheckButton` (server component, `src/components/buy-tenantcheck-button.tsx`) checks auth state: logged in → a real `<Link>` straight to `/landlord/checks/new`; logged out → renders `BuyTenantcheckTrigger` (`buy-tenantcheck-trigger.tsx`, client), which opens `AuthDialog` in signup mode with the destination pre-set. **Reuse note for Phase 3:** this same component is the right thing to drop into `landlord/page.tsx`'s own "Buy Tenantcheck" action — it already renders correctly for a logged-in landlord (plain link, no dialog), so that page doesn't need a second implementation.
- **Generalized post-auth redirect:** `login`/`signup`/the dialog support a generic `?next=` destination in addition to `invite`, consumed by `/auth/callback` on the email-confirmation path too.
- **Auto-granted landlord role (bug found and fixed during live testing):** a brand-new signup arriving via the gated "Buy Tenantcheck" CTA has *zero* roles at the moment it lands on `/landlord/checks/new` — the route guard (`if (!roles.includes("landlord")) redirect("/")`) would silently bounce them home instead of onto the purchase form. Fixed with `ensureLandlordRole(supabase, userId)` (`src/lib/auth.ts`, idempotent, hardened against a duplicate-insert race on `user_roles`'s `(user_id, role)` primary key) called from three places: `LoginForm`/`SignupForm` on an immediate-session success, and `/auth/callback/route.ts` on the email-confirmation path — anywhere someone can end up authenticated and headed to a `/landlord` route via this flow. **Not yet covered:** an *already logged-in* user with some other role (e.g. tenant-only) clicking "Buy Tenantcheck" still gets bounced, since that path skips the dialog (already authenticated) and never calls the ensure-role helper — flagged to the client as a known edge case, not yet fixed. Worth closing before/during Phase 3 if it matters for the target users.

---

## 4. Component Upgrades

Introduce via `shadcn/ui` (Radix-backed, Tailwind v4 compatible) unless noted. Each maps to a concrete replacement in the current code. **✅ = shipped and in `src/components/ui/`; ⏳ = still to do.**

| New component | Status | Replaces (file:line) | Notes |
|---|---|---|---|
| `Button` (variants: default/navy, secondary, outline, ghost, destructive, link) | ✅ shipped | still needs to replace ad hoc `rounded bg-black px-3 py-2 text-white` in `landlord/page.tsx`, the logged-in "no roles yet" branch of `page.tsx`, `ship-button.tsx` (marketing site + auth forms already converted) | Has a `size` prop (`xs`/`sm`/`default`/`lg`/`icon*`) and disabled/loading-ready styling; still needs each remaining bare button wired to `disabled`/loading state (`document-upload-row.tsx:60` tracks `isPending` but only swaps text). |
| `Input`, `Label` | ✅ shipped | still needs to replace bare `<input>` in `buy-tenantcheck-form.tsx`, `application-form.tsx` (auth forms already converted) | Consistent focus ring, `aria-invalid` error styling, and paired `<Label>` already work (verified in Phase 1 preview) — just needs wiring into the remaining forms. No `Textarea` built yet; add when a form actually needs one. |
| `Card` (+ `CardHeader`/`CardContent`/`CardFooter`/`CardTitle`/`CardDescription`) | ✅ shipped | still needs to replace `rounded border p-4` in `landlord/page.tsx:41`, `document-upload-row.tsx:40` | Ships with `shadow-sm` + `transition-shadow` by default (added on top of shadcn's generated `ring-1` treatment); hover-lift is opt-in per usage, not baked into every card. |
| `Badge` | ✅ shipped, with extra variants | still needs to replace role pill (was `dashboard-nav.tsx:21`, now n/a — `AppHeader` already uses `Badge`), terminal-state block in `status-tracker.tsx:8` | Added `success`/`warning`/`info` variants beyond shadcn's default set specifically for the status-pipeline rebuild below. |
| **Status pipeline / stepper** (custom, not shadcn) | ⏳ not started | `status-tracker.tsx` in full | Unchanged since before Phase 0. Rebuild as a proper horizontal stepper using the new `Badge` semantic variants; keep the same `CheckStatus`/`CHECK_STATUSES` props contract. First real Phase 3 UI piece. |
| `DropdownMenu` | ✅ shipped | powers `UserMenu` (Section 3) | |
| `Sheet` | ✅ shipped | powers `MobileNav` and `MarketingHeader`'s mobile menu (Section 3) | |
| `Dialog` | ✅ shipped | powers `AuthDialog` (Section 3) | Still pending: confirmation on "Ship" in `admin/checks/[id]/ship-button.tsx` (Phase 5). |
| **Data table** | ⏳ not started | `landlord/page.tsx` checks list, `admin/page.tsx` checks overview | Phase 3/5. |
| **File upload / dropzone** | ⏳ not started | `document-upload-row.tsx`, `admin-document-uploader.tsx`, `application-form.tsx`'s `document-uploader.tsx` | Phase 3/4/5. |
| **Toast** | ⏳ not started | inline `<p className="text-red-600">` errors throughout | Phase 7. |
| `EmptyState` | ✅ shipped | `landlord/page.tsx:31` (`"No Tenantchecks yet"`) still needs to adopt it | Built in Phase 1 (`src/components/empty-state.tsx`), verified in isolation; not yet used on a real page since Phase 3 hasn't started. |
| `PageHeader` | ✅ shipped | every dashboard page's hand-rolled title/actions row | Built in Phase 1 (`src/components/page-header.tsx`); in production use only on the marketing Home page so far. |
| `Skeleton` + route `loading.tsx` | ⏳ not started | no route in `src/app/**` has a `loading.tsx`, confirmed still true | See Section 1's motion subsection. |

Every shipped component above also picks up the Section 1 motion rules by default (hover-lift opt-in on `Card`, press-scale on `Button`, animate-in on `DropdownMenu`/`Sheet`/`Dialog`) — that's what turns "restyled" into "premium and smooth," not any single component in isolation.

---

## 5. Execution Roadmap

Phased so the app stays shippable after every phase — no big-bang rewrite, no route/data changes, each phase independently reviewable.

**Standing instruction for every phase's write-up:** after the normal technical explanation of what was built, always add a short "in plain English" section telling the client exactly where to look to see the phase's changes on the real, running site — which URL(s) to open, and what to visually look for once there (e.g. "go to `/login` — the form now has labels above each field and a navy Log in button with a soft shadow"). Phases like 0 and 1 that only touch tokens/components with nothing wired into a real page yet should say so plainly ("nothing to see on the live site yet — this was internal plumbing/a components library; you'll see it appear starting in Phase 2") rather than pointing to a temporary dev-only preview route, since those get deleted after verification and aren't something the client can visit.

**Phase 0 — Groundwork ✅ DONE**
- Design tokens in `globals.css` (Section 1), Arial override removed, `--font-display` wired.
- `metadata` in `layout.tsx` fixed (was "Create Next App").
- `shadcn/ui` installed and initialized (Radix base, Nova preset).
- Tenantcheck wordmark built (`src/components/logo.tsx`, `dark`/`light` variants added later in Phase 6 for the dark footer).
- *Verified:* `tsc`/`eslint`/`next build` clean; logo rendering confirmed via screenshot.

**Phase 1 — Core primitives ✅ DONE**
- `Button`, `Input`, `Label`, `Card`, `Badge` shipped via shadcn generators, themed to the tokens; `Badge` got extra `success`/`warning`/`info` variants beyond the shadcn default set.
- `EmptyState`, `PageHeader` shipped as custom components.
- *Verified:* built and screenshotted a temporary `/dev-primitives-preview` route exercising every variant, then deleted it (per the established pattern — temp preview routes get deleted after verification, not merged).

**Phase 2 — Shell & navigation ✅ DONE**
- `DashboardShell`, `AppHeader`, `UserMenu`, `MobileNav` built (Section 2 & 3); all three `layout.tsx` files swapped over; `dashboard-nav.tsx` deleted.
- `login`/`signup` got the minimal `AuthHeader` variant (later became the fallback pages behind the Phase 6 auth modal).
- *Verified:* live-clicked the account dropdown and mobile sheet via a scripted browser session to confirm both actually open/close correctly, not just render.

**Phase 6 — Public marketing site & auth surfaces ✅ DONE** *(pulled forward, ahead of Phase 3, per explicit client request — the site needed to be publicly browsable, then the auth flow needed to be a modal not a page, before the dashboard polish continues)*
- `MarketingHeader` + `SiteFooter` (Section 3) — shared chrome for every public page, nav is `Home`/`Product`/`About Us`/`Contact`.
- `page.tsx` (logged-out home): real landing content — hero with `--font-display` + `--gradient-brand`, feature cards, "how it works" steps, closing CTA.
- `product/page.tsx`, `about/page.tsx`, `contact/page.tsx` shipped — public, no auth guard. Product content drawn from `product_spec.md`; **About Us and Contact are still placeholder copy** (About: generic mission statement, no invented company history/team; Contact: placeholder email/phone flagged `TODO` in the code) — real content from the client is an open follow-up, not a blocker.
- `AuthDialog` modal (Section 3) — superseded the original "navigate to `/login`" plan per a later client request. `login`/`signup` pages kept as real fallbacks, rebuilt on shared `LoginForm`/`SignupForm` components.
- Gated, role-aware `BuyTenantcheckButton` + the `ensureLandlordRole` auto-grant fix (Section 3).
- *Verified:* `tsc`/`eslint`/`next build` clean throughout; the full signup → auto-role-grant → land-on-purchase-page flow was **live-tested against the real hosted Supabase project** with the client's explicit sign-off (throwaway test account, email pattern `tenantcheck.frontendplan.test+<timestamp>@mailinator.com` — safe to delete from Supabase Auth).

---

**Phase 3 — Landlord dashboard** *(next — priority surface, nothing started yet)*
- `landlord/page.tsx`: swap the hand-rolled title/actions row for `PageHeader`; move the checks list from `<ul className="flex flex-col gap-4">` to the `grid sm:grid-cols-2 xl:grid-cols-3` card layout from Section 2; replace the raw `<Link className="rounded bg-black...">Buy Tenantcheck</Link>` with the already-built `BuyTenantcheckButton` (Section 3) — it already does the right thing for a logged-in landlord (plain link, no dialog), so this is a straight swap, not new logic; adopt `EmptyState` for the "No Tenantchecks yet" case.
- `landlord/checks/[id]/page.tsx`: rebuilt `StatusTracker` (still fully unbuilt — see Section 4), `Card`-based document/package sections, `invite-link-box.tsx` and `package-downloads.tsx` restyled to the new `Card`/`Button` set.
- `landlord/properties/*`, `landlord/checks/new/buy-tenantcheck-form.tsx`, `landlord/checks/[id]/pay/*`: forms upgraded to `Input`/`Label`/`Button` (all three already shipped and proven in the auth forms — this is applying an existing pattern, not inventing one).
- Worth a decision at the start of this phase: whether to also close the "logged-in-but-wrong-role" gap noted in Section 3 (existing tenant-only user clicking Buy Tenantcheck still gets silently bounced) while already in this code.

**Phase 4 — Tenant flow** *(not started)*
- `tenant/page.tsx` to-do list as a checklist-style card set.
- `tenant/checks/[id]/consent/page.tsx`, `application/*` (`application-form.tsx`, `document-uploader.tsx`): styled inputs, the new dropzone upload component, multi-step progress if the application form is long enough to warrant it.

**Phase 5 — Admin panel** *(not started)*
- `admin/page.tsx`: data table for checks overview (highest row-count surface).
- `admin/checks/[id]/page.tsx`, `admin-document-uploader.tsx`, `ship-button.tsx`: add the `Dialog` confirmation on Ship (the `Dialog` primitive is already shipped, powering `AuthDialog` — same component, new usage), restyle uploader.

**Phase 7 — Cross-cutting QA pass** *(not started)*
- Responsive audit at 375/768/1024/1440px for every route touched above.
- Keyboard nav + focus-visible audit on all new interactive components (dropdown, sheet, dialog get this for free from Radix; verify custom pieces like the stepper).
- Loading/error/empty state audit — every data-fetching page should have all three, not just the happy path, and every route segment has its `loading.tsx` skeleton (Section 1).
- Motion audit — confirm `--ease-premium` is the only easing curve in use, hover-lift/press-scale are applied consistently, nothing animates that shouldn't (respect `prefers-reduced-motion` — wrap the custom hover/scale transitions in `motion-safe:` variants since Radix's `animate-in`/`animate-out` already respect it).
- Toast wiring for the action-level feedback gaps noted in Section 4.

Each phase is a self-contained PR. With Phases 0, 1, 2, and 6 done, Phases 3, 4, and 5 remain independent of each other (no shared files) and can run in any order — Phase 3 is next per the original landlord-first priority, but nothing structurally blocks doing 4 or 5 first if priorities shift. Phase 7 (QA) should come last regardless, once there's more surface area to audit.
