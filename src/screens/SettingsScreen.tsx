import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Sparkles, Trash2 } from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { db } from '@/db/db';
import { setKanjiAudioEnabled, useSettings } from '@/lib/settings';
import { looksLikeRomaji, romajiToHiragana } from '@/lib/kana';
import { deleteKanaAlphabetCards } from '@/lib/deleteKanaCards';

export function SettingsScreen() {
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const { kanjiAudioEnabled } = useSettings();

  async function onExport() {
    setBusy(true);
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
      toast.success(
        `Exported ${languages.length} language(s) and ${flashcards.length} card(s).`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  async function onBackfillHiragana() {
    setBusy(true);
    try {
      const japanese = await db.languages
        .filter((l) => l.name.toLowerCase() === 'japanese')
        .toArray();
      if (japanese.length === 0) {
        toast.info('No Japanese language found.');
        return;
      }
      const ids = japanese.map((l) => l.id);
      const cards = await db.flashcards
        .where('languageId')
        .anyOf(ids)
        .toArray();
      const updates = cards
        .filter((c) => !c.variant2.trim() && looksLikeRomaji(c.variant1))
        .map((c) => ({ id: c.id, variant2: romajiToHiragana(c.variant1) }));
      if (updates.length === 0) {
        toast.info('All Japanese cards already have hiragana.');
        return;
      }
      const now = new Date().toISOString();
      await db.transaction('rw', db.flashcards, async () => {
        for (const u of updates) {
          await db.flashcards.update(u.id, {
            variant2: u.variant2,
            updatedAt: now,
          });
        }
      });
      toast.success(`Filled hiragana for ${updates.length} card(s).`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Backfill failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteKanaCards() {
    setBusy(true);
    try {
      const count = await deleteKanaAlphabetCards();
      if (count === 0) {
        toast.info('No kana alphabet cards found.');
      } else {
        toast.success(`Deleted ${count} kana alphabet card(s).`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    setBusy(true);
    try {
      await db.transaction('rw', db.languages, db.flashcards, async () => {
        await db.flashcards.clear();
        await db.languages.clear();
      });
      toast.success('All data cleared.');
      setResetOpen(false);
      setConfirmText('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" />
      <PageShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio</CardTitle>
              <CardDescription>
                Voice playback options for cards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Label
                    htmlFor="kanji-audio"
                    className="text-base font-medium"
                  >
                    Play Kanji (Chinese character) audio
                  </Label>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Turn off if you can already read kanji and don't want the
                    speaker button on the Kanji field.
                  </p>
                </div>
                <Switch
                  id="kanji-audio"
                  checked={kanjiAudioEnabled}
                  onCheckedChange={setKanjiAudioEnabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fill missing Hiragana</CardTitle>
              <CardDescription>
                For Japanese cards with empty Hiragana, generate it from the
                Romaji field.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={onBackfillHiragana}
                disabled={busy}
              >
                <Sparkles />
                Fill from Romaji
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delete Kana Alphabet Cards</CardTitle>
              <CardDescription>
                Remove all hiragana and katakana alphabet learning cards (single
                kana characters like あ, い, ア, イ, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={onDeleteKanaCards}
                disabled={busy}
              >
                <Trash2 />
                Delete Kana Cards
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data</CardTitle>
              <CardDescription>
                Export a JSON backup of every language and card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onExport} disabled={busy}>
                <Download />
                Download backup
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Reset all data</CardTitle>
              <CardDescription>
                Deletes every language and card from this browser. Cannot be
                undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 />
                    Reset everything
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete all languages and cards?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes every language and card stored
                      in this browser. Export first if you might want them
                      back.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-delete">
                      Type{' '}
                      <span className="font-mono font-semibold">DELETE</span>{' '}
                      to confirm
                    </Label>
                    <Input
                      id="confirm-delete"
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
                        if (confirmText === 'DELETE') void onReset();
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
