
import { useCallback, useEffect, useRef, useState } from 'react';
import DrumPad from './DrumPad';
import HitLog, { type HitEntry } from './HitLog';
import { drumPads, type DrumCode } from '../config/drumPads';
import { useDrumKeyboard } from '../hooks/useDrumKeyboard';
import { AudioEngine } from '../audio/audioEngine';

export default function DrumKit() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioEngine | null>(null);

  const [audioError, setAudioError] = useState('');
  const [hits, setHits] = useState<HitEntry[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const hitIdRef = useRef(0);
  const pendingRef = useRef({
    count: 0,
    latest: '',
  });

  useEffect(() => {
    const engine = new AudioEngine();
    audioRef.current = engine;

    return () => {
      audioRef.current = null;
      engine.dispose();
    };
  }, []);

  // Throttle screen-reader announcements to avoid flooding.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const { count, latest } = pendingRef.current;

      if (count === 0) return;

      setAnnouncement(
        count === 1
          ? `${latest} drum triggered.`
          : `${count} drum hits triggered. Latest: ${latest}.`
      );

      pendingRef.current = { count: 0, latest: '' };
    }, 1200);

    return () => window.clearInterval(timer);
  }, []);

  const handleTrigger = useCallback(async (code: DrumCode) => {
    const pad = drumPads.find((item) => item.code === code);
    if (!pad) return;

    // Record every hit, including rapid sequences.
    const entry: HitEntry = {
      id: ++hitIdRef.current,
      name: pad.name,
      time: new Date().toLocaleTimeString(),
    };

    setHits((previous) => [entry, ...previous].slice(0, 12));

    pendingRef.current.count += 1;
    pendingRef.current.latest = pad.name;

    const engine = audioRef.current;
    if (!engine) return;

    setAudioError('');

    try {
      await engine.play(code);
    } catch (error) {
      console.error(`Audio playback failed for ${code}:`, error);

      if (audioRef.current !== engine) return;

      setAudioError(
        `Unable to play ${pad.name} sound. Check the audio file.`
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

      <HitLog
        hits={hits}
        announcement={announcement}
      />
    </section>
  );
}
