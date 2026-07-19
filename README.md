# Meridian — Deep Work Navigator

**Chart your focus. Hold your course.**

Meridian is a deep-work session tracker built around a single idea: a focus session is a voyage. You set a bearing (a session length), hold your course while an astrolabe-style dial sweeps, and log a waypoint in your voyage log the moment you arrive. Every completed session becomes a star plotted on the instrument — turning a day of work into a small, personal constellation.

Built with pure HTML, CSS, and JavaScript. No frameworks, no build tools, no dependencies.

---

## Table of Contents

- [Features](#features)
- [Live Preview](#live-preview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage Guide](#usage-guide)
- [Design System](#design-system)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Data & Privacy](#data--privacy)
- [Customization](#customization)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Conclusion](#conclusion)

---

## Features

- **The Astrolabe Ring** — a hand-built SVG timer dial with 60 tick marks, brass degree markings, and a smoothly animated progress arc. No canvas libraries, no chart dependencies.
- **Orbit Plotting** — every completed session today is rendered as a glowing waypoint dot orbiting the dial, giving instant visual feedback on the day's progress.
- **Accurate Background Timing** — the timer is driven by a target timestamp (`Date.now()` + duration) rather than a naive countdown, so it stays correct even when the browser tab is throttled or backgrounded.
- **Voyage Log** — a horizontal, auto-scrolling timeline of every completed session, grouped and time-stamped, with total streak and longest-session tracking.
- **Synthesized Audio Chime** — a clean three-note arrival bell generated live with the Web Audio API on session completion. No audio files to load.
- **Persistent Settings & History** — session length, break length, sound preference, auto-start behavior, and the full voyage log are saved to `localStorage` and restored on reload.
- **Keyboard Support** — press <kbd>Space</kbd> to start or pause a session from anywhere on the page; <kbd>Esc</kbd> closes the settings drawer.
- **Fully Responsive** — scales cleanly from desktop down to small mobile viewports.
- **Reduced-Motion Aware** — respects `prefers-reduced-motion` and disables non-essential animation for users who request it.

---

## Live Preview

Open `index.html` in any modern browser — there is no server, build step, or installation required.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Markup | HTML | Semantic structure, no templating engine needed |
| Styling | CSS (Custom Properties, Flexbox, Grid, SVG styling) | Full control over the instrument-style visuals with zero framework overhead |
| Behavior | JavaScript  | Small surface area, no bundler required, easy to audit and extend |
| Fonts | [Fraunces](https://fonts.google.com/specimen/Fraunces), [Inter](https://fonts.google.com/specimen/Inter), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (Google Fonts) | Display serif for personality, a clean UI sans, and a monospace face for all timers and data |
| Audio | Web Audio API | Synthesized chime, no binary audio asset to ship |
| Persistence | `localStorage` | Keeps the voyage log and preferences on-device, no backend required |

---

## Project Structure

```
meridian/
├── index.html          # Page structure & content
├── css/
│   └── style.css        # Design tokens, layout, instrument styling, animations
├── js/
│   └── main.js           # Timer engine, rendering, persistence, event handling
└── README.md            # This file
```

Each file has a single responsibility, and `main.js` is organized into clearly commented sections (state, persistence, dial rendering, timer engine, voyage log, audio, settings, event bindings, init) so any part can be extended in isolation.

---

## Getting Started

### Option 1 — Just open it
1. Unzip the project.
2. Double-click `index.html`, or drag it into your browser.

### Option 2 — Serve it locally (recommended for development)
Some browsers restrict certain features (like `localStorage`) under the `file://` protocol in strict configurations. If you run into that, serve the folder locally:

```bash
# Python 3
cd meridian
python3 -m http.server 8000

# then visit
# http://localhost:8000
```

Or with Node:

```bash
npx serve meridian
```

No installation, dependencies, or environment variables are required either way.

---

## Usage Guide

1. **Choose a session length** — 25, 45, 60, or 90 minutes — from the pill selector beneath the dial.
2. **Click "Chart Course"** (or press <kbd>Space</kbd>) to start. The arc sweeps clockwise as time elapses.
3. **Pause anytime** with "Hold Position," or **Reset** with the circular arrow icon.
4. When a focus session completes, you'll hear the arrival chime (unless muted) and a new waypoint appears in the Voyage Log below. Meridian then automatically offers a break.
5. Open **Settings** (top-right nav) to adjust break length, enable auto-start for the next session, mute the chime, or clear your voyage log.

---

## Design System

Meridian's visual identity is deliberately grounded in celestial navigation rather than generic dashboard conventions.

**Color**

| Token | Hex | Role |
|---|---|---|
| `--navy-bg` | `#0B1220` | Page background |
| `--navy-panel` | `#141F32` | Cards, panels, drawer |
| `--brass` | `#C9A227` | Primary accent — active states, progress arc |
| `--brass-bright` | `#E4C24F` | Hover/highlight brass |
| `--slate-teal` | `#3E7C8C` | Secondary accent — break mode |
| `--rose` | `#B5563D` | Alerts, destructive actions |
| `--starlight` | `#F5F3EC` | Primary text |

**Type**

- **Fraunces** — display serif, used sparingly for headlines and the closing quote.
- **Inter** — body and UI copy.
- **IBM Plex Mono** — every number on the page: the timer readout, tick labels, stats, and log timestamps.

**Signature Element**

The Astrolabe Ring is the one deliberately bold element on the page; everything around it (panels, typography, spacing) stays quiet and disciplined so the instrument remains the focal point.

---

## Accessibility

- Visible focus outlines on every interactive element (`:focus-visible`).
- Full keyboard operability: tab order follows visual order, <kbd>Space</kbd> and <kbd>Esc</kbd> shortcuts, no keyboard traps in the settings drawer.
- `aria-label`, `aria-hidden`, and `aria-checked` used appropriately on icon-only controls, decorative elements, and the toggle switch.
- Respects `prefers-reduced-motion: reduce` by disabling non-essential animation.
- Color contrast checked against the dark background for all text and interactive states.

---

## Browser Support

Meridian uses standard, widely supported web platform features:

- CSS Custom Properties, Flexbox, Grid
- SVG (inline, styled via CSS)
- `Intl.DateTimeFormat`
- Web Audio API
- `localStorage`

Tested against current versions of Chrome, Firefox, Safari, and Edge. Graceful degradation: if the Web Audio API is unavailable, the chime is silently skipped rather than throwing an error.

---

## Data & Privacy

Meridian stores your voyage log and preferences **only** in your browser's `localStorage`. Nothing is transmitted to a server — there is no backend, no analytics, and no network request made by the app itself (aside from loading the Google Fonts stylesheet on first load). Clearing your browser storage or using the in-app "Clear voyage log" button permanently removes your history.

---

## Customization

- **Session lengths**: edit the `data-mins` values on the `.len-btn` elements in `index.html`.
- **Color palette**: all colors are CSS Custom Properties defined at the top of `css/style.css` under `:root` — change them once, and the whole UI updates.
- **Chime notes**: adjust the `notes` array inside `playChime()` in `js/main.js` to change the arrival sound.
- **Tick density**: change `totalTicks` and `majorEvery` inside `buildDial()` in `js/main.js` to redraw the dial with a different scale.

---

## Roadmap

Ideas for future iterations, not yet implemented:

- [ ] Optional cloud sync across devices
- [ ] Weekly/monthly voyage summaries and export (CSV/JSON)
- [ ] Custom session labels ("what are you working on?")
- [ ] Theming presets beyond the default navy/brass palette
- [ ] PWA support for offline use and home-screen install

---

## Contributing

This is a self-contained static project — contributions are straightforward:

1. Fork or copy the `meridian/` folder.
2. Make your changes directly in `index.html`, `css/style.css`, or `js/main.js`.
3. Test in a local server (see [Getting Started](#getting-started)).
4. Open a pull request or share your changes.

No build pipeline means no compilation step to worry about — what you edit is what ships.


```
MIT License

Copyright (c) 2026 Meridian Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Conclusion

Most focus timers are an afterthought bolted onto a to-do list — a bare circle counting down with no character of its own. Meridian starts from the opposite direction: it treats the timer itself as the product, and builds a real instrument around it, one grounded in the specific, tactile world of celestial navigation rather than generic dashboard conventions.

The result is a tool that is genuinely production-ready — zero dependencies, fully accessible, responsive, and privacy-respecting by design — while still taking a real point of view on what a focus session should *feel* like. It is built to be read, understood, and extended by any developer in minutes, not reverse-engineered from a bundle.

Every session you complete becomes a waypoint. Every day becomes a voyage log. That is the whole idea, and it is the reason Meridian is worth using over a generic timer: it makes deep work visible, one bearing at a time.

**Fair winds, and hold your course.**
