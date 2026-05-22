import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { db } from '../db/db';

export function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onExport() {
    setBusy(true);
    setMessage(null);
    try {
      const [languages, flashcards] = await Promise.all([
        db.languages.toArray(),
        db.flashcards.toArray(),
      ]);
      const blob = new Blob(
        [JSON.stringify({ languages, flashcards }, null, 2)],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quizz-card-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(
        `Exported ${languages.length} language(s) and ${flashcards.length} card(s).`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (
      !confirm(
        'Delete ALL languages and cards? This cannot be undone. Export first if needed.',
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await db.transaction('rw', db.languages, db.flashcards, async () => {
        await db.flashcards.clear();
        await db.languages.clear();
      });
      setMessage('All data cleared.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-md space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-base font-semibold">Export</h2>
            <p className="mt-1 text-sm text-slate-600">
              Download a JSON backup of all languages and cards.
            </p>
            <Button className="mt-3" onClick={onExport} disabled={busy}>
              Download backup
            </Button>
          </section>

          <section className="rounded-xl border border-red-200 bg-white p-4">
            <h2 className="text-base font-semibold text-red-700">
              Reset all data
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Deletes every language and card from this browser.
            </p>
            <Button
              variant="danger"
              className="mt-3"
              onClick={onReset}
              disabled={busy}
            >
              Reset everything
            </Button>
          </section>

          {message ? (
            <p className="text-sm text-slate-600">{message}</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
