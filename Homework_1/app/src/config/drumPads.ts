
export type DrumCode =
  | 'KeyW'
  | 'KeyA'
  | 'KeyS'
  | 'KeyD'
  | 'KeyJ'
  | 'KeyK'
  | 'KeyL';

export interface DrumPadConfig {
  code: DrumCode;
  key: string;
  name: string;
  sound: string;
}

export const drumPads: DrumPadConfig[] = [
  { code: 'KeyW', key: 'W', name: 'Kick', sound: '/sounds/kick.wav' },
  { code: 'KeyA', key: 'A', name: 'Snare', sound: '/sounds/snare.wav' },
  { code: 'KeyS', key: 'S', name: 'Closed Hi-Hat', sound: '/sounds/hihat-closed.wav' },
  { code: 'KeyD', key: 'D', name: 'Open Hi-Hat', sound: '/sounds/hihat-open.wav' },
  { code: 'KeyJ', key: 'J', name: 'Clap', sound: '/sounds/clap.wav' },
  { code: 'KeyK', key: 'K', name: 'Tom', sound: '/sounds/tom.wav' },
  { code: 'KeyL', key: 'L', name: 'Crash', sound: '/sounds/crash.wav' },
];
