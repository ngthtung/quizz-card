# Phase 4 Plan — UI/UX Overhaul with shadcn/ui

Builds on [plan-1.md](./plan-1.md), [plan-2.md](./plan-2.md), and [plan-3.md](./plan-3.md). The first three phases delivered features; this phase makes the app feel polished and consistent by replacing the hand-rolled primitives with **shadcn/ui** components and tightening visual hierarchy, spacing, and interaction feedback.

## Motivation

The current UI works but is built from a small set of bespoke components (`Button`, `Modal`, `TextField`, `PageHeader`, `Layout`) with ad-hoc Tailwind classes per screen. As the feature surface has grown (sections, audio, settings, multiple study modes), the visual language has drifted: inconsistent spacing, emoji-based icons, browser-default `<select>` and `<input type="file">`, no toast feedback, and limited accessibility (focus rings, ARIA, dialog focus traps).

Adopting shadcn/ui gives us a vetted, accessible component layer (Radix primitives under the hood) without becoming a third-party component dependency — the components live in our repo and are styled with Tailwind, so we can keep the existing look-and-feel and evolve it.

## Why shadcn/ui (and not a heavier UI lib)

- **Tailwind v4 compatible** — shadcn ships a Tailwind v4 / React 19 path (the project already uses both).
- **Source-in-repo, not a runtime dep** — components are copied into `src/components/ui/`, so we keep full control and don't ship an entire library.
- **Radix-backed accessibility** — focus management, keyboard navigation, ARIA roles handled correctly (matters for the Modal → Dialog migration).
- **Small footprint** — only the components we use get added.
- **Existing primitives map 1:1** — `Button` → `Button`, `Modal` → `Dialog`, `TextField` → `Input` + `Label`, etc. Migration is mechanical.

Companion libraries:

- **lucide-react** — icon set (replaces the emoji icons in the navigation and buttons).
- **sonner** — toast notifications (for import results, delete confirmations, settings saved, etc.).
- **class-variance-authority** + **clsx** + **tailwind-merge** — installed transitively by shadcn; used for variant-driven components.

## Goal

Migrate every screen and shared component to shadcn/ui with no behavior regressions, then layer in a small set of UX upgrades that the new primitives unlock (toasts, command palette, better empty states, consistent icons). Visual identity stays in the same neutral slate palette but becomes more cohesive via design tokens (CSS variables) instead of inline color classes.

## Scope

### 1. Setup

- Install shadcn/ui via its Tailwind v4 / React 19 CLI path:
  - `npx shadcn@latest init` (choose Tailwind v4, neutral slate base, CSS-variables theme, `src/components/ui` as the components dir, `@/` alias).
  - Update `tsconfig.app.json` and `vite.config.ts` to register the `@/*` path alias if not already present.
- Install runtime deps: `lucide-react`, `sonner`.
- Add the global theme tokens shadcn generates (CSS variables for `--background`, `--foreground`, `--primary`, `--muted`, `--ring`, `--radius`, etc.) into `src/index.css`. Keep light theme only for now; dark mode is out of scope (see §"Out of Scope").
- Decide and document the design tokens we standardize on (radius `0.75rem`, base font, container max-widths) in `src/index.css` comments so the choice is durable.

### 2. Component migration map

Replace each existing primitive with the equivalent shadcn component. Old files are deleted once all call sites are switched.

