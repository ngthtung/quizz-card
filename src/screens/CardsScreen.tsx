import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SpeakButton } from '@/components/SpeakButton';
import { Furigana } from '@/components/Furigana';
import { pronunciationFor } from '@/lib/speech';
import { db } from '@/db/db';
import {
  createFlashcard,
  deleteFlashcard,
  updateFlashcard,
} from '@/db/flashcards';
import { cardFormSchema, emptyCardFormValues } from '@/lib/schemas';
import type { CardFormValues } from '@/types';
import type { Flashcard, Language } from '@/types';

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

  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Flashcard | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const c of cards ?? []) for (const t of c.tags) set.add(t);
    return [...set].sort();
  }, [cards]);

  const filtered = useMemo(() => {
    return (cards ?? []).filter((c) => {
      if (languageFilter !== 'all' && c.languageId !== languageFilter)
        return false;
      if (tagFilter !== 'all' && !c.tags.includes(tagFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          c.mainText,
          c.variant1,
          c.variant2,
          c.variant3,
          c.meaning,
          c.notes ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cards, languageFilter, tagFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginated = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [languageFilter, tagFilter, search, pageSize]);

  const langById = useMemo(() => {
    const m: Record<string, Language> = {};
    for (const l of languages ?? []) m[l.id] = l;
    return m;
  }, [languages]);

  const noLanguages = languages !== undefined && languages.length === 0;
  const loading = cards === undefined || languages === undefined;

  const newCardButton = (
    <Button
      onClick={() => setEditor({ mode: 'create' })}
      disabled={noLanguages}
    >
      <Plus />
      New card
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Cards"
        actions={
          noLanguages ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>{newCardButton}</span>
              </TooltipTrigger>
              <TooltipContent>Create a language first</TooltipContent>
            </Tooltip>
          ) : (
            newCardButton
          )
        }
      />
      <PageShell>
        {!loading && !noLanguages ? (
          <div className="mb-4 grid gap-2 md:grid-cols-[200px_200px_1fr]">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages?.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={tagFilter}
              onValueChange={setTagFilter}
              disabled={allTags.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search cards…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        ) : null}

        {loading ? (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        ) : noLanguages ? (
          <NoLanguagesState />
        ) : (cards?.length ?? 0) === 0 ? (
          <EmptyCardsState onCreate={() => setEditor({ mode: 'create' })} />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            No cards match your filters.
          </p>
        ) : (
          <>
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginated.map((c) => (
                <li key={c.id}>
                  <CardRow
                    card={c}
                    language={langById[c.languageId]}
                    onEdit={() => setEditor({ mode: 'edit', card: c })}
                    onDelete={() => setDeleteTarget(c)}
                  />
                </li>
              ))}
            </ul>
            <Pagination
              page={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </PageShell>

      {editor && languages ? (
        <CardEditor
          state={editor}
          languages={languages}
          onClose={() => setEditor(null)}
        />
      ) : null}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this card?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.mainText || '(no main text)'}" will be removed
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteFlashcard(deleteTarget.id);
                toast.success('Card deleted');
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CardRow({
  card,
  language,
  onEdit,
  onDelete,
}: {
  card: Flashcard;
  language: Language | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {card.mainText ? (
              <SpeakButton
                text={card.mainText}
                pronunciation={pronunciationFor(card, language)}
                languageName={language?.name}
                fieldKey="mainText"
                size="sm"
              />
            ) : null}
            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {card.mainText ? (
                  <Furigana
                    text={card.mainText}
                    enabled={language?.name?.toLowerCase() === 'japanese'}
                  />
                ) : (
                  <span className="text-muted-foreground">(no main text)</span>
                )}
              </CardTitle>
              <Badge variant="secondary" className="mt-1">
                {language?.name ?? '—'}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Card actions"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <dl className="space-y-1 text-sm">
          {(['variant1', 'variant2', 'variant3'] as const).map((k) => {
            const value = card[k];
            if (!value) return null;
            return (
              <div
                key={k}
                className="flex items-center justify-between gap-2"
              >
                <dt className="text-muted-foreground text-xs">
                  {language?.fieldLabels[k] ?? k}
                </dt>
                <dd className="text-foreground text-right font-medium">
                  {value}
                </dd>
              </div>
            );
          })}
          {card.meaning ? (
            <div className="border-border flex items-start justify-between gap-2 border-t pt-1.5">
              <dt className="text-muted-foreground text-xs">
                {language?.fieldLabels.meaning ?? 'Meaning'}
              </dt>
              <dd className="text-right font-medium">{card.meaning}</dd>
            </div>
          ) : null}
        </dl>

        {card.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {card.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        ) : null}

        {card.notes ? (
          <p className="text-muted-foreground mt-3 text-xs italic">
            {card.notes}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="text-muted-foreground text-xs">
        <span className="text-emerald-600">✓ {card.rememberedCount}</span>
        <span className="px-2">·</span>
        <span className="text-destructive">✕ {card.forgottenCount}</span>
      </CardFooter>
    </Card>
  );
}

function NoLanguagesState() {
  return (
    <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <Inbox className="text-muted-foreground size-10" />
      <p className="mt-3 text-base font-medium">No languages yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Create a language on the Languages screen first.
      </p>
    </div>
  );
}

function EmptyCardsState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <Inbox className="text-muted-foreground size-10" />
      <p className="mt-3 text-base font-medium">No cards yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Add your first card to start studying.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus />
        Add your first card
      </Button>
    </div>
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

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: initial
      ? {
          languageId: initial.languageId,
          mainText: initial.mainText,
          variant1: initial.variant1,
          variant2: initial.variant2,
          variant3: initial.variant3,
          meaning: initial.meaning,
          notes: initial.notes ?? '',
          tagsRaw: initial.tags.join(', '),
        }
      : emptyCardFormValues(languages[0]?.id ?? ''),
  });

  // Reset when switching between create/edit targets
  useEffect(() => {
    if (initial) {
      form.reset({
        languageId: initial.languageId,
        mainText: initial.mainText,
        variant1: initial.variant1,
        variant2: initial.variant2,
        variant3: initial.variant3,
        meaning: initial.meaning,
        notes: initial.notes ?? '',
        tagsRaw: initial.tags.join(', '),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const languageId = form.watch('languageId');
  const lang = languages.find((l) => l.id === languageId);

  async function onSubmit(values: CardFormValues) {
    const tags = values.tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      if (isEdit && initial) {
        await updateFlashcard(initial.id, {
          languageId: values.languageId,
          mainText: values.mainText.trim(),
          variant1: values.variant1.trim(),
          variant2: values.variant2.trim(),
          variant3: values.variant3.trim(),
          meaning: values.meaning.trim(),
          notes: values.notes.trim() || undefined,
          tags,
        });
        toast.success('Card updated');
      } else {
        await createFlashcard({
          languageId: values.languageId,
          mainText: values.mainText,
          variant1: values.variant1,
          variant2: values.variant2,
          variant3: values.variant3,
          meaning: values.meaning,
          notes: values.notes,
          tags,
        });
        toast.success('Card created');
      }
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit card' : 'New card'}</DialogTitle>
          <DialogDescription>
            Fill at least one variant or meaning field.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="card-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-3"
          >
            <FormField
              control={form.control}
              name="languageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose…" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mainText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {lang?.fieldLabels.mainText ?? 'Main text'}
                  </FormLabel>
                  <FormControl>
                    <Input autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(['variant1', 'variant2', 'variant3', 'meaning'] as const).map(
              (k) => (
                <FormField
                  key={k}
                  control={form.control}
                  name={k}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{lang?.fieldLabels[k] ?? k}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            k === 'meaning' ? 'Nghĩa / meaning' : undefined
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ),
            )}
            <FormField
              control={form.control}
              name="tagsRaw"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="daily, greeting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="sm:justify-between">
          {isEdit && initial ? (
            <Button
              variant="outline"
              type="button"
              className="text-destructive hover:bg-destructive/10"
              disabled={form.formState.isSubmitting}
              onClick={async () => {
                await deleteFlashcard(initial.id);
                toast.success('Card deleted');
                onClose();
              }}
            >
              <Trash2 />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="card-form"
              disabled={form.formState.isSubmitting}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  if (total === 0) return null;
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="text-muted-foreground text-sm">
        Showing {start}–{end} of {total}
      </div>
      <div className="flex items-center gap-3">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[12, 24, 48, 96].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <span className="px-2 text-sm tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
