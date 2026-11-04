
import { useCallback, useEffect, useRef, useState } from 'react';
import DrumPad from './DrumPad';
import { drumPads, type DrumCode } from '../config/drumPads';
import { useDrumKeyboard } from '../hooks/useDrumKeyboard';
import { AudioEngine } from '../audio/audioEngine';

export default function DrumKit() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    const engine = new AudioEngine();
    audioRef.current = engine;

    return () => {
      audioRef.current = null;
      engine.dispose();
    };
  }, []);

  const handleTrigger = useCallback(async (code: DrumCode) => {
    const engine = audioRef.current;
    if (!engine) return;

    setAudioError('');

    try {
      await engine.play(code);
    } catch {
      if (audioRef.current !== engine) return;

      const pad = drumPads.find((item) => item.code === code);
      setAudioError(
        `Unable to play ${pad?.name ?? 'drum'} sound. Check the audio file.`
      );
    }
  }, []);

  const { activeCodes } = useDrumKeyboard({
    scopeRef,
    onTrigger: handleTrigger,
  });

  return (
    <section aria-labelledby="drum-kit-heading">
      <h2 id="drum-kit-heading">Drum Kit</h2>

      <div
        ref={scopeRef}
        tabIndex={0}
        className="drum-kit"
        aria-label="Drum kit keyboard area"
        aria-describedby="drum-kit-instructions"
      >
        <p id="drum-kit-instructions">
          Focus here, then press W A S D J K L.
          Use Tab to navigate pads.
          Press Enter or Space to activate a focused pad.
        </p>

        <div className="drum-pad-grid">
          {drumPads.map((pad) => (
            <DrumPad
              key={pad.code}
              pad={pad}
              isActive={activeCodes.has(pad.code)}
              onActivate={(code) => {
                void handleTrigger(code);
              }}
            />
          ))}
        </div>
      </div>

      {audioError && (
        <p role="alert">{audioError}</p>
      )}
    </section>
  );
}
