import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { TextArea } from '../components/TextField';
import {
  importRows,
  rowsFromCsv,
  rowsFromJson,
  type ImportResult,
} from '../lib/import';

const SAMPLE_CSV = `language,mainText,variant1,variant2,variant3,meaning,notes,tags
Japanese,今日は,konnichiwa,こんにちわ,コンニチワ,xin chào,Greeting,"daily,greeting"`;

const SAMPLE_JSON = `[
  {
    "language": "Japanese",
    "mainText": "今日は",
    "variant1": "konnichiwa",
    "variant2": "こんにちわ",
    "variant3": "コンニチワ",
    "meaning": "xin chào",
    "notes": "Greeting",
    "tags": ["daily", "greeting"]
  }
]`;

type Format = 'csv' | 'json';

export function ImportScreen() {
  const [format, setFormat] = useState<Format>('csv');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  async function onImport() {
    setParseError(null);
    setResult(null);
    if (!text.trim()) {
      setParseError('Paste some data first');
      return;
    }
    setBusy(true);
    try {
      const rows =
        format === 'csv' ? rowsFromCsv(text) : rowsFromJson(text);
      if (rows.length === 0) {
        setParseError('No rows found');
        return;
      }
      const res = await importRows(rows);
      setResult(res);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Failed to parse');
    } finally {
      setBusy(false);
    }
  }

  function onPickFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const t = reader.result;
      if (typeof t === 'string') setText(t);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader title="Import" />
      <div className="px-4 py-6 md:px-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Format</p>
            <div className="flex gap-2">
              <Button
                variant={format === 'csv' ? 'primary' : 'secondary'}
                onClick={() => setFormat('csv')}
              >
                CSV
              </Button>
              <Button
                variant={format === 'json' ? 'primary' : 'secondary'}
                onClick={() => setFormat('json')}
              >
                JSON
              </Button>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept={format === 'csv' ? '.csv,text/csv' : '.json,application/json'}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickFile(f);
              }}
              className="block w-full text-sm text-slate-700"
            />
          </div>

          <TextArea
            label={`Or paste ${format.toUpperCase()} below`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={format === 'csv' ? SAMPLE_CSV : SAMPLE_JSON}
          />

          {parseError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {parseError}
            </div>
          ) : null}

          <Button
            className="w-full py-3 text-base"
            onClick={onImport}
            disabled={busy}
          >
            {busy ? 'Importing…' : 'Import'}
          </Button>

          {result ? <ImportSummary result={result} /> : null}
        </div>
      </div>
    </>
  );
}

function ImportSummary({ result }: { result: ImportResult }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm">
        Imported{' '}
        <span className="font-semibold text-emerald-700">
          {result.imported}
        </span>{' '}
        card(s).
      </p>
      {result.createdLanguages.length > 0 ? (
        <p className="text-sm text-slate-600">
          Created languages: {result.createdLanguages.join(', ')}
        </p>
      ) : null}
      {result.errors.length > 0 ? (
        <details className="rounded-md bg-red-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-red-700">
            {result.errors.length} error(s)
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-red-700">
            {result.errors.map((e) => (
              <li key={e.row}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
