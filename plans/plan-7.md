# Phase 7 Plan — Listening Mode

Builds on [plan-1.md](./plan-1.md) (study flow), [plan-3.md](./plan-3.md) (TTS pronunciation override), [plan-4.md](./plan-4.md) (shadcn UI), [plan-5.md](./plan-5.md) (Write mode), and [plan-6.md](./plan-6.md) (scope picker). Adds a fourth study mode — **Listen** — where the question is *only* audio of the word and the learner picks the meaning from four choices.

## Motivation

The existing modes (Swipe, Choice, Write) all show the Japanese script as the prompt — the learner sees `りんご` or `林檎` and has to recall the meaning. That trains **reading**, but it doesn't train **listening**, which is the weakest skill for most beginners and the one Anki-style apps usually neglect.

The TTS infrastructure is already in place (`src/lib/speech.ts`, `SpeakButton`, kana-fallback via `pronunciationFor` from [[plan-3.md]]). The only missing piece is a mode where audio is the prompt instead of an optional accessory. A new "Listen" mode wires that infrastructure into the study flow.

## Goal

When the user picks **Listen** mode and starts a session:

1. The audio of a card plays automatically (kana for Japanese, `mainText` otherwise).
2. The screen shows **four meaning choices** (A/B/C/D) — no script visible.
3. The user picks one. Feedback: green/red, plus the script + meaning is revealed after answering.
4. A **replay** button lets the user hear the audio again, before or after answering.
5. Pressing **Next** plays the next card's audio automatically.

## Scope

### 1. New mode: Listen

A fourth option in the Study screen's mode `Tabs`:

```
[Swipe] [Choice] [Write] [Listen]
```

Same data flow as the existing modes:

- `languageId` and `scope` props (from [[plan-6.md]]).
- Reads cards through `db.flashcards.where('languageId').equals(languageId).filter(matchesScope)`.
- Calls `recordReview(cardId, correct)` to update `rememberedCount` / `forgottenCount` like the others.

### 2. Question shape

```ts
type ListenQuestion = {
  card: Flashcard;
  spokenText: string;       // what TTS will say
  choices: string[];        // 4 meanings, shuffled
  choiceCards: Flashcard[]; // parallel array — for showing kanji on reveal if needed
  correctIndex: number;
};
```

#### Picking `spokenText`

Reuses the existing `pronunciationFor()` helper:

- **Japanese cards**: prefer `pronunciationFor(card, language)` (kana variant). If absent — i.e., no kanji in `mainText` — use `mainText` directly.
- **Other languages**: use `mainText`.

The same `cleanForSpeech()` cleanup that `SpeakButton` already runs is applied (strip `~`, strip bracketed readings).

#### Eligibility filter for the pool

A card qualifies for Listen mode if it has:

- A non-empty `mainText` (so we have audio source).
- A non-empty `meaning` (so the choice is meaningful).

Cards that fail this are skipped silently, like Write mode already does for empty fields.

If fewer than 4 eligible cards exist for distractors, fall back to whatever distractors are available (3, 2, or 1) — better than a hard error. If only 1 eligible card exists, show the `Need at least four cards with meanings.` empty state.

### 3. UI

New component: `src/screens/study/ListenMode.tsx`. Modeled directly on `MultipleChoiceMode.tsx` to keep the UX consistent.

Differences from `MultipleChoiceMode`:

- **No prompt card** with the script. Instead, a centered "audio button" that's larger and obviously interactive — a circular button with a `Volume2` icon (or `Headphones`), `size-16`, primary tint.
  - Caption underneath: `Tap to replay`.
  - Auto-plays once when the question mounts.
  - Pressing the button replays.
- **Choice list**: same A/B/C/D layout as `MultipleChoiceMode`, but each choice is a `meaning` string. No `Furigana` rendering on choices since meanings are not Japanese script.
- **After answering**: reveal panel below the choices showing:
  - The card's `mainText` (with `Furigana` if Japanese).
  - The card's `meaning` (already in the chosen choice but echo it for clarity).
  - A small `SpeakButton` next to `mainText` for explicit replay.
- **Next button**: same pattern as `MultipleChoiceMode`. Pressing Next triggers the next question and auto-plays its audio.

### 4. Auto-play behavior

- On question mount (`useEffect` watching `question.card.id`), call `speak(spokenText, language.name)`.
- On click of the replay button, call `speak()` again (cancels and replays — `speechSynthesis.cancel()` is already in `speech.ts`).
- **No auto-play before user gesture**: most browsers (especially mobile Safari) block speech synthesis until the user has interacted with the page. The user's click on **Start session** counts as that gesture, so the first auto-play after Start works. Subsequent auto-plays after `onNext` are also tied to a click. No special handling needed.
- If `speechSupported` is false, the mode shows a clear empty-state: `Listening mode needs browser TTS, which isn't available here.` and disables Start.

### 5. Wiring into StudyScreen

Edit `src/screens/StudyScreen.tsx`:

- `Mode` type gains `'listen'`.
- `MODE_TITLES` adds `listen: 'Listening'`.
- `Tabs` adds a fourth `TabsTrigger` with a `Headphones` icon.
- The mode-description line under the tabs adds:
  > `Hear the word, pick the meaning.`
- The session render block adds a fourth branch rendering `<ListenMode languageId={...} scope={...} />`.

If `speechSupported === false`, the **Listen** tab is rendered disabled with a tooltip explaining why.

### 6. Settings interaction

The existing `kanjiAudioEnabled` setting from [[plan-3.md]] is **ignored** in Listen mode — audio is the whole point of the mode, so even if a user has hidden the kanji-audio button on cards, they still get audio here. Document this in a one-line comment in `ListenMode.tsx`.

