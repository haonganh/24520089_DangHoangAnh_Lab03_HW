
import { useCallback, useRef } from 'react';
import DrumPad from './DrumPad';
import { drumPads, type DrumCode } from '../config/drumPads';
import { useDrumKeyboard } from '../hooks/useDrumKeyboard';

export default function DrumKit() {
  const scopeRef = useRef<HTMLDivElement>(null);

  const handleTrigger = useCallback((code: DrumCode) => {
    console.log('Drum triggered:', code);
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
              onActivate={handleTrigger}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
