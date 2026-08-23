# Tenantcheck Frontend Transformation Plan

## Status

**Done: Phases 0, 1, 2, 6, plus a client-driven architecture change.** Design tokens, primitives (`Button`/`Input`/`Card`/`Badge`/`Dialog`/`DropdownMenu`/`Sheet`), the full public marketing site (Home/Product/About/Contact, the `AuthDialog` login/signup modal, and the gated + role-aware "Buy Tenantcheck" flow) are all built and verified (`tsc`/`eslint`/`next build` clean, plus live-testing against the real hosted Supabase project).

**Superseding change:** the original plan had two separate headers — `MarketingHeader` for the public site, `AppHeader` for logged-in dashboards — so logging in dropped you into a visually disconnected "app," with no way back to Home/Product/About/Contact short of the browser back button, and a multi-role user landed on a completely bare, unstyled "Choose a dashboard" page. The client asked to unify this: **one `SiteHeader` everywhere**, marketing pages and dashboards alike, so site-level nav is always present and logging in just adds account context rather than swapping the whole shell. See Section 3, rewritten to match. As part of this, the landlord's home page was renamed and restructured into **"My Activity"** (In Progress / History sections) — this absorbed the checks-list-grid item from Section 2 and the `PageHeader`/`EmptyState` adoption originally slated for Phase 3, so that part of Phase 3 is now done too.

**Next: rest of Phase 3 (landlord dashboard).** `landlord/checks/[id]/page.tsx`, `landlord/properties/*`, and `buy-tenantcheck-form.tsx` are still on the original bare styling — `landlord/page.tsx` (now "My Activity") is the only landlord page restyled so far. Phases 4, 5, and 7 haven't been touched. Pick up in Section 5.

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
- **Sticky header with scroll blur:** `SiteHeader` (Section 3) goes `sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200` so content scrolling underneath it reads as depth rather than the header just sitting flat on top.

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

3. **Grid system for cards — ✅ shipped for the overview.** `landlord/page.tsx` (now "My Activity," Section 5) moved off the original `<ul className="flex flex-col gap-4">` onto `grid gap-4 sm:grid-cols-2 xl:grid-cols-3`, split into In Progress / History sections. The detail page (`checks/[id]/page.tsx`) is still unbuilt — still the plan: single-column, `max-w-3xl`.

4. **Sidebar decision:** given only 3 roles and ~4-6 nav items per role, a persistent left sidebar is unnecessary weight for v1 — stick with a polished top header (below) rather than adding a sidebar shell. Revisit only if the admin panel grows past ~6 sections.

---

## 3. Navigation Architecture — ✅ shipped, unified (client decision, revised from the original two-header design)

**Original design (superseded):** a separate `MarketingHeader` for the public site and `AppHeader` for logged-in dashboards. This shipped first, then the client asked to undo the split: logging in dropped you into a visually disconnected "app" with no way back to Home/Product/About/Contact, and a multi-role user landed on a completely bare, unstyled "Choose a dashboard" page with zero site chrome. "Keep everything in the same place" — one site, not a marketing site bolted onto a separate app.

