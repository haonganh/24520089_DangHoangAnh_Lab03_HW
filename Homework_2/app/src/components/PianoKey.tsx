
import { memo } from 'react';
import type { PianoKeyData } from '../music/pianoKeys';

interface PianoKeyProps {
  note: PianoKeyData;
  isActive: boolean;
  onPlay: (midi: number) => void;
  leftPx?: number;
}

function PianoKey({
  note,
  isActive,
  onPlay,
  leftPx,
}: PianoKeyProps) {
  return (
    <button
      type="button"
      className={`piano-key ${note.isBlack ? 'black' : 'white'}`}
      style={leftPx === undefined ? undefined : { left: leftPx }}
      data-active={isActive}
      aria-label={`Play ${note.noteName}`}
      onClick={() => onPlay(note.midi)}
    >
      <span aria-hidden="true">{note.noteName}</span>
    </button>
  );
}

// Reuse React.memo shallow comparison from Lab 2 Slide 21.
export default memo(PianoKey);
