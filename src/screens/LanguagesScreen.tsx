import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Globe, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader, PageShell } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { db } from '@/db/db';
import {
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from '@/db/languages';
import { FIELD_KEYS, type Language } from '@/types';
import {
  defaultLanguageFormValues,
  languageFormSchema,
  type LanguageFormValues,
} from '@/lib/schemas';

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

  async function onDelete(lang: Language) {
    try {
      await deleteLanguage(lang.id);
      toast.success(`Deleted "${lang.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  return (
    <>
      <PageHeader
        title="Languages"
        actions={
          <Button onClick={() => setEditor({ mode: 'create' })}>
            <Plus />
            New language
          </Button>
        }
      />
      <PageShell>
        {languages && languages.length === 0 ? (
          <EmptyState onCreate={() => setEditor({ mode: 'create' })} />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {languages?.map((lang) => {
              const count = cardCounts?.[lang.id] ?? 0;
              const canDelete = count === 0;
              return (
                <li key={lang.id}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle>{lang.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1.5">
                            {count} card{count === 1 ? '' : 's'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        {FIELD_KEYS.map((k) => (
                          <div
                            key={k}
                            className="flex justify-between gap-2 truncate"
                          >
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="text-foreground truncate font-medium">
                              {lang.fieldLabels[k]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </CardContent>
                    <CardFooter className="justify-end gap-2 border-t pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setEditor({ mode: 'edit', language: lang })
                        }
                      >
                        <Pencil />
                        Edit
                      </Button>
                      {canDelete ? (
                        <DeleteLanguageButton
                          lang={lang}
                          onConfirm={() => void onDelete(lang)}
                        />
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0}>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="text-muted-foreground"
                              >
                                <Trash2 />
                                Delete
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Remove all {count} card
                            {count === 1 ? '' : 's'} first.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </PageShell>

      {editor ? (
        <LanguageEditor state={editor} onClose={() => setEditor(null)} />
      ) : null}
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <Globe className="text-muted-foreground size-10" />
      <p className="mt-3 text-base font-medium">No languages yet</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Create one to start adding cards.
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus />
        New language
      </Button>
    </div>
  );
}

function DeleteLanguageButton({
  lang,
  onConfirm,
}: {
  lang: Language;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete language?</DialogTitle>
          <DialogDescription>
            Permanently remove "{lang.name}" from this browser.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

  const form = useForm<LanguageFormValues>({
    resolver: zodResolver(languageFormSchema),
    defaultValues: initial
      ? { name: initial.name, fieldLabels: { ...initial.fieldLabels } }
      : defaultLanguageFormValues,
  });

  useEffect(() => {
    form.reset(
      initial
        ? { name: initial.name, fieldLabels: { ...initial.fieldLabels } }
        : defaultLanguageFormValues,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  async function onSubmit(values: LanguageFormValues) {
    try {
      if (isEdit && initial) {
        await updateLanguage(initial.id, {
          name: values.name,
          fieldLabels: values.fieldLabels,
        });
        toast.success('Language updated');
      } else {
        await createLanguage({
          name: values.name,
          fieldLabels: values.fieldLabels,
        });
        toast.success('Language created');
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
          <DialogTitle>
            {isEdit ? 'Edit language' : 'New language'}
          </DialogTitle>
          <DialogDescription>
            Set the display labels each card will use for this language.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="language-form"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Japanese" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <p className="mb-2 text-sm font-medium">Field labels</p>
              <div className="grid gap-3 md:grid-cols-2">
                {FIELD_KEYS.map((k) => (
                  <FormField
                    key={k}
                    control={form.control}
                    name={`fieldLabels.${k}` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">
                          {k}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </form>
        </Form>
        <DialogFooter>
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
            form="language-form"
            disabled={form.formState.isSubmitting}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
