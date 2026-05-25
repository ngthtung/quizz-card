# Quiz Card Project Plan

## Goal

Build a responsive React website for learning Japanese with flashcards. The app must work well on desktop and mobile browsers, store all data locally, and support two study modes:

- Swipe left/right: left means forgot, right means remembered.
- Multiple choice: choose A, B, C, or D.

No backend, login, or cloud sync is needed for the first version.

## MVP Scope

### Tech Stack

- React
- Vite
- TypeScript
- React Router for screen navigation
- IndexedDB via Dexie for local-first storage
- Tailwind CSS for styling
- `@use-gesture/react` + `framer-motion` for swipe interactions
- Mobile-first responsive layout

### Main Screens

1. Study
   - Choose study mode: Swipe or Multiple Choice.
   - Choose language.
   - Start a review session.

2. Cards
   - List all flashcards.
   - Create, edit, and delete cards.
   - Filter by language or tags.

3. Languages
   - Create, edit, and delete languages.
   - Example: Japanese, English, Vietnamese.

4. Import
   - Import cards from CSV or JSON.
   - Validate imported data before saving.
   - Show success and error messages.

5. Settings
   - Included in MVP.
   - Export all data as JSON.
   - Reset all data.
   - Field label settings per language.

## Data Model

### Language

```ts
type Language = {
  id: string;
  name: string;
  fieldLabels: {
    mainText: string;
    variant1: string;
    variant2: string;
    variant3: string;
  };
  createdAt: string;
  updatedAt: string;
};
```

### Flashcard

The app should stay flexible for future languages, so the fields should be generic but allow Japanese-specific labels in the UI.

```ts
type Flashcard = {
  id: string;
  languageId: string;
  mainText: string;
  variant1: string;
  variant2: string;
  variant3: string;
  notes?: string;
  tags: string[];
  rememberedCount: number;
  forgottenCount: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};
```

Field labels are stored per language on the `Language` record so each language can use its own terminology.

For Japanese, default labels:

- Main text: Kanji
- Variant 1: Romaji
- Variant 2: Hiragana
- Variant 3: Katakana

Example:

```text
mainText: 今日は
variant1: konnichiwa
variant2: こんにちわ
variant3: コンニチワ
```

## Study Behavior

### Card Selection

Cards should be selected with a simple weighted review system:

- Cards with higher `forgottenCount` appear more often.
- Cards with no `lastReviewedAt` should appear early.
- Cards recently remembered should appear less often.

MVP formula can be simple:

```ts
priority = 1 + forgottenCount * 2 - rememberedCount;
```

Always keep priority at least `1`.

### Swipe Mode

Flow:

1. Pick a card.
2. Randomly choose one visible prompt from `mainText`, `variant1`, `variant2`, or `variant3`.
3. Hide the other fields.
4. User taps to reveal the answer.
5. User swipes:
   - Right: remembered
   - Left: forgot
6. Also show buttons:
   - Remember
   - Forgot
7. Update stats and move to the next card.

Mobile support:

- Touch drag should move the card horizontally.
- Release past a threshold to submit.
- Desktop can use buttons and optional mouse drag.

### Multiple Choice Mode

Flow:

1. Pick a card.
2. Choose the question and answer fields using a constrained pairing (no random pairing across all fields):
   - **Japanese-script → meaning** — when the question is `mainText` (kanji), `variant2` (hiragana), or `variant3` (katakana), the answer **must** be `meaning`.
   - **meaning → Japanese-script** — when the question is `meaning`, the answer **must** be one of `mainText` / `variant2` / `variant3` (kanji / hiragana / katakana).
   - Romaji (`variant1`) is **not** used as the question or answer in Choice mode — it's a transliteration aid, not a recall target. (Romaji practice belongs in Write mode.)
   - Direction is chosen first (script→meaning vs. meaning→script). For meaning→script, pick whichever Japanese-script field on the card is non-empty; if more than one is filled, prefer `mainText` (kanji) when present, otherwise fall back to a kana variant.
   - This guarantees learners practice both **recognition** (Japanese → meaning) and **production** (meaning → Japanese), and avoids the kana ↔ kanji or kana ↔ romaji pairings that the old random-field approach produced.
