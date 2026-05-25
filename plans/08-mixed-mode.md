# Phase 8 Plan — Mixed Mode (Hybrid Drill)

Builds on [01-mvp-flashcards.md](./01-mvp-flashcards.md) (study flow + weighted picker), [04-shadcn-ui-overhaul.md](./04-shadcn-ui-overhaul.md) (mode picker = `Tabs`), [05-write-mode.md](./05-write-mode.md), [06-scope-picker.md](./06-scope-picker.md), and [07-listen-mode.md](./07-listen-mode.md). Adds a **fifth study mode — "Mixed"** — that randomly switches between Swipe / MultipleChoice / Listen for every card, and **keeps re-queueing wrong cards until they are mastered**.

## Motivation

The four single-mode sessions each test one skill. Real fluency needs all of them on the same vocabulary: recognize on sight (MC), produce in writing (Write), hear and parse audio (Listen), and snap-judge meaning (Swipe). Forcing a card through multiple random angles is the cheapest way to surface "I only know this from one direction" — exactly the gap pure flashcard apps miss.

The re-queue rule fixes a separate problem: today, a card you fail just floats back into the weighted pool with slightly higher weight, but a session can end before you ever see it again. Mixed-mode makes the session itself the unit of mastery — you don't leave until everything in scope is "thuộc".

## Goals

1. New "Mixed" tab in the mode picker, alongside Swipe / Choice / Write / Listen.
2. Each card in the session is rendered using **one randomly-chosen sub-mode** (Swipe, MC, Write, Listen).
3. A card is **mastered** when:
   - It was answered correctly in **Swipe** (one right swipe is enough, per existing Swipe convention), OR
   - It was answered correctly **3 times in a row** in MC / Write / Listen.
4. Wrong answers reset the streak and re-queue the card. The session does not end until all cards in scope are mastered. **No cap on retries** — user can end the session manually with the existing "End session" button.
5. The mode rolled for the **next appearance** is random again — sai ở Listen có thể quay lại bằng Write/Swipe/MC.
6. Listen sub-mode is silently skipped (re-rolled) if `speechSupported` is false; the Mixed tab itself stays enabled so users without TTS can still mix the other three.

## Non-goals

- No SRS / spaced repetition across sessions. Mastery is *per session* only — the existing `rememberedCount` / `forgottenCount` stats are still updated by `recordReview`, but the session's mastery counter is in-memory.
- No new audio assets, no new UI primitives, no per-mode customization of the mix (e.g., "only MC + Write"). Mix is fixed at all-four (or all-three when TTS unavailable).
- No difficulty escalation (sai ở MC → Write). Pure random pick on each appearance.

## UX

### Mode picker

`StudyScreen.tsx` currently has `<TabsList className="grid w-full grid-cols-4">` with four triggers. Switch to `grid-cols-5` and add a fifth trigger:

```tsx
<TabsTrigger value="mixed">
  <Shuffle />
  Mixed
</TabsTrigger>
```

`Mode` union becomes `'swipe' | 'mc' | 'write' | 'listen' | 'mixed'`. Add `mixed: 'Mixed drill'` to `MODE_TITLES`. Helper text under the picker: `"Random mode each card. Wrong cards keep coming back until mastered."`

### Mixed session UI

A thin wrapper component `MixedMode` that, for each "turn":

1. Picks the next card from the **session queue** (see "Mastery loop" below).
2. Rolls a sub-mode (`'swipe' | 'mc' | 'write' | 'listen'`, filtered by `speechSupported`).
3. Renders **the existing single-mode component scoped to one card** — see "Single-card mode shims".
4. Receives the result (`remembered: boolean`) from the child and updates the session queue.

