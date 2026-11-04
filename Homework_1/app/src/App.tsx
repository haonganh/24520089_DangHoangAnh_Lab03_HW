
import { useCallback, useRef } from 'react';
import { useDrumKeyboard } from './hooks/useDrumKeyboard';
import type { DrumCode } from './config/drumPads';

function App() {
  const scopeRef = useRef<HTMLDivElement>(null);

  const handleTrigger = useCallback((code: DrumCode) => {
    console.log('Drum triggered:', code);
  }, []);

  const { activeCodes } = useDrumKeyboard({
    scopeRef,
    onTrigger: handleTrigger,
  });

  return (
    <main>
      <h1>Production Studio Drum Kit</h1>

      <div ref={scopeRef} tabIndex={0} aria-label="Drum kit keyboard area">
        <p>Focus here, then press W A S D J K L.</p>
        <p>Active pads: {Array.from(activeCodes).join(', ') || 'None'}</p>
      </div>

      <input aria-label="Test text input" />
    </main>
  );
}

export default App;
