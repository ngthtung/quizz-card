import { useEffect, useState } from 'react';
import { addFurigana } from '@/lib/furigana';

export function Furigana({
  text,
  enabled = true,
}: {
  text: string;
  enabled?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayText(text);
      return;
    }

    let mounted = true;
    addFurigana(text).then((result) => {
      if (mounted) setDisplayText(result);
    });

    return () => {
      mounted = false;
    };
  }, [text, enabled]);

  return <>{displayText}</>;
}
