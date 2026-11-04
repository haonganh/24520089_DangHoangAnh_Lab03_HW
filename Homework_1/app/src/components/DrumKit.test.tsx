
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DrumKit from './DrumKit';
import { drumPads } from '../config/drumPads';

const mocks = vi.hoisted(() => ({
  play: vi.fn(),
  dispose: vi.fn(),
}));

// Mock Web Audio to test UI behavior independently.
vi.mock('../audio/audioEngine', () => ({
  AudioEngine: class {
    play = mocks.play;
    dispose = mocks.dispose;

    getAnalyser() {
      return null;
    }
  },
}));

beforeEach(() => {
  mocks.play.mockReset();
  mocks.play.mockResolvedValue(undefined);
  mocks.dispose.mockClear();
});

describe('T09 - Drum Kit integration', () => {
  it('renders seven accessible drum buttons', () => {
    render(<DrumKit />);

    for (const pad of drumPads) {
      expect(
        screen.getByRole('button', {
          name: `${pad.name} drum, ${pad.key}`,
        })
      ).toBeInTheDocument();
    }
  });

  it('plays the correct sound when clicked', async () => {
    const user = userEvent.setup();
    render(<DrumKit />);

    for (const pad of drumPads) {
      await user.click(
        screen.getByRole('button', {
          name: `${pad.name} drum, ${pad.key}`,
        })
      );
    }

    expect(
      mocks.play.mock.calls.map(([code]) => code)
    ).toEqual(drumPads.map((pad) => pad.code));
  });

  it('supports Tab, Enter and Space', async () => {
    const user = userEvent.setup();
    render(<DrumKit />);

    await user.tab();
    await user.tab();

    const kick = screen.getByRole('button', {
      name: 'Kick drum, W',
    });

    expect(kick).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(mocks.play).toHaveBeenCalledTimes(2);
  });

  it('limits the visible hit log to 12 entries', async () => {
    const user = userEvent.setup();
    render(<DrumKit />);

    const kick = screen.getByRole('button', {
      name: 'Kick drum, W',
    });

    for (let i = 0; i < 14; i++) {
      await user.click(kick);
    }

    expect(screen.getAllByRole('listitem'))
      .toHaveLength(12);
  });

  it('displays an accessible signal meter', () => {
    render(<DrumKit />);

    expect(
      screen.getByRole('meter', {
        name: 'Output level (dBFS)',
      })
    ).toBeInTheDocument();
  });

  it('announces audio playback failures', async () => {
    const user = userEvent.setup();

    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    mocks.play.mockRejectedValueOnce(
      new Error('Playback blocked')
    );

    try {
      render(<DrumKit />);

      await user.click(
        screen.getByRole('button', {
          name: 'Kick drum, W',
        })
      );

      expect(await screen.findByRole('alert'))
        .toHaveTextContent('Unable to play Kick sound');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('cleans up keyboard listeners on unmount', () => {
    const removeSpy = vi.spyOn(
      window,
      'removeEventListener'
    );

    try {
      const { unmount } = render(<DrumKit />);

      unmount();

      expect(
        removeSpy.mock.calls.some(
          ([eventName]) => eventName === 'keydown'
        )
      ).toBe(true);

      expect(mocks.dispose).toHaveBeenCalled();
    } finally {
      removeSpy.mockRestore();
    }
  });

  it('supports physical keyboard activation', () => {
    render(<DrumKit />);

    const scope = screen.getByLabelText(
      'Drum kit keyboard area'
    );

    scope.focus();

    fireEvent.keyDown(window, {
      code: 'KeyW',
      key: 'w',
    });

    expect(mocks.play).toHaveBeenCalledWith('KeyW');
  });
});
