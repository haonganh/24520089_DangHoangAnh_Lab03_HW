
// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  cleanup,
  render,
  screen,
  within,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';

import App from './App';

describe('T13 - PUBG Arena Integration Tests', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 't13-claim-id'),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // TEST 1: Optimistic Claim
  it('confirms a successful claim', async () => {
    const user = userEvent.setup();

    render(<App />);

    const card = screen.getByRole('article', {
      name: /PVS Finals VIP Pass/i,
    });

    // Claim is unavailable before the drop opens.
    expect(
      within(card).queryByRole('button', {
        name: 'Claim item',
      })
    ).toBeNull();

    await user.click(
      screen.getByRole('button', {
        name: 'Activate live demo',
      })
    );

    await user.click(
      within(card).getByRole('button', {
        name: 'Claim item',
      })
    );

    // Stock decreases immediately.
    expect(
      within(card).getByText('49')
    ).toBeDefined();

    // Wait for mock API confirmation.
    await within(card).findByText(
      'Claim confirmed successfully.'
    );

    expect(
      within(card).getByText('49')
    ).toBeDefined();
  });

  // TEST 2: HTTP 409 Rollback
  it('restores inventory after HTTP 409', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Activate live demo',
      })
    );

    const card = screen.getByRole('article', {
      name: /PVS Finals VIP Pass/i,
    });

    await user.click(
      within(card).getByRole('button', {
        name: 'Simulate HTTP 409',
      })
    );

    // Optimistic update.
    expect(
      within(card).getByText('49')
    ).toBeDefined();

    // Wait for rollback.
    await within(card).findByText(
      /Claim rejected \(HTTP 409\)/i
    );

    // Original stock is restored.
    expect(
      within(card).getByText('50')
    ).toBeDefined();
  });

  // TEST 3: Leaderboard Filtering
  it('filters PUBG squads correctly', async () => {
    const user = userEvent.setup();

    render(<App />);

    const search = screen.getByRole('searchbox', {
      name: 'Search squads',
    });

    await user.type(search, 'Cerberus');

    const table = screen.getByRole('table');

    expect(
      within(table).getByText('Cerberus Esports')
    ).toBeDefined();

    expect(
      within(table).queryByText('The Expendables')
    ).toBeNull();
  });

  // TEST 4: Virtual Scroller
  it('virtualizes 1000 combat events', async () => {
    const user = userEvent.setup();

    const { container } = render(<App />);

    await user.click(
      screen.getByRole('button', {
        name: 'Load 1,000 test events',
      })
    );

    expect(
      screen.getByText(
        'Showing 1004 of 1004 events.'
      )
    ).toBeDefined();

    // Only visible rows should be in the DOM.
    const visibleRows = container.querySelectorAll(
      '.virtual-killfeed-viewport li'
    );

    expect(visibleRows.length).toBeGreaterThan(0);
    expect(visibleRows.length).toBeLessThan(20);

    // Accessible fallback: display every event.
    await user.click(
      screen.getByRole('button', {
        name: 'Show all events',
      })
    );

    const allRows = container.querySelectorAll(
      '.killfeed-list > ol li'
    );

    expect(allRows).toHaveLength(1004);
  });
});
