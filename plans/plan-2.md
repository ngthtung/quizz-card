# Phase 2 Plan

Builds on [plan-1.md](./plan-1.md). Tightens the card workflow, adds audio, and introduces sections (decks) so users can drill one Minna no Nihongo lesson at a time.

## Goals

1. Allow users to delete a card.
2. Loosen the "all fields required" rule on card create/edit so a card can be saved with only one filled field.
3. Add per-card audio (file upload or URL) with playback in the card list and study modes.
4. Group cards into **sections** (e.g. "Minna Bài 1", "Minna Bài 2") and let study sessions be scoped to a section.

## Scope

### 1. Delete card

- Add a delete action on the Cards list (row-level) and on the card edit form.
- Confirm with a dialog before deleting.
- Remove the card from IndexedDB and refresh the list.
- If the card was part of an active study session, drop it from the queue gracefully.

### 2. Relaxed required fields on card create/edit

- Today the form effectively expects all four text fields. Change the rule to: **at least one of `mainText`, `variant1`, `variant2`, `variant3` must be filled**; the rest are optional.
- `languageId` is still required.
- Update form validation, error messages, and the import validator (CSV/JSON) to use the same "at least one field" rule.
- Study modes must handle cards that only have a subset of fields:
  - **Swipe:** pick a prompt only from non-empty fields. If only one field exists, show it as the prompt and the answer area says "no other fields yet".
  - **Multiple choice:** skip cards that don't have at least two non-empty fields (one for question, one for answer); surface a message if the language has too few eligible cards.

### 3. Audio support per card

- Extend `Flashcard` with an optional audio attachment:

  ```ts
  audio?: {
    mime: string;       // e.g. "audio/mpeg", "audio/wav"
    blob: Blob;         // stored directly in IndexedDB
    sourceUrl?: string; // optional: original URL if imported from web
  };
  ```

- **Card form:** allow uploading an audio file (`.mp3`, `.wav`, `.m4a`, `.ogg`) or pasting a URL to fetch and store as a blob (so playback works offline).
- **Card list:** small play button per card.
- **Study modes:** play button on the card; in Swipe mode, optionally auto-play when the answer is revealed (toggle in Settings).
- **Import:** support an optional `audioUrl` column in CSV / field in JSON. During import, fetch the URL and store the blob; if the fetch fails, save the card without audio and report the row in the import summary.
- **Settings:** add a toggle "Auto-play audio on reveal" (default off).

### 4. Sections (decks)

- A **Section** is a named group of cards inside a language (e.g. "Bài 1", "Bài 2"). One card belongs to zero or one section.
- New screen / area: section list under each language. Create / rename / delete sections.
  - Deleting a section asks: keep the cards (just unassign) or delete the cards too.
- Card form: section dropdown (optional, scoped to the selected language).
- Cards screen: filter by section (in addition to language and tags).
- Study screen: after picking a language, optionally pick a section to scope the session. "All sections" is the default.
- Import: support an optional `section` column / field. If the section doesn't exist for that language, create it.
- Markdown ingest: `data/minna-bai-N.md` files become a built-in import that creates section "Bài N" under the Japanese language and loads its rows. (Initial trigger is a button on the Import screen — no automatic loading on app start.)

```ts
type Section = {
  id: string;
  languageId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
```

## Data Model Changes

- `Flashcard.audio?: { mime: string; blob: Blob; sourceUrl?: string }`
- `Flashcard.sectionId?: string`
- New `sections` table in Dexie, indexed by `languageId`.
- Dexie schema bump: new version covers `audio`, `sectionId`, and `sections` table. Existing cards stay valid (both fields optional).
- Export-as-JSON should base64-encode `audio.blob` and include sections so the export stays a single file. Import should decode it back to a Blob and recreate sections.

## Acceptance Criteria

- A card can be deleted from the list and from the edit screen, with a confirmation prompt.
- A card can be saved with only one of the four text fields filled.
- Study modes do not crash on cards with missing fields and skip cards that can't form a valid question.
- A user can attach an audio file to a card and play it back from the Cards list and during study.
- A user can import a CSV/JSON that references audio URLs and the audio is stored locally for offline playback.
- A user can create sections under a language, assign cards to a section, filter the card list by section, and start a study session scoped to one section.
- A user can load a `data/minna-bai-N.md` file from the Import screen and end up with a "Bài N" section populated with cards (audio links preserved).
- Existing cards (created before Phase 2) continue to load without migration errors.

## Out of Scope

- Recording audio in-browser (file upload / URL only).
- Per-field audio (one clip per card is enough for now).
- Cloud sync of audio blobs.
