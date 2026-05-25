import type { ReactNode } from 'react';
import { Progress } from '@/components/ui/progress';

export function SessionProgress({
  left,
  right,
  value,
}: {
  left: ReactNode;
  right: ReactNode;
  value: number;
}) {
  return (
    <div className="mb-4 space-y-1">
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{left}</span>
        <span>{right}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
