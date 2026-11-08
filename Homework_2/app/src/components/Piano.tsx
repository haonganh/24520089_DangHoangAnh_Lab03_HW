
import { useCallback, useEffect, useRef, useState } from 'react';
import PianoKey from './PianoKey';
import { pianoKeys } from '../music/pianoKeys';

const WHITE_WIDTH = 48;
const BLACK_WIDTH = 30;

// Generate key positions while preserving MIDI order (21–108).
// This ensures accessible Tab navigation from A0 to C8.
let whiteCount = 0;

const positionedKeys = pianoKeys.map((note) => {
  const leftPx = note.isBlack
    ? whiteCount * WHITE_WIDTH - BLACK_WIDTH / 2
    : whiteCount++ * WHITE_WIDTH;

  return { note, leftPx };
});

interface PianoProps {
  onPlay?: (midi: number) => void;
}

export default function Piano({ onPlay }: PianoProps) {
  const [activeMidi, setActiveMidi] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePlay = useCallback(
    (midi: number) => {
      setActiveMidi(midi);

      // Clear the previous visual feedback timer.
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }

      // Reset the active key after 150ms.
      timerRef.current = setTimeout(() => {
        setActiveMidi(null);
      }, 150);

      onPlay?.(midi);
    },
    [onPlay]
  );

  // Clean up timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <section aria-labelledby="piano-heading">
      <h2 id="piano-heading">88-Key Piano</h2>

      <p id="piano-instructions">
        Use Tab to select a piano key.
        Press Enter or Space to play.
        You can also click or tap any key.
      </p>

      <div
        className="piano-scroll"
        role="region"
        aria-label="Scrollable piano keyboard"
        aria-describedby="piano-instructions"
        tabIndex={0}
      >
        <div className="piano-track">
          {positionedKeys.map(({ note, leftPx }) => (
            <PianoKey
              key={note.midi}
              note={note}
              leftPx={leftPx}
              isActive={activeMidi === note.midi}
              onPlay={handlePlay}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
