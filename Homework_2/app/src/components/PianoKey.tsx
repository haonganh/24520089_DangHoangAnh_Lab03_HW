
import { memo, useEffect, useRef } from 'react';
import type {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
} from 'react';
import type { PianoKeyData } from '../music/pianoKeys';

interface PianoKeyProps {
  note: PianoKeyData;
  isActive: boolean;
  leftPx: number;
  resetToken: number;
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

function PianoKey({
  note,
  isActive,
  leftPx,
  resetToken,
  onNoteOn,
  onNoteOff,
}: PianoKeyProps) {
  const pointers = useRef(new Set<number>());
  const keyboardDown = useRef(false);
  const assistiveDown = useRef(false);
  const pressed = useRef(false);
  const assistiveTimer = useRef<number | null>(null);
  const lastKeyboardTime = useRef(-Infinity);

  const syncNote = () => {
    const shouldPlay =
      pointers.current.size > 0 ||
      keyboardDown.current ||
      assistiveDown.current;

    if (shouldPlay === pressed.current) return;

    pressed.current = shouldPlay;

    if (shouldPlay) onNoteOn(note.midi);
    else onNoteOff(note.midi);
  };

  // Reset local input state after window blur or tab hiding.
  useEffect(() => {
    pointers.current.clear();
    keyboardDown.current = false;
    assistiveDown.current = false;
    pressed.current = false;

    if (assistiveTimer.current !== null) {
      window.clearTimeout(assistiveTimer.current);
      assistiveTimer.current = null;
    }
  }, [resetToken]);

  useEffect(() => {
    return () => {
      if (assistiveTimer.current !== null) {
        window.clearTimeout(assistiveTimer.current);
      }

      if (pressed.current) {
        onNoteOff(note.midi);
      }
    };
  }, [note.midi, onNoteOff]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    pointers.current.add(event.pointerId);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable.
    }

    syncNote();
  };

  const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointers.current.delete(event.pointerId)) {
      syncNote();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    if (
      event.nativeEvent.isComposing ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    event.preventDefault();
    lastKeyboardTime.current = performance.now();

    if (event.repeat || keyboardDown.current) return;

    keyboardDown.current = true;
    syncNote();
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    lastKeyboardTime.current = performance.now();

    keyboardDown.current = false;
    syncNote();
  };

  // Fallback for screen readers that activate buttons via click.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return;

    if (performance.now() - lastKeyboardTime.current < 250) {
      return;
    }

    assistiveDown.current = true;
    syncNote();

    if (assistiveTimer.current !== null) {
      window.clearTimeout(assistiveTimer.current);
    }

    assistiveTimer.current = window.setTimeout(() => {
      assistiveDown.current = false;
      assistiveTimer.current = null;
      syncNote();
    }, 200);
  };

  return (
    <button
      type="button"
      className={`piano-key ${note.isBlack ? 'black' : 'white'}`}
      style={{ left: leftPx }}
      data-active={isActive}
      aria-label={`Play ${note.noteName}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onBlur={() => {
        keyboardDown.current = false;
        syncNote();
      }}
      onClick={handleClick}
    >
      <span aria-hidden="true">{note.noteName}</span>
    </button>
  );
}

export default memo(PianoKey);