A small ribbon above the card shows:
- `[Mixed] Swipe` / `Multiple choice` / `Write` / `Listen` — the sub-mode currently rolled (so the user isn't surprised).
- Mastery progress: `12 / 30 mastered` + `<Progress />` bar.

## Mastery loop

### Session state (in-memory only, lives in `MixedMode`)

```ts
type MixedQueueEntry = {
  cardId: string;
  streak: number;          // consecutive correct in MC / Write / Listen
  mastered: boolean;
};

type MixedSessionState = {
  queue: MixedQueueEntry[];        // cards still to drill (mastered = false)
  mastered: number;                // count of mastered cards
  total: number;                   // initial pool size — fixed for progress bar
  current: { entry: MixedQueueEntry; subMode: SubMode } | null;
};
```

Initial `queue` = all in-scope cards (from `db.flashcards` filtered by `matchesScope`), each with `streak: 0`, `mastered: false`. `total` = `queue.length`.

### After each answer

```ts
function applyResult(state, result: { remembered: boolean; subMode: SubMode }) {
  const entry = state.current.entry;

  if (result.remembered) {
    if (result.subMode === 'swipe') {
      entry.mastered = true;            // swipe-right = mastered immediately
    } else {
      entry.streak += 1;
      if (entry.streak >= 3) entry.mastered = true;
    }
  } else {
    entry.streak = 0;                    // reset on any miss
  }

  if (entry.mastered) {
    state.mastered += 1;
    state.queue = state.queue.filter(e => e !== entry);
  } else {
    // move to back of queue so the user sees other cards first
    state.queue = [...state.queue.filter(e => e !== entry), entry];
  }
}
```

Then pick the next card by `pickWeighted(state.queue.map(e => allCardsById[e.cardId]))` — reusing the existing weighted picker so harder cards still trend earlier within the queue, but the queue rotation in the snippet above avoids showing the same card twice in a row.

### Session end

When `state.queue.length === 0`, render a "Session complete" panel:

- `🎉 All N cards mastered`
- `Total answers: X` (correct + wrong, useful to see how many retries it took)
- Buttons: `Restart` (rebuild queue from scope) / `End session` (back to setup).

### "End session early"

The existing top-bar "End session" button works as-is. No "are you sure?" prompt — pressing it discards the in-memory state and returns to setup. `recordReview` calls have already persisted to Dexie throughout, so per-card stats survive.

## Single-card mode shims

The existing `SwipeMode` / `MultipleChoiceMode` / `WriteMode` / `ListenMode` each:
- Maintain their own session loop (own progress counter, own next-card picker).
- Take `(languageId, scope)` and read cards from Dexie.

Mixed needs to render **one card at a time** and get the result back, not let the child run its own loop. Two options:

### **A. Refactor each mode to accept an optional `controlled` prop (recommended)**

Each mode gets:

```ts
type ControlledProps = {
  card: Flashcard;
  language: Language;
  onResult: (remembered: boolean) => void;
};

// component signature:
{ languageId, scope }: StandaloneProps | { controlled: ControlledProps }
```

When `controlled` is set, the component:
- Skips its `useLiveQuery(cards)` and progress UI.
- Renders just the card (and choices / input / audio for that card).
- Calls `onResult(remembered)` instead of looping to the next card.

Benefits:
- Each mode's interaction logic (swipe gestures, MC distractor generation, Write input parsing, Listen TTS) is reused **as-is**.
- No duplication.

Cost: each mode file gets a small branch at the top to extract `card` + `language` from controlled vs. self-fetched. ~15-20 lines per file.

### B. Extract a `<modeName>Card` sub-component from each mode and call it from Mixed

More modular but doubles the surface area: would need 4 new exports + 4 sets of prop wiring. Not worth it just for this feature.

**Decision: A.** Smaller diff, keeps the source of truth in one component per mode.

### Distractor pool for MC / Listen in Mixed

Both rely on `pickRandom` over **other cards in the same scope** for distractors. In controlled mode, we still need that pool. Pass it through:

```ts
type ControlledProps = {
  card: Flashcard;
  language: Language;
  pool: Flashcard[];     // for MC distractors etc.
  onResult: (remembered: boolean) => void;
};
```

Mixed already has the full scoped pool — it just hands it down.

## File-by-file changes

| File | Change |
|---|---|
| `src/screens/StudyScreen.tsx` | Add `'mixed'` to `Mode`, add 5th `<TabsTrigger>`, `grid-cols-5`, route `session.mode === 'mixed'` to `<MixedMode>`. |
| `src/screens/study/MixedMode.tsx` | **New.** Owns the queue, picks sub-mode + card, renders the right child in controlled mode, applies `applyResult`, handles "session complete". |
| `src/screens/study/SwipeMode.tsx` | Add `controlled` prop. When set: skip self-loop + progress, render single `SwipeCard`, call `onResult` from the existing `submit` path (both swipe-gesture and Forgot/Remember buttons). |
| `src/screens/study/MultipleChoiceMode.tsx` | Same shape: controlled mode renders one `Question` (built from passed `card` + `pool` for distractors), reports result via `onResult` instead of advancing internally. |
| `src/screens/study/WriteMode.tsx` | Controlled mode renders the input form for the passed card, calls `onResult(remembered)` on submit. |
| `src/screens/study/ListenMode.tsx` | Controlled mode renders the play-audio + 4-choice UI for the passed card with passed pool, reports result. |
| `src/lib/study.ts` | Add `pickSubMode(allowed: SubMode[])` helper if needed; otherwise keep logic inline in `MixedMode`. |
| `src/types/index.ts` (or wherever `Scope`/`FieldKey` live) | Add `SubMode = 'swipe' \| 'mc' \| 'write' \| 'listen'`. |

Tests / manual checks:
- Start Mixed with a 3-card scope, force one wrong answer in MC and one in Write — verify each comes back. Verify a wrong-then-right-3-times sequence eventually masters that card.
- Swipe a card right once → it should master immediately (no streak required).
- Swipe a card left → it goes back into queue with streak 0 (not -1, no underflow).
- Disable TTS in browser → Listen should never be rolled, but Mixed tab is still enabled.
- End session early mid-drill → returns to setup screen, no errors.
- Empty scope → Mixed shows "no cards" message (reuse existing pattern from other modes).

## Open questions / deferred

- **Persistent "needs review" flag.** The user explicitly chose "no retry cap", so a card can stay in the queue forever. We don't need a flag now, but if Phase 9+ adds SRS, the in-session miss count would be a useful seed for the initial ease factor.
- **Sub-mode weighting.** Currently uniform random. Could later bias toward modes the card has historically failed (e.g., always fails Write → roll Write more). Not in this phase.
- **Mid-session pause/resume.** State is in-memory only — refreshing the page restarts the session. Acceptable trade-off for v1.

## Implementation milestones

1. **M1 — Type plumbing.** Add `SubMode` type, add `controlled` prop *types* to all four mode components without using them yet. Verify TypeScript still compiles.
2. **M2 — Refactor SwipeMode for controlled rendering.** Smallest of the four. Validate the pattern on it before rolling out.
3. **M3 — Refactor MC + Write + Listen for controlled rendering.** Mostly mechanical after M2.
4. **M4 — `MixedMode` skeleton + queue logic + sub-mode picker.** No UI polish yet — text-only progress, default Tailwind.
5. **M5 — Wire into `StudyScreen` (5th tab, routing).**
6. **M6 — Polish.** Sub-mode ribbon, completion screen, progress bar, final manual test pass.
