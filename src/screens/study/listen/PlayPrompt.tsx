import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PlayPrompt({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="bg-card flex flex-col items-center rounded-2xl border p-8 shadow-xs">
      <Button
        type="button"
        size="icon"
        onClick={onReplay}
        aria-label="Replay audio"
        title="Replay audio"
        className="h-20 w-20 rounded-full"
      >
        <Volume2 className="size-8" />
      </Button>
      <p className="text-muted-foreground mt-3 text-xs">Tap to replay</p>
      <p className="text-muted-foreground mt-3 text-xs">
        Pick the matching meaning.
      </p>
    </div>
  );
}
