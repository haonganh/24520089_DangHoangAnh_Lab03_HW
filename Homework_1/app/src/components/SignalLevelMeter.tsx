
import { useEffect, useState } from 'react';

interface SignalLevelMeterProps {
  getAnalyser: () => AnalyserNode | null;
}

const MIN_DB = -60;
const MAX_DB = 0;

export default function SignalLevelMeter({
  getAnalyser,
}: SignalLevelMeterProps) {
  const [decibels, setDecibels] = useState(MIN_DB);

  useEffect(() => {
    let samples = new Float32Array(0);

    const timer = window.setInterval(() => {
      const analyser = getAnalyser();

      if (!analyser) {
        setDecibels(MIN_DB);
        return;
      }

      if (samples.length !== analyser.fftSize) {
        samples = new Float32Array(analyser.fftSize);
      }

      analyser.getFloatTimeDomainData(samples);

      let sum = 0;

      for (const sample of samples) {
        sum += sample * sample;
      }

      const rms = Math.sqrt(sum / samples.length);

      // Convert RMS signal amplitude to dBFS.
      const db = 20 * Math.log10(Math.max(rms, 0.001));

      const clamped = Math.max(
        MIN_DB,
        Math.min(MAX_DB, db)
      );

      setDecibels(Math.round(clamped * 10) / 10);
    }, 50);

    return () => window.clearInterval(timer);
  }, [getAnalyser]);

  const isSilent = decibels <= MIN_DB;

  return (
    <section
      className="signal-meter"
      aria-labelledby="signal-meter-heading"
    >
      <h3 id="signal-meter-heading">Audio Signal Level</h3>

      <label htmlFor="audio-level">
        Output level (dBFS)
      </label>

      <meter
        id="audio-level"
        min={MIN_DB}
        max={MAX_DB}
        value={decibels}
        aria-describedby="signal-level-value"
      />

      <p id="signal-level-value">
        {isSilent
          ? 'Below -60 dBFS (near silence)'
          : `${decibels.toFixed(1)} dBFS`}
      </p>

      <p className="signal-description">
        Digital audio signal level, not physical sound pressure
        (dB SPL).
      </p>
    </section>
  );
}
