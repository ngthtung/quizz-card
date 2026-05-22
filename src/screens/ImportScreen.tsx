import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  importRows,
  type ImportResult,
} from '@/lib/import';
import { listLessons } from '@/lib/markdownLessons';
import { db } from '@/db/db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import '@/lib/debug-db';

export function ImportScreen() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearOpen, setClearOpen] = useState(false);

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

  async function onClearDatabase() {
    setBusy(true);
    try {
      await db.transaction('rw', db.languages, db.flashcards, async () => {
        await db.flashcards.clear();
        await db.languages.clear();
      });
      toast.success('Database cleared. All cards and languages deleted.');
      setClearOpen(false);
      setConfirmText('');
      setResult(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Clear failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Import" />
      <PageShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <BuiltInLessons onResult={reportResult} busy={busy} setBusy={setBusy} />

          {result ? <ImportSummary result={result} /> : null}

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Clear Database</CardTitle>
              <CardDescription>
                Delete all cards and languages from this browser. Use this to
                start fresh before importing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={busy}>
                    <Trash2 />
                    Clear all data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete all languages and cards?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes every language and card stored in
                      this browser. Cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-clear">
                      Type{' '}
                      <span className="font-mono font-semibold">DELETE</span> to
                      confirm
                    </Label>
                    <Input
                      id="confirm-clear"
                      autoFocus
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setConfirmText('')}
                      disabled={busy}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirmText === 'DELETE') void onClearDatabase();
                      }}
                      disabled={busy || confirmText !== 'DELETE'}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
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
