
# Lab 3 – Homework 1
## Production Studio Drum Kit

### 1. Overview
An interactive drum kit developed with React, TypeScript,
and Vite.

The application applies WCAG 2.2 AA accessibility
principles, including keyboard accessibility, focus
management, accessible controls, and screen-reader feedback.

Accessibility techniques were adapted from Lab 2 HW1.

### 2. Technologies
- React + TypeScript
- Vite
- Web Audio API
- Vitest + React Testing Library
- HTML5 and CSS3

### 3. Installation

Requirements: Node.js and npm.

```bash
cd Homework_1/app
npm install
npm run dev
```

Open the local URL displayed by Vite.

### 4. Build and Test

```bash
npm run build
npm run lint
npm run test
npm run preview
```

### 5. Drum Controls

| Key | Instrument |
|-----|------------|
| W | Kick |
| A | Snare |
| S | Closed Hi-Hat |
| D | Open Hi-Hat |
| J | Clap |
| K | Tom |
| L | Crash |

Users can also activate drum pads using a mouse,
touchscreen, Enter, or Space.

Keyboard shortcuts are scoped to the focused Drum Kit.

### 6. Accessibility Features

- Native HTML button controls
- WCAG 2.2 keyboard accessibility principles
- Visible keyboard focus indicators
- Accessible names and descriptions
- Live announcements using ARIA
- Responsive layout and text contrast
- Reduced-motion support
- High Contrast Mode support
- Accessible audio signal meter
- Readable audio error messages

### 7. Accessibility Design Decisions

#### Keyboard shortcuts
Character shortcuts are active only when keyboard
focus is within the Drum Kit.

This approach addresses WCAG 2.1.4 – Character Key Shortcuts.

#### aria-pressed
Drum pads use native buttons without aria-pressed.

The pads are momentary activation controls rather
than persistent toggle buttons.

Visual active feedback is provided using CSS.

#### Lab 2 HW1 Reuse
The implementation adapts accessibility techniques
from the Lab 2 DataGrid component:

- Keyboard event handling
- Focus management
- aria-describedby instructions
- focus-visible styling
- High Contrast Mode support
- Accessible status announcements

Lab 3 is maintained in an independent Git repository.

### 8. Audio Assets

Audio samples are stored in `app/public/sounds/`.

Document the source and license of each audio sample
in `app/public/sounds/README.md`.

### 9. Accessibility Testing

Testing includes:

- Vitest and React Testing Library
- Lighthouse Accessibility audit
- axe DevTools
- Keyboard-only navigation
- Screen-reader checks
- Responsive layout verification
- Text and non-text contrast verification

Detailed findings are recorded in:
`accessibility_audit.md`.

### 10. Project Structure

```text
Homework_1/
├── app/
│   ├── public/sounds/
│   ├── src/
│   │   ├── audio/
│   │   ├── components/
│   │   ├── config/
│   │   ├── hooks/
│   │   └── test/
│   └── package.json
├── README.md
├── ai_rule.md
├── task_decomposistion.md
└── accessibility_audit.md
```
