# Phase 5 Plan — Write Study Mode

Builds on [plan-1.md](./plan-1.md) (data model + study flow), [plan-2.md](./plan-2.md) (Minna sections + import), [plan-3.md](./plan-3.md) (Kanji audio toggle), and [plan-4.md](./plan-4.md) (shadcn UI primitives). Adds a third study mode where the learner **types the answer** instead of swiping or picking from choices — a much harder recall exercise that's especially useful for practicing hiragana / katakana production from a romaji or meaning prompt.

## Motivation

The two existing modes cover **recognition**:

- **Swipe** — reveal-and-self-grade. Honest, but trivial to game ("yeah I knew that").
- **Multiple Choice** — recognition with distractors. Better, but still cued by the visible options.

Neither tests **production**: can the user actually *produce* `こんにちは` when given `konnichiwa`? For kana drills (the user just added あいうえお / アイウエオ cards) this gap is the whole point. Write mode closes it: the prompt is shown, the input is empty, the user has to commit a guess before seeing the answer.

This is the natural complement to the audio playback added in [plan-3.md](./plan-3.md) — together, audio (input) and writing (output) cover both directions of recall for each character or vocabulary item.

## Goal

Add a new **Write** option to the Study screen's mode picker. Selecting it runs a session where each card's prompt is shown, the user types into an input, submits, and gets correct / incorrect feedback. Reuse the same weighted card selection ([[plan-1.md]]) and review-stat updates as Swipe and Multiple Choice — only the interaction layer differs.

## Scope

### 1. Mode plumbing

- Extend the `Mode` union in `src/screens/StudyScreen.tsx` from `'swipe' | 'mc'` to `'swipe' | 'mc' | 'write'`.
- Add a third `<ModeButton>` (or, after [[plan-4.md]] M5, a third tab in `Tabs`):
  - Label: **Write**
  - Hint: "Type the answer"
- The session header switches title to "Write study" when `mode === 'write'`.
- Routing inside `StudyScreen` mirrors the existing `SwipeMode` / `MultipleChoiceMode` branch — render `<WriteMode languageId={...} />`.

### 2. Question generation

New helper inside `src/lib/study.ts` (or a sibling `src/lib/studyWrite.ts` if the file gets too dense):

```ts
type WriteQuestion = {
  card: Flashcard;
  promptField: FieldKey;
  answerField: FieldKey;
};

function buildWriteQuestion(cards: Flashcard[]): WriteQuestion | null;
```

Rules:

- Must have ≥2 non-empty fields on the chosen card; otherwise pick another (re-run `pickWeighted`, capped at e.g. 10 retries before giving up and returning `null`).
- **Prompt-field bias** — fields the user is *more likely to know already*, so the question feels like a recall task rather than a guessing game:
  - First-choice prompts: `meaning`, `variant1` (romaji).
  - Second-choice: `mainText` (often kanji or the headword).
  - Last resort: any kana variant.
- **Answer-field bias** — for Japanese, prefer kana fields (`variant2` hiragana, `variant3` katakana) so the user actually practices writing kana. For other languages, prefer any non-prompt field.
- Bias is a **soft preference**, not a hard filter: if a card only has `mainText + variant1`, that pair is still valid — the learner will be asked to type romaji from kanji or vice versa. This keeps cards with sparse data usable.

The bias function is small; expose it as a pure helper so it's unit-testable.

### 3. Answer matching

This is the load-bearing piece. Write mode is only as good as its tolerance for valid variants.

New module: `src/lib/answerMatch.ts`.

```ts
export function isAnswerCorrect(
  userInput: string,
  expected: string,
  options?: { language?: string; field?: FieldKey },
): boolean;
```

Normalization rules (applied to **both** sides before comparison):

1. **Trim and collapse whitespace** — `'  konnichi   wa '` → `'konnichi wa'`.
2. **Unicode NFC normalize** (`'string'.normalize('NFC')`) — handles combined vs precomposed kana.
3. **Half-width → full-width katakana** — typed `ｱ` should match stored `ア`.
4. **Strip optional decorations** that appear in the dataset:
   - Wide tilde `〜` and ASCII `~` — used as placeholders (e.g., `～さん`); user shouldn't be required to type them.
   - Trailing bracketed alternates `［…］`, `（…）`, `(...)` — e.g., `だれ（どなた）` should accept either `だれ` *or* `どなた`. Implement by splitting on the brackets and adding both forms to the accepted set.
   - Leading dashes / em-dashes (`―`, `-`) used for counters — e.g., `―歳` should accept `歳`.
