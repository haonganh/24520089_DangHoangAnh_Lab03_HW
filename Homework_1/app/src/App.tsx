
import DrumKit from './components/DrumKit';
import './App.css';

function App() {
  return (
    <main className="app-container">
      <header className="app-header">
        <h1>Production Studio Drum Kit</h1>
        <p>
          Create drum beats using your keyboard,
          mouse, or touch.
        </p>
      </header>

      <DrumKit />
    </main>
  );
}

export default App;
