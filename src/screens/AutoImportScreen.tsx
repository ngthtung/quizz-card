import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listLessons } from '@/lib/markdownLessons';
import { importRows } from '@/lib/import';

export function AutoImportScreen() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<string[]>([]);

  async function runImport() {
    setStatus('running');
    setMessage('Loading lessons...');
    setDetails([]);

    try {
      const lessons = listLessons();
      setDetails((prev) => [...prev, `Found ${lessons.length} lesson(s)`]);

      if (lessons.length === 0) {
        setStatus('error');
        setMessage('No lessons found in data/');
        return;
      }

      const allRows = lessons.flatMap((l) => l.rows);
      setDetails((prev) => [...prev, `Total rows: ${allRows.length}`]);
      setMessage(`Importing ${allRows.length} cards...`);

      const result = await importRows(allRows);

      setDetails((prev) => [
        ...prev,
        `✓ Imported: ${result.imported} cards`,
        `✓ Created languages: ${result.createdLanguages.join(', ') || 'none'}`,
        result.errors.length > 0 ? `⚠ Errors: ${result.errors.length}` : '✓ No errors',
      ]);

      setStatus('success');
      setMessage('Import complete!');
      toast.success(`Imported ${result.imported} cards from all lessons`);
    } catch (e) {
      setStatus('error');
      setMessage(e instanceof Error ? e.message : 'Import failed');
      setDetails((prev) => [...prev, `✗ Error: ${message}`]);
      toast.error('Import failed');
    }
  }

  useEffect(() => {
    runImport();
  }, []);

  return (
    <>
      <PageHeader title="Auto Import" />
      <PageShell>
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {status === 'running' && <Loader2 className="animate-spin" />}
                {status === 'success' && <CheckCircle2 className="text-emerald-600" />}
                {status === 'error' && <XCircle className="text-destructive" />}
                {message || 'Preparing import...'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {details.length > 0 && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                    Details
                  </p>
                  <ul className="space-y-1 font-mono text-sm">
                    {details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {status === 'success' && (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => (window.location.href = '/study')}
                >
                  Go to Study
                </Button>
              )}

              {status === 'error' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={runImport}
                >
                  Retry
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
