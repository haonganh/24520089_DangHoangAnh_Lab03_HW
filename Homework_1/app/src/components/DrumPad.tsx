
import type { DrumCode, DrumPadConfig } from '../config/drumPads';

interface DrumPadProps {
  pad: DrumPadConfig;
  isActive: boolean;
  onActivate: (code: DrumCode) => void;
}

export default function DrumPad({
  pad,
  isActive,
  onActivate,
}: DrumPadProps) {
  return (
    <button
      type="button"
      className="drum-pad"
      data-active={isActive}
      aria-label={`${pad.name} drum, ${pad.key}`}
      onClick={() => onActivate(pad.code)}
    >
      <kbd aria-hidden="true">{pad.key}</kbd>
      <span aria-hidden="true">{pad.name}</span>
    </button>
  );
}
