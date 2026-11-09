import { Leaderboard } from './components/Leaderboard';
import {
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { AirdropCountdown } from './components/AirdropCountdown';

import { demoDrops } from './demo/demoFixtures';

import {
  claimReducer,
  createClaimState,
  getAvailableStock,
} from './inventory/claim-machine';

import { createMockClaimApi } from './api/mock-claim-api';
import { executeOptimisticClaim } from './api/optimistic-claim';

import { getDropPhase } from './airdrop/airdrop-phase-machine';

import './App.css';

function App() {
  const [claimState, dispatch] = useReducer(
    claimReducer,
    demoDrops,
    createClaimState
  );

  // Keep server inventory stable across React re-renders.
  const [api] = useState(() =>
    createMockClaimApi(demoDrops, 400)
  );

  // Allows testing without waiting 15 minutes.
  const [demoStartEpoch, setDemoStartEpoch] =
    useState<number | null>(null);

  const [pendingByDrop, setPendingByDrop] =
    useState<Record<string, boolean>>({});

  const [messages, setMessages] =
    useState<Record<string, string>>({});

  // Prevent duplicate requests before React re-renders.
  const pendingDropIds = useRef(new Set<string>());

  const controllersRef = useRef(
    new Set<AbortController>()
  );

  useEffect(() => {
    const controllers = controllersRef.current;

    return () => {
      // Cancel pending requests on unmount.
      for (const controller of controllers) {
        controller.abort();
      }

      controllers.clear();
    };
  }, []);

  const activateDemo = () => {
    // Airdrop opened one second ago.
    setDemoStartEpoch(Date.now() - 1000);
  };

  const handleClaim = async (
    dropId: string,
    simulate409: boolean
  ) => {
    if (pendingDropIds.current.has(dropId)) {
      return;
    }

    const originalDrop = demoDrops.find(
      (drop) => drop.id === dropId
    );

    if (!originalDrop) return;

    const stock = getAvailableStock(
      claimState,
      dropId
    );

    const phase = getDropPhase(
      {
        dropEpochMs:
          demoStartEpoch ?? originalDrop.dropEpochMs,
        remainingStock: stock,
      },
      Date.now()
    );

    if (phase !== 'AIRDROP_LIVE') {
      return;
    }

    pendingDropIds.current.add(dropId);

    setPendingByDrop((previous) => ({
      ...previous,
      [dropId]: true,
    }));

    setMessages((previous) => ({
      ...previous,
      [dropId]: 'Processing claim...',
    }));

    const controller = new AbortController();
    controllersRef.current.add(controller);

    const claimId = crypto.randomUUID();

    try {
      const outcome = await executeOptimisticClaim(
        api,
        {
          claimId,
          dropId,
          signal: controller.signal,
          simulateHttp409: simulate409,
        },
        dispatch
      );

      if (outcome === 'CONFIRMED') {
        setMessages((previous) => ({
          ...previous,
          [dropId]: 'Claim confirmed successfully.',
        }));
      } else {
        setMessages((previous) => ({
          ...previous,
          [dropId]: simulate409
            ? 'Claim rejected (HTTP 409). Inventory restored.'
            : 'Claim failed. Inventory restored.',
        }));
      }
    } catch (error) {
      console.error('Claim error:', error);

      setMessages((previous) => ({
        ...previous,
        [dropId]: 'Unable to process claim.',
      }));
    } finally {
      controllersRef.current.delete(controller);
      pendingDropIds.current.delete(dropId);

      setPendingByDrop((previous) => ({
        ...previous,
        [dropId]: false,
      }));
    }
  };

  return (
    <>
      <header className="site-header">
        <h1>KRAFTON × PUBG Vietnam Championship</h1>

        <p>Airdrop Arena – Unofficial Demo</p>
      </header>

      <main id="main-content">
        <section aria-labelledby="arena-title">
          <h2 id="arena-title">
            PUBG Vietnam Airdrop Arena
          </h2>

          <p>
            Claim championship VIP passes and
            G-Coin crates in this simulated event.
          </p>

          <div className="demo-controls">
            <button
              type="button"
              onClick={activateDemo}
              disabled={demoStartEpoch !== null}
            >
              {demoStartEpoch === null
                ? 'Activate live demo'
                : 'Live demo activated'}
            </button>

            <p>
              Demo mode activates both airdrops
              immediately for testing.
            </p>
          </div>

          <div className="drop-grid">
            {demoDrops.map((drop) => {
              const remainingStock =
                getAvailableStock(
                  claimState,
                  drop.id
                );

              return (
                <AirdropCountdown
                  key={drop.id}
                  drop={{
                    ...drop,
                    remainingStock,
                    dropEpochMs:
                      demoStartEpoch ??
                      drop.dropEpochMs,
                  }}
                  isPending={
                    pendingByDrop[drop.id] ?? false
                  }
                  message={
                    messages[drop.id] ?? ''
                  }
                  onClaim={handleClaim}
                />
              );
            })}
          </div>
        </section>
        <Leaderboard />
      </main>

      <footer className="site-footer">
        <p>
          Educational project – Not affiliated
          with KRAFTON or PUBG.
        </p>
      </footer>
    </>
  );
}

export default App;
