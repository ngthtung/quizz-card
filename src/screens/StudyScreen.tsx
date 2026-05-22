import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { db } from '../db/db';
import { SwipeMode } from './study/SwipeMode';
import { MultipleChoiceMode } from './study/MultipleChoiceMode';

type Mode = 'swipe' | 'mc';

type Session = { mode: Mode; languageId: string };

export function StudyScreen() {
  const languages = useLiveQuery(
    () => db.languages.orderBy('name').toArray(),
    [],
  );
  const [mode, setMode] = useState<Mode>('swipe');
  const [languageId, setLanguageId] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);

  if (session) {
    return (
      <>
        <PageHeader
          title={session.mode === 'swipe' ? 'Swipe study' : 'Multiple choice'}
          actions={
            <Button variant="ghost" onClick={() => setSession(null)}>
              End session
            </Button>
          }
        />
        {session.mode === 'swipe' ? (
          <SwipeMode languageId={session.languageId} />
        ) : (
          <MultipleChoiceMode languageId={session.languageId} />
        )}
      </>
    );
  }

  const noLanguages = !languages || languages.length === 0;

  return (
    <>
      <PageHeader title="Study" />
      <div className="px-4 py-6 md:px-6">
        {noLanguages ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Create a language and some cards first.
          </div>
        ) : (
          <div className="mx-auto max-w-md space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <ModeButton
                  active={mode === 'swipe'}
                  onClick={() => setMode('swipe')}
                  label="Swipe"
                  hint="Tap to reveal, swipe left/right"
                />
                <ModeButton
                  active={mode === 'mc'}
                  onClick={() => setMode('mc')}
                  label="Multiple choice"
                  hint="Pick A, B, C, or D"
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">
                Language
              </span>
              <select
                value={languageId}
                onChange={(e) => setLanguageId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Choose…</option>
                {languages?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>

            <Button
              className="w-full py-3 text-base"
              disabled={!languageId}
              onClick={() => setSession({ mode, languageId })}
            >
              Start session
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function ModeButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-3 text-left transition ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
      }`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div
        className={`text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}
      >
        {hint}
      </div>
    </button>
  );
}
