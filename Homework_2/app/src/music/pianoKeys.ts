
export interface PianoKeyData {
  midi: number;
  noteName: string;
  frequency: number;
  isBlack: boolean;
}

const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const BLACK_NOTES = new Set([1, 3, 6, 8, 10]);

export const pianoKeys: PianoKeyData[] = Array.from(
  { length: 88 },
  (_, index) => {
    const midi = index + 21;
    const pitchClass = midi % 12;
    const octave = Math.floor(midi / 12) - 1;

    return {
      midi,
      noteName: `${NOTE_NAMES[pitchClass]}${octave}`,
      frequency: 440 * Math.pow(2, (midi - 69) / 12),
      isBlack: BLACK_NOTES.has(pitchClass),
    };
  }
);
