
import { AirdropCountdown } from './components/AirdropCountdown';
import { demoDrops } from './demo/demoFixtures';
import './App.css';

function App() {
  return (
    <>
      <header>
        <h1>KRAFTON × PUBG Vietnam Championship</h1>
        <p>Airdrop Arena – Unofficial Demo</p>
      </header>

      <main id="main-content">
        <section aria-labelledby="airdrop-title">
          <h2 id="airdrop-title">
            PUBG Vietnam Airdrop Arena
          </h2>

          <p>
            Championship tickets and G-Coin crate drops.
          </p>

          {demoDrops.map((drop) => (
            <AirdropCountdown
              key={drop.id}
              drop={drop}
            />
          ))}
        </section>
      </main>

      <footer>
        <p>
          Educational project – Not affiliated with
          KRAFTON.
        </p>
      </footer>
    </>
  );
}

export default App;
