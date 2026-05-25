import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SwipeControls({
  revealed,
  onToggleReveal,
  onSubmit,
}: {
  revealed: boolean;
  onToggleReveal: () => void;
  onSubmit: (remembered: boolean) => void;
}) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-2">
      <Button
        variant="outline"
        size="lg"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => onSubmit(false)}
      >
        <XCircle />
        Forgot
      </Button>
      <Button variant="secondary" size="lg" onClick={onToggleReveal}>
        {revealed ? <EyeOff /> : <Eye />}
        {revealed ? 'Hide' : 'Reveal'}
      </Button>
      <Button variant="success" size="lg" onClick={() => onSubmit(true)}>
        <CheckCircle2 />
        Remember
      </Button>
    </div>
  );
}
