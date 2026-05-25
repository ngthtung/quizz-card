import { RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MixedComplete({
  total,
  answers,
  onRestart,
}: {
  total: number;
  answers: number;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-6 md:px-6">
      <div className="bg-card rounded-2xl border p-8 text-center shadow-xs">
        <Sparkles className="mx-auto size-12 text-emerald-500" />
        <h2 className="mt-4 text-2xl font-semibold">All cards mastered</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {total} card{total === 1 ? '' : 's'} · {answers} answer
          {answers === 1 ? '' : 's'}
        </p>
        <Button size="lg" className="mt-6 w-full" onClick={onRestart}>
          <RotateCcw />
          Restart with same scope
        </Button>
      </div>
    </div>
  );
}
