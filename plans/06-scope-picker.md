# Phase 6 Plan — Session Scope Picker

Builds on [01-mvp-flashcards.md](./01-mvp-flashcards.md) (study flow), [02-audio-and-minna-decks.md](./02-audio-and-minna-decks.md) (Minna lessons + import), [04-shadcn-ui-overhaul.md](./04-shadcn-ui-overhaul.md) (shadcn UI), and [05-write-mode.md](./05-write-mode.md) (Write mode). Adds a **scope picker** so each study session can target one or more datasets — e.g., "study only Minna Bài 3", "study Bài 1 + Bài 3 together", or "drill the kana vowels".

## Motivation

Right now the Study screen lets the user pick a **language** but pulls every card in that language into the session. After importing several Minna lessons (Bài 1, Bài 2, Bài 3) plus the kana vowels, a Japanese session draws from 60+ cards across four unrelated datasets at once. Beginners trying to drill Bài 3 specifically can't — Bài 1 cards keep getting mixed in.

The data is already shaped to support this: every imported card is tagged with its lesson id (`minna-bai-1`, `minna-bai-2`, `minna-bai-3`, `kana`). A scope picker that filters by tag is enough to fix the use case.

## Goal

When the user clicks **Start session**, open a modal that lists every dataset (lesson) available in the chosen language, with a checkbox per item and a card-count badge. The user picks one or more, then confirms — the session opens with **only those cards** in the pool. If the user picks "Everything" (or doesn't pick anything), the current behavior is preserved as the default.

## Scope

### 1. Dataset model

A "dataset" in v1 is just a tag on a card. The available datasets per language come from:

- The bundled `data/minna-bai-*.md` lesson files — each contributes a `minna-bai-N` tag during import (already present, see [[02-audio-and-minna-decks.md]]).
- The `kana` tag added by the manual vowel import.
- Any future user-imported set: if a CSV row has a tag like `minna-bai-12`, it shows up automatically.

No new schema. The picker reads tags off the existing `Flashcard` rows.

#### Display rules

- Group tags into a fixed set of "kinds" with sensible labels:
  - `minna-bai-N` → "Minna Bài N" (sort by N ascending).
  - `kana`        → "Kana basics".
  - everything else → just show the raw tag, alphabetically.
- For each dataset, show a `Badge` with the **card count for the current language** (not global — a `kana` tag could exist in two languages someday).
- Hide datasets with zero cards in the chosen language.
- Always include a synthetic "**Everything in this language**" pseudo-option at the top.
- **First-visit default per language:** the most recently imported lesson (largest `minna-bai-N`) if present; otherwise the alphabetically-first dataset; otherwise "Everything".
- **Subsequent visits:** restore the last confirmed scope from localStorage. If any tag in the saved scope no longer exists, drop the missing tags silently. If the result is empty, fall back to the first-visit default for that language.

### 2. UI: scope modal

New component: `src/components/ScopePicker.tsx`. Used only by the Study screen.

Shape:

- shadcn `Dialog` on desktop, `Sheet` (bottom slide-up) on mobile — same pattern the LanguagesScreen already uses for the editor.
- Title: **Pick datasets**.
- Description: "Choose which lessons or sets to include in this session."
- Body:
  - Top row: "Everything in this language" — a single radio-style toggle that, when selected, deselects all individual datasets.
  - Below: a list of `Card`-rowed datasets, each with checkbox + label + count Badge.
  - Counter line at the bottom: **"X cards selected"** updates live.
- Footer:
  - `Cancel` (secondary).
  - `Start session` (primary). Disabled when 0 cards selected.

The selection state lives in the modal until confirmed; on confirm, the parent gets `{ tags: string[] | null }` (where `null` = "everything").

### 3. Wiring

Edit `src/screens/StudyScreen.tsx`:

- Replace the current `Start session` button's behavior. Today it sets the `Session` state directly. New behavior: open the `ScopePicker` modal.
- `Session` type gains an optional `tags?: string[]` field (or `null` for "all"):

  ```ts
  type Session = {
    mode: Mode;
    languageId: string;
    tags: string[] | null;
  };
  ```

- After the modal confirms, `setSession({ mode, languageId, tags })` and the modal closes.

Edit each study mode (`SwipeMode`, `MultipleChoiceMode`, `WriteMode`) to accept and use the new prop:

- New prop: `tags?: string[] | null`.
- The Dexie query that fetches the session pool changes from:

  ```ts
  db.flashcards.where('languageId').equals(languageId).toArray()
  ```

  to:

  ```ts
  db.flashcards
    .where('languageId').equals(languageId)
    .filter((c) => !tags || tags.length === 0
      ? true
      : c.tags.some((t) => tags.includes(t)))
    .toArray()
  ```

  This stays as a `.filter` on the Dexie collection (not a new compound index) — pool sizes are small (low hundreds), and the multi-tag intersection isn't worth a schema change. Re-evaluate if a single language ever holds 10k+ cards.

- The "X cards in pool" badge in each mode header should reflect the filtered count (it already does, since it reads from the same `cards` query).

### 4. State persistence

Remember the last picked scope **per language** in `localStorage` so the modal pre-populates. Key shape:

```
quizz-card.studyScope.<languageId> = JSON.stringify({ tags: string[] | null })
```

- Saved on confirm, loaded when the user picks a language.
- Cleared if the language is deleted (cheap to do via the existing `deleteLanguage` flow, or just stale entries — they're harmless).

### 5. Empty-state and edge cases

- **Language has 0 or 1 datasets**: still show the modal. Predictable flow every time. The "Everything" pseudo-option always exists, so the modal is never empty.
- **User selects datasets that intersect with 0 cards** (shouldn't happen given the count-driven UI, but defensively): show a toast `"No cards match. Pick at least one dataset."` and keep the modal open.
- **Selected datasets become empty mid-session** (user deletes a card): the live `useLiveQuery` updates the pool naturally; nothing extra needed.
- **Unknown tags from user CSV imports** — show under "Other" group with raw label.

### 6. Accessibility

- Each checkbox row is a labeled `<label>` wrapping `Checkbox` + text — the existing `BuiltInLessons` pattern in [[02-audio-and-minna-decks.md]] is the reference.
- Modal traps focus (shadcn `Dialog` does this automatically).
- "Start session" button gets `aria-disabled` and a `Tooltip` explaining "Pick at least one dataset" when nothing is selected.

## Data Model Changes

None. This phase is purely UI and query-shape changes.

## Files Touched

New:

- `src/components/ScopePicker.tsx` — the modal.
- `src/lib/datasets.ts` — small pure helpers: `groupTagsForLanguage`, `countCardsByTag`, `loadSavedScope`, `saveScope`. Keeps the modal logic-free.

Edited:

- `src/screens/StudyScreen.tsx` — open modal on Start, pass `tags` into modes.
- `src/screens/study/SwipeMode.tsx` — add `tags` prop, filter Dexie query.
- `src/screens/study/MultipleChoiceMode.tsx` — same.
- `src/screens/study/WriteMode.tsx` — same.

Untouched:

- `src/db/*` — no schema or migration.
- `src/lib/import.ts`, `src/lib/markdownLessons.ts` — already produce the right tags.

## Out of Scope

- **A new "Decks" or "Sections" first-class entity.** Tags carry the same information; a new entity adds CRUD UI without a clear win for v1. Re-evaluate once a user wants to author their own decks from scratch with hand-picked cards.
- **Saved "deck presets"** (e.g., "Bài 1 + Bài 3 combo"). The localStorage scope-per-language is enough; named presets are Phase 7+.
- **Cross-language sessions** ("Japanese + Vietnamese together"). The language picker stays a single-select.
- **Tag editing UI in the Cards screen.** Tags can already be edited via the Card form; a bulk tag editor is its own feature.
- **Reordering / favoriting datasets.** Default sort (Bài N ascending, then alphabetic) is enough.

## Acceptance Criteria

- On the Study screen, picking a mode + language and clicking **Start session** opens a `ScopePicker` modal (when the language has ≥2 distinct tags).
- The modal lists every tag in the chosen language with a label and a count badge. Minna lessons appear as "Minna Bài N", `kana` as "Kana basics", others as their raw tag.
- "Everything in this language" is selected by default and deselects on individual choice.
- Card-count line updates live as checkboxes flip.
- **Start session** button in the modal is disabled when 0 cards are selected.
- Confirming opens the chosen mode with **only** the cards in the selected datasets in the pool. The progress bar's "N cards in pool" reflects the filtered count.
- Cancel returns to the Study picker, no session started.
- Re-opening the picker for the same language pre-populates with the previous selection (read from localStorage).
- The modal always opens, regardless of how many datasets exist (1 or many).
- `npm run build` succeeds with no TypeScript or ESLint errors.
- Visual: modal looks consistent with the LanguagesScreen editor (spacing, button placement, header).

## Implementation Milestones

### M1 — Data helpers

1. Create `src/lib/datasets.ts`.
2. `groupTagsForLanguage(languageId, cards)` returns `{ id: string; label: string; count: number }[]` sorted as described in §1.
3. `loadSavedScope(languageId)` / `saveScope(languageId, tags)` — localStorage.
4. Pure functions, no React. Manual sanity check against the seeded data via `evaluate_script` in the browser console.

### M2 — `ScopePicker` modal

1. Build the modal with shadcn `Dialog` (desktop) + `Sheet` (mobile) — match the existing LanguagesScreen editor pattern.
2. Wire the "Everything in this language" toggle and the per-dataset checkboxes.
3. Live count line.
4. Footer buttons.

### M3 — Wire into StudyScreen + modes

1. `Session.tags` field.
2. `Start session` opens the modal (when there are ≥2 datasets); otherwise starts immediately.
3. Pass `tags` to all three mode components.
4. Each mode applies `.filter` on the Dexie query.

### M4 — Persistence

1. Load saved scope when the user changes the language picker.
2. Save on modal confirm.

### M5 — Manual QA

- Confirm a Bài-1-only session pulls only Bài 1 cards.
- Confirm Bài 1 + Bài 3 selected pulls from both.
- Confirm "Everything" still works as before.
- Refresh the page; saved scope is restored.
- A language with no tags (e.g., a freshly-created language with hand-typed cards and no tags at all) skips the modal.

## Resolved Decisions

- **First-visit default**: most recently imported lesson (largest `minna-bai-N`).
- **User-defined tags**: shown alongside lesson tags, grouped under "Other tags".
- **Modal always opens**: regardless of dataset count (1 or more).
- **Stale saved tags**: silently dropped on load; fall back to first-visit default if all are gone.
