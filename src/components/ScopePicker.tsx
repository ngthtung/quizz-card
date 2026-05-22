import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  countCardsForScope,
  type Dataset,
  type Scope,
} from '@/lib/datasets';
import type { Flashcard } from '@/types';

const GROUP_LABELS: Record<Dataset['group'], string> = {
  lessons: 'Lessons',
  kana: 'Kana',
  other: 'Other tags',
};

export function ScopePicker({
  open,
  onOpenChange,
  languageId,
  datasets,
  cards,
  initialScope,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  languageId: string;
  datasets: Dataset[];
  cards: Flashcard[];
  initialScope: Scope;
  onConfirm: (scope: Scope) => void;
}) {
  const [draft, setDraft] = useState<Scope>(initialScope);

  // Reset draft whenever the modal is opened anew or the initial scope changes.
  useEffect(() => {
    if (open) setDraft(initialScope);
  }, [open, initialScope]);

  const grouped = useMemo(() => {
    const groups: Record<Dataset['group'], Dataset[]> = {
      lessons: [],
      kana: [],
      other: [],
    };
    for (const d of datasets) groups[d.group].push(d);
    return groups;
  }, [datasets]);

  const everythingChecked = draft === null;
  const totalSelectedCount = countCardsForScope(draft, languageId, cards);

  function pickEverything() {
    setDraft(null);
  }

  function toggleTag(tag: string) {
    setDraft((prev) => {
      const current = prev === null ? [] : [...prev];
      const idx = current.indexOf(tag);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(tag);
      return current;
    });
  }

  const canStart = totalSelectedCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pick datasets</DialogTitle>
          <DialogDescription>
            Choose which lessons or sets to include in this session.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-1">
          <ScopeRow
            label="Everything in this language"
            count={cards.filter((c) => c.languageId === languageId).length}
            checked={everythingChecked}
            onChange={pickEverything}
            kind="radio"
          />

          {(['lessons', 'kana', 'other'] as const).map((g) => {
            const items = grouped[g];
            if (items.length === 0) return null;
            return (
              <div key={g} className="space-y-1">
                <p className="text-muted-foreground px-1 text-xs font-semibold uppercase tracking-wide">
                  {GROUP_LABELS[g]}
                </p>
                <div className="space-y-1">
                  {items.map((d) => (
                    <ScopeRow
                      key={d.id}
                      label={d.label}
                      count={d.count}
                      checked={draft !== null && draft.includes(d.id)}
                      onChange={() => toggleTag(d.id)}
                      kind="checkbox"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-muted-foreground text-sm">
          {totalSelectedCount} card{totalSelectedCount === 1 ? '' : 's'} selected
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canStart}
            onClick={() => {
              onConfirm(draft);
              onOpenChange(false);
            }}
          >
            Start session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScopeRow({
  label,
  count,
  checked,
  onChange,
  kind,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
  kind: 'radio' | 'checkbox';
}) {
  return (
    <label className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-2 transition">
      <input
        type={kind === 'radio' ? 'radio' : 'checkbox'}
        name={kind === 'radio' ? 'scope-everything' : undefined}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-current"
      />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Badge variant="secondary">{count}</Badge>
    </label>
  );
}
