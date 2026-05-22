import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  FileDown,
  FileText,
  Upload,
} from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  importRows,
  rowsFromCsv,
  rowsFromJson,
  type ImportResult,
} from '@/lib/import';
import { listLessons } from '@/lib/markdownLessons';

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
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reportResult(res: ImportResult) {
    setResult(res);
    if (res.errors.length === 0) {
      toast.success(`Imported ${res.imported} card(s).`);
    } else {
      toast.warning(
        `Imported ${res.imported}; ${res.errors.length} row(s) had errors.`,
      );
    }
  }

  async function onImport() {
    if (!text.trim()) {
      toast.error('Paste some data first');
      return;
    }
    setBusy(true);
    try {
      const rows =
        format === 'csv' ? rowsFromCsv(text) : rowsFromJson(text);
      if (rows.length === 0) {
        toast.error('No rows found');
        return;
      }
      const res = await importRows(rows);
      reportResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to parse');
    } finally {
      setBusy(false);
    }
  }

  function readFile(file: File) {
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
      <PageShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <BuiltInLessons onResult={reportResult} busy={busy} setBusy={setBusy} />

          <Card>
            <CardHeader>
              <CardTitle>Import from file or text</CardTitle>
              <CardDescription>
                Paste CSV/JSON or drop a file. Languages and tags are created
                as needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Tabs
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="csv">
                      <FileText />
                      CSV
                    </TabsTrigger>
                    <TabsTrigger value="json">
                      <FileText />
                      JSON
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                  dragOver
                    ? 'border-ring bg-accent/40'
                    : 'border-border bg-muted/40',
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) readFile(f);
                }}
              >
                <FileDown className="text-muted-foreground size-8" />
                <p className="mt-2 text-sm font-medium">
                  Drop a {format.toUpperCase()} file or
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload />
                  Choose file
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept={
                    format === 'csv' ? '.csv,text/csv' : '.json,application/json'
                  }
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) readFile(f);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paste-textarea">
                  Or paste {format.toUpperCase()} below
                </Label>
                <Textarea
                  id="paste-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  placeholder={format === 'csv' ? SAMPLE_CSV : SAMPLE_JSON}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={onImport}
                disabled={busy}
              >
                <Upload />
                {busy ? 'Importing…' : 'Import'}
              </Button>
            </CardContent>
          </Card>

          {result ? <ImportSummary result={result} /> : null}
        </div>
      </PageShell>
    </>
  );
}

function BuiltInLessons({
  onResult,
  busy,
  setBusy,
}: {
  onResult: (r: ImportResult) => void;
  busy: boolean;
  setBusy: (b: boolean) => void;
}) {
  const lessons = useMemo(() => listLessons(), []);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  if (lessons.length === 0) return null;

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onImport() {
    if (picked.size === 0) return;
    const rows = lessons
      .filter((l) => picked.has(l.id))
      .flatMap((l) => l.rows);
    if (rows.length === 0) {
      toast.error('No rows in selected lessons');
      return;
    }
    setBusy(true);
    try {
      const res = await importRows(rows);
      onResult(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to import');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Built-in lessons</CardTitle>
        <CardDescription>
          Vocabulary from Minna no Nihongo, bundled with the app. Each lesson
          is tagged so you can filter by it later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicked(new Set(lessons.map((l) => l.id)))}
          >
            Select all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPicked(new Set())}
          >
            Clear
          </Button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {lessons.map((l) => {
            const isPicked = picked.has(l.id);
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => toggle(l.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isPicked
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-sm border',
                      isPicked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input',
                    )}
                  >
                    {isPicked ? <CheckCircle2 className="size-3" /> : null}
                  </span>
                  <span className="flex-1 truncate">{l.title}</span>
                  <Badge variant="secondary">{l.rows.length}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
        <Button
          size="lg"
          className="w-full"
          onClick={onImport}
          disabled={busy || picked.size === 0}
        >
          <Upload />
          {busy ? 'Importing…' : `Import ${picked.size} lesson(s)`}
        </Button>
      </CardContent>
    </Card>
  );
}

function ImportSummary({ result }: { result: ImportResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="text-emerald-600" />
          Import complete
        </CardTitle>
        <CardDescription>
          Imported {result.imported} card(s)
          {result.createdLanguages.length > 0 ? (
            <>
              {' '}
              · created languages:{' '}
              <span className="font-medium">
                {result.createdLanguages.join(', ')}
              </span>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>
      {result.errors.length > 0 ? (
        <CardContent>
          <div className="border-destructive/30 bg-destructive/5 rounded-md border p-3">
            <p className="text-destructive flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="size-4" />
              {result.errors.length} error
              {result.errors.length === 1 ? '' : 's'}
            </p>
            <div className="mt-2 max-h-60 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-3 text-left font-medium">Row</th>
                    <th className="py-1 text-left font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e) => (
                    <tr key={e.row} className="border-border border-t">
                      <td className="py-1 pr-3 font-mono">{e.row}</td>
                      <td className="text-destructive py-1">{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
