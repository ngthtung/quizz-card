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
import { countCardsForScope } from '@/lib/datasets';
import type { Dataset, Flashcard, Scope } from '@/types';

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
  const [draft, setDraft] = useState<string[]>(() =>
    normalizeScope(initialScope, datasets),
  );

  useEffect(() => {
    if (open) setDraft(normalizeScope(initialScope, datasets));
  }, [open, initialScope, datasets]);

  const grouped = useMemo(() => {
    const groups: Record<Dataset['group'], Dataset[]> = {
      lessons: [],
      kana: [],
      other: [],
    };
    for (const d of datasets) groups[d.group].push(d);
    return groups;
  }, [datasets]);

  const lessonIds = useMemo(
    () => grouped.lessons.map((d) => d.id),
    [grouped.lessons],
  );
  const lessonsTotal = useMemo(
    () => grouped.lessons.reduce((sum, d) => sum + d.count, 0),
    [grouped.lessons],
  );
  const allLessonsChecked =
    lessonIds.length > 0 && lessonIds.every((id) => draft.includes(id));

  const totalSelectedCount = countCardsForScope(draft, languageId, cards);

  function toggleAllLessons() {
    setDraft((prev) => {
      if (allLessonsChecked) {
        return prev.filter((id) => !lessonIds.includes(id));
      }
      const set = new Set(prev);
      for (const id of lessonIds) set.add(id);
      return Array.from(set);
    });
  }

  function toggleTag(tag: string) {
    setDraft((prev) => {
      const idx = prev.indexOf(tag);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      }
      return [...prev, tag];
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
          {lessonIds.length > 0 ? (
            <ScopeRow
              label="All"
              count={lessonsTotal}
              checked={allLessonsChecked}
              onChange={toggleAllLessons}
            />
          ) : null}

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
                      checked={draft.includes(d.id)}
                      onChange={() => toggleTag(d.id)}
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

function normalizeScope(scope: Scope, datasets: Dataset[]): string[] {
  if (scope === null) return datasets.map((d) => d.id);
  return [...scope];
}

function ScopeRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border border-transparent px-2 py-2 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-current"
      />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <Badge variant="secondary">{count}</Badge>
    </label>
  );
}
