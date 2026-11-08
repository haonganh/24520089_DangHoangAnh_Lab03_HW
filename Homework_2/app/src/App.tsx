
import { useCallback, useEffect, useRef, useState } from 'react';
import Piano from './components/Piano';
import { pianoKeys } from './music/pianoKeys';
import { PolyphonicSynth } from './audio/PolyphonicSynth';
import {
  NoteRecorder,
  type RecordedNote,
} from './sequencer/NoteRecorder';
import {
  ReplayScheduler,
  type ReplaySpeed,
} from './sequencer/ReplayScheduler';
import './App.css';

interface HeldVoice {
  voiceId: number | null;
}

function App() {
  const synthRef = useRef<PolyphonicSynth | null>(null);
  const schedulerRef = useRef<ReplayScheduler | null>(null);
  const recorderRef = useRef(new NoteRecorder());
  const heldRef = useRef(new Map<number, HeldVoice>());

  const [audioError, setAudioError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);

  // T10 - Replay state
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [replayStatus, setReplayStatus] = useState('Ready to record.');

  useEffect(() => {
    const synth = new PolyphonicSynth();
    const scheduler = new ReplayScheduler();

    synthRef.current = synth;
    schedulerRef.current = scheduler;

    const held = heldRef.current;
    const recorder = recorderRef.current;

    return () => {
      scheduler.stop();
      scheduler.dispose();

      schedulerRef.current = null;
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

  // T07 - Start piano note
  const handleNoteOn = useCallback((midi: number) => {
    const synth = synthRef.current;
    const note = pianoKeys[midi - 21];

    if (!synth || !note || note.midi !== midi) return;
    if (heldRef.current.has(midi)) return;

    const heldVoice: HeldVoice = { voiceId: null };
    heldRef.current.set(midi, heldVoice);

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

  // T07 - Release piano note
  const handleNoteOff = useCallback((midi: number) => {
    recorderRef.current.noteOff(midi);

    const voice = heldRef.current.get(midi);
    if (!voice) return;

    heldRef.current.delete(midi);

    if (voice.voiceId !== null) {
      synthRef.current?.noteOff(voice.voiceId);
    }
  }, []);

  // T08 - Recording controls
  const startRecording = useCallback(() => {
    recorderRef.current.start();
    setRecordedNotes([]);
    setIsRecording(true);
    setReplayStatus('Recording in progress.');
  }, []);

  const stopRecording = useCallback(() => {
    const notes = recorderRef.current.stop();

    setRecordedNotes(notes);
    setIsRecording(false);
    setReplayStatus(`${notes.length} notes recorded.`);
  }, []);

  const clearRecording = useCallback(() => {
    recorderRef.current.clear();
    setRecordedNotes([]);
    setIsRecording(false);
    setReplayStatus('Recording cleared.');
  }, []);

  // T10 - Replay recorded notes
  const startReplay = useCallback(async () => {
    const synth = synthRef.current;
    const scheduler = schedulerRef.current;

    if (!synth || !scheduler || recordedNotes.length === 0) {
      return;
    }

    if (scheduler.isPlaying || isRecording) return;

    setAudioError('');
    setIsPlaying(true);
    setIsStopping(false);
    setReplayStatus(`Replaying at ${replaySpeed}x speed.`);

    try {
      await scheduler.play(recordedNotes, replaySpeed, {
        noteOn: (midi, freqHz) => synth.noteOn(midi, freqHz),
        noteOff: (voiceId) => synth.noteOff(voiceId),
      });

      if (schedulerRef.current === scheduler) {
        setReplayStatus('Replay completed.');
      }
    } catch (error: unknown) {
      if (schedulerRef.current !== scheduler) return;

      if (
        error instanceof DOMException &&
        error.name === 'AbortError'
      ) {
        setReplayStatus('Replay stopped.');
      } else {
        console.error('Replay failed:', error);
        setAudioError('Unable to replay the recording.');
        setReplayStatus('Replay failed.');
      }
    } finally {
      if (schedulerRef.current === scheduler) {
        setIsPlaying(false);
        setIsStopping(false);
      }
    }
  }, [recordedNotes, replaySpeed, isRecording]);

  // T10 - Cancel replay
  const stopReplay = useCallback(() => {
    schedulerRef.current?.stop();
    setIsStopping(true);
    setReplayStatus('Stopping replay...');
  }, []);

  return (
    <main>
      <h1>Polyphonic Piano Studio</h1>

      <Piano
        onNoteOn={handleNoteOn}
        onNoteOff={handleNoteOff}
      />

      {audioError && <p role="alert">{audioError}</p>}

      <section
        className="recorder-section"
        aria-labelledby="recorder-heading"
      >
        <h2 id="recorder-heading">Piano Recorder</h2>

        <div className="recorder-controls">
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording || isPlaying}
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
              isPlaying ||
              recordedNotes.length === 0
            }
          >
            Clear
          </button>
        </div>

        {/* T10 - Replay controls */}
        <section aria-labelledby="replay-heading">
          <h3 id="replay-heading">Melody Replay</h3>

          <label htmlFor="replay-speed">
            Playback Speed
          </label>

          <select
            id="replay-speed"
            value={replaySpeed}
            disabled={isPlaying || isRecording}
            onChange={(event) => {
              setReplaySpeed(
                Number(event.target.value) as ReplaySpeed
              );
            }}
          >
            <option value={0.5}>0.5x - Slow</option>
            <option value={1}>1x - Normal</option>
            <option value={2}>2x - Fast</option>
          </select>

          <button
            type="button"
            onClick={() => void startReplay()}
            disabled={
              isRecording ||
              isPlaying ||
              recordedNotes.length === 0
            }
          >
            Replay
          </button>

          <button
            type="button"
            onClick={stopReplay}
            disabled={!isPlaying || isStopping}
          >
            Stop Replay
          </button>
        </section>

        <p role="status" aria-live="polite">
          {replayStatus}
        </p>

        <p>
          Total recorded notes: {recordedNotes.length}
        </p>

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
