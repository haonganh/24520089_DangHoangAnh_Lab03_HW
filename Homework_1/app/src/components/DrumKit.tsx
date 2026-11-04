
import { useCallback, useEffect, useRef, useState } from 'react';
import DrumPad from './DrumPad';
import HitLog, { type HitEntry } from './HitLog';
import SignalLevelMeter from './SignalLevelMeter';
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

  // T05 - Initialize and clean up the audio engine.
  useEffect(() => {
    const engine = new AudioEngine();
    audioRef.current = engine;

    return () => {
      audioRef.current = null;
      engine.dispose();
    };
  }, []);

  // T06 - Throttle screen-reader announcements.
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

  // T07 - Provide audio analyser to the signal meter.
  const getAnalyser = useCallback(() => {
    return audioRef.current?.getAnalyser() ?? null;
  }, []);

  // T05 + T06 - Shared drum activation pipeline.
  const handleTrigger = useCallback(async (code: DrumCode) => {
    const pad = drumPads.find((item) => item.code === code);
    if (!pad) return;

    // T06 - Record every drum hit.
    const entry: HitEntry = {
      id: ++hitIdRef.current,
      name: pad.name,
      time: new Date().toLocaleTimeString(),
    };

    setHits((previous) => [entry, ...previous].slice(0, 12));

    pendingRef.current.count += 1;
    pendingRef.current.latest = pad.name;

    // T05 - Play the corresponding audio sample.
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

  // T03 - WCAG-aware keyboard shortcut handling.
  const { activeCodes } = useDrumKeyboard({
    scopeRef,
    onTrigger: handleTrigger,
  });

  return (
    <section aria-labelledby="drum-kit-heading">
      <h2 id="drum-kit-heading">Drum Kit</h2>

      {/* T03 + T04 - Keyboard focus scope and accessible pads */}
      <div
        ref={scopeRef}
         role="group"
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

      {/* T05 - Accessible audio error feedback */}
      {audioError && (
        <p role="alert">{audioError}</p>
      )}

      {/* T07 - Accessible audio signal level meter */}
      <SignalLevelMeter getAnalyser={getAnalyser} />

      {/* T06 - Accessible visual hit history */}
      <HitLog
        hits={hits}
        announcement={announcement}
      />
    </section>
  );
}
