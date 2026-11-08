
import { useCallback, useEffect, useRef, useState } from 'react';
import Piano from './components/Piano';
import { pianoKeys } from './music/pianoKeys';
import { PolyphonicSynth } from './audio/PolyphonicSynth';
import {
  NoteRecorder,
  type RecordedNote,
} from './sequencer/NoteRecorder';
import './App.css';

interface HeldVoice {
  voiceId: number | null;
}

function App() {
  // T05-T07: Polyphonic synthesizer
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const heldRef = useRef(new Map<number, HeldVoice>());

  // T08: MIDI recording
  const recorderRef = useRef(new NoteRecorder());

  const [audioError, setAudioError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);

  // Initialize and clean up audio resources.
  useEffect(() => {
    const synth = new PolyphonicSynth();
    synthRef.current = synth;

    const held = heldRef.current;
    const recorder = recorderRef.current;

    return () => {
      synthRef.current = null;

      for (const voice of held.values()) {
        if (voice.voiceId !== null) {
          synth.noteOff(voice.voiceId);
        }
      }

      held.clear();
      recorder.clear();
      synth.dispose();
    };
  }, []);

  // T07 + T08: Start a note and record its onset.
  const handleNoteOn = useCallback((midi: number) => {
    const synth = synthRef.current;
    const note = pianoKeys[midi - 21];

    if (!synth || !note || note.midi !== midi) return;
    if (heldRef.current.has(midi)) return;

    const heldVoice: HeldVoice = {
      voiceId: null,
    };

    heldRef.current.set(midi, heldVoice);

    // T08: Record note-on event.
    recorderRef.current.noteOn(midi, note.frequency);

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

  // T07 + T08: Stop a note and record its duration.
  const handleNoteOff = useCallback((midi: number) => {
    recorderRef.current.noteOff(midi);

    const voice = heldRef.current.get(midi);
    if (!voice) return;

    heldRef.current.delete(midi);

    if (voice.voiceId !== null) {
      synthRef.current?.noteOff(voice.voiceId);
    }
  }, []);

  // T08: Start recording.
  const startRecording = useCallback(() => {
    recorderRef.current.start();

    setRecordedNotes([]);
    setIsRecording(true);
  }, []);

  // T08: Stop recording and retrieve notes.
  const stopRecording = useCallback(() => {
    const notes = recorderRef.current.stop();

    setRecordedNotes(notes);
    setIsRecording(false);
  }, []);

  // T08: Clear recorded notes.
  const clearRecording = useCallback(() => {
    recorderRef.current.clear();

    setRecordedNotes([]);
    setIsRecording(false);
  }, []);

  return (
    <main>
      <h1>Polyphonic Piano Studio</h1>

      {/* T04-T07: Accessible 88-key piano */}
      <Piano
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      {/* Audio error feedback */}
      {audioError && (
        <p role="alert">{audioError}</p>
      )}

      {/* T08: Recording controls */}
      <section
        className="recorder-section"
        aria-labelledby="recorder-heading"
      >
        <h2 id="recorder-heading">Piano Recorder</h2>

        <div className="recorder-controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
          >
            Start Recording
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
          >
            Stop Recording
          </button>

          <button
            type="button"
            onClick={clearRecording}
            disabled={
              isRecording ||
              recordedNotes.length === 0
            }
          >
            Clear
          </button>
        </div>

        {/* Accessible recording status */}
        <p role="status" aria-live="polite">
          {isRecording
            ? 'Recording in progress...'
            : `${recordedNotes.length} notes recorded.`}
        </p>

        {/* Recorded note history */}
        {recordedNotes.length > 0 && (
          <section aria-labelledby="recorded-notes-heading">
            <h3 id="recorded-notes-heading">
              Recorded Notes
            </h3>

            <ol className="recorded-notes-list">
              {recordedNotes.map((note, index) => (
                <li key={index}>
                  <strong>MIDI {note.midi}</strong>
                  {' — '}
                  Frequency: {note.freqHz.toFixed(2)} Hz
                  {' — '}
                  Duration: {note.durationMs} ms
                  {' — '}
                  Delta: {note.deltaMs} ms
                </li>
              ))}
            </ol>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