**Current design: one `SiteHeader` everywhere** (`src/components/site-header.tsx`), replacing both `AppHeader` and `MarketingHeader` (both deleted, along with the now-unneeded standalone `mobile-nav.tsx` — its logic is inline in `SiteHeader`'s own `Sheet`, since the dashboard/marketing split it existed to handle no longer exists):

- **Site-level nav — `Home`, `Product`, `About Us`, `Contact` — is always present**, logged in or out, on every page including dashboard routes.
- **Role-specific nav** (e.g. the landlord's `My Activity`, `Properties`) appears *inline, next to the site nav* (with a thin divider between the two groups) whenever `SiteHeader` is given an `activeRole` + `navItems` — i.e. whenever you're inside that role's own route tree via `DashboardShell`. On marketing pages there's no `activeRole` in scope, so no inline role links show there.
- **Account area:** logged out → Log in (outline) / Sign up (primary) buttons, opening `AuthDialog`. Logged in → `UserMenu` (avatar initials, dropdown). `UserMenu`'s `activeRole` prop is now **optional** — with it set (dashboard context), behavior is unchanged ("Switch to {role}" for every *other* role); without it (marketing pages, the multi-role picker), there's no "current" role to exclude, so it lists **every** role as "Go to {role} dashboard."
- **Mobile:** one hamburger → `Sheet` with site nav, then role nav (if any) under a small heading, then either "Switch dashboard" links or the logged-out auth buttons, then Log out.
- **`SiteFooter`** now renders on dashboard pages too (`DashboardShell` adds it after `<main>`), and takes a `loggedIn` prop — when true it drops the "Account" column (Log in/Sign up links, which read as broken/backwards once you're already logged in) and keeps only the Home/Product/About/Contact column.
- **Auth pages** (`login`, `signup`) keep the separate minimal `AuthHeader` (wordmark only) — unaffected by this change, they're still edge-case fallbacks (invite flow, email confirmation), not normal browsing.
- **`getCurrentUserAndRoles`** (`src/lib/auth.ts`) is now wrapped in React's `cache()` — every page calls it at least once for the header, so request-level dedup avoids a redundant Supabase round trip on pages that also need it for their own logic (e.g. a dashboard layout's guard).

Every page constructs the `auth` prop the same way: `{ userLabel, roles, activeRole? }` or `null` if logged out. `DashboardShell` builds it from its existing `activeRole`/`roles`/`userLabel` props (no layout.tsx changes needed); the four marketing pages and the home page's multi-role/no-role branches each call `getCurrentUserAndRoles()` directly and omit `activeRole`.

### Auth modal, gated CTA, and the role-grant fix — ✅ shipped

- **Auth as a modal, not a page:** clicking Log in / Sign up anywhere opens `AuthDialog` (`src/components/auth-dialog.tsx`, `AuthDialogProvider` + `useAuthDialog()` mounted once in the root layout) centered over the page with a blurred/dimmed backdrop. Switching "Log in" ↔ "Sign up" swaps content in place. `/login` and `/signup` **still exist** as real pages for the tenant invite flow, the Supabase email-confirmation callback, and direct/bookmarked navigation — sharing the same `LoginForm`/`SignupForm` components as the dialog, one copy of the form logic.
- **The post-auth "which dashboard" step is in-dialog too** (client decision — the multi-role picker and "claim landlord" prompt used to be separate full-page navigations after a plain Log in/Sign up, which felt like leaving the popup to land on yet another page). `LoginForm`/`SignupForm` take an optional `onAmbiguousDestination` callback, only wired up when rendered inside `AuthDialog` (the standalone `/login`/`/signup` pages omit it, keeping their old behavior — there's no dialog to hand off to there). When a plain login/signup (destination `"/"`, i.e. not a gated CTA that already knows where it's going) succeeds, `resolveAmbiguousDestination()` (`src/lib/resolve-post-auth.ts`, client-side, RLS-safe read of the user's own `user_roles`) checks role count: exactly one → redirect straight there, same as before; anything else → hand the roles back to `AuthDialog`, which switches its own mode to `choose-role` (a `Card` list of dashboards, reusing the same visual pattern as the standalone multi-role page) or `claim-landlord` (the "Continue as a landlord" prompt) **without ever navigating away** — the dialog just shows different content, exactly like the login/signup toggle. `getDisplayName`/`ROLE_LABEL`/`Role` were pulled out of `lib/auth.ts` into a new `src/lib/roles.ts` with zero server-only imports, since this resolution now needs to run client-side and `lib/auth.ts` pulls in `next/headers` — `lib/auth.ts` re-exports them so no existing server-side import needed to change. Live-verified: a fresh signup with no gated destination now shows the "claim landlord" panel inside the still-open dialog and, after submitting, closes the dialog and lands on "My Activity" — the `choose-role` panel (multi-role case) wasn't separately live-tested (no easy way to grant a test account a second role — `tenant` is only ever assigned via the invite RPC), but it's the identical mechanism with a different render.
- **Gated "Buy Tenantcheck" CTA:** `BuyTenantcheckButton` (server component) checks auth state: logged in → a real `<Link>` to `/landlord/checks/new`; logged out → `BuyTenantcheckTrigger` (client), which opens `AuthDialog` in signup mode with the destination pre-set. This same component now also powers "My Activity"'s own Buy button (Section 5) — no second implementation needed.
- **Generalized post-auth redirect:** `login`/`signup`/the dialog support a generic `?next=` destination in addition to `invite`, consumed by `/auth/callback` on the email-confirmation path too.
- **Auto-granted landlord role (bug found and fixed during live testing, twice):** a brand-new signup arriving via the gated CTA has *zero* roles when it lands on `/landlord/checks/new` — the route guard would bounce it home instead. First fix (`ensureLandlordRole`) used check-then-insert, which is a real race, not a theoretical one — it produced a live crash (`duplicate key value violates unique constraint "user_roles_pkey"`) logging into an account that already had the role. Rewritten to just attempt the insert and treat "already exists" (`error.code === "23505"`, with a message-text fallback) as success — Postgres's own `(user_id, role)` primary key is the source of truth, not a client-side read beforehand. Same fix applied to `claimLandlordRole` (`src/app/actions.ts`), which had the identical unguarded-insert bug. Re-verified live against the exact crashing scenario — lands cleanly now. **Not yet covered:** an *already logged-in* user with some other role (e.g. tenant-only) clicking "Buy Tenantcheck" still gets bounced — still a known, flagged edge case.

---

## 4. Component Upgrades

Introduce via `shadcn/ui` (Radix-backed, Tailwind v4 compatible) unless noted. Each maps to a concrete replacement in the current code. **✅ = shipped and in `src/components/ui/`; ⏳ = still to do.**

| New component | Status | Replaces (file:line) | Notes |
|---|---|---|---|
| `Button` (variants: default/navy, secondary, outline, ghost, destructive, link) | ✅ shipped | still needs to replace ad hoc `rounded bg-black px-3 py-2 text-white` in `landlord/page.tsx`, the logged-in "no roles yet" branch of `page.tsx`, `ship-button.tsx` (marketing site + auth forms already converted) | Has a `size` prop (`xs`/`sm`/`default`/`lg`/`icon*`) and disabled/loading-ready styling; still needs each remaining bare button wired to `disabled`/loading state (`document-upload-row.tsx:60` tracks `isPending` but only swaps text). |
| `Input`, `Label` | ✅ shipped | still needs to replace bare `<input>` in `buy-tenantcheck-form.tsx`, `application-form.tsx` (auth forms already converted) | Consistent focus ring, `aria-invalid` error styling, and paired `<Label>` already work (verified in Phase 1 preview) — just needs wiring into the remaining forms. No `Textarea` built yet; add when a form actually needs one. |
| `Card` (+ `CardHeader`/`CardContent`/`CardFooter`/`CardTitle`/`CardDescription`) | ✅ shipped | still needs to replace `rounded border p-4` in `landlord/page.tsx:41`, `document-upload-row.tsx:40` | Ships with `shadow-sm` + `transition-shadow` by default (added on top of shadcn's generated `ring-1` treatment); hover-lift is opt-in per usage, not baked into every card. |
| `Badge` | ✅ shipped, with extra variants | still needs to replace role pill (was `dashboard-nav.tsx:21`, now n/a — `SiteHeader` already uses `Badge`), terminal-state block in `status-tracker.tsx:8` | Added `success`/`warning`/`info` variants beyond shadcn's default set specifically for the status-pipeline rebuild below. |
| **Status pipeline / stepper** (custom, not shadcn) | ⏳ not started | `status-tracker.tsx` in full | Unchanged since before Phase 0. Rebuild as a proper horizontal stepper using the new `Badge` semantic variants; keep the same `CheckStatus`/`CHECK_STATUSES` props contract. First real Phase 3 UI piece. |
| `DropdownMenu` | ✅ shipped | powers `UserMenu` (Section 3) | |
| `Sheet` | ✅ shipped | powers `SiteHeader`'s mobile menu (Section 3) | |
| `Dialog` | ✅ shipped | powers `AuthDialog` (Section 3) | Still pending: confirmation on "Ship" in `admin/checks/[id]/ship-button.tsx` (Phase 5). |
| **Data table** | ⏳ not started | `landlord/page.tsx` checks list, `admin/page.tsx` checks overview | Phase 3/5. |
| **File upload / dropzone** | ⏳ not started | `document-upload-row.tsx`, `admin-document-uploader.tsx`, `application-form.tsx`'s `document-uploader.tsx` | Phase 3/4/5. |
| **Toast** | ⏳ not started | inline `<p className="text-red-600">` errors throughout | Phase 7. |
| `EmptyState` | ✅ shipped, in use | was `landlord/page.tsx:31` (`"No Tenantchecks yet"`) | Now powers "My Activity"'s zero-checks state (Section 5). Still needs adopting on the tenant/admin empty states once Phases 4/5 start. |
| `PageHeader` | ✅ shipped, in use | remaining dashboard pages' hand-rolled title/actions rows | In production use on the marketing Home page and now "My Activity" (Section 5). |
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

**Phase 3 — Landlord dashboard** *(next — priority surface, partially started)*
- ✅ `landlord/page.tsx` — done, and renamed/restructured beyond the original plan: it's now **"My Activity,"** using `PageHeader`, the `grid sm:grid-cols-2 xl:grid-cols-3` card layout, `BuyTenantcheckButton` (a straight swap for the old raw `<Link>` — it already does the right thing for a logged-in landlord), and `EmptyState` for the zero-checks case. Checks are split into **In Progress** (everything before `COMPLETED`) and **History** (`COMPLETED`/`DECLINED`/`CANCELLED`/`EXPIRED`) sections, each only rendered if non-empty; a single top-level `EmptyState` replaces both when there are no checks at all. The nav item linking here is labeled "My Activity," not "Dashboard" (`landlord/layout.tsx`). Not live-verified with real check data yet (only the empty state) — no seeded checks existed on the test account; worth a manual look once real checks exist.
- ⏳ `landlord/checks/[id]/page.tsx`: rebuilt `StatusTracker` (still fully unbuilt — see Section 4), `Card`-based document/package sections, `invite-link-box.tsx` and `package-downloads.tsx` restyled to the new `Card`/`Button` set.
- ⏳ `landlord/properties/*`, `landlord/checks/new/buy-tenantcheck-form.tsx`, `landlord/checks/[id]/pay/*`: forms upgraded to `Input`/`Label`/`Button` (all three already shipped and proven in the auth forms — this is applying an existing pattern, not inventing one).
- Worth a decision before finishing this phase: whether to also close the "logged-in-but-wrong-role" gap noted in Section 3 (existing tenant-only user clicking Buy Tenantcheck still gets silently bounced) while already in this code.

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
