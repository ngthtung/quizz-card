import { speak, speechSupported } from '../lib/speech';
import { useSettings } from '../lib/settings';
import type { FieldKey } from '../types';

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
  const spoken = (pronunciation && pronunciation.trim()) || text;
  if (!speechSupported || !spoken) return null;
  if (
    fieldKey === 'mainText' &&
    languageName?.toLowerCase() === 'japanese' &&
    !kanjiAudioEnabled
  ) {
    return null;
  }
  const sizeCls =
    size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(spoken, languageName);
      }}
      title="Play audio"
      aria-label="Play audio"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 ${sizeCls} ${className}`}
    >
      🔊
    </button>
  );
}
