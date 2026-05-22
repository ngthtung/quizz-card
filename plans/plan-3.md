# Phase 3 Plan

Builds on [plan-1.md](./plan-1.md) and [plan-2.md](./plan-2.md). Adds a Settings toggle to turn the Kanji (Chinese-character) audio on or off, so learners who are new to kanji can keep its sound, while readers who already know kanji can quietly hide it.

## Motivation

The app currently shows a 🔊 speaker on every text field, including the Japanese `mainText` (Kanji). For a learner who can already read kanji, the Kanji speaker is noise — they want to hear the reading from Hiragana / Romaji instead. For a beginner, hearing the kanji read aloud is the most useful audio in the app. One global switch lets each user choose.

## Goal

Add a single Settings toggle: **"Play Kanji (Chinese character) audio"**. When off, the 🔊 button is **hidden** for the Kanji field across the whole app. All other fields (Romaji, Hiragana, Katakana, Meaning, and any future language's `mainText`) are unaffected.

## Scope

### 1. Settings: new toggle

- Add a boolean preference `kanjiAudioEnabled` (default: `true`, so beginners get audio out of the box).
- Surface it on the Settings screen as a labeled switch:
  - Title: "Play Kanji (Chinese character) audio"
  - Helper text: "Turn off if you can already read kanji and don't want the 🔊 button on the Kanji field."
- Persist in IndexedDB alongside other app settings (or in `localStorage` if no settings table exists yet — pick whichever the existing Settings screen already uses).

### 2. Hide the speaker on the Kanji field when off

- The toggle only affects the **`mainText` field of cards whose Language is Japanese**. Other fields and other languages are never affected.
- "Hide" means the `<SpeakButton>` does not render at all (no greyed-out placeholder, no layout gap beyond what's natural without the button).
- Apply consistently in all places `SpeakButton` is rendered for `mainText`:
  - `src/screens/CardsScreen.tsx` (card list main text + edit/preview rows)
  - `src/screens/study/SwipeMode.tsx` (prompt and revealed answer when the field is `mainText`)
  - `src/screens/study/MultipleChoiceMode.tsx` (question and any choice rendered as `mainText`)

### 3. Wiring

- Add a small hook or context, e.g. `useSettings()`, that exposes `{ kanjiAudioEnabled, setKanjiAudioEnabled }`. Keep it minimal — one boolean for now.
- Either:
  - Read the flag inside `SpeakButton` and accept a new prop `fieldKey?: FieldKey` + `languageName?: string`, and short-circuit to `null` when `fieldKey === 'mainText'`, language is Japanese, and the flag is off; **or**
  - Keep `SpeakButton` dumb and have each call site decide whether to render it. The first option is fewer touch points and keeps the rule in one place — prefer it.
- Make sure the rule reacts live: toggling Settings should immediately hide/show the buttons on already-mounted screens (use a context or a subscription, not a one-time read).

## Data Model Changes

- Add `kanjiAudioEnabled: boolean` to whatever settings store the app already has. No schema migration needed beyond a default value of `true` for existing users.
- No changes to `Language` or `Flashcard`.

## Out of Scope

- Per-card overrides ("hide audio on this one card").
- Per-field toggles for Romaji / Hiragana / Katakana / Meaning.
- Language-level audio toggles (e.g. "mute all Chinese cards"). If we later add a real Chinese language, we can revisit — but Phase 3 is only about the Kanji field on Japanese cards.
- Changing the speech voice, rate, or `lang` mapping in `src/lib/speech.ts`.
- Auto-play behavior (the existing manual-tap model stays).

## Acceptance Criteria

- A new toggle "Play Kanji (Chinese character) audio" appears on the Settings screen, defaulting to **on**.
- With the toggle **on**, the app behaves exactly as it does today — the 🔊 button shows on the Kanji field everywhere.
- With the toggle **off**:
  - The 🔊 button is gone from the Kanji field in the Cards list.
  - The 🔊 button is gone from the Kanji field in Swipe study (both prompt side and reveal side).
  - The 🔊 button is gone from the Kanji field in Multiple Choice study (question and any answer rendered as `mainText`).
  - 🔊 buttons on Romaji, Hiragana, Katakana, and Meaning still work normally.
  - 🔊 buttons on cards from non-Japanese languages are unaffected.
- The setting persists across page refreshes.
- Toggling the setting updates open screens immediately, without requiring a refresh.

## Implementation Steps

1. Add the `kanjiAudioEnabled` setting + a `useSettings` hook/context with a default of `true` and persistence.
2. Render the toggle on `SettingsScreen.tsx` with the copy above.
3. Update `SpeakButton` (or its call sites) so it returns `null` when `fieldKey === 'mainText'`, the card's language is Japanese, and `kanjiAudioEnabled` is `false`. Pass `fieldKey` and `languageName` from the three screens listed in §2.
4. Manually verify the four scenarios in Acceptance Criteria on a phone-width and desktop viewport.
