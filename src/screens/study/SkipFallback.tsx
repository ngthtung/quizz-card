import { Button } from '@/components/ui/button';

export function SkipFallback({
  message,
  onSkip,
}: {
  message: string;
  onSkip: () => void;
}) {
  return (
    <div className="bg-card rounded-2xl border p-6 text-sm">
      <p className="text-muted-foreground">{message}</p>
      <Button className="mt-3 w-full" onClick={onSkip}>
        Continue
      </Button>
    </div>
  );
}