5. **Slash- and comma-separated alternates inside the field** — e.g., `MT / ヨーネン / アキックス` accepts any one. Same pattern as the brackets, just a different separator.
6. **Case-insensitive** for romaji and other Latin-script answers; case-sensitive for kana / kanji (case doesn't apply, so this is a no-op there but matters for non-Japanese languages).

Decision points to confirm before implementing — listed in **Open Questions**:

- Whether to do romaji ↔ kana auto-conversion. **Default: no.** If the user types `konnichiwa` when the answer is `こんにちは`, that's wrong — different field, different exercise. They should pick the right answer field via the bias system.
- Whether long vowels are interchangeable (`ローマ` vs `ロマ`, `おとうさん` vs `おとおさん`). **Default: strict.** Keep mismatches honest; users can correct themselves.

The function returns a single boolean; the caller doesn't need a "close enough" score for v1. (A diff/fuzzy-match score is a Phase 6+ idea — see Out of Scope.)

### 4. UI

New screen: `src/screens/study/WriteMode.tsx`. Layout mirrors `MultipleChoiceMode.tsx`.

Top section — **prompt card**:

- Card with `text-xs uppercase` label = `language.fieldLabels[promptField]`.
- Big `text-3xl` value = `card[promptField]`.
- 🔊 SpeakButton, hidden when prompt field is `meaning` (it's not in the target language) — same conditional already used in the other modes. Honors the kanji-audio toggle from [[plan-3.md]] when prompt is `mainText` of a Japanese card.
- Helper line: `Type the {language.fieldLabels[answerField]}.`

Middle section — **input**:

- Single-line `<input>` (or shadcn `Input` after [[plan-4.md]]).
- `autoFocus` when the question first renders **and** when the user clicks "Next question".
- `enterKeyHint="go"`, `autoCapitalize="off"`, `autoCorrect="off"`, `spellCheck={false}` — kana / romaji shouldn't be autocorrected.
- IME stays enabled (no `inputMode` override). On mobile, the OS surfaces the kana keyboard if the user has it installed; otherwise they get romaji input that the IME converts.
- Submit on Enter (`onKeyDown` for `Enter` while `!isComposing` — IMPORTANT: ignore Enter while `event.nativeEvent.isComposing` is `true`, otherwise IME conversion confirmation triggers a submit).

Bottom section — **actions**:

- Primary `Submit` button (full-width on mobile).
- `Skip / show answer` ghost button — counts as incorrect, advances after showing the answer. Useful when the user truly doesn't know.

After submit — **feedback panel**:

- Border-color flash: emerald for correct, red for incorrect.
- Show the expected answer in big text with a 🔊 SpeakButton (audio rules same as prompt).
- If incorrect, also show **what you typed** in muted text below, so the user can see the diff at a glance.
- "Next question" button (full-width on mobile), `autoFocus`-ed.
- Pressing Enter while feedback is shown advances to the next question.

### 5. Stats

Identical contract to Multiple Choice:

- Correct → `recordReview(card.id, true)`.
- Incorrect (including Skip) → `recordReview(card.id, false)`.

`recordReview` already updates `rememberedCount` / `forgottenCount` / `lastReviewedAt`, which feeds back into the weighted selector for the next card — same loop the other modes use, no new DB code.

### 6. Edge cases

- **Card has only one filled field** — `buildWriteQuestion` returns `null`; show the same "Need at least one card with two filled fields." empty-state copy `MultipleChoiceMode` uses today.
- **All cards in a language have only kana fields, no meaning, no mainText** — a valid pair still exists between the kana fields. Mode still works.
- **Empty input on Submit** — treat as Incorrect, do NOT auto-skip. Same UX: show feedback, advance with Next.
- **Whitespace-only input** — same as empty (the trim in normalization handles it).
- **Very long expected answer** (e.g., `どうぞよろしく［おねがいします］`) — input wraps naturally; feedback panel uses `break-words` so the comparison row doesn't overflow.

### 7. Settings interaction

- Honor [[plan-3.md]]'s `kanjiAudioEnabled` for any 🔊 rendered on the `mainText` field of a Japanese card.
- No new settings. The bias rules in §2 are intentional and shouldn't be user-tunable in v1 — keep config surface small.

## Data Model Changes

None. Write mode is purely an interaction layer over the existing `Flashcard` schema.

## Files Touched

New:

- `src/screens/study/WriteMode.tsx`
- `src/lib/answerMatch.ts`
- (Optional) `src/lib/studyWrite.ts` if the bias helper grows.
- `src/lib/__tests__/answerMatch.test.ts` if a test runner is set up; otherwise inline `// @ts-expect-error` style asserts in dev only. See Open Questions.

Edited:

- `src/screens/StudyScreen.tsx` — add `'write'` to the `Mode` union and a third mode picker.
- `src/lib/study.ts` — export `buildWriteQuestion` (or import from the new file).

Untouched:

- `src/db/*` — no schema or query changes.
- Other study modes — they keep working exactly as today.
- `src/lib/import.ts`, `src/lib/csv.ts` — unchanged.

## Out of Scope

- **Romaji ↔ kana conversion.** The point of Write mode is to test what was asked. If a card asks for hiragana, typing romaji is wrong.
- **Fuzzy / Levenshtein scoring.** No "you were 1 character off" feedback in v1. Binary correct / incorrect is enough; a future phase can layer in a hint or a colored diff.
- **Stroke order / handwriting input.** No canvas. The web platform's IME is sufficient for typing kana; handwriting is a separate, much larger project.
- **Speech-to-text input.** Out of scope; speaking ≠ writing.
- **Adaptive difficulty.** The weighted selector already biases toward forgotten cards — that's the only adaptation v1 needs.
- **A "type the romaji of what you hear" mode.** Interesting but distinct — Phase 6 idea.

## Acceptance Criteria

- Study screen has three mode buttons / tabs: Swipe, Multiple Choice, **Write**.
- Selecting Write + Japanese starts a session that shows a prompt and an input.
- Typing the expected answer and pressing Enter shows green "Correct" feedback; the card's `rememberedCount` increments (verifiable on the Cards screen after End session).
- Typing a wrong answer shows red feedback, displays the expected answer with a 🔊 button, and shows what the user typed; the card's `forgottenCount` increments.
- Pressing Enter on the feedback panel advances to the next question.
- The "Skip / show answer" button works and counts as incorrect.
- A card like `だれ（どなた）` accepts both `だれ` and `どなた` as correct.
- A card with `MT / ヨーネン / アキックス` accepts any of the three.
- An answer with leading/trailing whitespace is treated the same as the trimmed version.
- Half-width katakana input matches full-width katakana storage (e.g., `ｱ` matches `ア`).
- Empty submission is incorrect, not a no-op.
- Enter pressed during IME composition does NOT submit (verified in browser with the macOS Japanese IME or equivalent).
- 🔊 button on the prompt is hidden when the prompt field is `meaning`, and respects the [[plan-3.md]] kanji-audio toggle on `mainText` of Japanese cards.
- Switching from Write back to Swipe or MC mid-session via "End session" returns to the Study picker without errors.
- `npm run build` succeeds; no new ESLint or TypeScript errors.

## Implementation Milestones

### M1 — Answer matcher (TDD-friendly, no UI)

1. Create `src/lib/answerMatch.ts` with `isAnswerCorrect`.
2. Cover the cases in §3 with assertions — table-driven if a test runner exists, or as a tiny manually-run dev script in `src/lib/__dev__/answerMatch.demo.ts` otherwise.
3. Confirm bracket / slash splits, NFC, half-width katakana, trim, case-insensitive Latin.

### M2 — Question builder

1. Add `buildWriteQuestion` (and the bias rules) to `src/lib/study.ts`.
2. Run it against the seeded data in the browser via `evaluate_script` to confirm `meaning`/`variant1` prompts are biased over kana when both are present.

### M3 — `WriteMode` screen

1. Build the prompt card, input, and submit flow.
2. Wire up `recordReview` on submit and on Skip.
3. Wire up Enter key (with `isComposing` guard) and Next-question advancement.
4. Honor SpeakButton rules (no audio on `meaning`, kanji-audio toggle, kanji → kana fallback for the Japanese voice).

### M4 — Mode plumbing in `StudyScreen`

1. Add the third option to the mode picker (or `Tabs` after [[plan-4.md]] M5).
2. Render `<WriteMode />` when selected.
3. Update the session-header title.

### M5 — Manual QA pass

Run through the Acceptance Criteria in the browser:

- IME submit guard with the macOS Japanese IME (or the user's preferred IME).
- Bracket-alternate card (`だれ（どなた）`) — both forms accepted.
- Slash-alternate card.
- Whitespace, empty, half-width.
- Stats round-trip (Cards screen shows incremented counts).

## Open Questions

- **Test runner.** The repo doesn't currently have one. For `answerMatch` specifically, table-driven tests are the highest-value test we could add. Options: (a) add Vitest now, port the matcher first, defer broader test coverage; (b) skip and write a `src/lib/__dev__/answerMatch.demo.ts` that logs results in the browser console. **Recommendation:** (a) — Vitest is one config file and aligns with Vite.
- **Romaji-to-kana help on the input.** A small "show romaji helper" toggle (`konnichiwa` → live preview `こんにちは` next to the input) would be very useful for kana production. **Recommendation: defer to Phase 6.** Adds wanikaniesque tooling that's scope-creep here. Confirm.
- **Long-vowel leniency.** Allowing `おとおさん` ≈ `おとうさん` makes early learners' lives easier but masks genuine mistakes. **Recommendation: strict.** Confirm.
- **Skip behavior.** Should Skip count as Forgot or be neutral (not affect stats)? **Recommendation: count as Forgot** so the weighted selector resurfaces it.
- **Multi-line input.** Some cards (`どうぞよろしく［おねがいします］`) are long. Single line with horizontal scroll is fine, but a `<textarea>` would be friendlier. **Recommendation: single line** for v1; revisit if learners complain.
