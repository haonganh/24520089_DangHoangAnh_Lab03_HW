
import { useEffect, useState, type RefObject } from 'react';
import { drumPads, type DrumCode } from '../config/drumPads';

interface DrumKeyboardOptions {
  scopeRef: RefObject<HTMLElement | null>;
  onTrigger: (code: DrumCode) => void;
  isEnabled?: boolean;
}

const validCodes = new Set<string>(drumPads.map((pad) => pad.code));

export function useDrumKeyboard({
  scopeRef,
  onTrigger,
  isEnabled = true,
}: DrumKeyboardOptions) {
  const [activeCodes, setActiveCodes] = useState<Set<DrumCode>>(
    () => new Set()
  );

  useEffect(() => {
    const clearActive = () => setActiveCodes(new Set());

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEnabled || event.repeat || event.isComposing) return;
      if (event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.matches('input, textarea, select')) return;
        if (target.isContentEditable) return;
      }

      // Shortcuts only work while focus is inside the drum kit.
      const scope = scopeRef.current;
      if (!scope || !scope.contains(document.activeElement)) return;

      if (!validCodes.has(event.code)) return;

      const code = event.code as DrumCode;
      event.preventDefault();

      setActiveCodes((previous) => new Set(previous).add(code));
      onTrigger(code);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!validCodes.has(event.code)) return;

      const code = event.code as DrumCode;
      setActiveCodes((previous) => {
        const next = new Set(previous);
        next.delete(code);
        return next;
      });
    };

    const onVisibilityChange = () => {
      if (document.hidden) clearActive();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearActive);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearActive);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [scopeRef, onTrigger, isEnabled]);

  return { activeCodes };
}
