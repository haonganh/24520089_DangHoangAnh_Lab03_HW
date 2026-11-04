
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useDrumKeyboard } from './useDrumKeyboard';
import type { DrumCode } from '../config/drumPads';

function TestHarness({
  onTrigger,
  isEnabled = true,
}: {
  onTrigger: (code: DrumCode) => void;
  isEnabled?: boolean;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);

  const { activeCodes } = useDrumKeyboard({
    scopeRef,
    onTrigger,
    isEnabled,
  });

  return (
    <>
      <button type="button">Outside</button>

      <div ref={scopeRef} tabIndex={0} data-testid="scope">
        <input aria-label="Text input" />
        <textarea aria-label="Text area" />

        <select aria-label="Instrument">
          <option>Kick</option>
        </select>

        <div
          contentEditable
          suppressContentEditableWarning
          tabIndex={0}
          data-testid="editable"
        >
          Editable content
        </div>

        <output data-testid="active">
          {[...activeCodes].join(', ')}
        </output>
      </div>
    </>
  );
}

describe('T09 - Drum keyboard accessibility', () => {
  it('maps all seven physical keyboard codes', () => {
    const onTrigger = vi.fn();

    render(<TestHarness onTrigger={onTrigger} />);
    screen.getByTestId('scope').focus();

    const codes = [
      'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'KeyJ', 'KeyK', 'KeyL',
    ];

    for (const code of codes) {
      fireEvent.keyDown(window, { code });
      fireEvent.keyUp(window, { code });
    }

    expect(onTrigger.mock.calls.map(([code]) => code))
      .toEqual(codes);
  });

  it('ignores operating-system key repeat', () => {
    const onTrigger = vi.fn();

    render(<TestHarness onTrigger={onTrigger} />);
    screen.getByTestId('scope').focus();

    fireEvent.keyDown(window, {
      code: 'KeyW',
      repeat: false,
    });

    fireEvent.keyDown(window, {
      code: 'KeyW',
      repeat: true,
    });

    expect(onTrigger).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('active'))
      .toHaveTextContent('KeyW');

    fireEvent.keyUp(window, { code: 'KeyW' });

    expect(screen.getByTestId('active'))
      .toBeEmptyDOMElement();
  });

  it('ignores editable controls', () => {
    const onTrigger = vi.fn();

    render(<TestHarness onTrigger={onTrigger} />);

    const targets = [
      screen.getByRole('textbox', { name: 'Text input' }),
      screen.getByRole('textbox', { name: 'Text area' }),
      screen.getByRole('combobox', { name: 'Instrument' }),
      screen.getByTestId('editable'),
    ];

    // jsdom needs an explicit editable-state stub.
    Object.defineProperty(targets[3], 'isContentEditable', {
      configurable: true,
      value: true,
    });

    for (const target of targets) {
      target.focus();
      fireEvent.keyDown(target, { code: 'KeyW' });
    }

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('ignores modifiers, IME and out-of-scope keys', () => {
    const onTrigger = vi.fn();

    render(<TestHarness onTrigger={onTrigger} />);

    screen.getByRole('button', { name: 'Outside' }).focus();
    fireEvent.keyDown(window, { code: 'KeyW' });

    screen.getByTestId('scope').focus();

    fireEvent.keyDown(window, {
      code: 'KeyW',
      ctrlKey: true,
    });

    fireEvent.keyDown(window, {
      code: 'KeyW',
      altKey: true,
    });

    fireEvent.keyDown(window, {
      code: 'KeyW',
      metaKey: true,
    });

    fireEvent.keyDown(window, {
      code: 'KeyW',
      isComposing: true,
    });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it('clears active keys when the window loses focus', () => {
    const onTrigger = vi.fn();

    render(<TestHarness onTrigger={onTrigger} />);
    screen.getByTestId('scope').focus();

    fireEvent.keyDown(window, { code: 'KeyA' });

    expect(screen.getByTestId('active'))
      .toHaveTextContent('KeyA');

    fireEvent(window, new Event('blur'));

    expect(screen.getByTestId('active'))
      .toBeEmptyDOMElement();
  });

  it('does not trigger when shortcuts are disabled', () => {
    const onTrigger = vi.fn();

    render(
      <TestHarness
        onTrigger={onTrigger}
        isEnabled={false}
      />
    );

    screen.getByTestId('scope').focus();
    fireEvent.keyDown(window, { code: 'KeyW' });

    expect(onTrigger).not.toHaveBeenCalled();
  });
});