### 7. Empty / edge states

- **No cards with `mainText` + `meaning`**: `No cards with audio + meaning in this scope.`
- **TTS unavailable**: see §4.
- **Selected scope filtered to 0 cards**: `No cards in this language yet.` (matches the other modes).
- **Only 1 eligible card**: `Need at least two cards for Listen mode.` (we need at least one distractor).

### 8. Accessibility

- Replay button has `aria-label="Replay audio"`.
- Choice buttons have `aria-label` of the meaning text (default behavior of plain text in `<button>`).
- Reveal panel uses `role="status"` so screen readers announce the result.
- After-answer focus moves to the **Next** button (same pattern as Write mode's `nextRef`).

## Data Model Changes

None.

## Files Touched

New:

- `src/screens/study/ListenMode.tsx` — the mode component.

Edited:

- `src/screens/StudyScreen.tsx` — add the fourth `Mode`, `Tabs` trigger, render branch.
- `src/lib/study.ts` — add a `buildListenQuestion(cards, { isJapanese })` helper alongside the existing `buildWriteQuestion` to keep parity. Returns `ListenQuestion | null`.

Untouched:

- `src/lib/speech.ts` — already does what we need.
- `src/components/SpeakButton.tsx` — reused for the reveal panel.
- `src/lib/datasets.ts` — scope filter applies unchanged.

## Out of Scope

- **Audio recording / pronunciation grading.** That's a much larger feature (mic permission, audio compare). Phase 8+.
- **Listen-and-write** (hear the word, type the kanji/kana). Could be a future variation; v1 is multiple choice only because typing Japanese on mobile is friction-heavy and recognition first builds the ear.
- **Variable playback rate.** TTS already runs at `rate: 0.3` (slow) for learners. Adding a speed slider can come later.
- **Pre-loading next card's audio.** Browser TTS doesn't really support this; would only matter if we move to recorded audio files.
- **Recorded native-speaker audio** (vs. browser TTS). Out of scope; would require a separate asset pipeline. The TTS quality is good enough on macOS/iOS Japanese voices for v1.
- **Listen mode in Swipe form.** The swipe gesture doesn't map naturally to "did you understand the audio?". Skip.

## Acceptance Criteria

- The Study screen shows four mode tabs: Swipe, Choice, Write, **Listen**.
- Picking Listen + a language and clicking Start session opens the scope picker (per [[plan-6.md]]) and then the Listen mode session.
- On session start, the first card's audio plays automatically.
- The screen shows a circular replay button and four meaning choices — no Japanese script visible on the prompt.
- Tapping the replay button replays the audio.
- Picking a wrong answer marks the card forgotten (`recordReview(id, false)`); picking the right one marks it remembered.
- After picking, the reveal panel shows the card's `mainText` (with furigana if Japanese) plus the meaning.
- Tapping Next plays the next card's audio automatically and shows fresh choices.
- For Japanese cards with kanji `mainText`, the audio uses the kana variant (per `pronunciationFor`), not the kanji string.
- For Japanese cards without kanji (kana-only or romaji-only words), the audio plays the `mainText` directly.
- If browser TTS is unsupported, the Listen tab is disabled with a clear tooltip.
- If the scope has fewer than 2 eligible cards, an empty-state message is shown.
- `npm run build` passes with no TypeScript or ESLint errors.
- Visual consistency: the Listen mode shares the page header, progress bar, and choice button styling of `MultipleChoiceMode`.

## Implementation Milestones

### M1 — `buildListenQuestion` helper

1. Add `buildListenQuestion(cards, { isJapanese })` in `src/lib/study.ts`.
2. Filters cards to those with `mainText` and `meaning`.
3. Picks one weighted card; computes `spokenText` via the kana-preferred logic.
4. Picks 3 distractor cards with non-empty distinct meanings; shuffles into 4 choices.
5. Returns `null` if fewer than 1 eligible card or no distractors at all.

### M2 — `ListenMode` component

1. Build `src/screens/study/ListenMode.tsx`, copying the structural skeleton of `MultipleChoiceMode.tsx`.
2. Replace the prompt card with a centered audio button that auto-plays on mount and replays on click.
3. Wire choice clicks to `recordReview` + reveal panel.
4. Reveal panel: `mainText` with `Furigana`, meaning echo, `SpeakButton` for explicit replay.

### M3 — Wire into StudyScreen

1. Extend `Mode` type, `MODE_TITLES`, `Tabs`, mode-description line.
2. Add render branch for Listen in the active-session block.
3. Disable the Listen tab when `!speechSupported`.

### M4 — Manual QA

- Listen session with a Japanese scope (Bài 1) plays kana audio for kanji cards.
- Listen session with kana-only cards (e.g., kana basics) plays the `mainText` directly.
- Replay button replays the same audio.
- Picking wrong/right updates the card counts in `db.flashcards` (verify via Cards screen).
- Next auto-plays the next card.
- TTS-disabled environment (e.g., Safari without voices loaded yet): tab disabled, tooltip visible.
- Cancel mid-session → audio stops.

## Resolved Decisions

- **Question form**: multiple choice (4 meanings). Typing the meaning is a future variant.
- **Audio source**: browser TTS via the existing `speak()`. No recorded assets.
- **Auto-play**: yes, on question mount and on Next.
- **Japanese cards**: prefer kana variant for audio via `pronunciationFor`. Fall back to `mainText` if no kanji.
- **`kanjiAudioEnabled` setting**: ignored in Listen mode — audio is the mode's purpose.
- **Scope picker**: reused unchanged from [[plan-6.md]].
- **Empty-state thresholds**: need at least 2 eligible cards (1 prompt + 1 distractor); 4 distractors preferred but not required.
