
import { useCallback, useEffect, useRef, useState } from 'react';
import Piano from './components/Piano';
import { pianoKeys } from './music/pianoKeys';
import { PolyphonicSynth } from './audio/PolyphonicSynth';
import './App.css';

interface HeldVoice {
  voiceId: number | null;
}

function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const heldRef = useRef(new Map<number, HeldVoice>());
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    const synth = new PolyphonicSynth();
    synthRef.current = synth;
    const held = heldRef.current;

    return () => {
      synthRef.current = null;

      for (const voice of held.values()) {
        if (voice.voiceId !== null) {
          synth.noteOff(voice.voiceId);
        }
      }

      held.clear();
      synth.dispose();
    };
  }, []);

  const handleNoteOn = useCallback((midi: number) => {
    const synth = synthRef.current;
    const note = pianoKeys[midi - 21];

    if (!synth || !note || note.midi !== midi) return;
    if (heldRef.current.has(midi)) return;

    const heldVoice: HeldVoice = { voiceId: null };
    heldRef.current.set(midi, heldVoice);

    setAudioError('');

    void synth.noteOn(midi, note.frequency)
      .then((voiceId) => {
        if (
          synthRef.current !== synth ||
          heldRef.current.get(midi) !== heldVoice
        ) {
          synth.noteOff(voiceId);
          return;
        }

        heldVoice.voiceId = voiceId;
      })
      .catch((error: unknown) => {
        if (
          synthRef.current !== synth ||
          heldRef.current.get(midi) !== heldVoice
        ) {
          return;
        }

        heldRef.current.delete(midi);
        console.error('Piano audio error:', error);
        setAudioError('Unable to play the piano note.');
      });
  }, []);

  const handleNoteOff = useCallback((midi: number) => {
    const voice = heldRef.current.get(midi);
    if (!voice) return;

    heldRef.current.delete(midi);

    if (voice.voiceId !== null) {
      synthRef.current?.noteOff(voice.voiceId);
    }
  }, []);

  return (
    <main>
      <h1>Polyphonic Piano Studio</h1>

      <Piano
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      {audioError && (
        <p role="alert">{audioError}</p>
      )}
    </main>
  );
}

export default App;
