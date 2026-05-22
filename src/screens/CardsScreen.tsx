import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { TextArea, TextField } from '../components/TextField';
import { db } from '../db/db';
import {
  createFlashcard,
  deleteFlashcard,
  updateFlashcard,
} from '../db/flashcards';
import { FIELD_KEYS, type Flashcard, type Language } from '../types';

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; card: Flashcard }
  | null;

export function CardsScreen() {
  const languages = useLiveQuery(
    () => db.languages.orderBy('name').toArray(),
    [],
  );
  const cards = useLiveQuery(
    () => db.flashcards.orderBy('createdAt').reverse().toArray(),
    [],
  );

  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards ?? []) for (const t of c.tags) set.add(t);
    return [...set].sort();
  }, [cards]);

  const filtered = useMemo(() => {
    return (cards ?? []).filter((c) => {
      if (languageFilter && c.languageId !== languageFilter) return false;
      if (tagFilter && !c.tags.includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.mainText, c.variant1, c.variant2, c.variant3, c.notes ?? '']
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, languageFilter, tagFilter, search]);

  const langById = useMemo(() => {
    const m: Record<string, Language> = {};
    for (const l of languages ?? []) m[l.id] = l;
    return m;
  }, [languages]);

  const noLanguages = !languages || languages.length === 0;

  return (
    <>
      <PageHeader
        title="Cards"
        actions={
          <Button
            onClick={() => setEditor({ mode: 'create' })}
            disabled={noLanguages}
          >
            + New card
          </Button>
        }
      />

      <div className="px-4 py-4 md:px-6">
        {noLanguages ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Create a language first to add cards.
          </div>
        ) : (
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All languages</option>
              {languages?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              disabled={allTags.length === 0}
            >
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        )}

        {!noLanguages && filtered.length === 0 ? (
          <p className="text-slate-600">No cards match.</p>
        ) : null}

        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const lang = langById[c.languageId];
            return (
              <li
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{c.mainText}</p>
                    <p className="text-xs text-slate-500">{lang?.name ?? '—'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      onClick={() => setEditor({ mode: 'edit', card: c })}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Delete this card?')) {
                          void deleteFlashcard(c.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <dl className="mt-3 space-y-1 text-sm">
                  {FIELD_KEYS.slice(1).map((k) => {
                    const value = c[k];
                    if (!value) return null;
                    return (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-slate-400">
                          {lang?.fieldLabels[k] ?? k}
                        </dt>
                        <dd className="text-right font-medium text-slate-700">
                          {value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                {c.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {c.notes ? (
                  <p className="mt-3 text-xs text-slate-500">{c.notes}</p>
                ) : null}

                <p className="mt-3 text-xs text-slate-400">
                  ✅ {c.rememberedCount} · ❌ {c.forgottenCount}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {editor && languages ? (
        <CardEditor
          state={editor}
          languages={languages}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}

function CardEditor({
  state,
  languages,
  onClose,
}: {
  state: NonNullable<EditorState>;
  languages: Language[];
  onClose: () => void;
}) {
  const isEdit = state.mode === 'edit';
  const initial = isEdit ? state.card : null;

  const [languageId, setLanguageId] = useState(
    initial?.languageId ?? languages[0]?.id ?? '',
  );
  const [mainText, setMainText] = useState(initial?.mainText ?? '');
  const [variant1, setVariant1] = useState(initial?.variant1 ?? '');
  const [variant2, setVariant2] = useState(initial?.variant2 ?? '');
  const [variant3, setVariant3] = useState(initial?.variant3 ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [tagsRaw, setTagsRaw] = useState(initial?.tags.join(', ') ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lang = languages.find((l) => l.id === languageId);

  async function onSave() {
    if (!mainText.trim()) {
      setErr('Main text is required');
      return;
    }
    if (!variant1 && !variant2 && !variant3) {
      setErr('At least one variant is required');
      return;
    }
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateFlashcard(initial.id, {
          languageId,
          mainText: mainText.trim(),
          variant1: variant1.trim(),
          variant2: variant2.trim(),
          variant3: variant3.trim(),
          notes: notes.trim() || undefined,
          tags,
        });
      } else {
        await createFlashcard({
          languageId,
          mainText,
          variant1,
          variant2,
          variant3,
          notes,
          tags,
        });
      }
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit card' : 'New card'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Language
          </span>
          <select
            value={languageId}
            onChange={(e) => setLanguageId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </label>

        <TextField
          label={lang?.fieldLabels.mainText ?? 'Main text'}
          value={mainText}
          onChange={(e) => setMainText(e.target.value)}
          autoFocus
        />
        <TextField
          label={lang?.fieldLabels.variant1 ?? 'Variant 1'}
          value={variant1}
          onChange={(e) => setVariant1(e.target.value)}
        />
        <TextField
          label={lang?.fieldLabels.variant2 ?? 'Variant 2'}
          value={variant2}
          onChange={(e) => setVariant2(e.target.value)}
        />
        <TextField
          label={lang?.fieldLabels.variant3 ?? 'Variant 3'}
          value={variant3}
          onChange={(e) => setVariant3(e.target.value)}
        />
        <TextField
          label="Tags (comma-separated)"
          value={tagsRaw}
          onChange={(e) => setTagsRaw(e.target.value)}
          placeholder="daily, greeting"
        />
        <TextArea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
      </div>
    </Modal>
  );
}
