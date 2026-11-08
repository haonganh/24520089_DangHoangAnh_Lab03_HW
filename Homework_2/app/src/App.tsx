
import { useCallback } from 'react';
import Piano from './components/Piano';
import './App.css';

function App() {
  const handlePlay = useCallback((midi: number) => {
    console.log('Piano note:', midi);
  }, []);

  return (
    <main>
      <h1>Polyphonic Piano Studio</h1>
      <Piano onPlay={handlePlay} />
    </main>
  );
}

export default App;
