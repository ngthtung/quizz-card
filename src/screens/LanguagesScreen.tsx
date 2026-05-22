import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { TextField } from '../components/TextField';
import { db } from '../db/db';
import {
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from '../db/languages';
import {
  DEFAULT_GENERIC_LABELS,
  FIELD_KEYS,
  type FieldLabels,
  type Language,
} from '../types';

type EditorState =
  | { mode: 'create' }
  | { mode: 'edit'; language: Language }
  | null;

export function LanguagesScreen() {
  const languages = useLiveQuery(
    () => db.languages.orderBy('name').toArray(),
    [],
  );
  const cardCounts = useLiveQuery(async () => {
    const all = await db.flashcards.toArray();
    const map: Record<string, number> = {};
    for (const c of all) map[c.languageId] = (map[c.languageId] ?? 0) + 1;
    return map;
  }, []);

  const [editor, setEditor] = useState<EditorState>(null);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(lang: Language) {
    if (!confirm(`Delete language "${lang.name}"?`)) return;
    try {
      await deleteLanguage(lang.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  return (
    <>
      <PageHeader
        title="Languages"
        actions={
          <Button onClick={() => setEditor({ mode: 'create' })}>
            + New language
          </Button>
        }
      />

      <div className="px-4 py-6 md:px-6">
        {error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {languages && languages.length === 0 ? (
          <p className="text-slate-600">
            No languages yet. Create one to start adding cards.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {languages?.map((lang) => {
              const count = cardCounts?.[lang.id] ?? 0;
              return (
                <li
                  key={lang.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{lang.name}</h3>
                      <p className="text-xs text-slate-500">
                        {count} card{count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="secondary"
                        onClick={() => setEditor({ mode: 'edit', language: lang })}
                      >
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => onDelete(lang)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-600">
                    {FIELD_KEYS.map((k) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-slate-400">{k}</dt>
                        <dd className="font-medium text-slate-700">
                          {lang.fieldLabels[k]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editor ? (
        <LanguageEditor
          state={editor}
          onClose={() => setEditor(null)}
        />
      ) : null}
    </>
  );
}

function LanguageEditor({
  state,
  onClose,
}: {
  state: NonNullable<EditorState>;
  onClose: () => void;
}) {
  const isEdit = state.mode === 'edit';
  const initial = isEdit ? state.language : null;

  const [name, setName] = useState(initial?.name ?? '');
  const [labels, setLabels] = useState<FieldLabels>(
    initial?.fieldLabels ?? DEFAULT_GENERIC_LABELS,
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSave() {
    if (!name.trim()) {
      setErr('Name is required');
      return;
    }
    setBusy(true);
    try {
      if (isEdit && initial) {
        await updateLanguage(initial.id, {
          name: name.trim(),
          fieldLabels: labels,
        });
      } else {
        await createLanguage({ name, fieldLabels: labels });
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
      title={isEdit ? 'Edit language' : 'New language'}
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
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Japanese"
          error={err ?? undefined}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Field labels
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {FIELD_KEYS.map((k) => (
              <TextField
                key={k}
                label={k}
                value={labels[k]}
                onChange={(e) =>
                  setLabels((prev) => ({ ...prev, [k]: e.target.value }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