| Existing                        | shadcn replacement                              | Notes                                                       |
| ------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `components/Button.tsx`         | `ui/button.tsx`                                 | Variants: `default`, `secondary`, `destructive`, `ghost`, `outline`. Add `size="icon"` for square icon buttons (used by `SpeakButton`). |
| `components/Modal.tsx`          | `ui/dialog.tsx` + `ui/sheet.tsx`                | Use `Sheet` (bottom slide-up) on mobile for forms; `Dialog` (centered) on desktop. Pick by viewport at the call site, not inside the component. |
| `components/TextField.tsx`      | `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx`, `ui/form.tsx` | Replace bespoke label-wrap pattern with `Form` + `FormField` from shadcn (uses `react-hook-form` + `zod`). See §3 for whether we adopt `react-hook-form`. |
| `components/PageHeader.tsx`     | Keep, restyled                                   | Small custom component; restyle with `Separator` and `Button` only — no need for a shadcn equivalent. |
| `components/SpeakButton.tsx`    | Restyled with `Button size="icon"` + `Volume2` icon | Behavior unchanged; visuals only. Respects [[plan-3.md]] kanji-toggle. |
| `components/Layout.tsx` (sidebar + bottom nav) | `ui/sidebar.tsx` (desktop) + custom mobile bar   | shadcn ships a full sidebar primitive — use it on desktop. Mobile bottom-nav stays custom (shadcn doesn't ship one) but uses shadcn `Button` + lucide icons. |

New shadcn components to add (not replacing anything, but used across screens):

- `ui/card.tsx` — wrap each flashcard, language row, and section row.
- `ui/select.tsx` — language picker on Study screen, language picker on Card form, section dropdown.
- `ui/badge.tsx` — tags on cards, "Bài N" section labels, language pills.
- `ui/dropdown-menu.tsx` — row-level "..." menu on each card (Edit / Delete / Move to section).
- `ui/alert-dialog.tsx` — destructive confirmations (delete card, delete section, reset all data).
- `ui/tabs.tsx` — Study screen mode picker (Swipe / Multiple Choice).
- `ui/switch.tsx` — Settings toggles (kanji audio, auto-play audio).
- `ui/tooltip.tsx` — disabled-button reasons (e.g. "Add at least 4 cards in this language").
- `ui/skeleton.tsx` — loading states for the Cards screen on first paint.
- `ui/sonner.tsx` (Toaster) — mounted once in `App.tsx`.

### 3. Forms

shadcn's `Form` is built on `react-hook-form` + `zod`. The current forms are uncontrolled-style with manual error tracking. Two paths:

- **A. Adopt `react-hook-form` + `zod` (recommended)** — shared validation schemas for card create/edit and language create/edit, reusable for the import validator (CSV/JSON in [[plan-2.md]]). Better long-term, matches shadcn idioms.
- **B. Use `Input`/`Textarea`/`Label` only, keep current local state** — smaller diff, but we lose the integrated error rendering.

Pick **A** unless time-boxed. If we go A, the import validator in `src/lib/import.ts` should consume the same zod schema so "at least one variant filled" stays defined in one place.

### 4. Layout & navigation

- **Desktop:** swap the hand-rolled sidebar in `Layout.tsx` for shadcn's `Sidebar` with collapsed/expanded state persisted in `localStorage`. Header gets a small breadcrumb (`ui/breadcrumb.tsx`) showing e.g. `Cards / Edit "今日は"` during edit flows.
- **Mobile:** keep the bottom nav (shadcn doesn't ship one), but replace emoji with `lucide-react` icons (`Layers`, `Target`, `Globe`, `Download`, `Settings`). Add a subtle active-state pill background. Increase tap targets to 44×44px minimum.
- **Container widths:** standardize page content to `max-w-5xl` with consistent `px-4 md:px-6 py-6` padding via a `<PageShell>` wrapper.

### 5. Screen-by-screen polish

#### Cards screen (`src/screens/CardsScreen.tsx`)

- Each card becomes a shadcn `Card` with `CardHeader` (mainText + language `Badge`), `CardContent` (variants in a 2-col grid), `CardFooter` (tags + audio button + "..." menu).
- Filter bar at the top: language `Select`, section `Select`, tag `Combobox` (using `ui/command.tsx` inside a `Popover`), search `Input`.
- Empty state: centered illustration (`Inbox` icon), heading, helper text, primary `Button` "Add your first card" — instead of the current bare list.
- Loading state: 6 `Skeleton` cards while Dexie hydrates.
- Row "..." menu (`DropdownMenu`): Edit, Move to section, Delete (red).
- Delete confirmation uses `AlertDialog`, not a generic Modal.

#### Languages screen (`src/screens/LanguagesScreen.tsx`)

- Each language is a `Card` with name, default-field-labels preview, card count `Badge`, and an inline "Edit field labels" button that opens a `Sheet` (mobile) / `Dialog` (desktop).
- Delete blocked-by-cards message uses `Tooltip` over the disabled delete button.

#### Sections (under Languages or as a sub-section of Cards)

- List of `Card` rows per section with card count and primary "Study this section" `Button`.
- Markdown ingest buttons (`data/minna-bai-N.md` from [[plan-2.md]]) become a `Card` grid on the Import screen with a `Button` per file and a `Badge` showing how many cards it would create.

#### Study screen (`src/screens/StudyScreen.tsx`)

- Replace the mode picker with `Tabs` (Swipe / Multiple Choice).
- Language and section pickers as `Select`. Show a live preview "X cards available" via `Badge`.
- Big primary `Button` "Start session" full-width on mobile.

#### Swipe mode (`src/screens/study/SwipeMode.tsx`)

- Card uses `Card` styling but keeps the framer-motion drag layer.
- "Forgot" / "Remember" become `Button variant="outline"` (red) and `Button` (primary green) full-width on mobile, with `XCircle` and `CheckCircle2` lucide icons.
- Reveal-answer transition stays the same (framer-motion crossfade), no shadcn dependency.
- Progress bar (`ui/progress.tsx`) at the top showing N of M for the session.

#### Multiple choice (`src/screens/study/MultipleChoiceMode.tsx`)

- Choices A–D become full-width `Button variant="outline"` on mobile, 2×2 grid on desktop.
- Correct answer flashes `bg-green-100 ring-green-500`; incorrect flashes `bg-red-100 ring-red-500` for ~600ms before advancing.
- Progress bar same as Swipe.

#### Import screen (`src/screens/ImportScreen.tsx`)

- File drop zone styled with `Card` + dashed border, drag-over state with shadcn's `--ring` color.
- Per-row validation errors shown in a `Table` (`ui/table.tsx`) with a `Badge variant="destructive"` per failing row.
- Success summary fires a `sonner` toast: "Imported 124 cards across 3 languages. 2 rows skipped — see details." with a "View details" action.

#### Settings screen (`src/screens/SettingsScreen.tsx`)

- Group settings into `Card` sections: "Audio", "Data", "Appearance" (placeholder for future).
- Each toggle uses `Switch` + `Label` + helper text. Reuses [[plan-3.md]]'s `kanjiAudioEnabled`.
- "Reset all data" uses `AlertDialog` with a typed confirmation ("type DELETE to confirm").
- Export-as-JSON triggers a sonner toast on success/failure.

### 6. Icons

Replace every emoji used as a UI icon with `lucide-react`:

- Navigation: `Layers` (Cards), `Target` (Study), `Globe` (Languages), `Download` (Import), `Settings` (Settings).
- `SpeakButton`: `Volume2`.
- Card actions: `MoreVertical` (menu trigger), `Pencil` (edit), `Trash2` (delete), `ArrowRightLeft` (move section).
- Study controls: `XCircle`, `CheckCircle2`, `RotateCcw` (reveal again), `SkipForward`.
- Empty states: `Inbox`, `BookOpen`, `Languages`, `FileDown`.

Emoji is fine inside card content (it's user data); UI chrome should be lucide.

### 7. Accessibility

- Every dialog and sheet inherits Radix focus-trap and `Esc` close (replaces the manual handler in `Modal.tsx`).
- All form fields get visible `Label` and `aria-describedby` linkage for errors via `FormDescription` / `FormMessage`.
- Tap targets ≥ 44px on mobile (Tailwind `min-h-11`).
- Visible focus rings on all interactive elements via `--ring` token. Don't override `:focus-visible` away.
- Color-contrast pass on the slate palette in light mode (target WCAG AA).

### 8. Performance

- Tree-shake lucide imports (use named imports, never `import * as Icons`).
- shadcn components are pure source — no runtime cost beyond their actual JSX.
- Skeleton loaders replace blank flashes on Dexie-backed screens (the `dexie-react-hooks` `undefined` → `data` flip).

## Data Model Changes

None. This phase is purely UI.

## Out of Scope

- **Dark mode.** shadcn supports it via a `class="dark"` toggle, but introducing it now doubles the visual QA. Stub the CSS variables but leave the toggle out — easy to add in a Phase 5.
- **Animations beyond the existing framer-motion swipe.** No page transitions, no hero animations.
- **Replacing framer-motion or @use-gesture.** Both stay; shadcn doesn't conflict with them.
- **Custom theming UI.** No "pick your accent color" screen.
- **Internationalization of the UI strings.** Strings stay English (the project owner is Vietnamese — see [[user_profile]] — but app chrome staying English is fine for now; this can be a separate phase if needed).
- **Storybook / visual regression tests.** Not yet justified by the size of the component set.

## Acceptance Criteria

- `npm run build` succeeds with shadcn components installed and the `@/` alias resolved.
- Every screen renders using shadcn primitives — no remaining imports from the old `components/Button.tsx`, `components/Modal.tsx`, or `components/TextField.tsx` (those files are deleted).
- Every emoji used as a UI icon (in navigation and buttons, not card content) is replaced with a `lucide-react` icon.
- Sidebar collapses/expands on desktop, state persisted across reloads.
- Bottom nav on mobile has 44×44 tap targets and active-state styling.
- Card list shows skeleton loaders while Dexie hydrates, then a real empty state if there are no cards.
- Card delete and section delete use `AlertDialog`. "Reset all data" requires typing `DELETE`.
- Import screen shows row-level validation in a `Table` and fires a `sonner` toast on completion.
- Study screen uses `Tabs` for mode selection and `Select` for language/section, with a live "X cards available" badge.
- Swipe and Multiple Choice show a `Progress` bar for the current session.
- All forms (card create/edit, language create/edit, section create/edit) use `react-hook-form` + `zod` if §3-A is adopted; otherwise they use shadcn `Input`/`Textarea`/`Label` with the existing local state.
- Lighthouse a11y score ≥ 95 on Cards, Study, and Settings screens at mobile and desktop viewports.
- Visual smoke test on iPhone-width (390×844) and desktop (1440×900): no layout overflow, all primary actions reachable with one thumb on mobile.

## Implementation Milestones

### M1 — Foundation (no UI changes visible yet)

1. Install shadcn, lucide-react, sonner; run `init`.
2. Configure `@/` alias in `tsconfig.app.json` and `vite.config.ts`.
3. Add CSS variables and base tokens to `src/index.css`.
4. Mount `<Toaster />` in `App.tsx`.
5. Verify `npm run build` and `npm run dev` still work.

### M2 — Primitive swap

1. Add shadcn `Button`, `Input`, `Textarea`, `Label`, `Dialog`, `Sheet`, `AlertDialog`, `Card`, `Select`, `Badge`, `DropdownMenu`, `Switch`, `Tabs`, `Progress`, `Tooltip`, `Separator`, `Skeleton`, `Sonner`.
2. Search-and-replace imports of the old primitives across `src/screens/**` and `src/components/**`.
3. Delete `components/Button.tsx`, `components/Modal.tsx`, `components/TextField.tsx`.
4. Visual diff on every screen — fix per-screen spacing/styling drift.

### M3 — Layout

1. Replace `components/Layout.tsx` desktop sidebar with shadcn `Sidebar`.
2. Replace emoji nav icons with lucide.
3. Polish mobile bottom nav (tap targets, active state).
4. Add `PageShell` wrapper and apply across screens.

### M4 — Forms (decision §3)

1. If §3-A: install `react-hook-form` + `zod`, add `ui/form.tsx`, port card form, language form, section form. Share the card schema with `src/lib/import.ts`.
2. If §3-B: just use `Input`/`Textarea`/`Label` with the current local state.

### M5 — Screen polish

1. Cards: filter bar, dropdown menu, empty/loading states.
2. Study: tabs, selects, progress bar, available-count badge.
3. Swipe + Multiple Choice: new button styling, progress bar, correct/incorrect flash.
4. Import: drop zone, error table, completion toast.
5. Settings: grouped cards, switches, AlertDialog for reset.

### M6 — Polish & QA

1. lucide icons everywhere in chrome.
2. Tooltip pass on disabled buttons.
3. Lighthouse a11y pass.
4. Mobile + desktop smoke test on the routes listed in Acceptance Criteria.

## Open Questions

- **Forms §3:** A or B? Recommendation is A (adopt `react-hook-form` + `zod`) because the import validator can share the same schema. Confirm before M4.
- **Sidebar default state on desktop:** expanded or collapsed on first visit? Recommendation: expanded.
- **Toast position:** top-right (desktop default) or bottom-center (mobile-friendly default)? Recommendation: bottom-center on mobile, top-right on desktop via `sonner`'s responsive position.
