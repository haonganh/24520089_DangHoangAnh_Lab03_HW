
import { useCallback, useEffect, useRef, useState } from 'react';
import PianoKey from './PianoKey';
import { pianoKeys } from '../music/pianoKeys';

const WHITE_WIDTH = 48;
const BLACK_WIDTH = 30;

let whiteCount = 0;

const positionedKeys = pianoKeys.map((note) => {
  const leftPx = note.isBlack
    ? whiteCount * WHITE_WIDTH - BLACK_WIDTH / 2
    : whiteCount++ * WHITE_WIDTH;

  return { note, leftPx };
});

interface PianoProps {
  onNoteOn: (midi: number) => void;
  onNoteOff: (midi: number) => void;
}

export default function Piano({
  onNoteOn,
  onNoteOff,
}: PianoProps) {
  const activeRef = useRef(new Set<number>());
  const [activeMidi, setActiveMidi] = useState<Set<number>>(
    () => new Set()
  );
  const [resetToken, setResetToken] = useState(0);

  const handleNoteOn = useCallback((midi: number) => {
    if (activeRef.current.has(midi)) return;

    activeRef.current.add(midi);
    setActiveMidi(new Set(activeRef.current));
    onNoteOn(midi);
  }, [onNoteOn]);

  const handleNoteOff = useCallback((midi: number) => {
    if (!activeRef.current.delete(midi)) return;

    setActiveMidi(new Set(activeRef.current));
    onNoteOff(midi);
  }, [onNoteOff]);

  const releaseAll = useCallback(() => {
    for (const midi of activeRef.current) {
      onNoteOff(midi);
    }

    activeRef.current.clear();
    setActiveMidi(new Set());
    setResetToken((previous) => previous + 1);
  }, [onNoteOff]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) releaseAll();
    };

    window.addEventListener('blur', releaseAll);
    document.addEventListener(
      'visibilitychange',
      onVisibilityChange
    );

    return () => {
      window.removeEventListener('blur', releaseAll);
      document.removeEventListener(
        'visibilitychange',
        onVisibilityChange
      );

      for (const midi of activeRef.current) {
        onNoteOff(midi);
      }

      activeRef.current.clear();
    };
  }, [releaseAll, onNoteOff]);

  return (
    <section aria-labelledby="piano-heading">
      <h2 id="piano-heading">88-Key Piano</h2>

      <p id="piano-instructions">
        Use Tab to select a piano key.
        Hold Enter or Space to play, then release to stop.
        You can also press and hold a key using a mouse
        or touchscreen.
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
              isActive={activeMidi.has(note.midi)}
              resetToken={resetToken}
              onNoteOn={handleNoteOn}
              onNoteOff={handleNoteOff}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