3. Show four choices, all drawn from the same field as the answer:
   - One correct answer from the selected card.
   - Three wrong answers from other cards in the same language (same answer field).
4. Eligibility: a card needs `meaning` plus at least one of `mainText` / `variant2` / `variant3` to participate. If fewer than four eligible cards exist for distractors, use as many as are available; if zero distractors exist, show "Need at least two cards with meanings."
5. User chooses A, B, C, or D.
6. Show correct/incorrect state.
7. Update stats:
   - Correct: increment `rememberedCount`
   - Incorrect: increment `forgottenCount`
8. Move to the next question.

## Import Format

### CSV Columns

```csv
language,mainText,variant1,variant2,variant3,notes,tags
Japanese,今日は,konnichiwa,こんにちわ,コンニチワ,Greeting,"daily,greeting"
```

Rules:

- `language` is required.
- `mainText` is required.
- At least one variant field is required.
- `tags` can be comma-separated.
- If a language does not exist, create it during import.

### JSON Format

```json
[
  {
    "language": "Japanese",
    "mainText": "今日は",
    "variant1": "konnichiwa",
    "variant2": "こんにちわ",
    "variant3": "コンニチワ",
    "notes": "Greeting",
    "tags": ["daily", "greeting"]
  }
]
```

## UI Requirements

- First screen should be the app, not a landing page.
- Use a bottom navigation bar on mobile.
- Use a sidebar or top navigation on desktop.
- Study buttons should be large enough for phone use.
- Multiple choice answers should be easy to tap with one hand.
- Keep visual design clean and practical.
- Do not rely only on swipe gestures; always provide buttons too.

## Implementation Milestones

### Milestone 1: Project Setup

- Initialize React + Vite + TypeScript.
- Install and configure Tailwind CSS.
- Add React Router with the Cards screen as the default route.
- Create app shell with bottom navigation (mobile) / sidebar (desktop).
- Add base responsive styles.

### Milestone 2: Local Storage Layer

- Set up Dexie with a typed IndexedDB schema.
- Implement CRUD helpers for languages (including `fieldLabels`).
- Implement CRUD helpers for flashcards.
- Seed Japanese as an optional default language with Kanji/Romaji/Hiragana/Katakana labels.

### Milestone 3: Language Management

- Build language list screen.
- Add create/edit/delete language forms, including editable field labels.
- Block language deletion when cards still exist; show a clear message.

### Milestone 4: Card Management

- Build card list screen.
- Add create/edit/delete card forms.
- Support tags and notes.
- Add filters by language and tag.

### Milestone 5: Swipe Study Mode

- Build swipe card UI with `framer-motion` animations.
- Wire up drag/swipe gestures with `@use-gesture/react`.
- Add reveal answer behavior.
- Add Remember/Forgot buttons as a non-gesture fallback.
- Update review stats locally.

### Milestone 6: Multiple Choice Study Mode

- Generate A/B/C/D choices.
- Support random field-to-field questions.
- Show result feedback.
- Update review stats locally.

### Milestone 7: Import

- Add CSV import.
- Add JSON import.
- Validate rows before saving.
- Show import summary and row errors.

### Milestone 8: Settings & Polish

- Build Settings screen with export-as-JSON and reset-all-data.
- Add empty states across screens.
- Add confirmation dialogs for destructive actions.
- Test on mobile viewport.
- Improve keyboard accessibility for desktop.

## First Version Acceptance Criteria

- User can create a Japanese language.
- User can create cards with `mainText`, `variant1`, `variant2`, and `variant3`.
- User can review cards with swipe left/right.
- User can review cards with A/B/C/D multiple choice.
- User can import cards from CSV or JSON.
- Data persists after browser refresh.
- App layout works on phone and desktop.

## Resolved Decisions

- **Storage:** IndexedDB via Dexie.
- **Field labels:** generic internal field names (`mainText`, `variant1`–`variant3`) with per-language display labels stored on the `Language` record. Japanese defaults to Kanji / Romaji / Hiragana / Katakana.
- **Language deletion:** blocked while cards still exist.
- **Default screen:** Cards.
- **Routing:** React Router with URL-based routes.
- **Swipe:** `@use-gesture/react` for gestures, `framer-motion` for animations.
- **Settings:** included in MVP with export-as-JSON and reset-all-data.
