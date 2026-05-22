import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Keyboard, Layers, Target } from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { db } from '@/db/db';
import { SwipeMode } from './study/SwipeMode';
import { MultipleChoiceMode } from './study/MultipleChoiceMode';
import { WriteMode } from './study/WriteMode';
import { ScopePicker } from '@/components/ScopePicker';
import {
  groupTagsForLanguage,
  loadSavedScope,
  saveScope,
  type Scope,
} from '@/lib/datasets';

type Mode = 'swipe' | 'mc' | 'write';

const MODE_TITLES: Record<Mode, string> = {
  swipe: 'Swipe study',
  mc: 'Multiple choice',
  write: 'Write study',
};

type Session = { mode: Mode; languageId: string; scope: Scope };

export function StudyScreen() {
  const languages = useLiveQuery(
    () => db.languages.orderBy('name').toArray(),
    [],
  );
  const allCards = useLiveQuery(() => db.flashcards.toArray(), []);

  const cardCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of allCards ?? []) {
      map[c.languageId] = (map[c.languageId] ?? 0) + 1;
    }
    return map;
  }, [allCards]);

  const [mode, setMode] = useState<Mode>('swipe');
  const [languageId, setLanguageId] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const datasets = useMemo(
    () =>
      languageId && allCards
        ? groupTagsForLanguage(languageId, allCards)
        : [],
    [languageId, allCards],
  );

  const initialScope: Scope = useMemo(() => {
    if (!languageId) return null;
    return loadSavedScope(languageId, datasets);
  }, [languageId, datasets]);

  // Auto-select Japanese language as default
  useEffect(() => {
    if (!languageId && languages && languages.length > 0) {
      const japanese = languages.find(
        (l) => l.name.toLowerCase() === 'japanese',
      );
      if (japanese) {
        setLanguageId(japanese.id);
      } else {
        // Fallback to first language if Japanese not found
        setLanguageId(languages[0].id);
      }
    }
  }, [languages, languageId]);

  if (session) {
    return (
      <>
        <PageHeader
          title={MODE_TITLES[session.mode]}
          actions={
            <Button variant="ghost" onClick={() => setSession(null)}>
              <ArrowLeft />
              End session
            </Button>
          }
        />
        {session.mode === 'swipe' ? (
          <SwipeMode languageId={session.languageId} scope={session.scope} />
        ) : session.mode === 'mc' ? (
          <MultipleChoiceMode
            languageId={session.languageId}
            scope={session.scope}
          />
        ) : (
          <WriteMode languageId={session.languageId} scope={session.scope} />
        )}
      </>
    );
  }

  const noLanguages = languages !== undefined && languages.length === 0;
  const availableCount = languageId ? (cardCounts[languageId] ?? 0) : 0;

  function onStart() {
    if (!languageId) return;
    setPickerOpen(true);
  }

  function onConfirmScope(scope: Scope) {
    saveScope(languageId, scope);
    setSession({ mode, languageId, scope });
  }

  return (
    <>
      <PageHeader title="Study" />
      <PageShell>
        {noLanguages ? (
          <Card>
            <CardHeader>
              <CardTitle>No languages yet</CardTitle>
              <CardDescription>
                Create a language and add cards before starting a session.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="mx-auto max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Start a study session</CardTitle>
                <CardDescription>
                  Pick a mode and language to begin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="swipe">
                        <Layers />
                        Swipe
                      </TabsTrigger>
                      <TabsTrigger value="mc">
                        <Target />
                        Choice
                      </TabsTrigger>
                      <TabsTrigger value="write">
                        <Keyboard />
                        Write
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <p className="text-muted-foreground text-xs">
                    {mode === 'swipe'
                      ? 'Tap to reveal, swipe left/right.'
                      : mode === 'mc'
                        ? 'Pick A, B, C, or D.'
                        : 'Type the answer.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={languageId} onValueChange={setLanguageId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a language…" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages?.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {languageId ? (
                    <Badge variant="secondary">
                      {availableCount} card
                      {availableCount === 1 ? '' : 's'} available
                    </Badge>
                  ) : null}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!languageId || availableCount === 0}
                  onClick={onStart}
                >
                  Start session
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </PageShell>

      {languageId && allCards ? (
        <ScopePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          languageId={languageId}
          datasets={datasets}
          cards={allCards}
          initialScope={initialScope}
          onConfirm={onConfirmScope}
        />
      ) : null}
    </>
  );
}
