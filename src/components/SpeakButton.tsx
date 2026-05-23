import { Volume2 } from 'lucide-react';
import { cleanForSpeech, speak, speechSupported } from '@/lib/speech';
import { useSettings } from '@/lib/settings';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FieldKey } from '@/types';

export function SpeakButton({
  text,
  pronunciation,
  languageName,
  fieldKey,
  size = 'md',
  className = '',
}: {
  text: string;
  pronunciation?: string;
  languageName?: string;
  fieldKey?: FieldKey;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { kanjiAudioEnabled } = useSettings();
  const rawSpoken = (pronunciation && pronunciation.trim()) || text;
  const spoken = cleanForSpeech(rawSpoken);
  if (!speechSupported || !spoken) return null;
  if (
    fieldKey === 'mainText' &&
    languageName?.toLowerCase() === 'japanese' &&
    !kanjiAudioEnabled
  ) {
    return null;
  }

  const ariaLabel = `Play audio: ${spoken}`;

  return (
    <Button
      type="button"
      variant="secondary"
      size={size === 'sm' ? 'icon-sm' : 'icon'}
      onClick={(e) => {
        e.stopPropagation();
        speak(spoken, languageName);
      }}
      title={ariaLabel}
      aria-label={ariaLabel}
      className={cn('rounded-full', className)}
    >
      <Volume2 className={size === 'sm' ? 'size-3' : 'size-4'} />
    </Button>
  );
}
