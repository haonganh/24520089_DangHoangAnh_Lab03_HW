
import { useCallback, useEffect, useRef, useState } from 'react';
import Piano from './components/Piano';
import { pianoKeys } from './music/pianoKeys';
import { PolyphonicSynth } from './audio/PolyphonicSynth';
import './App.css';

function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const timersRef = useRef<Set<number>>(new Set());
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    const synth = new PolyphonicSynth();
    synthRef.current = synth;

    const timers = timersRef.current;

    return () => {
      synthRef.current = null;

      for (const timer of timers) {
        window.clearTimeout(timer);
      }

      timers.clear();
      synth.dispose();
    };
  }, []);

  const handlePlay = useCallback((midi: number) => {
    console.log('Piano clicked:', midi);

    const synth = synthRef.current;
    const note = pianoKeys.find((key) => key.midi === midi);

    if (!synth || !note) return;

    setAudioError('');

    void synth.noteOn(midi, note.frequency)
      .then((voiceId) => {
        if (synthRef.current !== synth) return;

        const timer = window.setTimeout(() => {
          synth.noteOff(voiceId);
          timersRef.current.delete(timer);
        }, 800);

        timersRef.current.add(timer);
      })
      .catch((error: unknown) => {
        if (synthRef.current !== synth) return;

        console.error('Audio error:', error);
        setAudioError('Unable to play the piano note.');
      });
  }, []);

  return (
    <main>
      <h1>Polyphonic Piano Studio</h1>

      <Piano onPlay={handlePlay} />

      {audioError && (
        <p role="alert">{audioError}</p>
      )}
    </main>
  );
}

export default App;
